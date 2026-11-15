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


def body_radius_km(body: str) -> float:
    """Equatorial (largest) radius of a body from the loaded PCK (bodvrd), in km."""
    return float(spiceypy.bodvrd(body, "RADII", 3)[1][0])


def angular_radius_deg(radius_km: float, distance_km: np.ndarray) -> np.ndarray:
    """Apparent angular radius (degrees) of a sphere of `radius_km` seen from `distance_km`."""
    return np.degrees(np.arcsin(np.minimum(radius_km / np.asarray(distance_km, dtype=float), 1.0)))


@dataclass(frozen=True)
class BodyGeometry:
    azimuth_deg: np.ndarray
    elevation_deg: np.ndarray
    range_km: np.ndarray  # site -> body center (azlcpo, same abcorr)
    dir_me: np.ndarray  # (n, 3) unit vector Moon center -> body, MOON_ME (spkpos, same abcorr)
    angular_radius_deg: np.ndarray


def body_geometry(
    lat_deg: float,
    lon_deg: float,
    ets: np.ndarray,
    abcorr: str,
    height_m: float = 0.0,
    bodies: Sequence[str] = BODIES,
) -> dict[str, BodyGeometry]:
    """Azimuth/elevation, range, MOON_ME direction and angular radius for each body and ephemeris time."""
    obspos = observer_position_km(lat_deg, lon_deg, height_m)
    result: dict[str, BodyGeometry] = {}
    for body in bodies:
        n = ets.size
        az = np.empty(n)
        el = np.empty(n)
        rng = np.empty(n)
        for i, et in enumerate(ets):
            state, _ = spiceypy.azlcpo("ELLIPSOID", body, et, abcorr, False, True, obspos, "MOON", "MOON_ME")
            rng[i] = state[0]
            az[i] = np.degrees(state[1]) % 360.0
            el[i] = np.degrees(state[2])
        # spkpos accepts an array of times (vectorized by SpiceyPy).
        pos, _ = spiceypy.spkpos(body, ets, "MOON_ME", abcorr, "MOON")
        pos = np.asarray(pos, dtype=float)
        dir_me = pos / np.linalg.norm(pos, axis=1)[:, None]
        result[body] = BodyGeometry(az, el, rng, dir_me, angular_radius_deg(body_radius_km(body), rng))
    return result
