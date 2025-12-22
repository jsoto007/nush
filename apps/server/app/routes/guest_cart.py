from flask import current_app, request
from itsdangerous import BadSignature, URLSafeSerializer


def _serializer():
    return URLSafeSerializer(current_app.config["SECRET_KEY"], salt="guest-cart")


def read_guest_cart_id():
    cookie_name = current_app.config["GUEST_CART_COOKIE_NAME"]
    raw = request.cookies.get(cookie_name)
    if not raw:
        return None
    serializer = _serializer()
    try:
        return serializer.loads(raw)
    except BadSignature:
        return None


def write_guest_cart_id(response, cart_id: str):
    cookie_name = current_app.config["GUEST_CART_COOKIE_NAME"]
    serializer = _serializer()
    signed = serializer.dumps(cart_id)
    response.set_cookie(
        cookie_name,
        signed,
        httponly=True,
        samesite=current_app.config.get("SESSION_COOKIE_SAMESITE", "Lax"),
        secure=current_app.config.get("SESSION_COOKIE_SECURE", False),
    )
    return response
