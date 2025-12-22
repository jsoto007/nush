from flask import Blueprint, request

from ..auth_helpers import get_current_user, require_auth, require_restaurant_access
from ..extensions import db
from ..model_helpers import normalize_lower
from ..models import (
    Menu,
    MenuCategory,
    MenuItem,
    MenuItemOption,
    MenuItemOptionGroup,
    OrderTypeConfiguration,
    Restaurant,
    RestaurantConfiguration,
    RestaurantStaffRole,
    RestaurantStaffUser,
    RestaurantStatus,
    User,
)
from .response import error, ok
from .serializers import menu_category_summary, menu_item_summary, menu_summary, restaurant_summary
from .validators import get_json


restaurant_admin_bp = Blueprint("restaurant_admin", __name__, url_prefix="/restaurant-admin")


@restaurant_admin_bp.get("/restaurants")
@require_auth
def list_managed_restaurants():
    user = get_current_user()
    if user.role.value == "admin":
        restaurants = db.session.query(Restaurant).all()
    else:
        owned = db.session.query(Restaurant).filter_by(owner_id=user.id)
        staff_restaurant_ids = [
            staff.restaurant_id for staff in db.session.query(RestaurantStaffUser).filter_by(user_id=user.id).all()
        ]
        restaurants = owned.union(db.session.query(Restaurant).filter(Restaurant.id.in_(staff_restaurant_ids))).all()
    return ok({"restaurants": [restaurant_summary(r) for r in restaurants]})


@restaurant_admin_bp.post("/restaurants")
@require_auth
def create_restaurant():
    payload, err = get_json(request)
    if err:
        return err
    user = get_current_user()
    name = payload.get("name")
    if not name:
        return error("VALIDATION_ERROR", "name is required", {"name": "required"})
    status_value = payload.get("status", RestaurantStatus.INACTIVE.value)
    try:
        status = RestaurantStatus(status_value)
    except ValueError:
        return error("VALIDATION_ERROR", "Invalid status", {"status": "invalid"})
    restaurant = Restaurant(
        name=name,
        phone=payload.get("phone"),
        email=payload.get("email"),
        status=status,
        cuisines=payload.get("cuisines") or [],
        owner_id=user.id,
    )
    db.session.add(restaurant)
    db.session.flush()
    db.session.add(RestaurantConfiguration(restaurant_id=restaurant.id))
    db.session.add(OrderTypeConfiguration(restaurant_id=restaurant.id))
    db.session.commit()
    return ok({"restaurant": restaurant_summary(restaurant)}, status=201)


@restaurant_admin_bp.patch("/restaurants/<uuid:restaurant_id>")
@require_auth
def update_restaurant(restaurant_id):
    access = require_restaurant_access("restaurant_id", RestaurantStaffRole.MANAGER)

    @access
    def _update(restaurant_id):
        payload, err = get_json(request)
        if err:
            return err
        restaurant = db.session.get(Restaurant, restaurant_id)
        if not restaurant:
            return error("NOT_FOUND", "Restaurant not found", status=404)
        for field in ["name", "phone", "email", "status", "cuisines"]:
            if field in payload:
                setattr(restaurant, field, payload[field])
        db.session.commit()
        return ok({"restaurant": restaurant_summary(restaurant)})

    return _update(restaurant_id=restaurant_id)


@restaurant_admin_bp.post("/restaurants/<uuid:restaurant_id>/staff")
@require_auth
def add_staff(restaurant_id):
    access = require_restaurant_access("restaurant_id", RestaurantStaffRole.OWNER)

    @access
    def _add(restaurant_id):
        payload, err = get_json(request)
        if err:
            return err
        user_email = normalize_lower(payload.get("user_email"))
        role_value = payload.get("role")
        if not user_email or not role_value:
            return error("VALIDATION_ERROR", "user_email and role are required", {"user_email": "required", "role": "required"})
        user = db.session.query(User).filter_by(email=user_email).first()
        if not user:
            return error("NOT_FOUND", "User not found", status=404)
        try:
            role = RestaurantStaffRole(role_value)
        except ValueError:
            return error("VALIDATION_ERROR", "Invalid role", {"role": "invalid"})
        staff = RestaurantStaffUser(user_id=user.id, restaurant_id=restaurant_id, role=role, is_active=True)
        db.session.add(staff)
        db.session.commit()
        return ok({"staff_id": str(staff.id)}, status=201)

    return _add(restaurant_id=restaurant_id)


@restaurant_admin_bp.post("/restaurants/<uuid:restaurant_id>/menus")
@require_auth
def create_menu(restaurant_id):
    access = require_restaurant_access("restaurant_id", RestaurantStaffRole.MENU_EDITOR)

    @access
    def _create(restaurant_id):
        payload, err = get_json(request)
        if err:
            return err
        name = payload.get("name")
        if not name:
            return error("VALIDATION_ERROR", "name is required", {"name": "required"})
        menu = Menu(restaurant_id=restaurant_id, name=name, is_active=payload.get("is_active", True))
        db.session.add(menu)
        db.session.commit()
        return ok({"menu": menu_summary(menu)}, status=201)

    return _create(restaurant_id=restaurant_id)


@restaurant_admin_bp.post("/menus/<uuid:menu_id>/categories")
@require_auth
def create_category(menu_id):
    payload, err = get_json(request)
    if err:
        return err
    menu = db.session.get(Menu, menu_id)
    if not menu:
        return error("NOT_FOUND", "Menu not found", status=404)
    access = require_restaurant_access("restaurant_id", RestaurantStaffRole.MENU_EDITOR)

    @access
    def _create(restaurant_id):
        name = payload.get("name")
        if not name:
            return error("VALIDATION_ERROR", "name is required", {"name": "required"})
        category = MenuCategory(
            restaurant_id=menu.restaurant_id,
            menu_id=menu.id,
            name=name,
            sort_order=payload.get("sort_order", 0),
            is_active=payload.get("is_active", True),
        )
        db.session.add(category)
        db.session.commit()
        return ok({"category": menu_category_summary(category)}, status=201)

    return _create(restaurant_id=menu.restaurant_id)


@restaurant_admin_bp.post("/menus/<uuid:menu_id>/items")
@require_auth
def create_item(menu_id):
    payload, err = get_json(request)
    if err:
        return err
    menu = db.session.get(Menu, menu_id)
    if not menu:
        return error("NOT_FOUND", "Menu not found", status=404)
    access = require_restaurant_access("restaurant_id", RestaurantStaffRole.MENU_EDITOR)

    @access
    def _create(restaurant_id):
        name = payload.get("name")
        base_price_cents = payload.get("base_price_cents")
        if not name or base_price_cents is None:
            return error("VALIDATION_ERROR", "name and base_price_cents are required", {"name": "required", "base_price_cents": "required"})
        category_id = payload.get("category_id")
        item = MenuItem(
            restaurant_id=menu.restaurant_id,
            menu_id=menu.id,
            category_id=category_id,
            name=name,
            description=payload.get("description"),
            base_price_cents=base_price_cents,
            price_pickup_cents=payload.get("price_pickup_cents"),
            price_delivery_cents=payload.get("price_delivery_cents"),
            tags=payload.get("tags") or [],
            is_active=payload.get("is_active", True),
            out_of_stock_until=payload.get("out_of_stock_until"),
            display_order=payload.get("display_order", 0),
        )
        db.session.add(item)
        db.session.commit()
        return ok({"item": menu_item_summary(item)}, status=201)

    return _create(restaurant_id=menu.restaurant_id)


@restaurant_admin_bp.patch("/items/<uuid:item_id>")
@require_auth
def update_item(item_id):
    payload, err = get_json(request)
    if err:
        return err
    item = db.session.get(MenuItem, item_id)
    if not item:
        return error("NOT_FOUND", "Menu item not found", status=404)
    access = require_restaurant_access("restaurant_id", RestaurantStaffRole.MENU_EDITOR)

    @access
    def _update(restaurant_id):
        for field in [
            "name",
            "description",
            "base_price_cents",
            "price_pickup_cents",
            "price_delivery_cents",
            "tags",
            "is_active",
            "out_of_stock_until",
            "display_order",
        ]:
            if field in payload:
                setattr(item, field, payload[field])
        db.session.commit()
        return ok({"item": menu_item_summary(item)})

    return _update(restaurant_id=item.restaurant_id)


@restaurant_admin_bp.post("/items/<uuid:item_id>/option-groups")
@require_auth
def create_option_group(item_id):
    payload, err = get_json(request)
    if err:
        return err
    item = db.session.get(MenuItem, item_id)
    if not item:
        return error("NOT_FOUND", "Menu item not found", status=404)
    access = require_restaurant_access("restaurant_id", RestaurantStaffRole.MENU_EDITOR)

    @access
    def _create(restaurant_id):
        if not payload.get("name"):
            return error("VALIDATION_ERROR", "name is required", {"name": "required"})
        group = MenuItemOptionGroup(
            menu_item_id=item.id,
            name=payload.get("name"),
            min_choices=payload.get("min_choices", 0),
            max_choices=payload.get("max_choices", 0),
            is_required=payload.get("is_required", False),
            is_active=payload.get("is_active", True),
        )
        db.session.add(group)
        db.session.commit()
        return ok({"option_group_id": str(group.id)}, status=201)

    return _create(restaurant_id=item.restaurant_id)


@restaurant_admin_bp.post("/option-groups/<uuid:group_id>/options")
@require_auth
def create_option(group_id):
    payload, err = get_json(request)
    if err:
        return err
    group = db.session.get(MenuItemOptionGroup, group_id)
    if not group:
        return error("NOT_FOUND", "Option group not found", status=404)
    access = require_restaurant_access("restaurant_id", RestaurantStaffRole.MENU_EDITOR)

    @access
    def _create(restaurant_id):
        if not payload.get("name"):
            return error("VALIDATION_ERROR", "name is required", {"name": "required"})
        option = MenuItemOption(
            option_group_id=group.id,
            name=payload.get("name"),
            price_delta_cents=payload.get("price_delta_cents", 0),
            is_active=payload.get("is_active", True),
        )
        db.session.add(option)
        db.session.commit()
        return ok({"option_id": str(option.id)}, status=201)

    menu_item = db.session.get(MenuItem, group.menu_item_id)
    return _create(restaurant_id=menu_item.restaurant_id)
