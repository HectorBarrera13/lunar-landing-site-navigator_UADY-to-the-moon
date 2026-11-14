# AGENTS.md — Backend (`apps/backend`)

> Read the root `AGENTS.md` first. This file adds backend-specific rules; the root rules (language, clarification protocol, git workflow, `AI_LOG.md`) always apply.

## Role

A lightweight FastAPI service that serves precomputed artifacts from `data/processed/` and runs cheap, pure-Python computations on them (for example, aggregating a precomputed time series over the user's mission window and applying the Suitability Index weights and vetoes). Heavy work (SPICE ephemerides, DEM/raster processing) belongs to `pipeline/`, never here.

## Stack

- Python 3.11+ · FastAPI · Uvicorn.
- Pydantic v2, Pydantic Settings, python-dotenv.
- **Standard library only beyond the packages above. NumPy, SciPy, Pandas, Rasterio, and SpiceyPy are forbidden in this app.** If a task seems to need them, the work belongs in `pipeline/`; stop and ask.

## Folder rules

| Folder | Responsibility | Must not |
|---|---|---|
| `app/api/` | HTTP routes only: parse request, call a service, return a Pydantic model | Contain business logic or file I/O |
| `app/services/` | Business logic: loading artifacts, windowed aggregation, scoring, vetoes | Import FastAPI or know about HTTP |
| `app/models/` | Pydantic request/response and domain models that mirror `docs/contracts/` | Contain logic beyond validation |
| `app/core/` | Settings, logging, shared infrastructure | Contain domain logic |

- Every route is mounted under `/api` and declares a `response_model`.
- Models must match `docs/contracts/` field-for-field (names, units, types). Units go in field names when ambiguous (`elevation_deg`, `distance_m`).
- Read artifact paths only through `get_settings().resolved_data_dir`; never hard-code paths.
- Configuration comes from environment variables / `.env` via `app/core/config.py`; never read `os.environ` directly elsewhere.
- Use the `logging` module, never `print`.

## Scientific rules (see `REQUIREMENTS.md`)

- All coordinates are in the `MOON_ME` frame, latitude/longitude in degrees, longitude in [-180, 180].
- The score is the "Suitability Index" (0–100), never a probability.
- Weights and veto thresholds are configuration, not magic numbers in code. Use the values marked as agreed in `REQUIREMENTS.md`; if a value is still pending, ask.

## Commands

Run from `apps/backend/`:

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # optional; defaults work for local dev
uvicorn app.main:app --reload --port 8000
```

Smoke check: `curl http://localhost:8000/api/health` → `{"status":"ok", ...}`. Interactive docs at `http://localhost:8000/docs`.

## Definition of Done

- The app starts with `uvicorn app.main:app` without errors.
- `python -m compileall app` passes.
- New or changed endpoints are reflected in `docs/contracts/` (after approval) and visible in `/docs`.
- `AI_LOG.md` is updated.
