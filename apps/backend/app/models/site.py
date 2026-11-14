from pydantic import BaseModel, Field


class SiteSummary(BaseModel):
    """Preset site as listed by `GET /api/sites` (docs/contracts §2)."""

    id: str
    name: str
    group: str
    lat: float | None = Field(default=None, ge=-90, le=90, description="Latitude in degrees, MOON_ME. Null until verified (PD-01).")
    lon: float | None = Field(default=None, ge=-180, le=180, description="Longitude in degrees, MOON_ME, [-180, 180]. Null until verified (PD-01).")
