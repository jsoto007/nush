from dotenv import load_dotenv
from flask import Flask

from .extensions import cors, db, limiter, migrate
from .routes import register_api_blueprints


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
    load_dotenv()
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
    return app
