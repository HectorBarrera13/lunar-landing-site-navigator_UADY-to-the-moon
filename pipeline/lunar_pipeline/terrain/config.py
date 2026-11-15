"""Terrain step configuration. Provisional values are marked with their decision ID."""

from dataclasses import dataclass


@dataclass(frozen=True)
class TerrainConfig:
    # PD-02 (Proposed): landing zone 200 m diameter -> 100 m radius.
    landing_radius_m: float = 100.0
    # REQUIREMENTS 5.4 (Agreed): mean slope inside the landing circle < 10 deg.
    mean_slope_safe_max_deg: float = 10.0
    # Not defined in REQUIREMENTS; observer at the DEM surface.
    observer_height_m: float = 0.0
    # Near horizon from the 20 m mosaic up to this distance; 240 m mosaic beyond (team decision 2026-11-14).
    near_radius_m: float = 10_000.0
    # PD-07 (Pending): written profile uses this max radius until the team decides.
    horizon_max_radius_m: float = 150_000.0
    # PD-07 test: profiles compared across these max radii.
    test_radii_m: tuple[float, ...] = (25_000.0, 75_000.0, 150_000.0)
