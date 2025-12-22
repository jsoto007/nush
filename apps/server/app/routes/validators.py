import uuid
from typing import Any

from .response import error


def parse_uuid(value: Any, field: str):
    if value is None:
        return None, error("VALIDATION_ERROR", f"{field} is required", {field: "required"})
    try:
        return uuid.UUID(str(value)), None
    except (ValueError, TypeError):
        return None, error("VALIDATION_ERROR", f"{field} must be a valid UUID", {field: "invalid"})


def parse_int(value: Any, field: str, minimum: int | None = None):
    if value is None:
        return None, error("VALIDATION_ERROR", f"{field} is required", {field: "required"})
    try:
        parsed = int(value)
    except (ValueError, TypeError):
        return None, error("VALIDATION_ERROR", f"{field} must be an integer", {field: "invalid"})
    if minimum is not None and parsed < minimum:
        return None, error(
            "VALIDATION_ERROR",
            f"{field} must be >= {minimum}",
            {field: f"min_{minimum}"},
        )
    return parsed, None


def parse_enum(value: Any, enum_cls, field: str):
    if value is None:
        return None, error("VALIDATION_ERROR", f"{field} is required", {field: "required"})
    try:
        return enum_cls(value), None
    except ValueError:
        allowed = [item.value for item in enum_cls]
        return None, error(
            "VALIDATION_ERROR",
            f"{field} must be one of {allowed}",
            {field: "invalid"},
        )


def get_json(request):
    if not request.is_json:
        return None, error("VALIDATION_ERROR", "JSON body required", {"body": "invalid"})
    return request.get_json(silent=True) or {}, None


def parse_pagination(args, default_limit: int = 20, max_limit: int = 100):
    try:
        limit = int(args.get("limit", default_limit))
        offset = int(args.get("offset", 0))
    except (TypeError, ValueError):
        return None, None, error("VALIDATION_ERROR", "limit and offset must be integers", {"limit": "invalid"})
    if limit < 0 or offset < 0:
        return None, None, error("VALIDATION_ERROR", "limit and offset must be >= 0", {"limit": "min_0"})
    return min(limit, max_limit), offset, None
