from fastapi import APIRouter

from app.models.site import SiteSummary
from app.services.sites import list_sites

router = APIRouter(tags=["sites"])


@router.get(
    "/sites",
    response_model=list[SiteSummary],
    summary="List preset sites",
    description="Reads data/catalog/sites.json. lat/lon are null until QA verifies them (PD-01).",
)
def get_sites() -> list[SiteSummary]:
    return list_sites()
