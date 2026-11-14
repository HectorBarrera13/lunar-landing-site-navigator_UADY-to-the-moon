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
