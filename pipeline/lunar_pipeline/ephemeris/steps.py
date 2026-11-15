"""Pipeline step `ephemeris`: Sun and Earth geometry for verified sites, one interim file per year.

Writes data/interim/ephemeris/<site_id>/<year>.json (columnar, unrounded floats). Visibility
fractions and the contract 1.1 files are produced by the `sites` step.
"""

from datetime import datetime, timedelta, timezone

import numpy as np
import spiceypy

from lunar_pipeline.ephemeris.config import EphemerisConfig
from lunar_pipeline.ephemeris.kernels import ensure_kernels, load_kernels
from lunar_pipeline.ephemeris.spice_geometry import body_geometry
from lunar_pipeline.paths import INTERIM_DIR, load_verified_sites, write_json_compact


def year_grid(year: int, step_minutes: int) -> tuple[list[str], np.ndarray]:
    """UTC ISO 8601 strings and SPICE ephemeris times for Jan 1 00:00Z of `year` onward, whole year."""
    start = datetime(year, 1, 1, tzinfo=timezone.utc)
    end = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    count = int((end - start).total_seconds() // (step_minutes * 60))
    times = [(start + timedelta(minutes=step_minutes * i)).strftime("%Y-%m-%dT%H:%M:%SZ") for i in range(count)]
    et0 = spiceypy.str2et(times[0])
    return times, et0 + np.arange(count) * step_minutes * 60.0


def run_ephemeris(config: EphemerisConfig = EphemerisConfig()) -> None:
    kernel_paths = ensure_kernels()
    load_kernels(kernel_paths)
    try:
        for site in load_verified_sites():
            site_id = site["id"]
            for year in config.years:
                times, ets = year_grid(year, config.step_minutes)
                geo = body_geometry(site["lat"], site["lon"], ets, config.abcorr, config.observer_height_m)
                sun, earth = geo["SUN"], geo["EARTH"]
                for arr in (sun.elevation_deg, earth.elevation_deg):
                    if np.any(np.abs(arr) > 90):
                        raise ValueError("Elevation outside [-90, 90] degrees.")
                payload: dict[str, object] = {
                    "site_id": site_id,
                    "year": year,
                    "lat_deg": site["lat"],
                    "lon_deg": site["lon"],
                    "frame": "MOON_ME",
                    "abcorr": config.abcorr,
                    "observer_height_meters": config.observer_height_m,
                    "azimuth_convention": "0 = local north, clockwise",
                    "kernels": [p.name for p in kernel_paths],
                    "time_step_minutes": config.step_minutes,
                    "time_utc": times,
                }
                for key, body in (("sun", sun), ("earth", earth)):
                    payload[f"{key}_azimuth_deg"] = body.azimuth_deg.tolist()
                    payload[f"{key}_elevation_deg"] = body.elevation_deg.tolist()
                    payload[f"{key}_distance_km"] = body.range_km.tolist()
                    payload[f"{key}_dir_me"] = body.dir_me.tolist()
                    payload[f"{key}_angular_radius_deg"] = body.angular_radius_deg.tolist()
                write_json_compact(INTERIM_DIR / "ephemeris" / site_id / f"{year}.json", payload)
                print(
                    f"  {site_id} {year}: {len(times)} points; Sun el {sun.elevation_deg.min():.3f}..{sun.elevation_deg.max():.3f}, "
                    f"Earth el {earth.elevation_deg.min():.3f}..{earth.elevation_deg.max():.3f} deg; "
                    f"Sun radius {sun.angular_radius_deg.min():.4f}..{sun.angular_radius_deg.max():.4f}, "
                    f"Earth radius {earth.angular_radius_deg.min():.4f}..{earth.angular_radius_deg.max():.4f} deg"
                )
                if year == config.years[0]:
                    print("    Instants for the JPL Horizons check (refraction off, apparent az/el):")
                    for stamp in ("2027-03-15T00:00:00Z", "2027-03-30T00:00:00Z", "2027-04-13T23:00:00Z"):
                        if stamp in times:
                            i = times.index(stamp)
                            print(
                                f"      {stamp}  Sun az {sun.azimuth_deg[i]:8.4f} el {sun.elevation_deg[i]:8.4f} "
                                f"r {sun.range_km[i]:.1f} km | Earth az {earth.azimuth_deg[i]:8.4f} "
                                f"el {earth.elevation_deg[i]:8.4f} r {earth.range_km[i]:.1f} km"
                            )
    finally:
        spiceypy.kclear()


STEPS = {
    "ephemeris": ("Sun and Earth geometry series (SPICE, MOON_ME), 2025-2035, per site and year", run_ephemeris),
}
