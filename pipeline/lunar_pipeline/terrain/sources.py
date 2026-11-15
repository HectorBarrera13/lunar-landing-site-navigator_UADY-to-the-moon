"""Terrain dataset sources. Every entry is registered in data/README.md.

PGDA 90, "A New View of the Lunar South Pole from LOLA" (Barker et al., 2023,
PSJ 4, 183): https://pgda.gsfc.nasa.gov/products/90. All TIFs are COGs per
the product page. South polar stereographic, MOON_ME (DE421).
"""

from pathlib import Path

from lunar_pipeline.paths import RAW_RASTER_DIR

PGDA90_BASE_URL = "https://pgda.gsfc.nasa.gov/data/LOLA_20mpp/"

LDEM_80S_20MPP_ADJ_URL = PGDA90_BASE_URL + "LDEM_80S_20MPP_ADJ.TIF"
LDSM_80S_20MPP_ADJ_URL = PGDA90_BASE_URL + "LDSM_80S_20MPP_ADJ.TIF"
LPSR_80S_20MPP_ADJ_URL = PGDA90_BASE_URL + "LPSR_80S_20MPP_ADJ.TIF"
LDEM_60S_240MPP_ADJ_URL = PGDA90_BASE_URL + "LDEM_60S_240MPP_ADJ.TIF"

# PGDA 78, "High-Resolution LOLA Topography for Lunar South Pole Sites"
# (Barker et al., 2021, PSS 203, 105119): https://pgda.gsfc.nasa.gov/products/78.
# File pattern: <base><Site>/<Site>_final_adj_5mpp_{surf,slp}.tif.
PGDA78_BASE_URL = "https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/"


def pgda78_url(site_folder: str, product: str) -> str:
    """URL of a PGDA 78 GeoTIFF; `product` is e.g. "surf" or "slp"."""
    return f"{PGDA78_BASE_URL}{site_folder}/{site_folder}_final_adj_5mpp_{product}.tif"


def pgda78_local_path(site_folder: str, product: str) -> Path:
    """Local path of a PGDA 78 GeoTIFF under the configured raw-raster directory."""
    return RAW_RASTER_DIR / site_folder / f"{site_folder}_final_adj_5mpp_{product}.tif"


# Landing site -> PGDA 78 tile folder. Only QA-confirmed entries (point inside the
# tile with valid data); sites without an entry use the registered PGDA 90 20 m products.
# malapert-massif -> Site23 ("Malapert massif"): confirmed 2026-11-14, lat -86.0,
# lon 0.3 projects inside Site23_final_adj_5mpp_surf.tif, 9.4 km from the edge.
PGDA78_SITE_TILES: dict[str, str] = {
    "malapert-massif": "Site23",
}
