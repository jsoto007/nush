from flask import Blueprint, request

from ..auth_helpers import get_current_user
from ..extensions import db
from ..models import (
    Cart,
    CartItem,
    CartItemOption,
    MenuItem,
    MenuItemOption,
    MenuItemOptionGroup,
    OrderType,
    Promotion,
    Restaurant,
    RestaurantStatus,
)
from ..services.cart_totals import apply_promo, compute_cart_totals
from .guest_cart import read_guest_cart_id, write_guest_cart_id
from .response import error, ok
from .serializers import cart_summary
from .validators import get_json, parse_enum, parse_int, parse_uuid


carts_bp = Blueprint("carts", __name__, url_prefix="/cart")


def merge_guest_cart_into_user(guest_cart_id, user_id):
    """
    Merges a guest cart into a user's cart(s).
    If the user already has a cart for the same restaurant, items are merged.
    Otherwise, the guest cart is assigned to the user.
    """
    guest_cart = db.session.get(Cart, guest_cart_id)
    if not guest_cart or guest_cart.customer_id is not None:
        return

    # Find if user already has a cart for this restaurant
    user_cart = (
        db.session.query(Cart)
        .filter_by(customer_id=user_id, restaurant_id=guest_cart.restaurant_id)
        .first()
    )

    if not user_cart:
        # Simple case: Just assign the guest cart to the user
        guest_cart.customer_id = user_id
        db.session.commit()
        return

    # Complex case: Merge items from guest_cart into user_cart
    for g_item in guest_cart.items:
        # Try to find matching item in user cart
        # Match by menu_item_id and options
        match = None
        for u_item in user_cart.items:
            if u_item.menu_item_id == g_item.menu_item_id:
                # Check options
                g_options = {(o.option_id, o.option_group_id) for o in g_item.options}
                u_options = {(o.option_id, o.option_group_id) for o in u_item.options}
                if g_options == u_options:
                    match = u_item
                    break

        if match:
            # Update quantity (guest cart takes priority as per requirements "keep most recent")
            # Or just use guest quantity. Let's use guest quantity.
            match.quantity = g_item.quantity
            match.notes = g_item.notes
        else:
            # Create new item in user cart
            new_item = CartItem(
                cart_id=user_cart.id,
                menu_item_id=g_item.menu_item_id,
                name_snapshot=g_item.name_snapshot,
                base_price_cents=g_item.base_price_cents,
                quantity=g_item.quantity,
                notes=g_item.notes,
            )
            db.session.add(new_item)
            for g_opt in g_item.options:
                new_opt = CartItemOption(
                    cart_item=new_item,
                    option_id=g_opt.option_id,
                    option_group_id=g_opt.option_group_id,
                    name_snapshot=g_opt.name_snapshot,
                    price_delta_cents=g_opt.price_delta_cents,
                )
                db.session.add(new_opt)

    # Delete guest cart after merging
    db.session.delete(guest_cart)
    # Recalculate user cart totals
    compute_cart_totals(user_cart)
    db.session.commit()


def _get_cart_for_user_or_guest(restaurant_id):
    user = get_current_user()
    if user:
        return (
            db.session.query(Cart)
            .filter_by(customer_id=user.id, restaurant_id=restaurant_id)
            .first()
        )
    guest_cart_id = read_guest_cart_id()
    if guest_cart_id:
        return db.session.query(Cart).filter_by(id=guest_cart_id).first()
    return None


def _authorize_cart(cart):
    user = get_current_user()
    if user:
        if cart.customer_id and cart.customer_id != user.id:
            return error("FORBIDDEN", "Cart access denied", status=403)
        if cart.customer_id is None:
            cart.customer_id = user.id
            db.session.commit()
        return None
    guest_cart_id = read_guest_cart_id()
    if cart.customer_id:
        return error("FORBIDDEN", "Cart access denied", status=403)
    if not guest_cart_id or str(cart.id) != str(guest_cart_id):
        return error("FORBIDDEN", "Cart access denied", status=403)
    return None


@carts_bp.get("/current")
def get_current_cart():
    restaurant_id_raw = request.args.get("restaurant_id")
    user = get_current_user()

    if restaurant_id_raw:
        restaurant_id, err = parse_uuid(restaurant_id_raw, "restaurant_id")
        if err:
            return err
        restaurant = db.session.get(Restaurant, restaurant_id)
        if not restaurant:
            return error("NOT_FOUND", "Restaurant not found", status=404)
        if restaurant.status != RestaurantStatus.ACTIVE:
            return error("VALIDATION_ERROR", "Restaurant is not active", {"restaurant": "inactive"})
        cart = _get_cart_for_user_or_guest(restaurant_id)
    else:
        # If no restaurant_id, get the most recently updated cart for the user or guest
        if user:
            cart = (
                db.session.query(Cart)
                .filter_by(customer_id=user.id)
                .order_by(Cart.updated_at.desc())
                .first()
            )
        else:
            guest_cart_id = read_guest_cart_id()
            if guest_cart_id:
                cart = db.session.query(Cart).filter_by(id=guest_cart_id).first()
            else:
                cart = None

    if not cart:
        return ok({"cart": None})

    totals = compute_cart_totals(cart)
    return ok({"cart": cart_summary(cart, totals)})



@carts_bp.post("")
def create_cart():
    payload, err = get_json(request)
    if err:
        return err
    restaurant_id, err = parse_uuid(payload.get("restaurant_id"), "restaurant_id")
    if err:
        return err
    order_type, err = parse_enum(payload.get("order_type"), OrderType, "order_type")
    if err:
        return err

    cart = _get_cart_for_user_or_guest(restaurant_id)
    if cart:
        return ok({"cart": cart_summary(cart, compute_cart_totals(cart))})

    user = get_current_user()
    cart = Cart(
        customer_id=user.id if user else None,
        restaurant_id=restaurant_id,
        order_type=order_type,
    )
    db.session.add(cart)
    db.session.commit()
    response, status = ok({"cart": cart_summary(cart, compute_cart_totals(cart))}, status=201)
    if not user:
        response = write_guest_cart_id(response, str(cart.id))
    return response, status


@carts_bp.post("/items")
def add_item():
    payload, err = get_json(request)
    if err:
        return err

    cart_id, err = parse_uuid(payload.get("cart_id"), "cart_id")
    if err:
        return err
    cart = db.session.get(Cart, cart_id)
    if not cart:
        return error("NOT_FOUND", "Cart not found", status=404)
    auth_err = _authorize_cart(cart)
    if auth_err:
        return auth_err

    menu_item_id, err = parse_uuid(payload.get("menu_item_id"), "menu_item_id")
    if err:
        return err
    quantity, err = parse_int(payload.get("quantity", 1), "quantity", minimum=1)
    if err:
        return err
    menu_item = db.session.get(MenuItem, menu_item_id)
    if not menu_item or not menu_item.is_active or menu_item.restaurant_id != cart.restaurant_id:
        return error("VALIDATION_ERROR", "Menu item unavailable", {"menu_item_id": "invalid"})

    is_delivery = cart.order_type == OrderType.DELIVERY
    base_price = (
        menu_item.price_delivery_cents
        if is_delivery and menu_item.price_delivery_cents is not None
        else menu_item.price_pickup_cents or menu_item.base_price_cents
    )
    cart_item = CartItem(
        cart_id=cart.id,
        menu_item_id=menu_item.id,
        name_snapshot=menu_item.name,
        base_price_cents=base_price,
        quantity=quantity,
        notes=payload.get("notes"),
    )
    db.session.add(cart_item)

    options_payload = payload.get("options") or []
    for option in options_payload:
        option_id, err = parse_uuid(option.get("option_id"), "option_id")
        if err:
            return err
        option_group_id, err = parse_uuid(option.get("option_group_id"), "option_group_id")
        if err:
            return err
        option_model = db.session.get(MenuItemOption, option_id)
        group_model = db.session.get(MenuItemOptionGroup, option_group_id)
        if not option_model or not group_model or option_model.option_group_id != group_model.id:
            return error("VALIDATION_ERROR", "Invalid option selection", {"options": "invalid"})
        if group_model.menu_item_id != menu_item.id:
            return error("VALIDATION_ERROR", "Option does not belong to menu item", {"options": "invalid"})
        cart_option = CartItemOption(
            cart_item=cart_item,
            option_id=option_model.id,
            option_group_id=group_model.id,
            name_snapshot=option_model.name,
            price_delta_cents=option_model.price_delta_cents,
        )
        db.session.add(cart_option)

    db.session.commit()
    totals = compute_cart_totals(cart)
    return ok({"cart": cart_summary(cart, totals)}, status=201)


@carts_bp.patch("/items/<uuid:item_id>")
def update_item(item_id):
    payload, err = get_json(request)
    if err:
        return err
    item = db.session.get(CartItem, item_id)
    if not item:
        return error("NOT_FOUND", "Cart item not found", status=404)
    cart = item.cart
    auth_err = _authorize_cart(cart)
    if auth_err:
        return auth_err

    if "quantity" in payload:
        quantity, err = parse_int(payload.get("quantity"), "quantity", minimum=1)
        if err:
            return err
        item.quantity = quantity
    if "notes" in payload:
        item.notes = payload.get("notes")

    if "options" in payload:
        item.options.clear()
        options_payload = payload.get("options") or []
        for option in options_payload:
            option_id, err = parse_uuid(option.get("option_id"), "option_id")
            if err:
                return err
            option_group_id, err = parse_uuid(option.get("option_group_id"), "option_group_id")
            if err:
                return err
            option_model = db.session.get(MenuItemOption, option_id)
            group_model = db.session.get(MenuItemOptionGroup, option_group_id)
            if not option_model or not group_model or option_model.option_group_id != group_model.id:
                return error("VALIDATION_ERROR", "Invalid option selection", {"options": "invalid"})
            if group_model.menu_item_id != item.menu_item_id:
                return error("VALIDATION_ERROR", "Option does not belong to menu item", {"options": "invalid"})
            cart_option = CartItemOption(
                cart_item=item,
                option_id=option_model.id,
                option_group_id=group_model.id,
                name_snapshot=option_model.name,
                price_delta_cents=option_model.price_delta_cents,
            )
            db.session.add(cart_option)

    db.session.commit()
    totals = compute_cart_totals(cart)
    return ok({"cart": cart_summary(cart, totals)})


@carts_bp.delete("/items/<uuid:item_id>")
def delete_item(item_id):
    item = db.session.get(CartItem, item_id)
    if not item:
        return error("NOT_FOUND", "Cart item not found", status=404)
    cart = item.cart
    auth_err = _authorize_cart(cart)
    if auth_err:
        return auth_err
    db.session.delete(item)
    db.session.commit()
    totals = compute_cart_totals(cart)
    return ok({"cart": cart_summary(cart, totals)})


@carts_bp.post("/apply-promo")
def apply_promo_code():
    payload, err = get_json(request)
    if err:
        return err
    code = payload.get("code")
    cart_id, err = parse_uuid(payload.get("cart_id"), "cart_id")
    if err:
        return err

    cart = db.session.get(Cart, cart_id)
    if not cart:
        return error("NOT_FOUND", "Cart not found", status=404)
    auth_err = _authorize_cart(cart)
    if auth_err:
        return auth_err

    promo = (
        db.session.query(Promotion)
        .filter(Promotion.code_normalized == (code or "").strip().lower())
        .first()
    )
    if not promo:
        return error("NOT_FOUND", "Promotion not found", status=404)

    discount_cents = apply_promo(cart, promo)
    if discount_cents <= 0:
        return error("VALIDATION_ERROR", "Promotion not applicable", {"code": "invalid"})
    cart.promo_id = promo.id
    cart.discount_cents = discount_cents
    totals = compute_cart_totals(cart)
    cart.subtotal_cents = totals["subtotal_cents"]
    cart.tax_cents = totals["tax_cents"]
    cart.fee_cents = totals["fee_cents"]
    cart.total_cents = totals["total_cents"]
    db.session.commit()
    return ok({"cart": cart_summary(cart, totals), "discount_cents": discount_cents})


@carts_bp.post("/clear")
def clear_cart():
    payload, err = get_json(request)
    if err:
        return err
    cart_id, err = parse_uuid(payload.get("cart_id"), "cart_id")
    if err:
        return err
    cart = db.session.get(Cart, cart_id)
    if not cart:
        return error("NOT_FOUND", "Cart not found", status=404)
    auth_err = _authorize_cart(cart)
    if auth_err:
        return auth_err
    cart.items.clear()
    cart.promo_id = None
    cart.discount_cents = 0
    cart.subtotal_cents = 0
    cart.tax_cents = 0
    cart.fee_cents = 0
    cart.total_cents = 0
    db.session.commit()
    return ok({"cart": cart_summary(cart, compute_cart_totals(cart))})
