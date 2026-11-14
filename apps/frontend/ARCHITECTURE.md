# Frontend Architecture — Lunar Landing Site Navigator

> Monorepo-level architecture (pipeline → backend → frontend) lives in the root `ARCHITECTURE.md`. This document covers the internal layering of `apps/frontend`.

## Overview

Desktop web application that renders a 3D Moon globe (lit by the Sun, with the Earth in its real relative position) with an overlaid 2D decision layer. The architecture strictly separates DOM/Tailwind presentation from the WebGL scene to preserve performance, clarity, and independent evolution of each layer.

## Layers

```text
┌─────────────────────────────────────────────────────────┐
│  2D UI — src/components/ui/ (React + Tailwind)          │
│  Calendar, site selector, 2D map, horizon, breakdown    │
└──────────────────────────┬──────────────────────────────┘
                           │ actions / selectors
┌──────────────────────────▼──────────────────────────────┐
│  Shared state — src/store/ (Zustand)                    │
│  Mission window, site, time cursor, view, preferences  │
└──────────────────────────┬──────────────────────────────┘
                           │ selectors / subscriptions
┌──────────────────────────▼──────────────────────────────┐
│  3D Scene — src/components/canvas/ (R3F + Three.js)     │
│  Moon globe, Sun light, Earth, site markers, camera    │
└─────────────────────────────────────────────────────────┘

Shared domain: src/types/ · src/data/ · src/lib/
Assets: public/models/ · public/textures/
```

## UI ↔ Canvas communication flow

1. The 2D UI never imports Three.js or R3F. It only invokes store actions.
2. The Zustand store is the single source of shared truth.
3. The 3D Canvas subscribes to granular selectors and translates state into Three.js props/refs.
4. For high-frequency changes (timeline scrubbing, camera position), use refs and `useFrame`, or `store.subscribe` with direct Three.js object updates, avoiding React re-renders.
5. The UI may read state derived from the store (for example, the selected site) without touching the scene.
6. No component in `ui/` imports components from `canvas/`, and vice versa.

### Dependency rule

```text
ui/ ──────► store/ ◄────── canvas/
   └────────► types/ ◄───────┘
              data/
              lib/
```

Arrows indicate the allowed dependency direction. `ui/` and `canvas/` do not reference each other.

## Folder structure

```text
src/
├── App.tsx                  # Root composition (shell)
├── main.tsx                 # React entry point
├── index.css                # Tailwind v4 + @theme tokens
├── components/
│   ├── ui/                  # 2D layer: Tailwind, DOM, accessibility
│   │   ├── controls/        # Buttons, sliders, toggles
│   │   ├── panels/          # Results, score breakdown, veto explanations
│   │   ├── map/             # 2D traffic-light map (Canvas 2D)
│   │   ├── horizon/         # Local horizon panel with Sun and Earth
│   │   └── hud/             # Overlays, legends, indicators
│   └── canvas/              # 3D layer: R3F, Three.js
│       ├── scene/           # Canvas, lights, camera, loop
│       ├── bodies/          # Moon globe, Earth, Sun direction, site markers
│       └── effects/         # Terminator, overlays (only with a performance budget)
├── store/                   # Zustand: typed state and actions
├── data/                    # Static frontend data (labels, UI copy resources)
├── lib/                     # Pure utilities (formatting, projections); api/ client
└── types/                   # Types shared across layers
```

> Subfolders under `ui/`, `canvas/`, and the rest will be created as tasks require them.

## Responsibilities per folder

| Folder | Responsibility | May import |
|---|---|---|
| `components/ui/` | 2D interface, Tailwind, accessibility | `store/`, `types/`, `lib/` |
| `components/canvas/` | 3D scene, R3F, Three.js | `store/`, `types/`, `lib/`, `data/` |
| `store/` | Shared state, actions | `types/`, `data/`, `lib/` |
| `data/` | Static UI data and copy resources | `types/` |
| `lib/` | Pure functions without React; `lib/api/` backend client | `types/` |
| `types/` | Type contracts | — |

## Shared state

The store is organized by domain, not by component:

- `mission`: mission window (t0, tf), timeline cursor, playback.
- `selection`: selected site or coordinates, hover, camera focus, 3D/2D mode.
- `view`: active 2D layer, visible overlays, saved comparison scenarios.
- `preferences`: graphics quality, units, accessibility.

Each domain exposes typed state and actions. Three.js objects are not stored in the store; only serializable data is.

## Performance

- `Canvas` with `dpr={[1, 2]}` and `gl={{ antialias: true }}` by default.
- `frameloop="demand"` for static views; animation only when necessary.
- Shared geometries and materials; explicit `dispose`.
- `InstancedMesh` for site markers and particles.
- Lazy asset loading with `Suspense`.
- Draw call and triangle budget documented before adding effects.

## Assets

- `public/textures/`: surface, normal, and emissive maps.
- `public/models/`: GLTF/GLB models.
- Names in `kebab-case` and versioned per body (e.g., `moon-albedo-2k.jpg`). Existing `2k_*.jpg` files keep their names until a task renames them.
- Optimize textures (power-of-two dimensions, compression where applicable).

## Conventions

- Components: `PascalCase.tsx`.
- Hooks: `useCamelCase.ts`.
- Utilities: `camelCase.ts`.
- Types: `PascalCase` without the `I` prefix.
- `@/` alias for `src/`.
- No cross-imports between `ui/` and `canvas/`.
