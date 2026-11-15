"""`GET /api/sites/{site_id}/series` models (docs/contracts 1.1)."""

from typing import Literal

from pydantic import BaseModel, Field

HorizonSource = Literal["lola", "sphere"]


class SeriesPoint(BaseModel):
    time_utc: str
    sun_azimuth_deg: float = Field(ge=0, le=360)
    sun_elevation_deg: float = Field(ge=-90, le=90)
    sun_visible: bool
    earth_azimuth_deg: float = Field(ge=0, le=360)
    earth_elevation_deg: float = Field(ge=-90, le=90)
    earth_visible: bool


class SiteTimeSeries(BaseModel):
    """Mirrors `data/processed/sites/<site_id>.json` and `docs/contracts` 1.1."""

    site_id: str
    name: str
    lat_deg: float = Field(ge=-90, le=90)
    lon_deg: float = Field(ge=-180, le=180)
    horizon_source: HorizonSource
    horizon_profile_deg: list[float] = Field(min_length=360, max_length=360)
    time_step_minutes: int = Field(gt=0)
    series: list[SeriesPoint]
