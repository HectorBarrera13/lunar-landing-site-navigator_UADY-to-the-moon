"""Terrain step configuration. Provisional values are marked with their decision ID."""

from dataclasses import dataclass


@dataclass(frozen=True)
class TerrainConfig:
    # PD-02 (Agreed 2026-11-15): landing zone 200 m diameter -> 100 m radius; slope is evaluated here.
    landing_radius_m: float = 100.0
    # REQUIREMENTS 5.4 (Agreed): mean slope inside the landing circle < 10 deg.
    mean_slope_safe_max_deg: float = 10.0
    # PD-09 (Agreed 2026-11-15): observer height at the DEM surface.
    observer_height_m: float = 0.0
    # PD-09 (Agreed 2026-11-15): exclude the near field from horizon blocking; slope covers it.
    min_distance_m: float = 100.0
    # Near/far switch recorded as a user decision in AI_LOG.md:224; not a formal REQUIREMENTS decision.
    near_radius_m: float = 10_000.0
    # PD-07 (Agreed 2026-11-15): written profile uses this max radius.
    horizon_max_radius_m: float = 150_000.0
    # PD-07 test: profiles compared across these max radii.
    test_radii_m: tuple[float, ...] = (25_000.0, 75_000.0, 150_000.0)
    # Sensitivity output for the provisional observer and near-field settings.
    sensitivity_observer_heights_m: tuple[float, ...] = (0.0, 2.0)
    sensitivity_min_distances_m: tuple[float, ...] = (0.0, 60.0, 100.0)
