from functools import wraps

from flask import g, session

from .extensions import db
from .models import Restaurant, RestaurantStaffRole, RestaurantStaffUser, User, UserRoleType
from .routes.response import error


def get_current_user():
    if hasattr(g, "current_user"):
        return g.current_user
    user_id = session.get("user_id")
    if not user_id:
        g.current_user = None
        return None
    user = db.session.get(User, user_id)
    g.current_user = user
    return user


def login_user(user):
    session["user_id"] = str(user.id)


def logout_user():
    session.pop("user_id", None)


def require_auth(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        user = get_current_user()
        if not user:
            return error("AUTH_REQUIRED", "Authentication required", status=401)
        if not user.is_active:
            return error("FORBIDDEN", "User is inactive", status=403)
        return func(*args, **kwargs)

    return wrapper


def require_role(*roles):
    role_values = {role.value if isinstance(role, UserRoleType) else role for role in roles}

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            user = get_current_user()
            if not user:
                return error("AUTH_REQUIRED", "Authentication required", status=401)
            if user.role.value not in role_values:
                return error("FORBIDDEN", "Insufficient role", status=403)
            return func(*args, **kwargs)

        return wrapper

    return decorator


def _staff_role_rank(role: RestaurantStaffRole) -> int:
    order = {
        RestaurantStaffRole.VIEWER: 0,
        RestaurantStaffRole.MENU_EDITOR: 1,
        RestaurantStaffRole.MANAGER: 2,
        RestaurantStaffRole.OWNER: 3,
    }
    return order.get(role, 0)


def require_restaurant_access(restaurant_id_arg: str, min_staff_role: RestaurantStaffRole):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            user = get_current_user()
            if not user:
                return error("AUTH_REQUIRED", "Authentication required", status=401)
            if user.role == UserRoleType.ADMIN:
                return func(*args, **kwargs)

            restaurant_id = kwargs.get(restaurant_id_arg)
            if not restaurant_id:
                return error("VALIDATION_ERROR", "restaurant_id is required", status=400)

            restaurant = db.session.get(Restaurant, restaurant_id)
            if not restaurant:
                return error("NOT_FOUND", "Restaurant not found", status=404)
            if restaurant.owner_id == user.id:
                return func(*args, **kwargs)

            staff = (
                db.session.query(RestaurantStaffUser)
                .filter_by(restaurant_id=restaurant.id, user_id=user.id, is_active=True)
                .first()
            )
            if not staff:
                return error("FORBIDDEN", "Restaurant access required", status=403)
            if _staff_role_rank(staff.role) < _staff_role_rank(min_staff_role):
                return error("FORBIDDEN", "Insufficient restaurant role", status=403)
            return func(*args, **kwargs)

        return wrapper

    return decorator


def has_restaurant_access(user, restaurant_id, min_staff_role: RestaurantStaffRole) -> bool:
    if not user:
        return False
    if user.role == UserRoleType.ADMIN:
        return True
    restaurant = db.session.get(Restaurant, restaurant_id)
    if not restaurant:
        return False
    if restaurant.owner_id == user.id:
        return True
    staff = (
        db.session.query(RestaurantStaffUser)
        .filter_by(restaurant_id=restaurant.id, user_id=user.id, is_active=True)
        .first()
    )
    if not staff:
        return False
    return _staff_role_rank(staff.role) >= _staff_role_rank(min_staff_role)
