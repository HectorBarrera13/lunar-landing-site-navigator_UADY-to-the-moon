import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.evaluate import router as evaluate_router
from app.api.health import router as health_router
from app.api.sites import router as sites_router
from app.core.config import get_settings

settings = get_settings()

logging.basicConfig(level=logging.DEBUG if settings.debug_mode else logging.INFO)

app = FastAPI(
    title="Lunar Landing Site Navigator API",
    version="0.1.0",
    debug=settings.debug_mode,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api")
app.include_router(sites_router, prefix="/api")
app.include_router(evaluate_router, prefix="/api")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="127.0.0.1", port=settings.port, reload=settings.debug_mode)
