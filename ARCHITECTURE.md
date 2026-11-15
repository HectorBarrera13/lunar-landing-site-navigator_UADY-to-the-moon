# Architecture — Lunar Landing Site Navigator

## Overview

A monorepo with three workspaces and one data folder. Heavy scientific computation happens **offline** in the pipeline; at runtime a lightweight API serves the precomputed results to a desktop web app. Nothing heavy runs live during the demo.

```text
                OFFLINE (before the demo)                       RUNTIME
┌───────────────────────────────┐            ┌──────────────────────────┐        ┌──────────────────────────┐
│ pipeline/  (Python)           │   writes   │ apps/backend/  (FastAPI) │  HTTP  │ apps/frontend/ (React)   │
│ SpiceyPy · NumPy · Rasterio   │──────────► │ stdlib + Pydantic only   │◄──────►│ Vite · Tailwind · R3F    │
│ ephemeris · terrain · layers  │ data/      │ load · aggregate · score │  JSON  │ 3D globe · 2D decision UI│
└───────────────┬───────────────┘ processed/ └──────────────────────────┘        └──────────────────────────┘
                │ reads
     data/raw/ · pipeline/kernels/ (never committed)   data/catalog/sites.json (verified sites)
```

## Repository map

```text
lunar-landing-site-navigator_UADY-to-the-moon/
├── AGENTS.md · CLAUDE.md          # Agent rules (CLAUDE.md imports AGENTS.md)
├── ARCHITECTURE.md                # This file
├── REQUIREMENTS.md                # Scope, requirements, decisions, pending items
├── AI_LOG.md                      # Mandatory log of agent work
├── README.md                      # How to run everything
├── .env.example                   # Shared runtime variables
├── .claude/agents/                # Role-scoped subagents for orchestration
├── .github/pull_request_template.md
├── docs/contracts/                # Data contracts between workspaces (source of truth)
├── data/
│   ├── catalog/sites.json         # 13 curated sites (QA-verified coordinates)
│   ├── raw/                       # NASA downloads (git-ignored)
│   └── processed/                 # Pipeline outputs served by the backend
├── pipeline/                      # Offline precomputation (heavy libraries allowed)
│   ├── AGENTS.md · requirements.txt
│   └── lunar_pipeline/{ephemeris,terrain,layers,sites}/
└── apps/
    ├── backend/                   # FastAPI (stdlib + Pydantic only)
    │   ├── AGENTS.md · requirements.txt · .env.example
    │   └── app/{main.py,api/,services/,models/,core/}
    └── frontend/                  # React + Vite + Tailwind v4 + R3F + Zustand
        ├── AGENTS.md · ARCHITECTURE.md (internal layering)
        └── src/components/{ui,canvas}/ · store/ · types/ · lib/ · data/
```

## Responsibilities and the dependency rule

| Workspace | Does | Never does |
|---|---|---|
| `pipeline/` | Reads NASA data, computes time series, horizons, slope, layers; writes artifacts | Runs at request time; serves HTTP |
| `apps/backend/` | Loads artifacts, slices them to the mission window, applies weights and vetoes, returns typed JSON | Imports NumPy/SciPy/SpiceyPy; reads raw rasters |
| `apps/frontend/` | Renders the 3D globe and 2D decision UI; calls the API | Computes ephemerides; reads raw data; changes contracts |

Direction of dependencies: `pipeline → data/processed → backend → frontend`. The only coupling is `docs/contracts/`.

## Frontend ↔ backend communication

1. The frontend reads `VITE_API_URL` (default `http://localhost:8000/api`) and calls the backend only through `apps/frontend/src/lib/api/`.
2. The backend allows the frontend origin through CORS using `FRONTEND_URL`.
3. Requests and responses are JSON. Their shapes are defined in `docs/contracts/` and mirrored by Pydantic models (`apps/backend/app/models/`) and TypeScript types (`apps/frontend/src/types/`).
4. Typical flow for the core use case:
   1. The UI writes the selected site and mission window `[t0, tf]` to the Zustand store.
   2. An API call requests the evaluation for that site and window.
   3. The backend loads the site's precomputed series and horizon, aggregates over `[t0, tf]`, computes the criteria, weights, and vetoes, and returns the Suitability Index with its breakdown.
   4. The store receives the result; the 2D UI renders the breakdown, horizon panel, and vetoes; the 3D canvas reads the Sun/Earth direction for the timeline cursor.
5. Large static artifacts (layer images) may be served as static files by the backend; their metadata (grid, bounds, projection) comes from a JSON endpoint.

## Precision levels

- **13 curated sites:** full date-specific evaluation from precomputed SPICE series and LOLA horizons.
- **Free click / manual coordinates:** date-specific evaluation after resolving to the nearest preset with precomputed artifacts. Regional average layers remain future work in `pipeline/layers`.
- Site Finder (optional module, decided at H12) reuses the regional layers.

## Environment

| Variable | Used by | Default |
|---|---|---|
| `PORT` | backend | `8000` |
| `FRONTEND_URL` | backend (CORS) | `http://localhost:5173` (comma-separated list allowed) |
| `DEBUG_MODE` | backend | `False` |
| `DATA_DIR` | backend | `data/processed` |
| `VITE_API_URL` | frontend | `http://localhost:8000/api` |
| `CATALOG_FILE` | backend | `data/catalog/sites.json` |

## Deployment (to decide)

The frontend builds to static files. The backend needs a Python host. Hosting choice is pending (see `REQUIREMENTS.md`).
