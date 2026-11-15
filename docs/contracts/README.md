# Data contracts

**Status: APPROVED — project-owner approval recorded 2026-11-14 (see `AI_LOG.md`).**

Contracts are the only coupling between `pipeline/`, `apps/backend/`, and `apps/frontend/`. Change protocol: see "Contract changes" in the root `AGENTS.md`.

Conventions: `MOON_ME` frame · latitude/longitude in degrees (lon ∈ [-180, 180]) · angles in degrees · time in UTC ISO 8601 · distances in meters · field names in `snake_case` with units when ambiguous.

---

## 1. Pipeline artifacts (`data/processed/`)

### 1.1 Site time series — `sites/<site_id>.json`

Produced by `pipeline/ephemeris` + `pipeline/terrain`. One file per verified preset site.

```json
{
  "site_id": "malapert-massif",
  "name": "Malapert Massif",
  "lat_deg": 0.0,
  "lon_deg": 0.0,
  "horizon_source": "lola",
  "horizon_profile_deg": [0.0],
  "time_step_minutes": 60,
  "series": [
    {
      "time_utc": "2027-03-15T12:00:00Z",
      "sun_azimuth_deg": 0.0,
      "sun_elevation_deg": 0.0,
      "sun_visible": true,
      "earth_azimuth_deg": 0.0,
      "earth_elevation_deg": 0.0,
      "earth_visible": true
    }
  ]
}
```

- `horizon_source`: `"lola"` (real terrain) or `"sphere"` (approximate, near side).
- `horizon_profile_deg`: 360 values, index = azimuth in whole degrees (0 = local north, clockwise), value = horizon elevation angle including lunar curvature.
- `*_visible`: body center above `horizon_profile_deg` at its azimuth. (Pending: center vs. limb criterion.)
- Pending: time step and file size for the full 2025–2035 range (may require one file per year).

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
| GET | `/api/sites/{site_id}/series?start=&end=` | Series sliced to the window, plus horizon profile |
| POST | `/api/evaluate` | Suitability Index for a site/point and window |
| GET | `/api/layers/{region_id}` | Layer metadata; images served as static files |

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

Either `site_id` or both `lat_deg`/`lon_deg` are required. Free points use average layers (standard precision).

Response:

```json
{
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
    "next_earthset_utc": null
  },
  "warnings": []
}
```

- `traffic_light`: `"green" | "orange" | "red"`.
- `precision`: `"date_specific"` (preset sites) | `"average"` (reserved; not implemented until `pipeline/layers` exists).
- Free points (`lat_deg`/`lon_deg`) are redirected to the nearest preset site that has a precomputed series; the response is the site's `date_specific` evaluation. There is no `average`-precision evaluation yet.
- Weights and veto thresholds come from configuration (REQUIREMENTS 5.2–5.5, Agreed 2026-11-14). Criteria without data are excluded and the remaining weights are renormalized; this is reported in `warnings`.
