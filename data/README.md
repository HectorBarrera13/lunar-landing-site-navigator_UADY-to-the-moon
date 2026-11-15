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
