# Data contracts

**Status: APPROVED — version 1.2, project-owner approval recorded 2026-11-15 (see `AI_LOG.md`).** History: 1.0 approved 2026-11-14; 1.1 (yearly columnar series, §1.1) approved 2026-11-15; 1.2 (optional angular-radius columns, transition metrics, 422 `detail` shapes, `resolved_site_id`) approved 2026-11-15.

Section references use `§` (for example §1.1 = site time series, §1.2 = terrain evaluation); "version" always means the contract version above.

Contracts are the only coupling between `pipeline/`, `apps/backend/`, and `apps/frontend/`. Change protocol: see "Contract changes" in the root `AGENTS.md`.

Conventions: `MOON_ME` frame · latitude/longitude in degrees (lon ∈ [-180, 180]) · angles in degrees · time in UTC ISO 8601 · distances in meters · field names in `snake_case` with units when ambiguous.

---

## 1. Pipeline artifacts (`data/processed/`)

### 1.1 Site time series — `sites/<site_id>/horizon.json` and `sites/<site_id>/<year>.json`

**Version 1.2 — approved 2026-11-15.** Supersedes version 1.1 (and the single-file `sites/<site_id>.json` of version 1.0). Produced by `pipeline/sites`. One directory per verified preset site; one yearly file per year 2025–2035. Files are compact JSON (no indentation), columnar, one value per time step.

`horizon.json`:

```json
{
  "site_id": "malapert-massif",
  "name": "Malapert Massif",
  "lat_deg": 0.0,
  "lon_deg": 0.0,
  "horizon_source": "lola",
  "horizon_profile_deg": [0.0],
  "max_radius_m": 150000,
  "near_field_m": 100,
  "observer_height_m": 0.0,
  "assumptions": ["..."]
}
```

`<year>.json` (e.g. `2027.json`):

```json
{
  "site_id": "malapert-massif",
  "year": 2027,
  "time_step_minutes": 60,
  "start_utc": "2027-01-01T00:00:00Z",
  "time_utc": ["2027-01-01T00:00:00Z"],
  "sun_azimuth_deg": [0.0],
  "sun_elevation_deg": [0.0],
  "sun_visible_fraction": [0.0],
  "sun_distance_km": [0.0],
  "sun_angular_radius_deg": [0.0],
  "sun_dir_me": [[0.0, 0.0, 0.0]],
  "earth_azimuth_deg": [0.0],
  "earth_elevation_deg": [0.0],
  "earth_visible_fraction": [0.0],
  "earth_distance_km": [0.0],
  "earth_angular_radius_deg": [0.0],
  "earth_dir_me": [[0.0, 0.0, 0.0]]
}
```

- All columns in a year file have the same length as `time_utc`.
- `sun_angular_radius_deg` and `earth_angular_radius_deg` are optional columns for legacy compatibility. While legacy artifacts exist, the backend may return each column as `null` or omit it. When present, each column is an array with the same length as `time_utc`.
- `horizon_source`: `"lola"` (real terrain) or `"sphere"` (approximate, near side).
- `horizon_profile_deg`: 360 values, index = azimuth in whole degrees (0 = local north, clockwise), value = horizon elevation angle including lunar curvature. `max_radius_m` = 150000 (PD-07), `near_field_m` = 100 and `observer_height_m` = 0 (PD-09).
- `*_dir_me`: unit vector from the Moon center to the body in `MOON_ME`. `*_distance_km`: distance from the site to the body center.
- `*_angular_radius_deg`: apparent angular radius derived from the SPICE kernel body radius and `*_distance_km`; no physical radius constants are stored in the artifact.
- Visibility (R3-2): `sun_visible_fraction` = fraction (0–1) of the solar disc above the horizon, assuming the horizon is flat across the disc width (horizon interpolated linearly in azimuth). `earth_visible_fraction` uses the same computation, and Earth counts as visible when its center is above the horizon (margin 0°).
- The `sun_visible` / `earth_visible` booleans of version 1.0 are removed: consumers derive them (Sun: fraction > 0; Earth: center elevation above the horizon, equivalently fraction >= 0.5).

Evaluation transition metrics use the series resolution. `next_sunset_utc` and `next_earthset_utc` are the first visible-to-not-visible transitions; `next_sunrise_utc` and `next_earthrise_utc` are the first not-visible-to-visible transitions within the inclusive interval `[start_utc, end_utc]`, counted from `start_utc` at `time_step_minutes` resolution. They are `null` when no matching transition occurs in the interval.

### 1.2 Terrain evaluation — `terrain/<site_id>.json`

Shape kept from the team's original contract.

```json
{
  "site_id": "malapert-massif",
  "safety_radius_meters": 100,
  "center_elevation_meters": 0.0,
  "max_slope_degrees": 0.0,
  "mean_slope_degrees": 0.0,
  "p95_slope_degrees": 0.0,
  "is_slope_safe": true,
  "terrain_roughness_index": 0.0,
  "nearest_ice_deposit_meters": 0.0
}
```

`p95_slope_degrees` is added to support the slope warning (REQUIREMENTS 5.4).
`terrain_roughness_index` and `nearest_ice_deposit_meters` are omitted until those products exist (REQUIREMENTS 5.5); consumers must treat them as optional.

### 1.3 Regional layers — `layers/<region_id>/`

- `metadata.json`: projection (`polar_stereographic` | `equirectangular`), grid cell size in meters, bounds, image width/height, and per-layer value ranges.
- One PNG per layer on the same grid: `illumination.png`, `earth_visibility.png`, `slope.png`, `permanent_shadow.png`.

---

## 2. Backend API (`/api`)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Liveness and data directory check (implemented) |
| GET | `/api/sites` | List of preset sites (id, name, lat, lon, group) |
| GET | `/api/sites/{site_id}/series?start=&end=` | Series sliced to the window (columns of 1.1), plus `horizon.json` content. 404 if the site is not precomputed; 422 if the window is inverted or outside 2025–2035 |
| POST | `/api/evaluate` | Suitability Index for a site/point and window |
| GET | `/api/layers/{region_id}` | Layer metadata; images served as static files |

### 2.0 `GET /api/sites/{site_id}/series`

Response = all fields of `horizon.json` + `time_step_minutes` + the columns of the year files (section 1.1) concatenated and sliced to `[start, end]` (inclusive). Year, `start_utc` and `site_id` of the year files are not repeated. The window may span several years.

### 2.1 `POST /api/evaluate`

Request:

```json
{
  "site_id": "malapert-massif",
  "lat_deg": null,
  "lon_deg": null,
  "start_utc": "2027-03-15T00:00:00Z",
  "end_utc": "2027-03-29T00:00:00Z"
}
```

Either `site_id` or both `lat_deg`/`lon_deg` are required. Free points currently use the nearest preset site's date-specific evaluation.

Response:

```json
{
  "resolved_site_id": "malapert-massif",
  "suitability_index": 0,
  "traffic_light": "green",
  "precision": "date_specific",
  "vetoes": [{ "code": "earth_visibility_low", "message": "Earth visible only 12% of the mission window (minimum 25%)." }],
  "criteria": [
    { "code": "power", "label": "Solar power", "normalized": 0.0, "weight": 0.3, "contribution": 0.0, "detail": "..." }
  ],
  "metrics": {
    "sunlight_percent": 0.0,
    "earth_visible_percent": 0.0,
    "longest_darkness_hours": 0.0,
    "next_sunset_utc": null,
    "next_sunrise_utc": null,
    "next_earthset_utc": null,
    "next_earthrise_utc": null
  },
  "warnings": []
}
```

- `resolved_site_id`: preset site ID actually used for the successful evaluation. For a `site_id` request, it equals the requested site ID; for a free-point request, it identifies the nearest preset site with the required artifacts. It is absent from error responses.
- `traffic_light`: `"green" | "orange" | "red"`.
- `precision`: `"date_specific"` (preset sites) | `"average"` (reserved; not implemented until `pipeline/layers` exists).
- Free points (`lat_deg`/`lon_deg`) are redirected silently to the nearest preset site that has a precomputed series; `resolved_site_id` identifies that site and the response remains its `date_specific` evaluation. There is no `average`-precision evaluation yet.
- Weights and veto thresholds come from configuration (REQUIREMENTS 5.2–5.5, Agreed 2026-11-14). Criteria without data are excluded and the remaining weights are renormalized; this is reported in `warnings`.
- A valid window with no matching series samples returns `422` with the detail `No series points in the requested window.`
- HTTP 422 responses use `detail` as text for service errors and as a list for Pydantic validation errors.
- `GET /api/layers/{region_id}` is reserved by the contract and is not implemented until regional layer artifacts exist.
