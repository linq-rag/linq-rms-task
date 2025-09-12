from app.config.lifespan import lifespan
from app.controllers.home import api as home_router
from app.controllers.auth import api as auth_router

from fastapi import FastAPI
from fastapi.middleware import Middleware
from fastapi.middleware.cors import CORSMiddleware


def init_routers(app_: FastAPI) -> None:
    # API routes
    app_.include_router(home_router)
    app_.include_router(auth_router, prefix="/auth")


def make_middleware() -> list[Middleware]:
    middleware = [
        Middleware(
            CORSMiddleware,
            allow_origins=[
                "http://localhost:3001",
                "http://localhost:3000",
            ],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        ),
    ]
    return middleware


def create_app() -> FastAPI:
    app_ = FastAPI(
        title="Linq RMS Task API",
        description="Linq RMS Task API",
        version="1.0.0",
        openapi_url=None,
        docs_url=None,
        redoc_url=None,
        middleware=make_middleware(),
        lifespan=lifespan,
        responses={
            200: {"description": "Successful response"},
            401: {"description": "Not enough privilege. Please check your access key."},
            404: {"description": "The resource that you are trying to access does not exist."},
            422: {"description": "Validation error. Please check your request body or params"},
            500: {
                "description": "Internal server error. Please contact us if the problem persists."
            },
        },
    )

    init_routers(app_=app_)

    return app_


app = create_app()