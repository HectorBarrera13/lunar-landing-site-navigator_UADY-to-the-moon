# AGENTS.md — Lunar Landing Site Navigator (monorepo)

Guidelines for every AI agent (and human) working in this repository. Read this file first, then the `AGENTS.md` of the workspace you are touching.

## Project in one paragraph

NASA Space Apps 2026 challenge "Lunar Landing Site Navigator", built by a 6-person team in a 26-hour hackathon. A desktop web tool where mission planners compare lunar **south pole** landing sites and dates: for a site and a mission window `[t0, tf]` it shows the Sun and the Earth relative to the local horizon, evaluates solar power and direct-to-Earth communication, and summarizes the result as a **Suitability Index** (0–100) with a traffic-light color and explained vetoes. Full requirements: `REQUIREMENTS.md`.

## Before any task

1. Read this file, the workspace `AGENTS.md`, and `ARCHITECTURE.md`.
2. Read the relevant sections of `REQUIREMENTS.md` and `docs/contracts/`.
3. Review the latest entries in `AI_LOG.md`.
4. Confirm which workspace and folder the task belongs to (see Ownership map). Do not change files outside that scope.

## Clarification protocol

**Ask the user clarifying questions when in doubt; do not guess ambiguous requirements.**

- Stop and ask before implementing when scope, acceptance criteria, the target folder, inputs (data sources, values, designs), or a meaningful technical trade-off is unclear.
- Values marked _Pending_ or _Proposed_ in `REQUIREMENTS.md` are not decided. Ask before using them as final.
- Group questions, propose a recommended default, and state explicit assumptions.
- Trivial, unambiguous tasks proceed without questions.

## Language

- Everything written to the repository is in **English**: documentation, code, identifiers, comments, UI copy, log entries, commit messages, and PR descriptions.
- Chat replies may follow the language the user writes in.

## Ownership map (separation of concerns)

| Path | Owner role | Contents |
|---|---|---|
| `apps/frontend/src/components/ui/` | Frontend 2 (UI & integration) | 2D Tailwind UI: calendar, selectors, 2D map, horizon panel, breakdown, vetoes |
| `apps/frontend/src/components/canvas/` | Frontend 1 (visualization) | 3D R3F/Three.js scene: Moon globe, Sun light, Earth, markers |
| `apps/frontend/src/store/`, `src/types/`, `src/lib/` | Frontend 2 (with Frontend 1) | Shared state, contract types, API client |
| `apps/backend/app/api/` | Backend B (backup: Backend A) | HTTP routes only |
| `apps/backend/app/services/`, `app/models/` | Backend B (backup: Backend A) | Artifact loading, windowed aggregation, Suitability Index, vetoes |
| `pipeline/lunar_pipeline/ephemeris/` | Backend A | SpiceyPy Sun/Earth time series |
| `pipeline/lunar_pipeline/terrain/`, `layers/` | Backend B | Horizons, slope, regional layers |
| `data/catalog/`, `data/README.md` | QA, Data & Docs | Verified site list, data source registry |
| `docs/contracts/` | Backend A + B propose, Frontend 2 approves | Data contracts between workspaces |
| `REQUIREMENTS.md`, `README.md` | Lead / PO (with QA) | Scope, priorities, decisions |

Hard boundaries:

- 2D Tailwind UI components live only in `apps/frontend/src/components/ui/`; 3D Canvas elements only in `apps/frontend/src/components/canvas/`; backend API routes only in `apps/backend/app/api/`.
- `apps/backend` uses the Python standard library plus FastAPI/Pydantic only. Heavy scientific libraries live only in `pipeline/`.
- Workspaces communicate only through `docs/contracts/` artifacts and the HTTP API. No cross-workspace imports.

## Contract changes

`docs/contracts/` is the single source of truth between pipeline, backend, and frontend.

- Never change a contract as a side effect of another task. Propose the change, ask the user, and wait for approval.
- After approval, update the contract first, then the producer, then the consumers, and log it in `AI_LOG.md`.

## Scientific integrity

- Single reference frame `MOON_ME`; degrees for angles; UTC ISO 8601 for time; meters for distances unless a field name says otherwise.
- No atmospheric refraction on the Moon; subtract lunar curvature for horizons.
- Never invent or recall from memory coordinates, thresholds, dataset URLs, or physical constants. Use `REQUIREMENTS.md`, `data/README.md`, or an official source, and cite it. If none exists, ask.
- Always say "Suitability Index", never "probability of success".

## Git workflow

- `main` is always deployable. Never commit directly to `main`.
- One short-lived branch per task: `feat/<area>-<topic>`, `fix/<area>-<topic>`, `chore/<topic>`, `docs/<topic>`.
- Small PRs (ideally < 400 changed lines), one concern each, using `.github/pull_request_template.md`.
- Commit messages follow Conventional Commits in English: `feat(frontend): add mission window calendar`.
- Agents do not commit, push, or open PRs unless the user explicitly asks.
- Never commit secrets, `.env` files, raw NASA data, or SPICE kernels.

## Out of scope for now

- No test frameworks (Jest, Vitest, Playwright, pytest) and no CI/CD pipelines unless the user explicitly asks. This will be revisited during development.
- No functional features without an explicit task.
- Verification is done with the commands in each workspace's Definition of Done plus the manual scientific checks in `pipeline/AGENTS.md`.

## Mandatory logging

After **every** completed task, append an entry to `AI_LOG.md` using the template at the end of that file (date, task, changes, files, architectural decisions, verification, risks). A task is not complete until `AI_LOG.md` is updated.

## Quick commands

| Workspace | Install | Run | Verify |
|---|---|---|---|
| `apps/frontend` | `npm install` | `npm run dev` | `npm run typecheck && npm run build` |
| `apps/backend` | `pip install -r requirements.txt` | `uvicorn app.main:app --reload` | `python -m compileall app` + `GET /api/health` |
| `pipeline` | `pip install -r requirements.txt` | `python -m lunar_pipeline` | Manual validation (see `pipeline/AGENTS.md`) |
