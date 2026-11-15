"""Pipeline step `sites`: join ephemeris and horizon interim files into data/processed/sites/.

Contract 1.1 requires `*_visible`, which only exists once both interim artifacts are
available. Run the `terrain` and `ephemeris` steps first.
"""

import json

from lunar_pipeline.paths import INTERIM_DIR, PROCESSED_DIR, load_verified_sites, write_json
from lunar_pipeline.sites.join import build_site_series


def run_sites() -> None:
    written = 0
    for site in load_verified_sites():
        site_id = site["id"]
        ephemeris_path = INTERIM_DIR / "ephemeris" / f"{site_id}.json"
        horizon_path = INTERIM_DIR / "horizon" / f"{site_id}.json"
        if not ephemeris_path.is_file() or not horizon_path.is_file():
            print(f"  {site_id}: skipped (run the terrain and ephemeris steps first)")
            continue
        ephemeris = json.loads(ephemeris_path.read_text(encoding="utf-8"))
        horizon = json.loads(horizon_path.read_text(encoding="utf-8"))
        payload = build_site_series(ephemeris, horizon, site["name"])
        write_json(PROCESSED_DIR / "sites" / f"{site_id}.json", payload)
        count = len(payload["series"])
        sun = sum(1 for point in payload["series"] if point["sun_visible"])
        earth = sum(1 for point in payload["series"] if point["earth_visible"])
        print(
            f"  {site_id}: {count} points; Sun visible {sun / count:.1%}; "
            f"Earth visible {earth / count:.1%}; horizon {payload['horizon_source']}"
        )
        written += 1
    if written == 0:
        print("  No site has both an ephemeris and a horizon artifact.")


STEPS = {
    "sites": (
        "Join ephemeris and horizon into data/processed/sites/<site_id>.json (contract 1.1)",
        run_sites,
    ),
}
