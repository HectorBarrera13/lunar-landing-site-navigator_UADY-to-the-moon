"""Sun and Earth azimuth/elevation from a point on the Moon (requires loaded kernels).

Frame MOON_ME. Azimuth: 0 = local north, clockwise (east = 90). Elevation positive
above the local horizontal plane of the reference ellipsoid. No refraction.
"""

from collections.abc import Sequence
from dataclasses import dataclass

import numpy as np
import spiceypy

BODIES: tuple[str, ...] = ("SUN", "EARTH")


@dataclass(frozen=True)
class AzEl:
    azimuth_deg: np.ndarray
    elevation_deg: np.ndarray


def observer_position_km(lat_deg: float, lon_deg: float, height_m: float = 0.0) -> np.ndarray:
    """MOON_ME position (km) of a surface point at planetodetic lat/lon on the Moon ellipsoid.

    For the spherical Moon radii in the PCK, planetodetic and planetocentric latitude coincide.
    """
    radii = spiceypy.bodvrd("MOON", "RADII", 3)[1]
    re, rp = radii[0], radii[2]
    flattening = (re - rp) / re
    return np.asarray(
        spiceypy.georec(np.radians(lon_deg), np.radians(lat_deg), height_m / 1000.0, re, flattening)
    )


def utc_to_et(times_utc: Sequence[str]) -> np.ndarray:
    return np.array([spiceypy.str2et(t) for t in times_utc])


def et_to_utc(et: float) -> str:
    return spiceypy.et2utc(et, "ISOC", 0) + "Z"


def body_az_el(
    lat_deg: float,
    lon_deg: float,
    times_utc: Sequence[str],
    abcorr: str,
    height_m: float = 0.0,
    bodies: Sequence[str] = BODIES,
) -> dict[str, AzEl]:
    """Apparent azimuth and elevation (degrees) of each body for every UTC time."""
    obspos = observer_position_km(lat_deg, lon_deg, height_m)
    ets = utc_to_et(times_utc)
    result: dict[str, AzEl] = {}
    for body in bodies:
        az = np.empty(ets.size)
        el = np.empty(ets.size)
        for i, et in enumerate(ets):
            state, _ = spiceypy.azlcpo("ELLIPSOID", body, et, abcorr, False, True, obspos, "MOON", "MOON_ME")
            az[i] = np.degrees(state[1]) % 360.0
            el[i] = np.degrees(state[2])
        result[body] = AzEl(azimuth_deg=az, elevation_deg=el)
    return result
