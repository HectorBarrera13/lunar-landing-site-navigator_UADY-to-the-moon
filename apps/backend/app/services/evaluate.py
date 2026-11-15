"""Windowed Suitability Index (REQUIREMENTS 5, Agreed 2026-11-14).

Aggregates the precomputed series and terrain for one site over `[start, end]`,
applies the configured weights and vetoes, and returns the explained index.
Free points are redirected to the nearest preset site with both artifacts.
"""

import math
from dataclasses import dataclass
from datetime import datetime

from app.core.config import get_settings
from app.models.evaluate import (
    Criterion,
    EvaluateRequest,
    EvaluateResponse,
    EvaluationMetrics,
    TrafficLight,
    Veto,
)
from app.models.series import SiteTimeSeries
from app.models.site import SiteSummary
from app.models.terrain import TerrainEvaluation
from app.services.series import get_site_series, has_series_artifacts
from app.services.sites import get_site, list_sites
from app.services.terrain import get_terrain

# R-10/R-11: near side only, south pole exception.
SOUTH_POLE_LAT_DEG = -80.0
NEAR_SIDE_LON_LIMIT_DEG = 90.0

# Contract §1.1: Earth visible equals center above horizon, i.e. visible fraction >= 0.5.
EARTH_VISIBLE_MIN_FRACTION = 0.5

CRITERION_LABELS = {
    "power": "Solar power",
    "communication": "Direct-to-Earth communication",
    "slope": "Terrain slope",
    "landing_zone": "Landing zone",
}


class EvaluationUnavailableError(LookupError):
    """The request is valid but no artifact can produce a date-specific evaluation."""


@dataclass(frozen=True)
class WindowAggregates:
    sunlight_percent: float
    earth_visible_percent: float
    longest_darkness_hours: float
    next_sunset_utc: str | None
    next_sunrise_utc: str | None
    next_earthset_utc: str | None
    next_earthrise_utc: str | None


def traffic_light_for(suitability_index: int, vetoes: list[Veto]) -> TrafficLight:
    """REQUIREMENTS 5.1 (Agreed): any veto is red; otherwise by index thresholds."""
    settings = get_settings()
    if vetoes or suitability_index < settings.traffic_light_orange_min:
        return "red"
    if suitability_index >= settings.traffic_light_green_min:
        return "green"
    return "orange"


def _parse_utc(value: str | None) -> datetime | None:
    return None if value is None else datetime.fromisoformat(value.replace("Z", "+00:00"))


def _next_set(times: list[str], visible: list[bool]) -> str | None:
    """First visible -> hidden transition inside the window, if any."""
    for index in range(len(visible) - 1):
        if visible[index] and not visible[index + 1]:
            return times[index + 1]
    return None


def _next_rise(times: list[str], visible: list[bool]) -> str | None:
    """First hidden -> visible transition inside the window, if any."""
    for index in range(len(visible) - 1):
        if not visible[index] and visible[index + 1]:
            return times[index + 1]
    return None


def _aggregate(series: SiteTimeSeries) -> WindowAggregates:
    total = len(series.time_utc)
    if total == 0:
        raise EvaluationUnavailableError("No series points in the requested window.")
    sun_fraction = series.sun_visible_fraction
    # Contract §1.1: Earth counts as visible when its center is above the horizon (fraction >= 0.5).
    earth = [fraction >= EARTH_VISIBLE_MIN_FRACTION for fraction in series.earth_visible_fraction]
    sun_visible = [fraction > 0 for fraction in sun_fraction]

    longest_run = 0
    run = 0
    for fraction in sun_fraction:
        run = run + 1 if fraction == 0 else 0
        longest_run = max(longest_run, run)

    return WindowAggregates(
        sunlight_percent=round(100 * sum(sun_fraction) / total, 2),
        earth_visible_percent=round(100 * sum(earth) / total, 2),
        longest_darkness_hours=round(longest_run * series.time_step_minutes / 60, 2),
        next_sunset_utc=_next_set(series.time_utc, sun_visible),
        next_sunrise_utc=_next_rise(series.time_utc, sun_visible),
        next_earthset_utc=_next_set(series.time_utc, earth),
        next_earthrise_utc=_next_rise(series.time_utc, earth),
    )


def _central_angle_degrees(lat_a: float, lon_a: float, lat_b: float, lon_b: float) -> float:
    """Great-circle angle between two surface points; ranking is independent of the radius."""
    phi_a, phi_b = math.radians(lat_a), math.radians(lat_b)
    delta_lon = math.radians(lon_b - lon_a)
    cosine = math.sin(phi_a) * math.sin(phi_b) + math.cos(phi_a) * math.cos(phi_b) * math.cos(delta_lon)
    return math.degrees(math.acos(max(-1.0, min(1.0, cosine))))


def _has_artifacts(site_id: str) -> bool:
    data_dir = get_settings().resolved_data_dir
    return has_series_artifacts(site_id) and (data_dir / "terrain" / f"{site_id}.json").is_file()


def _nearest_site_with_artifacts(lat_deg: float, lon_deg: float) -> SiteSummary:
    candidates = [
        site
        for site in list_sites()
        if site.lat is not None
        and site.lon is not None
        and _has_artifacts(site.id)
    ]
    if not candidates:
        raise EvaluationUnavailableError(
            "No preset site has both a precomputed series and terrain evaluation."
        )
    return min(
        candidates,
        key=lambda site: _central_angle_degrees(lat_deg, lon_deg, site.lat, site.lon),
    )


def _is_far_side(lat_deg: float, lon_deg: float) -> bool:
    return lat_deg > SOUTH_POLE_LAT_DEG and abs(lon_deg) > NEAR_SIDE_LON_LIMIT_DEG


def _resolve_site(request: EvaluateRequest) -> SiteSummary:
    if request.site_id is not None:
        return get_site(request.site_id)
    assert request.lat_deg is not None and request.lon_deg is not None
    if _is_far_side(request.lat_deg, request.lon_deg):
        raise EvaluationUnavailableError(
            "Far-side points have no direct-to-Earth communication; choose the near side "
            "(longitude within ±90°) or the south pole (latitude ≤ -80°)."
        )
    return _nearest_site_with_artifacts(request.lat_deg, request.lon_deg)


def _vetoes(aggregates: WindowAggregates, terrain: TerrainEvaluation) -> list[Veto]:
    settings = get_settings()
    vetoes: list[Veto] = []
    if aggregates.earth_visible_percent < settings.veto_earth_visible_min_percent:
        vetoes.append(
            Veto(
                code="earth_visibility_low",
                message=(
                    f"Earth visible only {aggregates.earth_visible_percent:.1f}% of the mission "
                    f"window (minimum {settings.veto_earth_visible_min_percent:.0f}%)."
                ),
            )
        )
    if aggregates.sunlight_percent < settings.veto_sunlight_min_percent:
        vetoes.append(
            Veto(
                code="sunlight_low",
                message=(
                    f"Sunlight only {aggregates.sunlight_percent:.1f}% of the mission window "
                    f"(minimum {settings.veto_sunlight_min_percent:.0f}%)."
                ),
            )
        )
    if aggregates.longest_darkness_hours > settings.veto_darkness_max_hours:
        vetoes.append(
            Veto(
                code="darkness_exceeded",
                message=(
                    f"Continuous darkness of {aggregates.longest_darkness_hours:.1f} h exceeds "
                    f"the {settings.veto_darkness_max_hours:.0f} h battery limit."
                ),
            )
        )
    if terrain.mean_slope_degrees > settings.veto_mean_slope_max_degrees:
        vetoes.append(
            Veto(
                code="slope_too_steep",
                message=(
                    f"Mean slope {terrain.mean_slope_degrees:.2f}° exceeds the "
                    f"{settings.veto_mean_slope_max_degrees:.0f}° landing limit."
                ),
            )
        )
    return vetoes


def _criteria(
    aggregates: WindowAggregates, terrain: TerrainEvaluation
) -> tuple[list[Criterion], list[str]]:
    """Criteria with renormalized weights; criteria without data are excluded and warned."""
    settings = get_settings()
    thresholds = settings.veto_mean_slope_max_degrees
    slope_denominator = thresholds if thresholds > 0 else 1.0
    slope_normalized = max(0.0, min(1.0, 1.0 - terrain.mean_slope_degrees / slope_denominator))

    raw = {
        "power": (
            aggregates.sunlight_percent / 100,
            f"Sun visible {aggregates.sunlight_percent:.1f}% of the window; "
            f"longest continuous darkness {aggregates.longest_darkness_hours:.1f} h.",
        ),
        "communication": (
            aggregates.earth_visible_percent / 100,
            f"Earth visible {aggregates.earth_visible_percent:.1f}% of the window.",
        ),
        "slope": (
            slope_normalized,
            f"Mean slope {terrain.mean_slope_degrees:.2f}° (veto above {thresholds:.0f}°); "
            f"95th percentile {terrain.p95_slope_degrees:.2f}°.",
        ),
        "landing_zone": (
            1.0 if terrain.is_slope_safe else 0.0,
            f"Slope inside the {terrain.safety_radius_meters:.0f} m landing circle is "
            f"{'within' if terrain.is_slope_safe else 'outside'} the safe threshold.",
        ),
    }

    # Resources and roughness have no product yet and no agreed normalization (5.5).
    total_weight = sum(settings.weights[code] for code in raw)
    if total_weight <= 0:
        raise EvaluationUnavailableError("Configured weights are all zero.")

    criteria = [
        Criterion(
            code=code,
            label=CRITERION_LABELS[code],
            normalized=round(normalized, 4),
            weight=round(settings.weights[code] / total_weight, 4),
            contribution=round(normalized * settings.weights[code] / total_weight, 4),
            detail=detail,
        )
        for code, (normalized, detail) in raw.items()
    ]
    warnings = [
        "Resources (ice proximity) and roughness are excluded until those products exist; "
        "the remaining weights are renormalized."
    ]
    if terrain.p95_slope_degrees > settings.warning_p95_slope_degrees:
        warnings.append(
            f"95th-percentile slope {terrain.p95_slope_degrees:.2f}° exceeds "
            f"{settings.warning_p95_slope_degrees:.0f}°; the landing circle contains steep "
            "micro-areas."
        )
    return criteria, warnings


def evaluate(request: EvaluateRequest) -> EvaluateResponse:
    site = _resolve_site(request)
    series = get_site_series(site.id, request.start_utc, request.end_utc)
    terrain = get_terrain(site.id)
    aggregates = _aggregate(series)
    vetoes = _vetoes(aggregates, terrain)
    criteria, warnings = _criteria(aggregates, terrain)
    suitability_index = int(round(100 * sum(criterion.contribution for criterion in criteria)))

    return EvaluateResponse(
        resolved_site_id=site.id,
        suitability_index=suitability_index,
        traffic_light=traffic_light_for(suitability_index, vetoes),
        precision="date_specific",
        vetoes=vetoes,
        criteria=criteria,
        metrics=EvaluationMetrics(
            sunlight_percent=aggregates.sunlight_percent,
            earth_visible_percent=aggregates.earth_visible_percent,
            longest_darkness_hours=aggregates.longest_darkness_hours,
            next_sunset_utc=_parse_utc(aggregates.next_sunset_utc),
            next_sunrise_utc=_parse_utc(aggregates.next_sunrise_utc),
            next_earthset_utc=_parse_utc(aggregates.next_earthset_utc),
            next_earthrise_utc=_parse_utc(aggregates.next_earthrise_utc),
        ),
        warnings=warnings,
    )


__all__ = ["EvaluationUnavailableError", "evaluate", "traffic_light_for"]
