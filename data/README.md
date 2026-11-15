# Data

| Folder | Content | Committed |
|---|---|---|
| `raw/` | Original NASA downloads (LOLA DEMs, PGDA layers) | No |
| `processed/` | Small artifacts produced by `pipeline/`, served by the backend | Yes, if small (< 5 MB each) |
| `catalog/` | Curated inputs maintained by the team (`sites.json`) | Yes |

SPICE kernels live in `pipeline/kernels/` and are never committed.

## Source registry

Every dataset used must be listed here before it is used in code. QA owns this table.

| Dataset | Provider | URL | Version / date | Resolution | Frame | License | Used by |
|---|---|---|---|---|---|---|---|
| Deep Star Maps 2020 (celestial coordinates, `starmap_2020_8k.exr`) | NASA Scientific Visualization Studio (E. Wright) | https://svs.gsfc.nasa.gov/4851 (file: `/vis/a000000/a004800/a004851/starmap_2020_8k.exr`) | 2020-09-09 (SVS 4851) | 8192x4096, downscaled to 4096x2048 JPG | ICRF/J2000 RA/Dec, plate carree (RA increases to the left); NOT yet rotated to `MOON_ME` | NOT VERIFIED: SVS page shows no license text; confirm NASA media usage terms and credit | Frontend `StarBackground` (`apps/frontend/public/textures/starmap_2020_4k.jpg`) |
| PGDA 78 — High-Resolution LOLA Topography for Lunar South Pole Sites | NASA GSFC PGDA (product page: https://pgda.gsfc.nasa.gov/products/78) | Base `https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/`; files `<Site>/<Site>_final_adj_5mpp_surf.tif` (elevation, m) and `<Site>/<Site>_final_adj_5mpp_slp.tif` (slope, deg). README: `https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/README` | Barker et al. 2021, PSS 203, 105119, doi:10.1016/j.pss.2020.105119 | 5 m/px | `MOON_ME` (DE421); south polar stereographic, X/Y in m (parameters read from each file) | Not stated on the product page; cite the paper | `pipeline/terrain` (site slope and near horizon; site ↔ file mapping pending QA, except Malapert Massif → Site23, QA-confirmed 2026-11-14) |
| PGDA 90 — A New View of the Lunar South Pole from LOLA | NASA GSFC PGDA (product page: https://pgda.gsfc.nasa.gov/products/90) | Base `https://pgda.gsfc.nasa.gov/data/LOLA_20mpp/`; `LDEM_80S_20MPP_ADJ.TIF` (elevation, m, 2.6 GB), `LDSM_80S_20MPP_ADJ.TIF` (slope, deg, 3.6 GB), `LPSR_80S_20MPP_ADJ.TIF` (PSR, 148 MB), `LDEM_60S_240MPP_ADJ.TIF` (elevation, m, 210 MB) | Barker et al. 2023, PSJ 4, 183, doi:10.3847/PSJ/acf3e1; data doi:10.60903/gsfcpgda-lola-spole | 20 m/px (80S); 240 m/px (60S) | `MOON_ME` (DE421); south polar stereographic, X/Y in m (parameters read from each file) | Not stated on the product page; cite the paper | `pipeline/terrain` (remote window reader, horizon, slope, PSR) |

Notes:

### Official landing site imagery (curated by the PO on 2026-11-15)

Used by `apps/frontend` as the base image of the 2D landing view (`LandingCanvas`), committed at
`apps/frontend/public/images/sites/<site_id>.png`. These are the official browse mosaics of the
LROC NAC Region-of-Interest (ROI) controlled products: each product is centered on the site
coordinates (product-id suffix `_E/PyyyN/Szzzz` = center lat/lon to 0.1°) and is **illustrative**
for our purposes — the drawn zone and margin remain to scale, but the image itself is not
re-registered to the site point. Credit: NASA/GSFC/Arizona State University. For the south-pole
ROI mosaics, cite Henriksen et al. 2023, European Lunar Symposium, pg. 134-135 (product-page
citation). Accessed 2026-11-15.

| site_id | Product page (`https://data.lroc.im-ldi.com/lroc/view_rdr/…`) | Browse file downloaded | Pixel size |
|---|---|---|---|
| `peak-near-cabeus-b` | `NAC_ROI_CABEUSPKLO2` | `NAC_ROI_CABEUSPKLO2_P836S2912_20M.BROWSE.PNG` | 1000×1000 @ ~20 m/px |
| `haworth` | `NAC_ROI_HAWORTH_LO1` | `NAC_ROI_HAWORTH_LO1_P867S3363_20M.BROWSE.PNG` | 1267×1261 @ ~20 m/px |
| `malapert-massif` | `NAC_ROI_MALAPERTLO1` | `NAC_ROI_MALAPERTLO1_P860S0003_20M.BROWSE.PNG` | 1248×1078 @ ~20 m/px |
| `mons-mouton-plateau` | `NAC_ROI_MOUTNPLTLO1` | `NAC_ROI_MOUTNPLTLO1_P843S0306_20M.BROWSE.PNG` | 1922×1447 @ ~20 m/px |
| `mons-mouton` | `NAC_ROI_MTMOUTONLO1` | `NAC_ROI_MTMOUTONLO1_P854S0353_20M.BROWSE.PNG` | 1324×1320 @ ~20 m/px |
| `nobile-rim-2` | `NAC_ROI_NOBILE02LO1` | `NAC_ROI_NOBILE02LO1_P839S0587_20M.BROWSE.PNG` | 1882×1882 @ ~20 m/px |
| `de-gerlache-rim-2` | `NAC_ROI_DEGERRIMLO1` | `NAC_ROI_DEGERRIMLO1_P885S2933_20M.BROWSE.PNG` | 1175×1173 @ ~20 m/px |
| `slater-plain` | `NAC_ROI_PSRSLATRLOA` | `NAC_ROI_PSRSLATRLOA_P875S1214.BROWSE.PNG` (no 20M variant exists) | 2051×948 |
| `apollo-11` | `NAC_ROI_APOLLO11LOA` | `NAC_ROI_APOLLO11LOA_E004N0235_20M.BROWSE.PNG` (along-track strip; site centered) | 261×1434 @ ~20 m/px |
| `apollo-17` | `NAC_ROI_APOLLO17LOA` | `NAC_ROI_APOLLO17LOA_E201N0308_20M.BROWSE.PNG` | 891×1708 @ ~20 m/px |
| `chandrayaan-3` | `NAC_ROI_VIKRAM__LOA` | `NAC_ROI_VIKRAM__LOA_P705S0232_20M.BROWSE.PNG` | 941×1815 @ ~20 m/px |
| `nobile-rim-1` | — no NAC ROI product exists for this region | placeholder tile kept | — |
| `change-3` | — no `NAC_ROI_CHANGE3` product; the featured-site page only exposes 200×200 thumbnails | placeholder tile kept | — |

- PGDA 90: the product page states "All TIF files are cloud-optimized GeoTiffs (COGs)", so they can be read by window over HTTPS.
- PGDA 90: checked on `LDEM_80S_20MPP_ADJ.TIF` (2026-11-14): `LAYOUT=COG`, 512×512 tiles, DEFLATE, overviews 2–64, float32, nodata NaN, 30400×30400 px. CRS read from the file: `+proj=stere +lat_0=-90 +lat_ts=-90 +lon_0=0 +R=1737400 +units=m` ("Moon (2015) - Sphere / Ocentric / South Polar").
- PGDA 78: COG status is not stated on the product page. Checked on `Site23/Site23_final_adj_5mpp_surf.tif` (2026-11-14): **not a COG** (1-row strips, no overviews, no compression; 4200×4200 px, 70.6 MB, float32, nodata NaN), same CRS as PGDA 90. Remote window reads work but need many range requests; download the site tile once to `data/raw/raster/<Site>/` and read it locally. (Malapert Massif → Site23 was QA-confirmed later on 2026-11-14: the verified site point projects inside this tile with valid data.)
- PGDA 78 reads in practice: the 5 m tiles are read from a local copy in `data/raw/raster/<Site>/` (git-ignored) when the expected `<Site>_final_adj_5mpp_{surf,slp}.tif` file exists. Otherwise the pipeline falls back to the registered PGDA HTTPS URL. The local copy is the reliable option because the PGDA server sometimes returns empty range responses for these striped, non-COG files.
- The PGDA server rejects multi-range HTTP requests (answers with the whole file) and intermittently returns 403/503 on valid range requests; `lunar_pipeline/terrain/remote_window.py` uses single-range requests with retries.

## SPICE kernels

Downloaded by `python -m lunar_pipeline ephemeris` into `pipeline/kernels/` (never committed). All from NASA NAIF generic kernels (https://naif.jpl.nasa.gov/pub/naif/generic_kernels/), checked 2026-11-14. NAIF kernels are public NASA data; no license file is provided.

| Kernel | URL | Size | Purpose |
|---|---|---|---|
| `naif0012.tls` (LSK) | https://naif.jpl.nasa.gov/pub/naif/generic_kernels/lsk/naif0012.tls | 5 KB | UTC to TDB conversion |
| `pck00011.tpc` (text PCK) | https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/pck00011.tpc | 128 KB | Moon radii (1737.4 km sphere) for the reference surface |
| `de421.bsp` (SPK) | https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/a_old_versions/de421.bsp | 16.8 MB | Sun, Earth, Moon positions; coverage 1899 JUL 29 to 2053 OCT 09 per NAIF `aa_summaries.txt` |
| `moon_pa_de421_1900-2050.bpc` (binary PCK) | https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/moon_pa_de421_1900-2050.bpc | 1.7 MB | Lunar orientation (libration) from DE421 |
| `moon_080317.tf` (FK) | https://naif.jpl.nasa.gov/pub/naif/generic_kernels/fk/satellites/moon_080317.tf | 21 KB | Defines `MOON_ME` (via `MOON_ME_DE421`), to be used with the DE421 binary PCK |
| `moon_assoc_me.tf` (FK) | https://naif.jpl.nasa.gov/pub/naif/generic_kernels/fk/satellites/moon_assoc_me.tf | 8 KB | Sets `MOON_ME` as the Moon's body-fixed frame |

DE421 matches the `MOON_ME` (DE421) frame of the LOLA data (PGDA 78 and 90).

SPICE correction note: `abcorr = LT+S` means one-way light-time correction plus stellar
aberration for the apparent direction. It is not atmospheric refraction; lunar calculations
use no refraction.
