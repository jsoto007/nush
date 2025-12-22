from flask import Blueprint

api_bp = Blueprint("api", __name__, url_prefix="/api/v1")


@api_bp.get("/health")
def health_check():
    return {"status": "ok"}
