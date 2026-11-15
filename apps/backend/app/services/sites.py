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


# Used only while a site has no verified latitude yet (PD-01): the catalog groups every Artemis III
# candidate region at the south pole; historical landings are elsewhere.
_REGION_BY_GROUP = {"artemis-iii-region": "south_pole", "historical-landing": "other"}


def _region(lat: float | None, group: str) -> str:
    if lat is not None:
        return "south_pole" if lat <= get_settings().south_pole_max_lat_deg else "other"
    return _REGION_BY_GROUP.get(group, "other")


def list_sites() -> list[SiteSummary]:
    path = get_settings().resolved_catalog_file
    with path.open(encoding="utf-8") as fh:
        catalog = json.load(fh)
    sites = [
        SiteSummary(
            id=s["id"],
            name=s["name"],
            group=s["group"],
            region=_region(s.get("lat"), s["group"]),
            lat=s.get("lat"),
            lon=s.get("lon"),
        )
        for s in catalog.get("sites", [])
    ]
    logger.debug("Loaded %d sites from %s", len(sites), path)
    return sites


def get_site(site_id: str) -> SiteSummary:
    for site in list_sites():
        if site.id == site_id:
            return site
    raise SiteNotFoundError(site_id)
