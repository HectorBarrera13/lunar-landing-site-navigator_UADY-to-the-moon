"""Terrain evaluation for one site: slope inside the landing circle and horizon profile.

Reads only windows of remote rasters (see remote_window.py). All projection and
body-radius values come from the rasters' own CRS.
"""

from dataclasses import dataclass

import numpy as np
from pyproj import CRS, Geod, Transformer
from scipy.ndimage import map_coordinates

from lunar_pipeline.terrain.config import TerrainConfig
from lunar_pipeline.terrain.horizon import elevation_angle_deg, profiles_by_radius, ray_lonlat
from lunar_pipeline.terrain.remote_window import DemWindow, read_window
from lunar_pipeline.terrain.slope import SlopeStats, slope_stats
from lunar_pipeline.terrain.sources import LDEM_60S_240MPP_ADJ_URL, LDEM_80S_20MPP_ADJ_URL, pgda78_url


@dataclass(frozen=True)
class SiteTerrain:
    center_elevation_m: float
    slope: SlopeStats
    is_slope_safe: bool
    profiles_deg: dict[float, np.ndarray]
    missing_horizon_samples: int
    """DEM samples along the rays with no data (ignored by the horizon max)."""
    sources: dict[str, str]


def _body(win: DemWindow) -> tuple[CRS, Geod, float]:
    crs = CRS.from_wkt(win.crs_wkt)
    radius = crs.ellipsoid.semi_major_metre if crs.ellipsoid else None
    if radius is None or crs.ellipsoid.semi_minor_metre != radius:
        raise ValueError("Expected a spherical body model in the raster CRS.")
    return crs, crs.get_geod(), float(radius)


def _sample(win: DemWindow, xs: np.ndarray, ys: np.ndarray) -> np.ndarray:
    """Bilinear sample at projected coordinates; NaN where missing or outside the window."""
    cols, rows = ~win.transform * (xs, ys)
    # Pixel i center sits at fractional index i + 0.5 in affine space.
    coords = np.vstack([np.ravel(rows) - 0.5, np.ravel(cols) - 0.5])
    values = map_coordinates(win.values, coords, order=1, mode="constant", cval=np.nan, prefilter=False)
    return values.reshape(np.shape(xs))


def _pixel_center_distances(win: DemWindow, lat_deg: float, lon_deg: float) -> np.ndarray:
    crs, geod, _ = _body(win)
    rows, cols = np.indices(win.values.shape)
    xs, ys = win.transform * (cols + 0.5, rows + 0.5)
    to_geo = Transformer.from_crs(crs, crs.geodetic_crs, always_xy=True)
    lons, lats = to_geo.transform(xs, ys)
    _, _, dist = geod.inv(np.full(lons.size, lon_deg), np.full(lats.size, lat_deg), np.ravel(lons), np.ravel(lats))
    return np.asarray(dist).reshape(win.values.shape)


def _sample_lonlat(win: DemWindow, lons: np.ndarray, lats: np.ndarray) -> np.ndarray:
    crs = CRS.from_wkt(win.crs_wkt)
    to_xy = Transformer.from_crs(crs.geodetic_crs, crs, always_xy=True)
    xs, ys = to_xy.transform(lons, lats)
    return _sample(win, np.asarray(xs), np.asarray(ys))


def evaluate_site_terrain(lat_deg: float, lon_deg: float, pgda78_tile: str, config: TerrainConfig) -> SiteTerrain:
    radius = config.landing_radius_m
    slope_url = pgda78_url(pgda78_tile, "slp")
    surf_url = pgda78_url(pgda78_tile, "surf")

    # Slope and center elevation from the 5 m site tile.
    slope_win = read_window(slope_url, lat_deg, lon_deg, half_size_m=radius + 20)
    stats = slope_stats(slope_win.values, _pixel_center_distances(slope_win, lat_deg, lon_deg), radius)
    surf_win = read_window(surf_url, lat_deg, lon_deg, half_size_m=20)
    center_elevation = float(_sample_lonlat(surf_win, np.array([lon_deg]), np.array([lat_deg]))[0])
    if not np.isfinite(center_elevation):
        raise ValueError("Missing center elevation in the site tile.")

    # Horizon: near part from the 20 m mosaic, far part from the 240 m mosaic.
    max_radius = max(max(config.test_radii_m), config.horizon_max_radius_m)
    near_win = read_window(LDEM_80S_20MPP_ADJ_URL, lat_deg, lon_deg, half_size_m=config.near_radius_m + 200)
    far_win = read_window(LDEM_60S_240MPP_ADJ_URL, lat_deg, lon_deg, half_size_m=max_radius + 2_000)
    _, geod, body_radius = _body(near_win)
    _, _, far_radius = _body(far_win)
    if far_radius != body_radius:
        raise ValueError("Near and far DEMs use different body radii.")

    near_step = abs(near_win.transform.a)
    far_step = abs(far_win.transform.a)
    near_d = np.arange(near_step, config.near_radius_m + near_step / 2, near_step)
    far_d = np.arange(config.near_radius_m + far_step, max_radius + far_step / 2, far_step)

    h_obs = float(_sample_lonlat(near_win, np.array([lon_deg]), np.array([lat_deg]))[0])
    if not np.isfinite(h_obs):
        raise ValueError("Missing observer elevation in the 20 m mosaic.")
    h_obs += config.observer_height_m

    near_lon, near_lat = ray_lonlat(geod, lat_deg, lon_deg, near_d)
    far_lon, far_lat = ray_lonlat(geod, lat_deg, lon_deg, far_d)
    heights = np.hstack([_sample_lonlat(near_win, near_lon, near_lat), _sample_lonlat(far_win, far_lon, far_lat)])
    distances = np.concatenate([near_d, far_d])
    angles = elevation_angle_deg(h_obs, heights, distances[np.newaxis, :], body_radius)

    radii = tuple(sorted(set(config.test_radii_m) | {config.horizon_max_radius_m}))
    profiles = profiles_by_radius(angles, distances, radii)

    return SiteTerrain(
        center_elevation_m=center_elevation,
        slope=stats,
        is_slope_safe=stats.mean_deg < config.mean_slope_safe_max_deg,
        profiles_deg=profiles,
        missing_horizon_samples=int(np.isnan(heights).sum()),
        sources={
            "slope": slope_url,
            "center_elevation": surf_url,
            "horizon_near": LDEM_80S_20MPP_ADJ_URL,
            "horizon_far": LDEM_60S_240MPP_ADJ_URL,
        },
    )
