from typing import Literal, Self

from pydantic import AwareDatetime, BaseModel, Field, model_validator

TrafficLight = Literal["green", "orange", "red"]
Precision = Literal["date_specific", "average"]


class EvaluateRequest(BaseModel):
    """Request body of `POST /api/evaluate` (docs/contracts §2.1)."""

    site_id: str | None = None
    lat_deg: float | None = Field(default=None, ge=-90, le=90)
    lon_deg: float | None = Field(default=None, ge=-180, le=180)
    start_utc: AwareDatetime
    end_utc: AwareDatetime

    @model_validator(mode="after")
    def check_target_and_window(self) -> Self:
        has_site = self.site_id is not None
        has_lat = self.lat_deg is not None
        has_lon = self.lon_deg is not None
        if has_lat != has_lon:
            raise ValueError("lat_deg and lon_deg must be provided together.")
        if has_site == has_lat:
            raise ValueError("Provide either site_id or both lat_deg and lon_deg, not both and not neither.")
        if self.end_utc <= self.start_utc:
            raise ValueError("end_utc must be later than start_utc.")
        return self


class Veto(BaseModel):
    code: str
    message: str


class Criterion(BaseModel):
    code: str
    label: str
    normalized: float = Field(ge=0, le=1)
    weight: float = Field(ge=0, le=1)
    contribution: float = Field(ge=0, le=1)
    detail: str


class EvaluationMetrics(BaseModel):
    sunlight_percent: float = Field(ge=0, le=100)
    earth_visible_percent: float = Field(ge=0, le=100)
    longest_darkness_hours: float = Field(ge=0)
    next_sunset_utc: AwareDatetime | None = None
    next_sunrise_utc: AwareDatetime | None = None
    next_earthset_utc: AwareDatetime | None = None
    next_earthrise_utc: AwareDatetime | None = None


class EvaluateResponse(BaseModel):
    """Response body of `POST /api/evaluate` (docs/contracts §2.1)."""

    resolved_site_id: str
    suitability_index: int = Field(ge=0, le=100)
    traffic_light: TrafficLight
    precision: Precision
    vetoes: list[Veto]
    criteria: list[Criterion]
    metrics: EvaluationMetrics
    warnings: list[str]
