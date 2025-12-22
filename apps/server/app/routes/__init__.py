from flask import Blueprint

from .admin import admin_bp
from .auth import auth_bp
from .carts import carts_bp
from .memberships import memberships_bp
from .menus import menus_bp
from .orders import orders_bp
from .payments import payments_bp, receipts_bp
from .promotions import promotions_bp
from .restaurant_admin import restaurant_admin_bp
from .restaurants import restaurants_bp
from .me import me_bp


api_bp = Blueprint("api", __name__)
api_bp.register_blueprint(auth_bp)
api_bp.register_blueprint(restaurants_bp)
api_bp.register_blueprint(menus_bp)
api_bp.register_blueprint(carts_bp)
api_bp.register_blueprint(orders_bp)
api_bp.register_blueprint(promotions_bp)
api_bp.register_blueprint(memberships_bp)
api_bp.register_blueprint(payments_bp)
api_bp.register_blueprint(receipts_bp)
api_bp.register_blueprint(admin_bp)
api_bp.register_blueprint(restaurant_admin_bp)
api_bp.register_blueprint(me_bp)


@api_bp.get("/health")
def api_health():
    return {"status": "ok"}


def register_api_blueprints(app):
    app.register_blueprint(api_bp, url_prefix="/api", name="api")
    app.register_blueprint(api_bp, url_prefix="/api/v1", name="api_v1")
