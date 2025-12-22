from flask import Blueprint, request
from sqlalchemy import or_

from ..auth_helpers import get_current_user, require_auth
from ..extensions import db, limiter
from ..models import Menu, Restaurant, RestaurantLike, RestaurantStatus
from .response import error, ok
from .serializers import address_summary, menu_summary, restaurant_summary
from .validators import parse_pagination


restaurants_bp = Blueprint("restaurants", __name__, url_prefix="/restaurants")


@restaurants_bp.get("")
@limiter.limit("60/minute")
def list_restaurants():
    query = db.session.query(Restaurant)

    q = (request.args.get("q") or "").strip()
    cuisine = (request.args.get("cuisine") or "").strip()
    status = request.args.get("status")
    if q:
        query = query.filter(or_(Restaurant.name.ilike(f"%{q}%"), Restaurant.email.ilike(f"%{q}%")))
    if cuisine:
        query = query.filter(Restaurant.cuisines.any(cuisine))
    if status:
        try:
            query = query.filter(Restaurant.status == RestaurantStatus(status))
        except ValueError:
            return error("VALIDATION_ERROR", "Invalid status", {"status": "invalid"})

    sort = request.args.get("sort", "created_at")
    order = request.args.get("order", "desc")
    sort_map = {"created_at": Restaurant.created_at, "name": Restaurant.name}
    if sort not in sort_map:
        return error("VALIDATION_ERROR", "Invalid sort", {"sort": "invalid"})
    sort_column = sort_map[sort]
    if order == "desc":
        sort_column = sort_column.desc()
    query = query.order_by(sort_column)

    limit, offset, err = parse_pagination(request.args)
    if err:
        return err
    results = query.limit(limit).offset(offset).all()
    return ok({"restaurants": [restaurant_summary(r) for r in results], "limit": limit, "offset": offset})


@restaurants_bp.get("/<uuid:restaurant_id>")
def get_restaurant(restaurant_id):
    restaurant = db.session.get(Restaurant, restaurant_id)
    if not restaurant:
        return error("NOT_FOUND", "Restaurant not found", status=404)
    data = restaurant_summary(restaurant)
    data["address"] = address_summary(restaurant.address)
    data["configuration"] = restaurant.configuration and {
        "prep_time_minutes": restaurant.configuration.prep_time_minutes,
        "min_order_cents": restaurant.configuration.min_order_cents,
        "fee_settings": restaurant.configuration.fee_settings,
        "tax_settings": restaurant.configuration.tax_settings,
    }
    data["order_type_configuration"] = restaurant.order_type_configuration and {
        "supports_delivery": restaurant.order_type_configuration.supports_delivery,
        "supports_pickup": restaurant.order_type_configuration.supports_pickup,
        "prep_time_delivery_minutes": restaurant.order_type_configuration.prep_time_delivery_minutes,
        "prep_time_pickup_minutes": restaurant.order_type_configuration.prep_time_pickup_minutes,
        "pickup_hours": restaurant.order_type_configuration.pickup_hours,
    }
    return ok(data)


@restaurants_bp.get("/<uuid:restaurant_id>/menu")
def get_menu(restaurant_id):
    menu = (
        db.session.query(Menu)
        .filter(Menu.restaurant_id == restaurant_id, Menu.is_active.is_(True))
        .order_by(Menu.created_at.desc())
        .first()
    )
    if not menu:
        return error("NOT_FOUND", "Active menu not found", status=404)
    return ok(menu_summary(menu))


@restaurants_bp.post("/<uuid:restaurant_id>/like")
@require_auth
def like_restaurant(restaurant_id):
    user = get_current_user()
    restaurant = db.session.get(Restaurant, restaurant_id)
    if not restaurant:
        return error("NOT_FOUND", "Restaurant not found", status=404)
    existing = (
        db.session.query(RestaurantLike)
        .filter_by(user_id=user.id, restaurant_id=restaurant.id)
        .first()
    )
    if existing:
        return ok({"liked": True})
    like = RestaurantLike(user_id=user.id, restaurant_id=restaurant.id)
    db.session.add(like)
    db.session.commit()
    return ok({"liked": True}, status=201)


@restaurants_bp.delete("/<uuid:restaurant_id>/like")
@require_auth
def unlike_restaurant(restaurant_id):
    user = get_current_user()
    like = (
        db.session.query(RestaurantLike)
        .filter_by(user_id=user.id, restaurant_id=restaurant_id)
        .first()
    )
    if like:
        db.session.delete(like)
        db.session.commit()
    return ok({"liked": False})
