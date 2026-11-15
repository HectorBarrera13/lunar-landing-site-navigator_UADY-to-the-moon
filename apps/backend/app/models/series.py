"""`GET /api/sites/{site_id}/series` models (docs/contracts 1.1 and 2.0, version 1.1)."""

from typing import Literal

from pydantic import BaseModel, Field

HorizonSource = Literal["lola", "sphere"]


class SiteTimeSeries(BaseModel):
    """`horizon.json` fields + `time_step_minutes` + year-file columns sliced to the window.

    Columnar: every column has the same length as `time_utc`.
    """

    site_id: str
    name: str
    lat_deg: float = Field(ge=-90, le=90)
    lon_deg: float = Field(ge=-180, le=180)
    horizon_source: HorizonSource
    horizon_profile_deg: list[float] = Field(min_length=360, max_length=360)
    max_radius_m: float
    near_field_m: float
    observer_height_m: float
    assumptions: list[str]

    time_step_minutes: int = Field(gt=0)
    time_utc: list[str]
    sun_azimuth_deg: list[float]
    sun_elevation_deg: list[float]
    sun_visible_fraction: list[float]
    sun_distance_km: list[float]
    sun_dir_me: list[list[float]]
    earth_azimuth_deg: list[float]
    earth_elevation_deg: list[float]
    earth_visible_fraction: list[float]
    earth_distance_km: list[float]
    earth_dir_me: list[list[float]]
