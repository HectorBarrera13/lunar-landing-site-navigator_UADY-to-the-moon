from fastapi import APIRouter, HTTPException

from app.models.evaluate import EvaluateRequest, EvaluateResponse
from app.services.evaluate import evaluate_mock
from app.services.sites import SiteNotFoundError

router = APIRouter(tags=["evaluate"])


@router.post(
    "/evaluate",
    response_model=EvaluateResponse,
    summary="Evaluate a site or point (MOCK)",
    description="MOCK: validates the request and returns placeholder values with the contract shape. Not a real Suitability Index.",
    responses={404: {"description": "Unknown site_id"}},
)
def evaluate(request: EvaluateRequest) -> EvaluateResponse:
    try:
        return evaluate_mock(request)
    except SiteNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
