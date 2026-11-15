# Requirements — Lunar Landing Site Navigator

Consolidated from the team's SRS, the project master document, and team decisions (2026-11-14). This file is the single source of truth for scope. **Status legend:** `Agreed` = decided by the team · `Proposed` = recommendation awaiting team approval · `Pending` = not defined yet. Agents must not treat `Proposed` or `Pending` values as final (see `AGENTS.md`).

---

## 1. Vision

A desktop web tool that turns lunar ephemerides and topography into a visual, comparable decision about **where and when** to land. A 3D Moon globe shows the Sun and the Earth; selecting a site and a mission window `[t0, tf]` zooms into a 2D view with a traffic-light map, the local horizon with the Sun and Earth, and a **Suitability Index** (0–100) with an explained breakdown.

**Pitch sentence:** "An engineer defines the mission and, in minutes, knows where and when to land at the lunar south pole to have power and communication with Earth."

### 1.1 The challenge (NASA Space Apps 2026)

- Build an intuitive tool for mission planners, educators, and the public to quickly compare landing sites and dates, visualizing the Sun and Earth relative to the horizon to assess power generation and direct-to-Earth communication windows.
- **Only mandatory objective:** show the Sun and the Earth relative to the local horizon for a site and date. Everything else is optional ("you may consider").
- **Problem:** existing tools (Quickmap, Moon Trek, JPL Horizons) are powerful but slow for comparing scenarios.
- **Core use case:** a mission is delayed and the team must quickly evaluate alternative sites in the same region or alternative dates at the same site.

### 1.2 Users

Mission planners and engineers (primary), educators, general public.

---

## 2. Scope

| | Content | Status |
|---|---|---|
| **In scope** | Surface evaluation of sites and dates: solar power, direct-to-Earth line of sight, slope, landing zone vs. error margin, proximity to ice. Delays only as a reason to recalculate. Desktop browsers only. | Agreed |
| **Out of scope** | Orbital transfer mechanics, TLI, Δv, launch windows, descent profiles, fuel. Mobile/tablet optimization. | Agreed |
| **Hackathon work area** | South pole (lat ≤ -80°) with real LOLA topography; near side with approximate horizon; far side blocked. | Proposed (D4) |
| **Deferred to future work** | Temperature (LRO Diviner), radiation (CRaTER), mineralogy, north pole, Spanish translation, 3D terrain shadows and local 3D view, date-precise evaluation for any arbitrary point. | Proposed (D5) |
| **Calendar range** | 2025–2035 (Artemis window). | Agreed (SRS) |

---

## 3. Decisions

| ID | Decision | Resolution | Status |
|---|---|---|---|
| D1 | What the core is | Evaluate one site over a mission window: local horizon with Sun and Earth, Suitability Index, explained vetoes | Proposed |
| D2 | Site search | "Site Finder" is an optional add-on module. Designed now; built only if the core passes the H12 checkpoint | Agreed |
| D3 | Architecture | Offline `pipeline/` (SpiceyPy, NumPy, Rasterio, SciPy) precomputes artifacts; lightweight FastAPI backend (stdlib + Pydantic only) serves and scores them; React frontend renders | Agreed (2026-11-14) |
| D4 | Work area | See Scope | Proposed |
| D5 | Out of hackathon | See Scope | Proposed |
| D6 | Data contract and vetoes | `docs/contracts/` is the approved source of truth for pipeline, backend, and frontend | Agreed (2026-11-15) |
| D7 | Mission window input | The mission window `[t0, tf]` is the first thing the user enters | Agreed |
| D8 | Frontend stack | React 19 + Vite + TypeScript + Tailwind v4 + React Three Fiber/drei + Zustand | Agreed (repository) |
| D9 | Tests / CI | None for now; to be revisited during development | Agreed |

> Note: the SRS (section 2.1) originally proposed computing Sun/Earth positions in the browser with analytic formulas. D3 supersedes it: positions are precomputed with SpiceyPy (includes libration), and the browser only reads them.

---

## 4. Domain rules

### 4.1 Reference frame and physics

- **R-01** Single frame `MOON_ME` (Mean Earth/Polar Axis) for DEMs, layers, coordinates, and ephemerides. Mixing with `MOON_PA` causes offsets up to ~1 km at the poles. — Agreed
- **R-02** No atmospheric refraction (disable it in any library that applies it). — Agreed
- **R-03** Horizon computed from terrain plus lunar curvature. — Agreed
- **R-04** Libration and orbital variations included via JPL SPICE kernels. — Agreed
- **R-05** In polar stereographic maps, image "up" is not local north; convert azimuth by site longitude. — Agreed
- **R-06** NASA average layers (≈19 years) are for searching; the final decision is verified with real dates. — Agreed
- **R-07** Maps are computed at ground level; panels mounted higher see more light. Declared as a conservative assumption in the UI and README. — Agreed

### 4.2 Site selection

| ID | Rule | Status |
|---|---|---|
| R-10 | Near side only: lon ∈ [-90°, +90°]. Far side shown dimmed/blocked with an educational message (no direct communication without relays). | Agreed (SRS) |
| R-11 | South pole exception: any longitude is selectable for lat ≤ -80°. | Agreed (SRS) |
| R-12 | Shadowed points are selectable; darkness triggers a veto/penalty with an explanation popup, not a click block. | Agreed (SRS) |
| R-13 | Three selection modes: free click, manual lat/lon entry, 13 preset markers. Presets have date-precise data; free points use average layers. | Agreed (SRS) |
| R-14 | 13 presets: 9 Artemis III regions (Peak near Cabeus B, Haworth, Malapert Massif, Mons Mouton Plateau, Mons Mouton, Nobile Rim 1, Nobile Rim 2, de Gerlache Rim 2, Slater Plain) + Apollo 11, Apollo 17, Chang'e 3, Chandrayaan-3. Coordinates verified by QA in `data/catalog/sites.json`. | Proposed (PD-01) |

### 4.3 2D view geometry

| ID | Rule | Status |
|---|---|---|
| R-20 | Polar stereographic projection for lat ≤ -80°; equirectangular/orthographic for mid latitudes. | Agreed (SRS) |
| R-21 | Fixed (non-editable) landing circle and error margin drawn on the 2D view. | Agreed (SRS) |
| R-22 | Landing zone 200 m diameter + 100 m error margin, as a documented assumption. | Proposed (PD-02) |
| R-23 | Grid cell 60 m (85°S–90°S) and 120 m (80°S–85°S), matching NASA layers. | Proposed (PD-03) |

---

## 5. Evaluation model

### 5.1 Suitability Index and traffic light — Agreed

- Weighted sum of criteria normalized to [0, 1], plus hard vetoes. Expressed 0–100. Named **"Suitability Index"**, never "probability of success".
- **Green:** ≥ 70 and no veto. **Orange:** 40–69 and no veto. **Red:** < 40 or any active veto; a popup explains the exact cause.

### 5.2 Weights

Baseline (SRS, agreed) vs. adjustment (master document, proposed). The proposal redistributes temperature and radiation, which will have no data in the hackathon, into power and communication.

| Criterion | SRS near side | SRS south pole | Proposed near side | Proposed south pole | Data source |
|---|---:|---:|---:|---:|---|
| Power / solar illumination | 25% | 25% | 30% | 30% | SpiceyPy series + horizon (presets); average map (free click) |
| Direct-to-Earth communication | 15% | 15% | 20% | 20% | Same as power |
| Terrain slope | 20% | 15% | 25% | 15% | LOLA LDSM slope |
| Landing zone vs. error margin | 15% | 10% | 20% | 10% | Slope inside the circle |
| Resources (proximity to ice) | 0% | 20% | 0% | 20% | Permanent shadow derived from illumination map |
| Surface temperature | 15% | 10% | 0% (informative) | 0% (informative) | Future work |
| Radiation | 5% | 5% | 0% (informative) | 0% (informative) | Future work |
| Roughness / other | 5% | 0% | 5% | 5% | LOLA roughness (optional) |

**Status:** Agreed (2026-11-14): proposed adjustment, south-pole column (30/20/15/10/20/0/0/5). Criteria at 0% are informative and not scored. Weights live in configuration, not in code.

### 5.3 Vetoes — Agreed (2026-11-14, PD-04)

| Veto | Rule | Rationale |
|---|---|---|
| Communication | Earth visible < 25% of the mission window | NASA excluded zones with Earth visibility < 25% when selecting Artemis III regions |
| Power | Continuous darkness longer than the battery limit (48 h), or light < 5% | NASA excluded zones with solar visibility < 5%; continuous darkness drains batteries |
| Slope | Mean slope inside the landing circle > 10° | SRS rule (5.4). The 95th percentile > 10° is a warning, not a veto |
| Far side | lon outside [-90°, +90°] and lat > -80° | No direct communication without relays |

The previously proposed slope veto on the 95th percentile was rejected because it contradicts the agreed 5.4 behaviour (secondary warning) and would veto the only verified site with current data. The 95th percentile is still reported as a warning.

### 5.4 Slope aggregation — Agreed (SRS) with recommended guard

The SRS defines the mean slope inside the landing circle with a < 10° threshold. Because the mean can hide a steep crater wall, the system also computes the max / 95th percentile and shows a secondary warning when micro-areas exceed 10°.

### 5.5 Normalization and thresholds — Agreed (2026-11-14)

Normalization functions (0–1), evaluated over `[t0, tf]`:

| Criterion | Normalization |
|---|---|
| Power / solar illumination | `sunlight_percent / 100` |
| Direct-to-Earth communication | `earth_visible_percent / 100` |
| Terrain slope | `clamp(1 − mean_slope_degrees / 10, 0, 1)` |
| Landing zone vs. error margin | `is_slope_safe ? 1 : 0` |
| Resources (ice proximity) | Excluded until a distance-to-ice product exists |
| Roughness | Excluded until a roughness metric is defined |

- Battery darkness limit: 48 h.
- Minimum solar visibility: 5%.
- Minimum Earth visibility: 25%.
- No separate minimum Earth elevation angle: visibility is defined by the horizon profile (contract 1.1).
- When a criterion has no data, it is excluded and the remaining weights are renormalized; the response says so in `warnings`.
- Free points are redirected to the nearest preset site that has a precomputed series. The evaluation is `date_specific`; there is no average-precision evaluation until `pipeline/layers` exists.

**Visibility rule (R3-2) — Agreed 2026-11-15.** Sun: `sun_visible_fraction` is the fraction (0–1) of the solar disc above the terrain horizon, assuming the horizon is flat across the width of the disc; `sunlight_percent` is the mean of that fraction over the window. Earth: the center of the disc must be above the terrain horizon, with a 0° margin. Azimuth is interpolated between whole-degree horizon bins.

**Horizon parameters (R3-4) — Agreed 2026-11-15.** PD-07: horizon search radius 150 km. PD-09: near field 100 m and observer height 0 m.

**Round 3 decisions — Agreed 2026-11-15.**

- **R3-5:** The landing zone is filled with the Suitability Index traffic-light color. The error margin is a neutral dotted ring. Icons and text accompany the color; color is never the only status indicator.
- **R3-6:** Comparison supports up to three site/window scenarios, including the `+N days` shift. A free-point selection continues to resolve silently to the nearest precomputed preset site; the UI may identify that preset without changing the evaluation precision.
- **Horizons validation tolerance:** the maximum absolute difference accepted for the current QA comparison is `0.000045°` for azimuth or elevation, with refraction disabled.

Open (not blocking the hackathon core): distance-to-ice function, roughness metric, zone-vs-margin formula beyond the binary `is_slope_safe`.

---

## 6. Functional requirements

Priority: **Must** / **Should** / **Could** (from the master document, Proposed unless marked).

### 6.1 Challenge core

| ID | Requirement | Priority |
|---|---|---|
| FR-01 | Local 360° horizon panel: terrain profile with the Sun and the Earth positions for the selected site and time. | Must (only mandatory challenge objective) |
| FR-02 | Time remaining until the next sunset and Earth-set, shown in the results panel. | Must |
| FR-03 | Mission window calendar: start `t0` and end `tf`, bounded to 2025–2035 (SRS RF-04). | Must |
| FR-04 | Site selection: 13 presets, free click, manual lat/lon entry validated against R-10/R-11 (SRS RF-06–RF-09). | Must |
| FR-05 | Suitability Index over the whole window `[t0, tf]` (SRS RF-16). | Must |
| FR-06 | Breakdown panel: global %, color, per-criterion contribution in plain language, plus % sunlight, solar elevation, % Earth visible, longest continuous darkness (SRS RF-17). | Must |
| FR-07 | Veto explanation popup with the exact cause (SRS RF-10). | Must |
| FR-08 | 2D view of the zone with the traffic-light grid and the fixed landing circle and margin (SRS RF-11, RF-13). | Must |
| FR-09 | Adaptive projection for the 2D view (SRS RF-12). | Must |
| FR-10 | Non-color indicators: icons, text, or patterns (SRS RF-18). | Must |
| FR-11 | Timeline within the window with light and contact bands; scrubbing moves the Sun, Earth, and shadows (SRS RF-05). | Should |
| FR-12 | 3D Moon globe with texture, solar lighting, Earth in real relative position, rotation and zoom (SRS RF-01, RF-02). | Should |
| FR-13 | Day/night terminator on the globe (SRS RF-03). Relief shadows in 3D are future work. | Should (terminator) |
| FR-14 | Compare up to 3 site × window scenarios and a "+7 days" delay shortcut (SRS RF-20). | Should |
| FR-15 | Thematic layers: slope and permanent shadow (subset of SRS RF-14) with a unified normalized color scale (RF-15). | Should |
| FR-16 | Advanced mode plus an "About" screen; full guided mode deferred (SRS RF-19). | Could |
| FR-17 | Export PNG of the current view and JSON/CSV of the evaluation (SRS RF-21). | Could |

### 6.2 Site Finder (optional module, built only after the H12 checkpoint — D2 Agreed)

| ID | Function | Priority |
|---|---|---|
| SF-1 | Highlight the top 3 cells in the region with default requirements | Must (module) |
| SF-2 | A cell qualifies only if the entire landing circle and margin meet the slope rule | Must (module) |
| SF-3 | Hover a red cell to read the rejection reason | Should |
| SF-4 | If the site is red, find the nearest viable cell and its distance | Should |
| SF-5 | Adjustable light, Earth, and slope requirements; map repaints | Should |
| SF-6 | Best start date for a preset site | Could |
| SF-7 | Mission profiles (robotic rover, crewed lander, science station) | Could |
| SF-8 | Worst-case index inside the error margin | Could |
| SF-9 | Light vs. Earth trade-off chart | Could |
| SF-10 | Export candidates as CSV | Could |

If the core is late at H12, build only SF-1 with fixed requirements.

---

## 7. Non-functional requirements

| ID | Requirement | Status |
|---|---|---|
| NFR-01 | Desktop browsers only. | Agreed (SRS) |
| NFR-02 | All UI, messages, and docs in English; strings in resource files for a later Spanish translation. | Agreed (SRS) |
| NFR-03 | 60 FPS target for globe rotation on standard desktop hardware; 2D view updates < 200 ms when scrubbing time. | Agreed (SRS) |
| NFR-04 | Initial load < 15 MB and < 5 s. | Proposed (PD-08) |
| NFR-05 | Always "Suitability Index", never "probability of success". | Agreed (SRS) |
| NFR-06 | Color-blind-safe palette (Okabe-Ito) plus icons and text. | Proposed (PD-05) |
| NFR-07 | No live heavy computation during the demo; the app must work with precomputed data only. | Agreed (D3) |
| NFR-08 | Public app and public repository, accessible without login. | Agreed (Space Apps rules) |

---

## 8. Data sources

| Data / tool | Purpose | Used in |
|---|---|---|
| SPICE kernels (NAIF/JPL) | Moon orbit and orientation with libration | `pipeline/ephemeris` |
| SpiceyPy | Sun and Earth azimuth/elevation from a lunar point | `pipeline/ephemeris` |
| JPL Horizons | Validation and plan B (refraction off) | QA |
| LOLA DEM (PGDA, 20 m/px for 80°S–90°S) | Terrain height for horizons | `pipeline/terrain` |
| LOLA LDSM slope | Slope and safe zone | `pipeline/terrain`, `layers` |
| PGDA average illumination and Earth visibility maps (60–240 m/px) | Free-click evaluation and Site Finder | `pipeline/layers` |
| Rasterio · NumPy · SciPy | Windowed raster reads, vector math, distance transform | `pipeline/` |

Exact URLs, versions, and licenses must be registered in `data/README.md` before use. Resolution of LOLA data per region and the horizon search radius (150 km Agreed 2026-11-15, SRS PD-07; resolution per region still open).

---

## 9. Data contracts

The approved contracts live in `docs/contracts/` (D6, Agreed 2026-11-15). Contract changes must follow the repository protocol: approve the change first, then update the contract, producer, consumers, and `AI_LOG.md`.

---

## 10. Hackathon milestones (Proposed)

| Hour | Milestone |
|---|---|
| H0–H1.5 | Approve D1–D6, data contract, site list, vetoes |
| H7 | End-to-end app with mock data |
| H12 | Checkpoint: real data for ≥ 3 sites, first deployment, Site Finder go/no-go |
| H18 | Feature freeze |
| H22 | Code freeze |
| H25 | Submission sent |

## 11. Final deliverables (Space Apps)

Public app tested from another computer; public repository with an English README (problem, solution, NASA data used, assumptions, limitations); demo video ≤ 30 s or ≤ 7 slides with a public link, in English; project page in English.

## 12. Risks and fallbacks

| Risk | Fallback |
|---|---|
| SpiceyPy or kernels not ready | Precomputed JPL Horizons tables (refraction off) |
| DEM too heavy | Windowed crops around each site or lower resolution |
| 3D globe late | Static south pole image with markers; protect horizon panel and traffic light |
| Hosting fails at demo | Local app and recorded video |
| Late integration | Contracts fixed at H1; continuous integration from H7 |
| Wrong numbers | QA validation against Horizons and published values; assumptions stated in app and README |

## 13. Open items summary

PD-01 site list and coordinates · PD-02 landing zone and margin · PD-03 grid cell size · PD-04 vetoes and normalization · PD-05 palette · PD-06 modes and comparison table details · PD-07 LOLA resolution and horizon radius (radius 150 km Agreed 2026-11-15) · PD-08 load budget · PD-09 near field 100 m and observer height 0 m (Agreed 2026-11-15) · weights choice (5.2) · D1, D4, D5, D6 approval · hosting.
