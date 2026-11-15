"""NAIF SPICE kernels for MOON_ME (DE421). Registered in data/README.md.

Kernels are downloaded once to pipeline/kernels/ (git-ignored) and never committed.
"""

import shutil
import urllib.request
from pathlib import Path

import spiceypy

from lunar_pipeline.paths import REPO_ROOT

KERNELS_DIR = REPO_ROOT / "pipeline" / "kernels"
NAIF = "https://naif.jpl.nasa.gov/pub/naif/generic_kernels/"

# Load order matters: frames that reference the binary PCK come after it.
KERNELS: tuple[tuple[str, str], ...] = (
    ("naif0012.tls", NAIF + "lsk/naif0012.tls"),
    ("pck00011.tpc", NAIF + "pck/pck00011.tpc"),
    ("de421.bsp", NAIF + "spk/planets/a_old_versions/de421.bsp"),
    ("moon_pa_de421_1900-2050.bpc", NAIF + "pck/moon_pa_de421_1900-2050.bpc"),
    ("moon_080317.tf", NAIF + "fk/satellites/moon_080317.tf"),
    ("moon_assoc_me.tf", NAIF + "fk/satellites/moon_assoc_me.tf"),
)


def ensure_kernels(directory: Path = KERNELS_DIR) -> list[Path]:
    """Download any missing kernel; existing files are reused (idempotent)."""
    directory.mkdir(parents=True, exist_ok=True)
    paths: list[Path] = []
    for name, url in KERNELS:
        path = directory / name
        if not path.exists():
            print(f"  downloading {name} ...")
            tmp = path.with_suffix(path.suffix + ".part")
            with urllib.request.urlopen(url, timeout=120) as response, tmp.open("wb") as out:
                shutil.copyfileobj(response, out)
            tmp.replace(path)
        paths.append(path)
    return paths


def load_kernels(paths: list[Path]) -> None:
    spiceypy.kclear()
    for path in paths:
        spiceypy.furnsh(str(path))
