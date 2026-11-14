# AGENTS.md — Data pipeline (`pipeline/`)

> Read the root `AGENTS.md` first. This file adds pipeline-specific rules; the root rules (language, clarification protocol, git workflow, `AI_LOG.md`) always apply.

## Role

Offline Python scripts that run **before** the demo, not at request time. They turn NASA data (SPICE kernels, LOLA DEMs, PGDA illumination maps) into small artifacts in `data/processed/` that the backend serves. This is where heavy scientific libraries are allowed.

## Stack

- Python 3.11+ · SpiceyPy · NumPy · Rasterio · SciPy (see `requirements.txt`).
- New dependencies require justification and an `AI_LOG.md` entry.

## Modules

| Module | Owner role | Produces |
|---|---|---|
| `lunar_pipeline/ephemeris/` | Backend A | Per-site time series: Sun and Earth azimuth, elevation, visibility (2025–2035) |
| `lunar_pipeline/terrain/` | Backend B | Per-site 360° horizon profiles, slope statistics inside the landing circle |
| `lunar_pipeline/layers/` | Backend B | Regional raster layers (illumination, Earth visibility, slope, permanent shadow) as images + metadata on a shared grid |

## Data sources

Every dataset below is registered (URL, version, resolution, frame, license) in `data/README.md`. Do not use a source that is not registered there.

### Libraries per task

- **Terrain (Rasterio + NumPy + SciPy):** LOLA GeoTIFFs give elevation (meters) and slope (degrees). They are used for the 360° local horizon profile, the slope check inside the landing circle, and the distance to permanently shadowed regions (`scipy.ndimage.distance_transform_edt`). SpacePy is not used (magnetospheric physics, out of scope).
- **Ephemerides (SpiceyPy only):** LOLA has no body positions. SpiceyPy with NAIF SPICE kernels in `MOON_ME` computes Sun and Earth azimuth and elevation for each UTC time. Time conversions also use SPICE (`str2et`/`et2utc`). **AstroPy is not used.** No atmospheric refraction.
- **Final crossing (NumPy):** body elevations are compared against the terrain horizon profile to get sunlight and direct-to-Earth communication windows.

### GeoTIFF per project zone

- **Artemis III south pole regions — PGDA 78** (High-Resolution LOLA Topography for Lunar South Pole Sites): 5 m/px site tiles, `<Site>_final_adj_5mpp_surf.tif` (elevation) and `<Site>_final_adj_5mpp_slp.tif` (slope), south polar stereographic, `MOON_ME`. **The mapping from each landing site to its PGDA 78 file is pending QA**; do not hard-code it until QA records it.
- **South pole 20 m mosaic — PGDA 90** (A New View of the Lunar South Pole from LOLA): `LDEM_80S_20MPP_ADJ` (elevation), `LDSM_80S_20MPP_ADJ` (slope), `LPSR_80S_20MPP_ADJ` (permanently shadowed regions), 80°S–90°S. Used for sites without a PGDA 78 tile (which sites those are is pending QA; the team notes suggest Slater Plain) and for the near part of the horizon. `LDEM_60S_240MPP_ADJ` (same product, 240 m/px) covers the far horizon.
- **Horizon search radius:** not decided (**PD-07**). The 5–100 km range in the original notes is only a starting point; keep the radius configurable.
- **2D overview and Site Finder:** use PGDA average illumination and Earth-visibility maps instead of computing horizons per pixel. These maps come from the team notes and are not verified yet (product, resolution); register each one in `data/README.md` before use.
- **Historical sites outside the pole (lat > -80°: Apollo 11, Apollo 17, Chang'e 3, Chandrayaan-3):** no GeoTIFF. Use an approximate spherical horizon (flat 0° horizon adjusted for lunar curvature) crossed with SpiceyPy (`horizon_source: "sphere"`).

### Remote reads and precompute

- PGDA 90 TIFs are Cloud-Optimized GeoTIFFs (per the product page). Rasterio opens the HTTPS URL and reads only the window around the point (HTTP range requests); see `lunar_pipeline/terrain/remote_window.py`. If a remote read takes minutes instead of seconds, download that file once to `data/raw/` and read it locally.
- Remote reads run only offline in this pipeline, never at request time. Results for the preset sites are precomputed into small artifacts in `data/processed/`.
- **Outputs are JSON and PNG only**, following `docs/contracts/`.

## Rules

- **Inputs** are read from `data/raw/` (never committed) and `pipeline/kernels/` (never committed). Document every source URL, version, resolution, and license in `data/README.md`.
- **Outputs** go to `data/processed/` and must match `docs/contracts/` exactly. Keep each committed artifact small (target < 5 MB each); larger outputs are regenerated, not committed.
- Every script is idempotent and deterministic: same inputs → same outputs. Expose steps through `python -m lunar_pipeline`.
- Write processing logic as plain functions (no CLI or I/O inside the math) so they can later be reused without rewriting.
- Site coordinates come only from `data/catalog/sites.json` entries with `"verified": true`.

## Scientific rules (non-negotiable)

- Single reference frame: `MOON_ME` for DEMs, layers, coordinates, and ephemerides. Never mix with `MOON_PA`.
- No atmospheric refraction: the Moon has no atmosphere. Disable refraction in any library that applies it by default.
- Subtract lunar curvature when computing horizon elevation angles.
- In polar stereographic rasters, image "up" is not local north; convert azimuths using the site longitude.
- Time in UTC (ISO 8601). Angles in degrees. Distances in meters unless the field name says otherwise.
- Never invent or "recall" numbers (coordinates, thresholds, dataset URLs). If a value is not in `REQUIREMENTS.md`, `data/README.md`, or an official source, stop and ask.

## Validation (manual, no test framework)

- Compare Sun/Earth elevation for at least one site and date against JPL Horizons (refraction off) and record the result in `AI_LOG.md`.
- Sanity-check value ranges (elevations within [-90, 90], percentages within [0, 100]) before writing outputs.

## Commands

Run from `pipeline/`:

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m lunar_pipeline
```

## Definition of Done

- The step runs end to end with `python -m lunar_pipeline` and writes contract-compliant outputs.
- The validation above is recorded.
- `AI_LOG.md` is updated.
