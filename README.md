# Lunar Landing Site Navigator

NASA Space Apps Challenge 2026. A desktop web tool to compare lunar south pole landing sites and dates by showing the Sun and the Earth relative to the local horizon, evaluating solar power and direct-to-Earth communication, and summarizing each option as a Suitability Index.

> Status: working end to end for all 13 preset sites. Every preset has precomputed Sun/Earth series (2025–2035, hourly, contract 1.2 with angular radii) and a horizon: LOLA for the 9 south-pole sites (PGDA 78 tile where QA-confirmed, otherwise the PGDA 90 20 m mosaic) and the idealized 0° sphere for the 4 historical sites (R-15); terrain slope files exist for the 9 polar sites. The FastAPI backend evaluates the Suitability Index over a mission window; the frontend shows the 3D globe and the 2D decision views. Coordinates were PO-approved in `data/catalog/sites.json` (PD-01 resolved 2026-11-15). Regional layers, ice proximity and roughness remain open (Round 4 items pending decisions).

## Repository layout

| Path | What it is |
|---|---|
| `apps/frontend/` | React 19 + Vite + TypeScript + Tailwind v4 + React Three Fiber + Zustand |
| `apps/backend/` | FastAPI API (Python standard library + Pydantic only) |
| `pipeline/` | Offline precomputation with SpiceyPy, NumPy, Rasterio, SciPy |
| `data/` | Site catalog, raw downloads (ignored), processed artifacts |
| `docs/contracts/` | Data contracts between workspaces |

Read `ARCHITECTURE.md` for the big picture and `REQUIREMENTS.md` for scope.

## Run locally

Requirements: Node.js 22.12+, Python 3.11+.

```bash
# Backend (terminal 1)
cd apps/backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000           # http://localhost:8000/api/health

# Frontend (terminal 2)
cd apps/frontend
npm install
npm run dev                                         # http://localhost:5173

# Pipeline (offline, when data is available)
cd pipeline
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m lunar_pipeline
```

Copy an `.env.example` to `.env` only if you need to change the defaults. Backend variables (`PORT`, `FRONTEND_URL`, `DEBUG_MODE`, `DATA_DIR`, `CATALOG_FILE`) are read from the root `.env` and then `apps/backend/.env`; the frontend variable `VITE_API_URL` is read by Vite only from `apps/frontend/.env`.

## Working with AI agents

- All agents follow `AGENTS.md` (Claude Code loads it through `CLAUDE.md`).
- Role-scoped subagents are in `.claude/agents/`.
- Every completed task is logged in `AI_LOG.md`.

## NASA data used

Summary of the sources registered in `data/README.md` (URLs, versions, resolutions and notes live there).

| Data | Provider | Used for | Citation |
|---|---|---|---|
| SPICE kernels: `naif0012.tls`, `pck00011.tpc`, `de421.bsp`, `moon_pa_de421_1900-2050.bpc`, `moon_080317.tf`, `moon_assoc_me.tf` | NASA NAIF (JPL) | Sun and Earth directions, distances and angular radii in `MOON_ME` (DE421), no refraction | NAIF generic kernels |
| PGDA 78 — High-Resolution LOLA Topography for Lunar South Pole Sites (5 m/px) | NASA GSFC PGDA | Slope inside the landing circle and center elevation (Malapert Massif → `Site23`) | Barker et al. 2021, PSS 203, 105119, doi:10.1016/j.pss.2020.105119 |
| PGDA 90 — A New View of the Lunar South Pole from LOLA (20 m/px and 240 m/px) | NASA GSFC PGDA | 360° horizon profile up to 150 km | Barker et al. 2023, PSJ 4, 183, doi:10.3847/PSJ/acf3e1; data doi:10.60903/gsfcpgda-lola-spole |
| Deep Star Maps 2020 | NASA Scientific Visualization Studio (SVS 4851) | Background star field of the 3D scene | https://svs.gsfc.nasa.gov/4851 |

Pending QA: the Deep Star Maps license is not verified yet, and the star map is in ICRF/J2000 coordinates, not rotated to `MOON_ME` (decorative only).

## Authorship

This project was developed collaboratively by the team members and with the assistance of AI tooling. Roles are listed below.

### Team

- **Maricarmen Buenfil** – Organized the team's functions and assigned tasks and roles. Contributed to backend development, ensuring the integrity of the application's data and operations.
- **Hector Barrera** – Designed the system and the frontend, contributing the 3D bodies in the application. Also worked on the backend, created the API, and handled the packaging of the system.
- **Andrea Baeza** – Delegated work across the team and was responsible for both the development and the testing of backend and frontend commits.
- **Daniela Villarino** – Designed the view layouts, mockups, interfaces, and user interface windows, and led the UX design.
- **Deco Acierno** – Carried out the system requirements analysis and produced the project documents. Contributed to the design of the application and the system, and to backend development.
- **Paulina Paredes** – Served as physics and chemistry advisor to ensure a complete understanding of the problem. Contributed to the user interface design and to the storytelling, presentations, and graphic elements.

### AI Assistance

- **Claude Code (Anthropic)** – Took charge of dividing the work into separate activities and supported the processing and organization of images and data. It assisted in code generation, which was always reviewed, tested, and approved by the team members, and supported general design tasks. Its contributions are acknowledged as authorship in this repository, while the team members remain responsible for all final decisions and for the quality of the code.
