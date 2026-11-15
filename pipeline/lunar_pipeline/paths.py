"""Repository paths and the verified site catalog."""

import json
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "data"
CATALOG_FILE = DATA_DIR / "catalog" / "sites.json"
PROCESSED_DIR = DATA_DIR / "processed"
INTERIM_DIR = DATA_DIR / "interim"


def load_verified_sites() -> list[dict[str, Any]]:
    """Catalog entries with `"verified": true` and non-null coordinates."""
    with CATALOG_FILE.open(encoding="utf-8") as fh:
        catalog = json.load(fh)
    return [
        site
        for site in catalog.get("sites", [])
        if site.get("verified") is True and site.get("lat") is not None and site.get("lon") is not None
    ]


def write_json(path: Path, payload: Any) -> None:
    """Write deterministic, human-readable JSON (UTF-8, 2-space indent, trailing newline)."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
