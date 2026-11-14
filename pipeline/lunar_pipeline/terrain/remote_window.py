"""Read a small window of a remote (COG) GeoTIFF around a lat/lon point.

The point is converted to the raster's own projected CRS with pyproj, using the
geodetic CRS of that same file, so no projection constants are hard-coded.
Only the tiles that cover the window are fetched (HTTP range requests).
"""

from dataclasses import dataclass

import numpy as np
import rasterio
from pyproj import CRS, Transformer
from rasterio import Affine
from rasterio.windows import Window, from_bounds

# GDAL options for remote COG reads: skip directory listings, only allow TIF
# files, retry transient 5xx errors, and fail instead of hanging. Multi-range
# requests are avoided: the PGDA server answers them with the whole file (200).
REMOTE_GDAL_OPTIONS: dict[str, str] = {
    "GDAL_DISABLE_READDIR_ON_OPEN": "EMPTY_DIR",
    "CPL_VSIL_CURL_ALLOWED_EXTENSIONS": ".tif,.TIF",
    "GDAL_HTTP_MULTIRANGE": "SERIAL",
    "GDAL_HTTP_MERGE_CONSECUTIVE_RANGES": "YES",
    "GDAL_HTTP_MAX_RETRY": "4",
    # The PGDA server intermittently answers valid range requests with 403/503.
    "GDAL_HTTP_RETRY_CODES": "403,429,500,502,503,504",
    "GDAL_HTTP_RETRY_DELAY": "2",
    "GDAL_HTTP_TIMEOUT": "60",
}


@dataclass(frozen=True)
class DemWindow:
    values: np.ndarray
    """2D float64 array; nodata cells are NaN. Units are those of the source file."""
    transform: Affine
    crs_wkt: str
    center_x_m: float
    center_y_m: float


def lonlat_to_xy(crs_wkt: str, lat_deg: float, lon_deg: float) -> tuple[float, float]:
    """Project a planetocentric lat/lon (degrees) into the given projected CRS (meters)."""
    projected = CRS.from_wkt(crs_wkt)
    geodetic = projected.geodetic_crs
    if geodetic is None:
        raise ValueError("Raster CRS has no geodetic CRS; cannot convert lat/lon.")
    transformer = Transformer.from_crs(geodetic, projected, always_xy=True)
    x, y = transformer.transform(lon_deg, lat_deg)
    return float(x), float(y)


def read_window(url: str, lat_deg: float, lon_deg: float, half_size_m: float) -> DemWindow:
    """Read a square window of side 2 * half_size_m centered on (lat, lon) from a GeoTIFF URL.

    Raises ValueError if the window is not fully inside the raster.
    """
    if half_size_m <= 0:
        raise ValueError("half_size_m must be positive.")
    with rasterio.Env(**REMOTE_GDAL_OPTIONS), rasterio.open(url) as src:
        if src.crs is None:
            raise ValueError(f"Raster has no CRS: {url}")
        crs_wkt = src.crs.to_wkt()
        x, y = lonlat_to_xy(crs_wkt, lat_deg, lon_deg)
        window = from_bounds(x - half_size_m, y - half_size_m, x + half_size_m, y + half_size_m, src.transform)
        window = window.round_offsets().round_lengths()
        full = Window(0, 0, src.width, src.height)
        if (
            window.col_off < 0
            or window.row_off < 0
            or window.col_off + window.width > full.width
            or window.row_off + window.height > full.height
        ):
            raise ValueError(
                f"Window around lat={lat_deg}, lon={lon_deg} (x={x:.0f} m, y={y:.0f} m) "
                f"is outside the raster coverage of {url}"
            )
        data = src.read(1, window=window, masked=True)
        values = np.ma.filled(data.astype(np.float64), np.nan)
        return DemWindow(
            values=values,
            transform=src.window_transform(window),
            crs_wkt=crs_wkt,
            center_x_m=x,
            center_y_m=y,
        )
