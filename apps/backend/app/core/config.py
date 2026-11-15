from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]
REPO_ROOT = BACKEND_DIR.parents[1]


class Settings(BaseSettings):
    """Runtime configuration. Values come from environment variables or .env files.

    Lookup order: repository root `.env`, then `apps/backend/.env` (later files win).
    """

    model_config = SettingsConfigDict(
        env_file=(REPO_ROOT / ".env", BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    port: int = 8000
    frontend_url: str = "http://localhost:5173"
    debug_mode: bool = False
    data_dir: Path = Path("data/processed")
    catalog_file: Path = Path("data/catalog/sites.json")

    # South-pole region boundary (REQUIREMENTS R-11): sites at or below this latitude are `south_pole`.
    south_pole_max_lat_deg: float = -80.0

    # Traffic-light thresholds on the Suitability Index (REQUIREMENTS 5.1, Agreed).
    traffic_light_green_min: int = 70
    traffic_light_orange_min: int = 40

    # Criterion weights (REQUIREMENTS 5.2, Agreed 2026-11-14, south-pole column).
    weight_power: float = 0.30
    weight_communication: float = 0.20
    weight_slope: float = 0.15
    weight_landing_zone: float = 0.10
    weight_resources: float = 0.20
    weight_roughness: float = 0.05

    # REQUIREMENTS 5.2, agreed 2026-11-15, SRS near-side baseline for historical sites.
    near_side_weight_power: float = 0.25
    near_side_weight_communication: float = 0.15
    near_side_weight_slope: float = 0.20
    near_side_weight_landing_zone: float = 0.15
    near_side_weight_resources: float = 0.0
    near_side_weight_surface_temperature: float = 0.15
    near_side_weight_radiation: float = 0.05
    near_side_weight_roughness: float = 0.05

    # Vetoes and warnings (REQUIREMENTS 5.3, 5.4, 5.5, Agreed 2026-11-14).
    veto_earth_visible_min_percent: float = 25.0
    veto_sunlight_min_percent: float = 5.0
    veto_darkness_max_hours: float = 48.0
    veto_mean_slope_max_degrees: float = 10.0
    # REQUIREMENTS 5.3 (PO decision 2026-11-15): landing at t0 requires the Sun center above
    # the local horizon; a visible solar fraction below this threshold vetoes the window.
    veto_landing_sun_min_fraction: float = 0.5
    warning_p95_slope_degrees: float = 10.0

    @property
    def weights(self) -> dict[str, float]:
        """Configured weights by criterion code, before renormalization."""
        return {
            "power": self.weight_power,
            "communication": self.weight_communication,
            "slope": self.weight_slope,
            "landing_zone": self.weight_landing_zone,
            "resources": self.weight_resources,
            "roughness": self.weight_roughness,
        }

    @property
    def near_side_weights(self) -> dict[str, float]:
        """SRS near-side baseline weights, before excluding unavailable criteria."""
        return {
            "power": self.near_side_weight_power,
            "communication": self.near_side_weight_communication,
            "slope": self.near_side_weight_slope,
            "landing_zone": self.near_side_weight_landing_zone,
            "resources": self.near_side_weight_resources,
            "surface_temperature": self.near_side_weight_surface_temperature,
            "radiation": self.near_side_weight_radiation,
            "roughness": self.near_side_weight_roughness,
        }

    @property
    def frontend_origins(self) -> list[str]:
        """CORS origins from `FRONTEND_URL` (comma-separated), plus loopback aliases.

        Vite serves the same app on `localhost` and `127.0.0.1`; browsers send the
        exact origin they were opened with, so both loopbacks are allowed for local
        development. Non-loopback origins are used verbatim.
        """
        origins = [url.strip().rstrip("/") for url in self.frontend_url.split(",") if url.strip()]
        for origin in list(origins):
            if origin.startswith("http://localhost:"):
                origins.append(origin.replace("http://localhost:", "http://127.0.0.1:", 1))
            elif origin.startswith("http://127.0.0.1:"):
                origins.append(origin.replace("http://127.0.0.1:", "http://localhost:", 1))
        return list(dict.fromkeys(origins))

    @property
    def resolved_data_dir(self) -> Path:
        return self.data_dir if self.data_dir.is_absolute() else REPO_ROOT / self.data_dir

    @property
    def resolved_catalog_file(self) -> Path:
        return self.catalog_file if self.catalog_file.is_absolute() else REPO_ROOT / self.catalog_file


@lru_cache
def get_settings() -> Settings:
    return Settings()
