"""`data/processed/terrain/<site_id>.json` model (docs/contracts 1.2)."""

from pydantic import BaseModel, Field


class TerrainEvaluation(BaseModel):
    """Terrain metrics inside the landing circle.

    `terrain_roughness_index` and `nearest_ice_deposit_meters` are optional until
    those products exist (REQUIREMENTS 5.5).
    """

    site_id: str
    safety_radius_meters: float = Field(gt=0)
    center_elevation_meters: float
    max_slope_degrees: float = Field(ge=0, le=90)
    mean_slope_degrees: float = Field(ge=0, le=90)
    p95_slope_degrees: float = Field(ge=0, le=90)
    is_slope_safe: bool
    terrain_roughness_index: float | None = None
    nearest_ice_deposit_meters: float | None = Field(default=None, ge=0)
