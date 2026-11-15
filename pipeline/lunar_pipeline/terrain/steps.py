"""Pipeline step `terrain`: slope stats and horizon profile for verified sites with a PGDA 78 tile.

Writes:
- data/processed/terrain/<site_id>.json (docs/contracts 1.2; `terrain_roughness_index`
  and `nearest_ice_deposit_meters` omitted until REQUIREMENTS 5.5 defines them)
- data/interim/horizon/<site_id>.json (360-value profile, joined into sites/<id>.json later)
"""

from itertools import combinations

import numpy as np

from lunar_pipeline.paths import INTERIM_DIR, PROCESSED_DIR, load_verified_sites, write_json
from lunar_pipeline.terrain.config import TerrainConfig
from lunar_pipeline.terrain.site_terrain import SiteTerrain, evaluate_site_terrain
from lunar_pipeline.terrain.sources import PGDA78_SITE_TILES


def _r(value: float) -> float:
    return round(float(value), 3)


def _print_radius_comparison(terrain: SiteTerrain, config: TerrainConfig) -> None:
    print("  Horizon change between max radii (PD-07 test):")
    for small, large in combinations(sorted(config.test_radii_m), 2):
        delta = terrain.profiles_deg[large] - terrain.profiles_deg[small]
        worst = int(np.argmax(delta))
        print(
            f"    {small / 1000:.0f} -> {large / 1000:.0f} km: max {delta.max():.3f} deg "
            f"(azimuth {worst}), mean {delta.mean():.3f} deg, "
            f"azimuths changed > 0.1 deg: {int(np.sum(delta > 0.1))}/360"
        )


def _print_sensitivity(terrain: SiteTerrain, config: TerrainConfig) -> None:
    print("  Horizon sensitivity (max / mean elevation at 150 km):")
    for observer_height_m in config.sensitivity_observer_heights_m:
        for min_distance_m in config.sensitivity_min_distances_m:
            maximum, mean = terrain.sensitivity[(observer_height_m, min_distance_m)]
            print(
                f"    observer {observer_height_m:.0f} m, min distance {min_distance_m:.0f} m: "
                f"max {maximum:.3f} deg, mean {mean:.3f} deg"
            )


def run_terrain(config: TerrainConfig = TerrainConfig()) -> None:
    sites = [s for s in load_verified_sites() if s["id"] in PGDA78_SITE_TILES]
    if not sites:
        print("  No verified site with a QA-confirmed PGDA 78 tile.")
        return
    for site in sites:
        site_id = site["id"]
        print(f"  {site_id}: lat {site['lat']}, lon {site['lon']} (tile {PGDA78_SITE_TILES[site_id]})")
        terrain = evaluate_site_terrain(site["lat"], site["lon"], PGDA78_SITE_TILES[site_id], config)
        _print_radius_comparison(terrain, config)
        _print_sensitivity(terrain, config)

        radius = config.landing_radius_m
        write_json(
            PROCESSED_DIR / "terrain" / f"{site_id}.json",
            {
                "site_id": site_id,
                "safety_radius_meters": int(radius) if float(radius).is_integer() else radius,
                "center_elevation_meters": _r(terrain.center_elevation_m),
                "max_slope_degrees": _r(terrain.slope.max_deg),
                "mean_slope_degrees": _r(terrain.slope.mean_deg),
                "p95_slope_degrees": _r(terrain.slope.p95_deg),
                "is_slope_safe": terrain.is_slope_safe,
            },
        )
        profile = terrain.profiles_deg[config.horizon_max_radius_m]
        write_json(
            INTERIM_DIR / "horizon" / f"{site_id}.json",
            {
                "site_id": site_id,
                "lat_deg": site["lat"],
                "lon_deg": site["lon"],
                "horizon_source": "lola",
                "azimuth_convention": "index = azimuth in whole degrees, 0 = local north, clockwise",
                "max_radius_meters": config.horizon_max_radius_m,
                "near_radius_meters": config.near_radius_m,
                "observer_height_meters": config.observer_height_m,
                "min_distance_meters": config.min_distance_m,
                "sources": terrain.sources,
                "horizon_profile_deg": [_r(v) for v in profile],
            },
        )
        print(
            f"  slope mean {terrain.slope.mean_deg:.2f} / p95 {terrain.slope.p95_deg:.2f} / "
            f"max {terrain.slope.max_deg:.2f} deg over {terrain.slope.pixel_count} px; "
            f"safe={terrain.is_slope_safe}; center elevation {terrain.center_elevation_m:.1f} m"
        )
        print(
            f"  horizon ({config.horizon_max_radius_m / 1000:.0f} km): min {profile.min():.3f}, "
            f"max {profile.max():.3f} deg; missing DEM samples along rays: {terrain.missing_horizon_samples}"
        )


STEPS = {
    "terrain": ("Slope stats and 360-degree horizon profile for verified sites with a PGDA 78 tile", run_terrain),
}
