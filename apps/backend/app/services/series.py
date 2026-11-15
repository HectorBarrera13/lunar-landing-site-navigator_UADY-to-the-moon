"""Loads precomputed site time series from data/processed/sites/ (contract 1.1)."""

import json
import logging
from datetime import datetime

from app.core.config import get_settings
from app.models.series import SiteTimeSeries
from app.services.sites import SiteNotFoundError, get_site

logger = logging.getLogger(__name__)


class SeriesNotFoundError(LookupError):
    def __init__(self, site_id: str) -> None:
        super().__init__(f"No precomputed series for site_id: {site_id!r}")
        self.site_id = site_id


def get_site_series(
    site_id: str,
    start: datetime | None = None,
    end: datetime | None = None,
) -> SiteTimeSeries:
    """Series sliced to [start, end] (inclusive on both ends when provided)."""
    get_site(site_id)  # Unknown catalog sites are a 404 even if an artifact exists.
    path = get_settings().resolved_data_dir / "sites" / f"{site_id}.json"
    if not path.is_file():
        raise SeriesNotFoundError(site_id)
    payload = json.loads(path.read_text(encoding="utf-8"))
    series = SiteTimeSeries.model_validate(payload)
    if start is None and end is None:
        return series
    points = [
        point
        for point in series.series
        if (start is None or datetime.fromisoformat(point.time_utc) >= start)
        and (end is None or datetime.fromisoformat(point.time_utc) <= end)
    ]
    logger.debug("Sliced %s series to %d points from %s", site_id, len(points), path)
    return series.model_copy(update={"series": points})


__all__ = ["SeriesNotFoundError", "SiteNotFoundError", "get_site_series"]
