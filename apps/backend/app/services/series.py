"""Loads precomputed site time series from data/processed/sites/<id>/ (contract §1.1, version 1.2)."""

import json
import logging
from bisect import bisect_left, bisect_right
from dataclasses import dataclass
from datetime import UTC, datetime
from functools import lru_cache
from pathlib import Path
from typing import Any

from app.core.config import get_settings
from app.models.series import SiteTimeSeries
from app.services.sites import SiteNotFoundError, get_site

logger = logging.getLogger(__name__)

FIRST_YEAR = 2025
LAST_YEAR = 2035

COLUMNS = (
    "time_utc",
    "sun_azimuth_deg",
    "sun_elevation_deg",
    "sun_visible_fraction",
    "sun_distance_km",
    "sun_dir_me",
    "earth_azimuth_deg",
    "earth_elevation_deg",
    "earth_visible_fraction",
    "earth_distance_km",
    "earth_dir_me",
)
OPTIONAL_COLUMNS = (
    "sun_angular_radius_deg",
    "earth_angular_radius_deg",
)


class SeriesNotFoundError(LookupError):
    """Site not precomputed, or a needed yearly file is missing (HTTP 404)."""


class SeriesWindowError(ValueError):
    """Window inverted or outside 2025-2035 (HTTP 422)."""


@dataclass(frozen=True)
class _YearFile:
    data: dict[str, Any]
    epochs: list[float]  # parsed time_utc, for bisect slicing


def _parse_utc(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


@lru_cache(maxsize=16)
def _read_json(path: str, mtime_ns: int, size: int) -> dict[str, Any]:
    """Parsed JSON cached by path + mtime + size; callers must treat it as read-only."""
    logger.debug("Parsing %s", path)
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def _load(path: Path) -> dict[str, Any]:
    stat = path.stat()
    return _read_json(str(path), stat.st_mtime_ns, stat.st_size)


@lru_cache(maxsize=16)
def _epochs(path: str, mtime_ns: int, size: int) -> list[float]:
    data = _read_json(path, mtime_ns, size)
    return [_parse_utc(value).timestamp() for value in data["time_utc"]]


def _load_year(path: Path) -> _YearFile:
    stat = path.stat()
    key = (str(path), stat.st_mtime_ns, stat.st_size)
    return _YearFile(data=_read_json(*key), epochs=_epochs(*key))


def site_dir(site_id: str) -> Path:
    return get_settings().resolved_data_dir / "sites" / site_id


def has_series_artifacts(site_id: str) -> bool:
    """True when `horizon.json` exists for the site (year files are checked per window)."""
    return (site_dir(site_id) / "horizon.json").is_file()


def get_horizon_source(site_id: str) -> str | None:
    """`horizon_source` ("lola" or "sphere") from `horizon.json`; None when missing."""
    path = site_dir(site_id) / "horizon.json"
    if not path.is_file():
        return None
    return _load(path).get("horizon_source")


def validate_window(start: datetime, end: datetime) -> tuple[datetime, datetime]:
    start_utc, end_utc = start.astimezone(UTC), end.astimezone(UTC)
    if end_utc <= start_utc:
        raise SeriesWindowError("end must be later than start.")
    if start_utc.year < FIRST_YEAR or end_utc.year > LAST_YEAR:
        raise SeriesWindowError(f"Window must lie within {FIRST_YEAR}-{LAST_YEAR} (UTC).")
    return start_utc, end_utc


def get_site_series(site_id: str, start: datetime, end: datetime) -> SiteTimeSeries:
    """Series sliced to [start, end], inclusive on both ends, concatenated across years."""
    get_site(site_id)  # Unknown catalog sites are a 404 even if an artifact exists.
    start_utc, end_utc = validate_window(start, end)

    directory = site_dir(site_id)
    horizon_path = directory / "horizon.json"
    if not horizon_path.is_file():
        raise SeriesNotFoundError(f"No precomputed series for site_id: {site_id!r}")

    columns: dict[str, list[Any]] = {name: [] for name in COLUMNS}
    optional_columns: dict[str, list[Any]] = {name: [] for name in OPTIONAL_COLUMNS}
    optional_presence: dict[str, bool | None] = {name: None for name in OPTIONAL_COLUMNS}
    step_minutes: int | None = None
    for year in range(start_utc.year, end_utc.year + 1):
        year_path = directory / f"{year}.json"
        if not year_path.is_file():
            raise SeriesNotFoundError(f"Series file for year {year} of site {site_id!r} is not precomputed.")
        year_file = _load_year(year_path)
        step = int(year_file.data["time_step_minutes"])
        if step_minutes is not None and step != step_minutes:
            raise SeriesNotFoundError(f"Inconsistent time_step_minutes across year files of {site_id!r}.")
        step_minutes = step
        lo = bisect_left(year_file.epochs, start_utc.timestamp())
        hi = bisect_right(year_file.epochs, end_utc.timestamp())
        for name in COLUMNS:
            columns[name].extend(year_file.data[name][lo:hi])
        for name in OPTIONAL_COLUMNS:
            present = name in year_file.data
            previous = optional_presence[name]
            if previous is not None and previous != present:
                raise SeriesNotFoundError(f"Inconsistent {name} availability across year files of {site_id!r}.")
            optional_presence[name] = present
            if present:
                optional_columns[name].extend(year_file.data[name][lo:hi])

    horizon = _load(horizon_path)
    payload: dict[str, Any] = {**horizon, "time_step_minutes": step_minutes, **columns}
    payload.update(
        {
            name: values
            for name, values in optional_columns.items()
            if optional_presence[name]
        }
    )
    logger.debug("Sliced %s series to %d steps", site_id, len(columns["time_utc"]))
    return SiteTimeSeries.model_validate(payload)


__all__ = [
    "SeriesNotFoundError",
    "SeriesWindowError",
    "SiteNotFoundError",
    "get_site_series",
    "get_horizon_source",
    "has_series_artifacts",
    "validate_window",
]
