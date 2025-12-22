from dotenv import load_dotenv
from flask import Flask

from .app import api_bp
from .config import Config
from .extensions import cors, db, migrate


def _parse_origins(raw_origins: str):
    if raw_origins:
        return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

    return [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8081",
        "http://127.0.0.1:8081",
    ]


def create_app():
    load_dotenv()
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    migrate.init_app(app, db)

    cors.init_app(
        app,
        resources={r"/api/.*": {"origins": _parse_origins(app.config["CORS_ORIGINS"]) }},
        supports_credentials=True,
    )

    from . import models  # noqa: F401

    @app.get("/health")
    def health():
        return {"status": "ok"}

    app.register_blueprint(api_bp)
    return app
