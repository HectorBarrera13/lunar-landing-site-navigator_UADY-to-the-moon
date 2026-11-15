"""Terrain step configuration. Provisional values are marked with their decision ID."""

from dataclasses import dataclass


@dataclass(frozen=True)
class TerrainConfig:
    # PD-02 (Approved): landing circle is 200 m in diameter.
    landing_radius_m: float = 100.0
    # REQUIREMENTS 5.4 (Agreed): mean slope inside the landing circle < 10 deg.
    mean_slope_safe_max_deg: float = 10.0
    # PD-09 (Agreed): observer at the DEM surface (height 0 m).
    observer_height_m: float = 0.0
    # PD-09 (Agreed): exclude the 100 m landing circle from horizon blocking.
    min_distance_m: float = 100.0
    # Near horizon from the 20 m mosaic up to this distance; 240 m mosaic beyond (team decision 2026-11-14).
    near_radius_m: float = 10_000.0
    # PD-07 (Agreed): written profile uses this maximum search radius.
    horizon_max_radius_m: float = 150_000.0
    # PD-07 test: profiles compared across these max radii.
    test_radii_m: tuple[float, ...] = (25_000.0, 75_000.0, 150_000.0)
    # Sensitivity output for the provisional observer and near-field settings.
    sensitivity_observer_heights_m: tuple[float, ...] = (0.0, 2.0)
    sensitivity_min_distances_m: tuple[float, ...] = (0.0, 60.0, 100.0)
