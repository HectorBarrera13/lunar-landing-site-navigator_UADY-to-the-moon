from fastapi import APIRouter, HTTPException, Query
from pydantic import AwareDatetime

from app.models.series import SiteTimeSeries
from app.services.series import SeriesNotFoundError, get_site_series
from app.services.sites import SiteNotFoundError

router = APIRouter(tags=["sites"])


@router.get(
    "/sites/{site_id}/series",
    response_model=SiteTimeSeries,
    summary="Precomputed Sun and Earth series for a site",
    description="Reads data/processed/sites/<site_id>.json and slices it to [start, end].",
    responses={404: {"description": "Unknown site_id or missing artifact"}},
)
def get_series(
    site_id: str,
    start: AwareDatetime | None = Query(default=None, description="Window start, UTC (inclusive)."),
    end: AwareDatetime | None = Query(default=None, description="Window end, UTC (inclusive)."),
) -> SiteTimeSeries:
    if start is not None and end is not None and end <= start:
        raise HTTPException(status_code=422, detail="end must be later than start.")
    try:
        return get_site_series(site_id, start, end)
    except (SiteNotFoundError, SeriesNotFoundError) as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
