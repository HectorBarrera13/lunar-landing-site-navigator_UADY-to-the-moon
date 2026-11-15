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

## Authorship

This project was developed collaboratively by the team members and with the assistance of AI tooling. Roles are listed below.

### Team

- **Maricarmen Buenfil** – Organized the team's functions and assigned tasks and roles. Contributed to backend development, ensuring the integrity of the application's data and operations.
- **Hector Barrera** – Designed the system and the frontend, contributing the 3D bodies in the application. Also worked on the backend, created the API, and handled the packaging of the system.
- **Andrea Baeza** – Delegated work across the team and was responsible for both the development and the testing of backend and frontend commits.
- **Daniela Villarino** – Designed the view layouts, mockups, interfaces, and user interface windows, and led the UX design.
- **Deco Acierno** – Carried out the system requirements analysis and produced the project documents. Contributed to the design of the application and the system, and to backend development.
- **Paulina Paredes** – Served as physics advisor to ensure a complete understanding of the problem. Contributed to the user interface design and to the storytelling, presentations, and graphic elements.

### AI Assistance

- **Claude Code (Anthropic)** – Took charge of dividing the work into separate activities and supported the processing and organization of images and data. It assisted in code generation, which was always reviewed, tested, and approved by the team members, and supported general design tasks. Its contributions are acknowledged as authorship in this repository, while the team members remain responsible for all final decisions and for the quality of the code.
