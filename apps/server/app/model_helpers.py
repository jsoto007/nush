import uuid

from sqlalchemy.dialects.postgresql import UUID

from .extensions import db


class BaseModel(db.Model):
    __abstract__ = True

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now(), nullable=False)
    updated_at = db.Column(
        db.DateTime(timezone=True), server_default=db.func.now(), onupdate=db.func.now(), nullable=False
    )


class SoftDeleteMixin:
    deleted_at = db.Column(db.DateTime(timezone=True), index=True)


def normalize_lower(value: str | None) -> str | None:
    if value is None:
        return None
    return value.strip().lower()


def validate_non_negative(value: int | None, field: str) -> int | None:
    if value is None:
        return None
    if value < 0:
        raise ValueError(f"{field} must be non-negative")
    return value


def validate_percent(value: int | None, field: str) -> int | None:
    if value is None:
        return None
    if not 0 <= value <= 100:
        raise ValueError(f"{field} must be between 0 and 100")
    return value
