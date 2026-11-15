"""Pipeline step `sites`: join ephemeris and horizon interim files into data/processed/sites/<site_id>/.

Writes horizon.json and one <year>.json per available interim year (docs/contracts §1.1).
Run the `terrain` and `ephemeris` steps first.
"""

import json
from pathlib import Path

import numpy as np

from lunar_pipeline.ephemeris.config import EphemerisConfig
from lunar_pipeline.paths import INTERIM_DIR, PROCESSED_DIR, load_verified_sites, write_json_compact
from lunar_pipeline.sites.join import build_horizon, build_year_series, validate_profile


def run_sites(years: tuple[int, ...] | None = None) -> None:
    written = 0
    for site in load_verified_sites():
        site_id = site["id"]
        horizon_path = INTERIM_DIR / "horizon" / f"{site_id}.json"
        ephemeris_dir = INTERIM_DIR / "ephemeris" / site_id
        if not horizon_path.is_file() or not ephemeris_dir.is_dir():
            print(f"  {site_id}: skipped (run the terrain and ephemeris steps first)")
            continue
        horizon = json.loads(horizon_path.read_text(encoding="utf-8"))
        out_dir = PROCESSED_DIR / "sites" / site_id
        horizon_payload = build_horizon(horizon, site["name"])
        write_json_compact(out_dir / "horizon.json", horizon_payload)
        _print_size(out_dir / "horizon.json")
        profile = validate_profile(horizon_payload["horizon_profile_deg"])
        for year in years or EphemerisConfig().years:
            path = ephemeris_dir / f"{year}.json"
            if not path.is_file():
                print(f"  {site_id} {year}: skipped (no interim ephemeris)")
                continue
            payload = build_year_series(json.loads(path.read_text(encoding="utf-8")), profile)
            write_json_compact(out_dir / f"{year}.json", payload)
            count = len(payload["time_utc"])
            sun = np.mean(np.asarray(payload["sun_visible_fraction"]) > 0)
            earth = np.mean(np.asarray(payload["earth_visible_fraction"]) >= 0.5)
            print(
                f"  {site_id} {year}: {count} points; Sun visible {sun:.1%}; Earth visible {earth:.1%}; "
                f"horizon {horizon_payload['horizon_source']}"
            )
            _print_size(out_dir / f"{year}.json")
            written += 1
    if written == 0:
        print("  No site has both an ephemeris and a horizon artifact.")


def _print_size(path: Path) -> None:
    print(f"    {path.name}: {path.stat().st_size / 1_000_000:.2f} MB")


STEPS = {
    "sites": (
        "Join ephemeris and horizon into data/processed/sites/<site_id>/ (contract §1.1)",
        run_sites,
    ),
}
