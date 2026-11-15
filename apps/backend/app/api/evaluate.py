from fastapi import APIRouter, HTTPException

from app.models.evaluate import EvaluateRequest, EvaluateResponse
from app.services.evaluate import EvaluationUnavailableError, evaluate as evaluate_target
from app.services.series import SeriesNotFoundError, SeriesWindowError
from app.services.sites import SiteNotFoundError
from app.services.terrain import TerrainNotFoundError

router = APIRouter(tags=["evaluate"])


@router.post(
    "/evaluate",
    response_model=EvaluateResponse,
    summary="Suitability Index for a site and mission window",
    description=(
        "Aggregates the precomputed series and terrain over [start_utc, end_utc]. "
        "Free points are redirected to the nearest preset site with artifacts."
    ),
    responses={
        404: {"description": "Unknown site_id or missing series/terrain artifact"},
        422: {"description": "Far-side point, window inverted or outside 2025-2035, or no evaluatable preset site"},
    },
)
def evaluate(request: EvaluateRequest) -> EvaluateResponse:
    try:
        return evaluate_target(request)
    except (SiteNotFoundError, SeriesNotFoundError, TerrainNotFoundError) as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except (EvaluationUnavailableError, SeriesWindowError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
