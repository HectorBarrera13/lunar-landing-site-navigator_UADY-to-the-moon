# Architecture — Solar System 3D

## Overview

Interactive web application that renders a 3D Solar System with an overlaid 2D interface layer. The architecture strictly separates DOM/Tailwind presentation from the WebGL scene to preserve performance, clarity, and independent evolution of each layer.

## Layers

```text
┌─────────────────────────────────────────────────────────┐
│  2D UI — src/components/ui/ (React + Tailwind)          │
│  Controls, panels, HUD, legends, forms                  │
└──────────────────────────┬──────────────────────────────┘
                           │ actions / selectors
┌──────────────────────────▼──────────────────────────────┐
│  Shared state — src/store/ (Zustand)                    │
│  Selection, time, scale, camera, preferences            │
└──────────────────────────┬──────────────────────────────┘
                           │ selectors / subscriptions
┌──────────────────────────▼──────────────────────────────┐
│  3D Scene — src/components/canvas/ (R3F + Three.js)     │
│  Canvas, Sun, planets, orbits, lights, camera           │
└─────────────────────────────────────────────────────────┘

Shared domain: src/types/ · src/data/ · src/lib/
Assets: public/models/ · public/textures/
```

## UI ↔ Canvas communication flow

1. The 2D UI never imports Three.js or R3F. It only invokes store actions.
2. The Zustand store is the single source of shared truth.
3. The 3D Canvas subscribes to granular selectors and translates state into Three.js props/refs.
4. For high-frequency changes (simulation time, camera position, planet tracking), use refs and `useFrame`, or `store.subscribe` with direct Three.js object updates, avoiding React re-renders.
5. The UI may read state derived from the store (for example, the selected planet) without touching the scene.
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
│   │   ├── panels/          # Side panels, planet info
│   │   └── hud/             # Overlays, legends, indicators
│   └── canvas/              # 3D layer: R3F, Three.js
│       ├── scene/           # Canvas, lights, camera, loop
│       ├── bodies/          # Sun, planets, moons, belts
│       └── effects/         # Post-processing, particles, atmospheres
├── store/                   # Zustand: typed state and actions
├── data/                    # Static solar system data
├── lib/                     # Pure utilities (scales, orbits, formatting)
└── types/                   # Types shared across layers
```

> Subfolders under `ui/`, `canvas/`, and the rest will be created as tasks require them.

## Responsibilities per folder

| Folder | Responsibility | May import |
|---|---|---|
| `components/ui/` | 2D interface, Tailwind, accessibility | `store/`, `types/`, `lib/` |
| `components/canvas/` | 3D scene, R3F, Three.js | `store/`, `types/`, `lib/`, `data/` |
| `store/` | Shared state, actions | `types/`, `data/`, `lib/` |
| `data/` | Astronomical constants and data | `types/` |
| `lib/` | Pure functions without React | `types/` |
| `types/` | Type contracts | — |

## Shared state

The store is organized by domain, not by component:

- `simulation`: time, speed, pause, simulated date.
- `selection`: selected body, hover, camera focus.
- `view`: scale, visible layers (orbits, labels, belts).
- `preferences`: graphics quality, units, accessibility.

Each domain exposes typed state and actions. Three.js objects are not stored in the store; only serializable data is.

## Performance

- `Canvas` with `dpr={[1, 2]}` and `gl={{ antialias: true }}` by default.
- `frameloop="demand"` for static views; animation only when necessary.
- Shared geometries and materials; explicit `dispose`.
- `InstancedMesh` for particles, stars, and asteroids.
- Lazy asset loading with `Suspense`.
- Draw call and triangle budget documented before adding effects.

## Assets

- `public/textures/`: surface, normal, and emissive maps.
- `public/models/`: GLTF/GLB models.
- Names in `kebab-case` and versioned per body (e.g., `earth-albedo-2k.jpg`).
- Optimize textures (power-of-two dimensions, compression where applicable).

## Conventions

- Components: `PascalCase.tsx`.
- Hooks: `useCamelCase.ts`.
- Utilities: `camelCase.ts`.
- Types: `PascalCase` without the `I` prefix.
- `@/` alias for `src/`.
- No cross-imports between `ui/` and `canvas/`.
