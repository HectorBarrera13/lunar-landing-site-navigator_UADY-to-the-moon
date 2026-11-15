from fastapi import APIRouter, HTTPException, Query
from pydantic import AwareDatetime

from app.models.series import SiteTimeSeries
from app.services.series import SeriesNotFoundError, SeriesWindowError, get_site_series
from app.services.sites import SiteNotFoundError

router = APIRouter(tags=["sites"])


@router.get(
    "/sites/{site_id}/series",
    response_model=SiteTimeSeries,
    summary="Precomputed Sun and Earth series for a site",
    description=(
        "Returns horizon.json plus the yearly series columns (contract 1.1) concatenated "
        "and sliced to [start, end], inclusive."
    ),
    responses={
        404: {"description": "Unknown site_id, site not precomputed, or a needed year file is missing"},
        422: {"description": "Window inverted or outside 2025-2035"},
    },
)
def get_series(
    site_id: str,
    start: AwareDatetime = Query(description="Window start, UTC ISO 8601 (inclusive)."),
    end: AwareDatetime = Query(description="Window end, UTC ISO 8601 (inclusive)."),
) -> SiteTimeSeries:
    try:
        return get_site_series(site_id, start, end)
    except (SiteNotFoundError, SeriesNotFoundError) as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except SeriesWindowError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
