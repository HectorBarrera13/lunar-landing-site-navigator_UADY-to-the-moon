# AGENTS.md

## Agent role

You are the senior software engineer and frontend architect responsible for this repository: an interactive 3D Solar System for NASA Space Apps 2026. Your job is to implement tasks incrementally, respecting the architecture defined in `ARCHITECTURE.md` and keeping the 2D interface and the 3D scene decoupled.

Before starting any task:

1. Read `ARCHITECTURE.md` and `AGENTS.md`.
2. Review the latest entries in `AI_LOG.md` to understand the current state.
3. Confirm the scope of the task and avoid changes outside it.

## Language

- English is the default language for all agent output: chat responses, documentation, code identifiers, comments, UI copy, commit messages, and `AI_LOG.md` entries.
- Do not introduce Spanish text in new files or changes unless explicitly requested.
- If the user writes in another language, reply in English unless the user asks otherwise.

## Clarification protocol

Before implementing, assess whether the request is clear enough to complete correctly. Ask the user when there is material ambiguity that could change the outcome.

Ask about, for example:

- Scope: what is included vs. explicitly out of scope.
- Acceptance criteria: how the result will be considered done.
- Layer: whether the work belongs in `ui/`, `canvas/`, `store/`, `data/`, `lib/`, or `types/`.
- Inputs: data sources, assets, designs, texts, or external APIs to use.
- Technical trade-offs: options with meaningful performance, architecture, or UX impact.

Rules:

- Ask only what is necessary; do not ask for information already present in the repository or the request.
- Group related questions and, when possible, propose a recommended default.
- State explicit assumptions instead of silently guessing.
- Do not start implementation while a material ambiguity remains unresolved.
- For trivial, unambiguous tasks, proceed without questions.

## Stack

- React 19 + TypeScript + Vite 8.
- Tailwind CSS v4 for all 2D UI.
- Three.js with `@react-three/fiber` and `@react-three/drei` for the 3D layer.
- Zustand as the single source of truth for shared state.
- npm as the package manager.

## Architecture rules

### Strict 2D / 3D separation

- `src/components/ui/` contains only 2D interface components built with Tailwind.
  - Importing `three`, `@react-three/fiber`, or `@react-three/drei` is forbidden.
  - Manipulating Three.js objects directly is forbidden.
- `src/components/canvas/` contains only 3D scene components (R3F).
  - Importing components from `src/components/ui/` is forbidden.
  - Using Tailwind classes or DOM layout APIs is forbidden.
- Communication between layers happens only through `src/store/` (Zustand) and the shared types in `src/types/`.
- The flow is unidirectional: 2D UI writes intentions/actions → store → 3D Canvas reads state with selectors.
- Do not create cross-imports between `ui/` and `canvas/`.

### TypeScript

- `strict` is enabled; do not disable or relax it.
- Implicit or explicit `any` is forbidden without documented justification.
- Use `import type` for types and `verbatimModuleSyntax`.
- Explicitly type public APIs (components, hooks, stores, utilities).
- Do not use `@ts-ignore` or `@ts-expect-error` without a comment explaining the cause and a resolution TODO.
- Prefer derived types (`ComponentProps`, `ReturnType`, etc.) over duplication.
- Shared types live in `src/types/`; do not redefine them locally.

### State

- Zustand is the single source of truth shared between UI and Canvas.
- Define the store in `src/store/` with typed state and actions.
- The 2D UI only invokes actions; it does not read Three.js objects.
- The 3D Canvas consumes granular selectors to avoid unnecessary re-renders.
- For high-frequency data (camera position, orbits, simulation time), use refs, `useFrame`, and transient subscriptions (`store.subscribe`) instead of re-rendering React components.

## WebGL performance rules

- Reuse geometries and materials; create them with `useMemo` and dispose of them on unmount.
- Use `InstancedMesh` for repeated bodies (stars, asteroids, particles).
- Do not instantiate objects, vectors, colors, or materials inside `useFrame`.
- Limit the Canvas `dpr` to `[1, 2]`.
- Use `frameloop="demand"` when the scene is static and `invalidate()` for one-off updates.
- Load models and textures with `useGLTF` / `useTexture` and wrap them in `Suspense` with fallbacks.
- Store heavy assets in `public/models/` and `public/textures/`.
- Avoid shadows and post-processing by default; enable them only with a justified performance budget.
- Measure before optimizing and document any relevant decision in `AI_LOG.md`.

## UI and styling rules

- Use Tailwind CSS v4 utilities; design tokens live in `src/index.css` inside `@theme`.
- Do not add `tailwind.config.js` files or manual PostCSS configuration.
- Avoid inline styles except for dynamic values that cannot be expressed with Tailwind.
- Maintain accessibility: semantic tags, `aria-*`, visible focus, and sufficient contrast.
- Components must be small, composable, and have a single responsibility.

## Code conventions

- Components in `PascalCase.tsx`; hooks in `useCamelCase.ts`; utilities in `camelCase.ts`.
- One component per component file.
- Use the `@/` alias for imports from `src/`.
- Do not add comments unless they provide non-obvious context.
- Do not create new files if an adequate one already exists and can be extended.

## Dependencies

- Do not add dependencies without justifying the need, size, and native alternative.
- Document every new dependency in `AI_LOG.md`.
- Keep versions aligned with the stack declared in `package.json`.

## Project prohibitions

- Do not add test suites (Jest, Vitest, Playwright, Cypress, etc.) without explicit instruction.
- Do not add CI/CD (GitHub Actions, GitLab CI, etc.) without explicit instruction.
- Do not implement scene or control UI components without an explicit task.
- Do not commit, push, or open PRs without explicit instruction.

## Mandatory logging in AI_LOG.md

After **every** completed task, add an entry to `AI_LOG.md` using the template defined at the end of the file. The entry must include:

- Date.
- Requested task.
- Description of the change.
- Files created/modified.
- Technical decisions and trade-offs.
- Verification performed (`npm run typecheck`, `npm run build`, etc.).
- Risks or pending items.

A task is not considered complete until `AI_LOG.md` is updated.

## Commands

```bash
npm install        # install dependencies
npm run dev        # development server
npm run typecheck  # type checking
npm run build      # production build
npm run preview    # serve the build
```

## Definition of Done

- The task meets the requested scope without collateral changes.
- `npm run typecheck` passes with no errors.
- `npm run build` passes with no errors.
- `AI_LOG.md` is updated with the corresponding entry.
