"""Pipeline step `ephemeris`: Sun and Earth series for verified sites.

Writes data/interim/ephemeris/<site_id>.json (test series; `*_visible` is added in
round 3 when it is joined with the horizon into data/processed/sites/<id>.json).
"""

import numpy as np
import spiceypy

from lunar_pipeline.ephemeris.config import EphemerisConfig
from lunar_pipeline.ephemeris.kernels import ensure_kernels, load_kernels
from lunar_pipeline.ephemeris.spice_geometry import body_az_el, et_to_utc
from lunar_pipeline.paths import INTERIM_DIR, load_verified_sites, write_json


def _r(value: float) -> float:
    return round(float(value), 4)


def time_grid_utc(config: EphemerisConfig) -> list[str]:
    start = spiceypy.str2et(config.start_utc)
    count = config.days * 24 * 60 // config.step_minutes
    return [et_to_utc(start + i * config.step_minutes * 60.0) for i in range(count)]


def run_ephemeris(config: EphemerisConfig = EphemerisConfig()) -> None:
    kernel_paths = ensure_kernels()
    load_kernels(kernel_paths)
    try:
        times = time_grid_utc(config)
        for site in load_verified_sites():
            site_id = site["id"]
            azel = body_az_el(site["lat"], site["lon"], times, config.abcorr, config.observer_height_m)
            sun, earth = azel["SUN"], azel["EARTH"]
            for arr in (sun.elevation_deg, earth.elevation_deg):
                if np.any(np.abs(arr) > 90):
                    raise ValueError("Elevation outside [-90, 90] degrees.")
            series = [
                {
                    "time_utc": t,
                    "sun_azimuth_deg": _r(sun.azimuth_deg[i]),
                    "sun_elevation_deg": _r(sun.elevation_deg[i]),
                    "earth_azimuth_deg": _r(earth.azimuth_deg[i]),
                    "earth_elevation_deg": _r(earth.elevation_deg[i]),
                }
                for i, t in enumerate(times)
            ]
            write_json(
                INTERIM_DIR / "ephemeris" / f"{site_id}.json",
                {
                    "site_id": site_id,
                    "lat_deg": site["lat"],
                    "lon_deg": site["lon"],
                    "frame": "MOON_ME",
                    "abcorr": config.abcorr,
                    "observer_height_meters": config.observer_height_m,
                    "azimuth_convention": "0 = local north, clockwise",
                    "kernels": [p.name for p in kernel_paths],
                    "time_step_minutes": config.step_minutes,
                    "series": series,
                },
            )
            print(f"  {site_id}: {len(series)} points, {times[0]} .. {times[-1]}")
            print(
                f"    Sun elevation {sun.elevation_deg.min():.3f} .. {sun.elevation_deg.max():.3f} deg; "
                f"Earth elevation {earth.elevation_deg.min():.3f} .. {earth.elevation_deg.max():.3f} deg"
            )
            print("    Instants for the JPL Horizons check (observer on the Moon, refraction off, apparent az/el):")
            for i in (0, len(times) // 2, len(times) - 1):
                print(
                    f"      {times[i]}  Sun az {sun.azimuth_deg[i]:8.4f} el {sun.elevation_deg[i]:8.4f} | "
                    f"Earth az {earth.azimuth_deg[i]:8.4f} el {earth.elevation_deg[i]:8.4f}"
                )
    finally:
        spiceypy.kclear()


STEPS = {
    "ephemeris": ("Sun and Earth azimuth/elevation series (SPICE, MOON_ME) for verified sites", run_ephemeris),
}
