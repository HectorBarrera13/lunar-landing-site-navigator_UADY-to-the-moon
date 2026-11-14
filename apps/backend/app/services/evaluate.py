"""MOCK Suitability Index evaluation.

Every value returned by `evaluate_mock` is a placeholder for frontend integration.
It is not computed from ephemerides or terrain and must be replaced by the real
windowed aggregation once the pipeline artifacts and the agreed weights and
vetoes (REQUIREMENTS 5.2, 5.3) are available.
"""

from app.core.config import get_settings
from app.models.evaluate import (
    Criterion,
    EvaluateRequest,
    EvaluateResponse,
    EvaluationMetrics,
    TrafficLight,
    Veto,
)
from app.services.sites import get_site

MOCK_WARNING = "MOCK DATA: values are placeholders for integration testing and are not a real evaluation."
MOCK_DETAIL = "Mock value for integration testing; not a real evaluation."

# Placeholder criteria. Weights are NOT the REQUIREMENTS 5.2 weights (still pending).
MOCK_CRITERIA: tuple[tuple[str, str, float, float], ...] = (
    ("power", "Solar power", 0.5, 0.5),
    ("communication", "Direct-to-Earth communication", 0.5, 0.5),
)


def traffic_light_for(suitability_index: int, vetoes: list[Veto]) -> TrafficLight:
    """REQUIREMENTS 5.1 (Agreed): any veto is red; otherwise by index thresholds."""
    settings = get_settings()
    if vetoes or suitability_index < settings.traffic_light_orange_min:
        return "red"
    if suitability_index >= settings.traffic_light_green_min:
        return "green"
    return "orange"


def evaluate_mock(request: EvaluateRequest) -> EvaluateResponse:
    if request.site_id is not None:
        get_site(request.site_id)
        precision = "date_specific"
    else:
        precision = "average"

    criteria = [
        Criterion(
            code=code,
            label=label,
            normalized=normalized,
            weight=weight,
            contribution=normalized * weight,
            detail=MOCK_DETAIL,
        )
        for code, label, weight, normalized in MOCK_CRITERIA
    ]
    suitability_index = round(100 * sum(c.contribution for c in criteria))
    vetoes: list[Veto] = []

    return EvaluateResponse(
        suitability_index=suitability_index,
        traffic_light=traffic_light_for(suitability_index, vetoes),
        precision=precision,
        vetoes=vetoes,
        criteria=criteria,
        metrics=EvaluationMetrics(
            sunlight_percent=50.0,
            earth_visible_percent=50.0,
            longest_darkness_hours=0.0,
            next_sunset_utc=None,
            next_earthset_utc=None,
        ),
        warnings=[MOCK_WARNING],
    )
