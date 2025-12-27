from flask import Blueprint, request

from ..extensions import db
from ..model_helpers import normalize_lower
from ..models import Cart, Promotion
from ..services.cart_totals import apply_promo
from .response import error, ok
from .validators import get_json, parse_uuid


promotions_bp = Blueprint("promotions", __name__, url_prefix="/promotions")


@promotions_bp.post("/validate")
def validate_promo():
    payload, err = get_json(request)
    if err:
        return err
    code = normalize_lower(payload.get("code"))
    if not code:
        return error("VALIDATION_ERROR", "code is required", {"code": "required"})
    promo = db.session.query(Promotion).filter_by(code_normalized=code).first()
    if not promo:
        return error("NOT_FOUND", "Promotion not found", status=404)
    cart_id = payload.get("cart_id")
    discount = 0
    if cart_id:
        cart_uuid, err = parse_uuid(cart_id, "cart_id")
        if err:
            return err
        cart = db.session.get(Cart, cart_uuid)
        if not cart:
            return error("NOT_FOUND", "Cart not found", status=404)
        discount = apply_promo(cart, promo)
    valid = discount > 0 or promo.is_active
    return ok({"valid": valid, "discount_cents": discount})


@promotions_bp.post("/test-email")
def test_marketing_email():
    from ..auth_helpers import get_current_user
    from ..services.email_service import EmailService
    user = get_current_user()
    if not user:
        return error("AUTH_REQUIRED", "Please login", status=401)
    
    EmailService.send_marketing_email(
        user, 
        "Don't miss out on these deals!", 
        "<p>We have some great new restaurants for you to try this weekend!</p>"
    )
    return ok({"message": "Test email sent."})
