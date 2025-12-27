from dotenv import find_dotenv, load_dotenv
from flask import Flask
from werkzeug.exceptions import HTTPException

from .extensions import cors, db, limiter, migrate
from .routes import register_api_blueprints
from .routes.response import error


def _parse_origins(raw_origins: str):
    if raw_origins:
        return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

    return [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://localhost:8081",
        "http://localhost:8082",
        "http://127.0.0.1:8081",
        "http://127.0.0.1:8082",
    ]


def create_app():
    load_dotenv(find_dotenv())
    from .config import Config
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    migrate.init_app(app, db)

    cors.init_app(
        app,
        resources={r"/api/.*": {"origins": _parse_origins(app.config["CORS_ORIGINS"]) }},
        supports_credentials=True,
    )
    limiter.init_app(app)

    from . import models  # noqa: F401

    @app.get("/health")
    def health():
        return {"status": "ok"}

    register_api_blueprints(app)

    @app.errorhandler(HTTPException)
    def handle_http_exception(exc: HTTPException):
        status = exc.code or 400
        friendly_messages = {
            400: "Invalid request.",
            401: "Authentication required.",
            403: "Access denied.",
            404: "Resource not found.",
            405: "Method not allowed.",
            409: "Request conflict.",
            415: "Unsupported media type.",
            422: "Invalid request.",
        }
        return error("HTTP_ERROR", friendly_messages.get(status, "Request failed."), status=status)

    @app.errorhandler(Exception)
    def handle_unexpected_exception(exc: Exception):
        app.logger.exception("Unhandled exception")
        return error(
            "INTERNAL_ERROR",
            "Something went wrong. Please try again later.",
            status=500,
        )
    return app
