from fastapi import APIRouter

from app.models.site import SiteSummary
from app.services.sites import list_sites

router = APIRouter(tags=["sites"])


@router.get(
    "/sites",
    response_model=list[SiteSummary],
    summary="List preset sites",
    description="Reads data/catalog/sites.json. All 13 preset coordinates are approved (PD-01 resolved 2026-11-15).",
)
def get_sites() -> list[SiteSummary]:
    return list_sites()
