from flask import Blueprint, request

from ..auth_helpers import require_role
from ..extensions import db
from ..models import MembershipTier, Order, Restaurant, RestaurantStatus, User, UserRoleType, Promotion, PromotionScope, PromotionType
from .response import error, ok
from .serializers import restaurant_summary, user_summary, order_summary
from .validators import get_json, parse_enum, parse_pagination


admin_bp = Blueprint("admin", __name__, url_prefix="/admin")


@admin_bp.get("/users")
@require_role(UserRoleType.ADMIN, UserRoleType.STAFF)
def list_users():
    limit, offset, err = parse_pagination(request.args, default_limit=50, max_limit=200)
    if err:
        return err
    users = db.session.query(User).order_by(User.created_at.desc()).limit(limit).offset(offset).all()
    return ok({"users": [user_summary(u) for u in users], "limit": limit, "offset": offset})


@admin_bp.patch("/users/<uuid:user_id>")
@require_role(UserRoleType.ADMIN, UserRoleType.STAFF)
def update_user(user_id):
    payload, err = get_json(request)
    if err:
        return err
    user = db.session.get(User, user_id)
    if not user:
        return error("NOT_FOUND", "User not found", status=404)
    if "is_active" in payload:
        user.is_active = bool(payload["is_active"])
    if "role" in payload:
        try:
            user.role = UserRoleType(payload["role"])
        except ValueError:
            return error("VALIDATION_ERROR", "Invalid role", {"role": "invalid"})
    db.session.commit()
    return ok({"user": user_summary(user)})


@admin_bp.get("/restaurants")
@require_role(UserRoleType.ADMIN, UserRoleType.STAFF)
def list_restaurants():
    limit, offset, err = parse_pagination(request.args, default_limit=50, max_limit=200)
    if err:
        return err
    restaurants = db.session.query(Restaurant).order_by(Restaurant.created_at.desc()).limit(limit).offset(offset).all()
    return ok({"restaurants": [restaurant_summary(r) for r in restaurants], "limit": limit, "offset": offset})


@admin_bp.patch("/restaurants/<uuid:restaurant_id>/status")
@require_role(UserRoleType.ADMIN, UserRoleType.STAFF)
def update_restaurant_status(restaurant_id):
    payload, err = get_json(request)
    if err:
        return err
    status, err = parse_enum(payload.get("status"), RestaurantStatus, "status")
    if err:
        return err
    restaurant = db.session.get(Restaurant, restaurant_id)
    if not restaurant:
        return error("NOT_FOUND", "Restaurant not found", status=404)
    restaurant.status = status
    db.session.commit()
    return ok({"restaurant": restaurant_summary(restaurant)})


@admin_bp.get("/orders")
@require_role(UserRoleType.ADMIN, UserRoleType.STAFF)
def list_orders():
    limit, offset, err = parse_pagination(request.args, default_limit=50, max_limit=200)
    if err:
        return err
    orders = db.session.query(Order).order_by(Order.created_at.desc()).limit(limit).offset(offset).all()
    return ok({"orders": [order_summary(o) for o in orders], "limit": limit, "offset": offset})


@admin_bp.get("/promotions")
@require_role(UserRoleType.ADMIN, UserRoleType.STAFF)
def list_promotions():
    limit, offset, err = parse_pagination(request.args, default_limit=50, max_limit=200)
    if err:
        return err
    promos = db.session.query(Promotion).order_by(Promotion.created_at.desc()).limit(limit).offset(offset).all()
    return ok(
        {
            "promotions": [
                {
                    "id": str(promo.id),
                    "code": promo.code,
                    "name": promo.name,
                    "type": promo.type.value if promo.type else None,
                    "scope": promo.scope.value if promo.scope else None,
                    "is_active": promo.is_active,
                }
                for promo in promos
            ],
            "limit": limit,
            "offset": offset,
        }
    )


@admin_bp.post("/promotions")
@require_role(UserRoleType.ADMIN, UserRoleType.STAFF)
def create_promotion():
    payload, err = get_json(request)
    if err:
        return err
    if not payload.get("code") or not payload.get("name"):
        return error(
            "VALIDATION_ERROR",
            "code and name are required",
            {"code": "required", "name": "required"},
        )
    promo_type, err = parse_enum(payload.get("type"), PromotionType, "type")
    if err:
        return err
    scope, err = parse_enum(payload.get("scope"), PromotionScope, "scope")
    if err:
        return err
    promo = Promotion(
        code=payload.get("code"),
        name=payload.get("name"),
        description=payload.get("description"),
        type=promo_type,
        scope=scope,
        min_order_cents=payload.get("min_order_cents", 0),
        rules=payload.get("rules") or {},
        starts_at=payload.get("starts_at"),
        ends_at=payload.get("ends_at"),
        is_active=payload.get("is_active", True),
    )
    db.session.add(promo)
    db.session.commit()
    return ok({"promotion_id": str(promo.id)}, status=201)


@admin_bp.patch("/promotions/<uuid:promotion_id>")
@require_role(UserRoleType.ADMIN, UserRoleType.STAFF)
def update_promotion(promotion_id):
    payload, err = get_json(request)
    if err:
        return err
    promo = db.session.get(Promotion, promotion_id)
    if not promo:
        return error("NOT_FOUND", "Promotion not found", status=404)
    for field in ["code", "name", "description", "min_order_cents", "rules", "is_active"]:
        if field in payload:
            setattr(promo, field, payload[field])
    if "type" in payload:
        try:
            promo.type = PromotionType(payload["type"])
        except ValueError:
            return error("VALIDATION_ERROR", "Invalid type", {"type": "invalid"})
    if "scope" in payload:
        try:
            promo.scope = PromotionScope(payload["scope"])
        except ValueError:
            return error("VALIDATION_ERROR", "Invalid scope", {"scope": "invalid"})
    db.session.commit()
    return ok({"promotion_id": str(promo.id)})


@admin_bp.delete("/promotions/<uuid:promotion_id>")
@require_role(UserRoleType.ADMIN, UserRoleType.STAFF)
def delete_promotion(promotion_id):
    promo = db.session.get(Promotion, promotion_id)
    if not promo:
        return error("NOT_FOUND", "Promotion not found", status=404)
    promo.is_active = False
    promo.deleted_at = db.func.now()
    db.session.commit()
    return ok({"deleted": True})


@admin_bp.post("/memberships/tiers")
@require_role(UserRoleType.ADMIN, UserRoleType.STAFF)
def create_membership_tier():
    payload, err = get_json(request)
    if err:
        return err
    if not payload.get("name"):
        return error("VALIDATION_ERROR", "name is required", {"name": "required"})
    tier = MembershipTier(
        name=payload.get("name"),
        description=payload.get("description"),
        eligibility=payload.get("eligibility") or {},
        discount_percent=payload.get("discount_percent", 0),
        fee_rules=payload.get("fee_rules") or {},
        is_active=payload.get("is_active", True),
    )
    db.session.add(tier)
    db.session.commit()
    return ok({"tier_id": str(tier.id)}, status=201)


@admin_bp.patch("/memberships/tiers/<uuid:tier_id>")
@require_role(UserRoleType.ADMIN, UserRoleType.STAFF)
def update_membership_tier(tier_id):
    payload, err = get_json(request)
    if err:
        return err
    tier = db.session.get(MembershipTier, tier_id)
    if not tier:
        return error("NOT_FOUND", "Tier not found", status=404)
    for field in ["name", "description", "eligibility", "discount_percent", "fee_rules", "is_active"]:
        if field in payload:
            setattr(tier, field, payload[field])
    db.session.commit()
    return ok({"tier_id": str(tier.id)})
