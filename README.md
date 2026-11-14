# Lunar Landing Site Navigator

NASA Space Apps Challenge 2026. A desktop web tool to compare lunar south pole landing sites and dates by showing the Sun and the Earth relative to the local horizon, evaluating solar power and direct-to-Earth communication, and summarizing each option as a Suitability Index.

> Status: repository scaffold. Features are being built during the hackathon.

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

Copy `.env.example` to `.env` (root, `apps/backend/`, `apps/frontend/`) only if you need to change the defaults.

## Working with AI agents

- All agents follow `AGENTS.md` (Claude Code loads it through `CLAUDE.md`).
- Role-scoped subagents are in `.claude/agents/`.
- Every completed task is logged in `AI_LOG.md`.

## NASA data used

To be completed: see `data/README.md`.

## Team

To be completed.
