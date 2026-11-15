"""Pure join of ephemeris columns with a 360-degree horizon profile (docs/contracts §1.1)."""

from collections.abc import Sequence
from typing import Any

import numpy as np

HORIZON_SOURCES = ("lola", "sphere")

VISIBILITY_APPROXIMATION = (
    "Visible fractions (contract 1.1, R3-2): the horizon elevation is read at the azimuth of the body "
    "center by linear interpolation between whole-degree bins (periodic in azimuth) and treated as a "
    "straight horizontal line across the whole disc width. The visible fraction is the area of the "
    "circular segment of the disc above that line divided by the disc area (disc radius from the SPICE "
    "kernel radius and distance; the disc is approximated as a circle in the azimuth/elevation plane, "
    "ignoring the cos(elevation) compression of azimuth width). Earth counts as visible when its center "
    "is above the horizon (margin 0 deg), equivalently fraction >= 0.5."
)

HORIZON_ASSUMPTIONS = (
    "Frame MOON_ME (DE421); azimuth 0 = local north, clockwise; angles in degrees; times UTC.",
    "No atmospheric refraction. Apparent directions use light-time and stellar-aberration correction (LT+S).",
    "Horizon elevation includes lunar curvature; terrain beyond max_radius_m is ignored and terrain inside near_field_m is excluded (slope covers the landing zone).",
    "Observer at the DEM surface (observer_height_m = 0).",
    VISIBILITY_APPROXIMATION,
)


def _required(mapping: dict[str, Any], key: str) -> Any:
    if key not in mapping:
        raise KeyError(f"Missing field {key!r} in intermediate artifact.")
    return mapping[key]


def validate_profile(profile: Sequence[float]) -> np.ndarray:
    values = np.asarray(profile, dtype=float)
    if values.shape != (360,):
        raise ValueError(f"horizon_profile_deg must have 360 values, got {values.size}.")
    return values


def horizon_at_azimuth(profile_deg: np.ndarray, azimuth_deg: np.ndarray) -> np.ndarray:
    """Horizon elevation (deg) at arbitrary azimuths: linear interpolation of whole-degree bins, periodic."""
    nodes = np.arange(361, dtype=float)
    closed = np.concatenate([profile_deg, profile_deg[:1]])
    return np.interp(np.mod(azimuth_deg, 360.0), nodes, closed)


def visible_disc_fraction(
    elevation_deg: np.ndarray,
    angular_radius_deg: np.ndarray,
    horizon_deg: np.ndarray,
) -> np.ndarray:
    """Fraction (0-1) of a circular disc lying above a horizontal horizon line.

    The disc center is at `elevation_deg`; the line at `horizon_deg`. With d = horizon - elevation
    (in units of the angular radius rho, t = d / rho) the visible area is the circular segment
    rho^2 * (acos(t) - t * sqrt(1 - t^2)); the fraction divides it by pi * rho^2.
    """
    rho = np.asarray(angular_radius_deg, dtype=float)
    t = np.clip((np.asarray(horizon_deg, dtype=float) - np.asarray(elevation_deg, dtype=float)) / rho, -1.0, 1.0)
    return (np.arccos(t) - t * np.sqrt(1.0 - t * t)) / np.pi


def _round(array: np.ndarray, decimals: int) -> list[Any]:
    return np.round(array, decimals).tolist()


def build_year_series(ephemeris: dict[str, Any], profile_deg: np.ndarray) -> dict[str, Any]:
    """Contract §1.1 `<year>.json` payload from an ephemeris interim payload and a horizon profile."""
    out: dict[str, Any] = {
        "site_id": _required(ephemeris, "site_id"),
        "year": int(_required(ephemeris, "year")),
        "time_step_minutes": int(_required(ephemeris, "time_step_minutes")),
    }
    times = _required(ephemeris, "time_utc")
    out["start_utc"] = times[0]
    out["time_utc"] = times
    for key in ("sun", "earth"):
        az = np.asarray(_required(ephemeris, f"{key}_azimuth_deg"), dtype=float)
        el = np.asarray(_required(ephemeris, f"{key}_elevation_deg"), dtype=float)
        dist = np.asarray(_required(ephemeris, f"{key}_distance_km"), dtype=float)
        direction = np.asarray(_required(ephemeris, f"{key}_dir_me"), dtype=float)
        radius = np.asarray(_required(ephemeris, f"{key}_angular_radius_deg"), dtype=float)
        if not (az.size == el.size == dist.size == radius.size == direction.shape[0] == len(times)):
            raise ValueError(f"Column length mismatch for {key} in year {out['year']}.")
        fraction = visible_disc_fraction(el, radius, horizon_at_azimuth(profile_deg, az))
        if np.any(fraction < 0.0) or np.any(fraction > 1.0):
            raise ValueError("Visible fraction outside [0, 1].")
        out[f"{key}_azimuth_deg"] = _round(az, 4)
        out[f"{key}_elevation_deg"] = _round(el, 4)
        out[f"{key}_visible_fraction"] = _round(fraction, 4)
        out[f"{key}_distance_km"] = _round(dist, 3)
        out[f"{key}_angular_radius_deg"] = _round(radius, 6)
        out[f"{key}_dir_me"] = _round(direction, 6)
    return out


def build_horizon(horizon: dict[str, Any], name: str) -> dict[str, Any]:
    """Contract §1.1 `horizon.json` payload from the terrain horizon interim payload."""
    source = _required(horizon, "horizon_source")
    if source not in HORIZON_SOURCES:
        raise ValueError(f"horizon_source must be one of {HORIZON_SOURCES}, got {source!r}.")
    profile = validate_profile(_required(horizon, "horizon_profile_deg"))

    def number(value: float) -> int | float:
        return int(value) if float(value).is_integer() else float(value)

    return {
        "site_id": _required(horizon, "site_id"),
        "name": name,
        "lat_deg": float(_required(horizon, "lat_deg")),
        "lon_deg": float(_required(horizon, "lon_deg")),
        "horizon_source": source,
        "horizon_profile_deg": _round(profile, 4),
        "max_radius_m": number(_required(horizon, "max_radius_meters")),
        "near_field_m": number(_required(horizon, "min_distance_meters")),
        "observer_height_m": float(_required(horizon, "observer_height_meters")),
        "assumptions": list(HORIZON_ASSUMPTIONS),
    }
