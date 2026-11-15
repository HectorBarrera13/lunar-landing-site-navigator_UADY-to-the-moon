"""Loads precomputed terrain evaluations from data/processed/terrain/ (contract §1.2)."""

import json
import logging

from app.core.config import get_settings
from app.models.terrain import TerrainEvaluation
from app.services.sites import get_site

logger = logging.getLogger(__name__)


class TerrainNotFoundError(LookupError):
    def __init__(self, site_id: str) -> None:
        super().__init__(f"No precomputed terrain evaluation for site_id: {site_id!r}")
        self.site_id = site_id


def get_terrain(site_id: str) -> TerrainEvaluation:
    get_site(site_id)  # Unknown catalog sites are a 404 even if an artifact exists.
    path = get_settings().resolved_data_dir / "terrain" / f"{site_id}.json"
    if not path.is_file():
        raise TerrainNotFoundError(site_id)
    payload = json.loads(path.read_text(encoding="utf-8"))
    terrain = TerrainEvaluation.model_validate(payload)
    logger.debug("Loaded terrain for %s from %s", site_id, path)
    return terrain


__all__ = ["TerrainNotFoundError", "get_terrain"]
