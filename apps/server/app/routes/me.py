from flask import Blueprint, request

from ..auth_helpers import get_current_user, require_auth
from ..extensions import db
from ..models import Restaurant, RestaurantLike
from .response import ok
from .serializers import restaurant_summary
from .validators import parse_pagination


me_bp = Blueprint("me", __name__, url_prefix="/me")


@me_bp.get("/likes")
@require_auth
def my_likes():
    user = get_current_user()
    limit, offset, err = parse_pagination(request.args)
    if err:
        return err
    restaurants = (
        db.session.query(Restaurant)
        .join(RestaurantLike, RestaurantLike.restaurant_id == Restaurant.id)
        .filter(RestaurantLike.user_id == user.id)
        .limit(limit)
        .offset(offset)
        .all()
    )
    return ok({"restaurants": [restaurant_summary(r) for r in restaurants], "limit": limit, "offset": offset})
