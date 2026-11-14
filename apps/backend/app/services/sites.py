"""Preset site catalog access (reads `data/catalog/sites.json`)."""

import json
import logging

from app.core.config import get_settings
from app.models.site import SiteSummary

logger = logging.getLogger(__name__)


class SiteNotFoundError(LookupError):
    def __init__(self, site_id: str) -> None:
        super().__init__(f"Unknown site_id: {site_id!r}")
        self.site_id = site_id


def list_sites() -> list[SiteSummary]:
    path = get_settings().resolved_catalog_file
    with path.open(encoding="utf-8") as fh:
        catalog = json.load(fh)
    sites = [
        SiteSummary(id=s["id"], name=s["name"], group=s["group"], lat=s.get("lat"), lon=s.get("lon"))
        for s in catalog.get("sites", [])
    ]
    logger.debug("Loaded %d sites from %s", len(sites), path)
    return sites


def get_site(site_id: str) -> SiteSummary:
    for site in list_sites():
        if site.id == site_id:
            return site
    raise SiteNotFoundError(site_id)
