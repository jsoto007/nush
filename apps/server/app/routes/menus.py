from flask import Blueprint

from ..extensions import db
from ..models import Menu
from .response import error, ok
from .serializers import menu_summary


menus_bp = Blueprint("menus", __name__, url_prefix="/menus")


@menus_bp.get("/<uuid:menu_id>")
def get_menu(menu_id):
    menu = db.session.get(Menu, menu_id)
    if not menu:
        return error("NOT_FOUND", "Menu not found", status=404)
    return ok({"menu": menu_summary(menu)})
