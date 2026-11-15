"""Local horizon math (pure functions). No refraction: the Moon has no atmosphere.

Azimuth convention: 0 = local north, clockwise, whole degrees 0..359.
"""

import numpy as np
from pyproj import Geod

AZIMUTHS_DEG = np.arange(360, dtype=np.float64)


def spherical_horizon_profile() -> np.ndarray:
    """Return the approved idealized spherical horizon with no local relief."""
    return np.zeros(AZIMUTHS_DEG.shape, dtype=np.float64)


def elevation_angle_deg(h_obs_m: float, h_target_m: np.ndarray, distance_m: np.ndarray, radius_m: float) -> np.ndarray:
    """Elevation angle of terrain points seen from the observer, including lunar curvature.

    Heights are above the reference sphere of radius `radius_m`; `distance_m` is the
    great-circle distance along that sphere. Exact spherical geometry:
    angle = atan2((R + h) cos(theta) - (R + h0), (R + h) sin(theta)), theta = d / R.
    """
    theta = distance_m / radius_m
    r_target = radius_m + h_target_m
    r_obs = radius_m + h_obs_m
    return np.degrees(np.arctan2(r_target * np.cos(theta) - r_obs, r_target * np.sin(theta)))


def ray_lonlat(geod: Geod, lat_deg: float, lon_deg: float, distances_m: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Lon/lat of points at `distances_m` along every azimuth (shape: 360 x len(distances)).

    Uses the geodesic of the raster's own body model, so local north is handled
    correctly in any projection (R-05).
    """
    az = np.repeat(AZIMUTHS_DEG, distances_m.size)
    dist = np.tile(distances_m, AZIMUTHS_DEG.size)
    lons, lats, _ = geod.fwd(np.full(az.size, lon_deg), np.full(az.size, lat_deg), az, dist)
    shape = (AZIMUTHS_DEG.size, distances_m.size)
    return np.asarray(lons).reshape(shape), np.asarray(lats).reshape(shape)


def profiles_by_radius(
    angles_deg: np.ndarray,
    distances_m: np.ndarray,
    max_radii_m: tuple[float, ...],
    min_distance_m: float = 0.0,
) -> dict[float, np.ndarray]:
    """Horizon profile (max elevation angle per azimuth) for each maximum search radius.

    `angles_deg` has shape 360 x len(distances_m). Missing samples (NaN) are ignored;
    an azimuth with no valid sample raises.
    """
    profiles: dict[float, np.ndarray] = {}
    for radius in max_radii_m:
        subset = angles_deg[:, (distances_m >= min_distance_m) & (distances_m <= radius)]
        if subset.size == 0 or np.any(np.all(np.isnan(subset), axis=1)):
            raise ValueError(f"Horizon has azimuths without valid terrain samples within {radius:.0f} m.")
        profile = np.nanmax(subset, axis=1)
        if np.any(profile < -90) or np.any(profile > 90):
            raise ValueError("Horizon elevation outside [-90, 90] degrees.")
        profiles[radius] = profile
    return profiles


def horizon_summary(
    heights_m: np.ndarray,
    distances_m: np.ndarray,
    observer_height_m: float,
    body_radius_m: float,
    min_distance_m: float,
    max_radius_m: float,
) -> tuple[float, float]:
    """Return maximum and mean horizon elevation for one observer/range setting."""
    angles = elevation_angle_deg(
        observer_height_m,
        heights_m,
        distances_m[np.newaxis, :],
        body_radius_m,
    )
    mask = (distances_m >= min_distance_m) & (distances_m <= max_radius_m)
    subset = angles[:, mask]
    if subset.size == 0 or np.any(np.all(np.isnan(subset), axis=1)):
        raise ValueError("Horizon has azimuths without valid terrain samples for the sensitivity setting.")
    profile = np.nanmax(subset, axis=1)
    if np.any(profile < -90) or np.any(profile > 90):
        raise ValueError("Horizon elevation outside [-90, 90] degrees.")
    return float(profile.max()), float(profile.mean())
