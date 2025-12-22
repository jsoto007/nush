from datetime import datetime, timezone
import secrets

from flask import Blueprint, current_app, request, session

from ..auth_helpers import get_current_user, has_restaurant_access, require_auth
from ..extensions import db
from ..models import (
    Cart,
    Order,
    OrderItem,
    OrderItemOption,
    OrderRestaurantAllocation,
    OrderStatus,
    OrderStatusHistory,
    OrderType,
    PickupSchedule,
    RestaurantStaffRole,
    Promotion,
    PromotionRedemption,
    PromotionRedemptionStatus,
    PaymentIntentRecord,
    PaymentIntentStatus,
    OrderReceipt,
    ChargeStatus,
)
from ..services.cart_totals import apply_promo, compute_cart_totals
from ..services.stripe_client import create_payment_intent
from .guest_cart import read_guest_cart_id
from .response import error, ok
from .serializers import order_summary
from .validators import get_json, parse_enum, parse_pagination, parse_uuid


orders_bp = Blueprint("orders", __name__, url_prefix="")


def _load_cart_for_user(cart_id, user):
    cart = db.session.get(Cart, cart_id)
    if not cart:
        return None, error("NOT_FOUND", "Cart not found", status=404)
    if cart.order_type != OrderType.PICKUP:
        return None, error("VALIDATION_ERROR", "Only pickup is supported", {"order_type": "pickup_only"})
    if cart.restaurant and cart.restaurant.status.value != "active":
        return None, error("VALIDATION_ERROR", "Restaurant is not active", {"restaurant": "inactive"})
    if cart.customer_id and cart.customer_id != user.id:
        return None, error("FORBIDDEN", "Cart access denied", status=403)
    if cart.customer_id is None:
        guest_cart_id = read_guest_cart_id()
        if not guest_cart_id or str(cart.id) != str(guest_cart_id):
            return None, error("FORBIDDEN", "Cart access denied", status=403)
        cart.customer_id = user.id
        db.session.commit()
    return cart, None


@orders_bp.post("/checkout/validate")
@require_auth
def checkout_validate():
    payload, err = get_json(request)
    if err:
        return err
    cart_id, err = parse_uuid(payload.get("cart_id"), "cart_id")
    if err:
        return err
    cart, err = _load_cart_for_user(cart_id, get_current_user())
    if err:
        return err
    if not cart.items:
        return error("VALIDATION_ERROR", "Cart is empty", {"cart_id": "empty"})
    totals = compute_cart_totals(cart)
    return ok({"totals": totals})


@orders_bp.post("/checkout/create-intent")
@require_auth
def checkout_create_intent():
    payload, err = get_json(request)
    if err:
        return err
    cart_id, err = parse_uuid(payload.get("cart_id"), "cart_id")
    if err:
        return err
    user = get_current_user()
    cart, err = _load_cart_for_user(cart_id, user)
    if err:
        return err
    if not cart.items:
        return error("VALIDATION_ERROR", "Cart is empty", {"cart_id": "empty"})

    totals = compute_cart_totals(cart)
    order = Order(
        customer_id=user.id,
        restaurant_id=cart.restaurant_id,
        order_type=OrderType.PICKUP,
        status=OrderStatus.CREATED,
        subtotal_cents=totals["subtotal_cents"],
        tax_cents=totals["tax_cents"],
        fee_cents=totals["fee_cents"],
        discount_cents=totals["discount_cents"],
        total_cents=totals["total_cents"],
        promo_id=cart.promo_id,
        membership_id=cart.membership_id,
    )
    db.session.add(order)
    db.session.flush()

    for cart_item in cart.items:
        order_item = OrderItem(
            order_id=order.id,
            menu_item_id=cart_item.menu_item_id,
            name_snapshot=cart_item.name_snapshot,
            base_price_cents=cart_item.base_price_cents,
            quantity=cart_item.quantity,
            total_price_cents=(cart_item.base_price_cents + sum(o.price_delta_cents for o in cart_item.options))
            * cart_item.quantity,
            notes=cart_item.notes,
        )
        db.session.add(order_item)
        db.session.flush()
        for option in cart_item.options:
            order_option = OrderItemOption(
                order_item_id=order_item.id,
                option_id=option.option_id,
                option_group_id=option.option_group_id,
                name_snapshot=option.name_snapshot,
                price_delta_cents=option.price_delta_cents,
            )
            db.session.add(order_option)

    allocation = OrderRestaurantAllocation(
        order_id=order.id,
        restaurant_id=order.restaurant_id,
        subtotal_cents=totals["subtotal_cents"],
        tax_cents=totals["tax_cents"],
        fee_cents=totals["fee_cents"],
        payout_cents=totals["total_cents"],
    )
    db.session.add(allocation)

    stripe_id = f"pi_mock_{secrets.token_hex(8)}"
    client_secret = f"{stripe_id}_secret_{secrets.token_hex(8)}"
    if not current_app.config.get("PAYMENTS_MOCK_MODE", True):
        intent = create_payment_intent(
            totals["total_cents"],
            "USD",
            metadata={"order_id": str(order.id), "restaurant_id": str(order.restaurant_id)},
        )
        if intent:
            stripe_id = intent.id
            client_secret = intent.client_secret
    intent = PaymentIntentRecord(
        stripe_payment_intent_id=stripe_id,
        order_id=order.id,
        restaurant_id=order.restaurant_id,
        amount_cents=totals["total_cents"],
        currency="USD",
        status=PaymentIntentStatus.REQUIRES_CONFIRMATION,
        client_secret=client_secret,
    )
    db.session.add(intent)
    db.session.commit()
    session["pending_order_id"] = str(order.id)
    return ok({"client_secret": intent.client_secret, "order_id": str(order.id)})


@orders_bp.post("/checkout/confirm")
@require_auth
def checkout_confirm():
    payload, err = get_json(request)
    if err:
        return err
    cart_id, err = parse_uuid(payload.get("cart_id"), "cart_id")
    if err:
        return err
    user = get_current_user()
    cart, err = _load_cart_for_user(cart_id, user)
    if err:
        return err
    if not cart.items:
        return error("VALIDATION_ERROR", "Cart is empty", {"cart_id": "empty"})

    totals = compute_cart_totals(cart)
    order_id = session.pop("pending_order_id", None)
    order = db.session.get(Order, order_id) if order_id else None
    if not order:
        order = Order(
            customer_id=user.id,
            restaurant_id=cart.restaurant_id,
            order_type=OrderType.PICKUP,
            status=OrderStatus.CONFIRMED,
            subtotal_cents=totals["subtotal_cents"],
            tax_cents=totals["tax_cents"],
            fee_cents=totals["fee_cents"],
            discount_cents=totals["discount_cents"],
            total_cents=totals["total_cents"],
            promo_id=cart.promo_id,
            membership_id=cart.membership_id,
        )
        db.session.add(order)
        db.session.flush()
    else:
        order.status = OrderStatus.CONFIRMED
        order.subtotal_cents = totals["subtotal_cents"]
        order.tax_cents = totals["tax_cents"]
        order.fee_cents = totals["fee_cents"]
        order.discount_cents = totals["discount_cents"]
        order.total_cents = totals["total_cents"]

    order.placed_at = datetime.now(tz=timezone.utc)

    order.items.clear()
    for cart_item in cart.items:
        order_item = OrderItem(
            order_id=order.id,
            menu_item_id=cart_item.menu_item_id,
            name_snapshot=cart_item.name_snapshot,
            base_price_cents=cart_item.base_price_cents,
            quantity=cart_item.quantity,
            total_price_cents=(cart_item.base_price_cents + sum(o.price_delta_cents for o in cart_item.options))
            * cart_item.quantity,
            notes=cart_item.notes,
        )
        db.session.add(order_item)
        db.session.flush()
        for option in cart_item.options:
            order_option = OrderItemOption(
                order_item_id=order_item.id,
                option_id=option.option_id,
                option_group_id=option.option_group_id,
                name_snapshot=option.name_snapshot,
                price_delta_cents=option.price_delta_cents,
            )
            db.session.add(order_option)

    db.session.add(
        OrderStatusHistory(
            order_id=order.id,
            from_status=OrderStatus.CREATED,
            to_status=OrderStatus.CONFIRMED,
            actor_id=user.id,
            note="Order confirmed",
        )
    )

    allocation = (
        db.session.query(OrderRestaurantAllocation)
        .filter_by(order_id=order.id, restaurant_id=order.restaurant_id)
        .first()
    )
    if not allocation:
        allocation = OrderRestaurantAllocation(
            order_id=order.id,
            restaurant_id=order.restaurant_id,
            subtotal_cents=totals["subtotal_cents"],
            tax_cents=totals["tax_cents"],
            fee_cents=totals["fee_cents"],
            payout_cents=totals["total_cents"],
        )
        db.session.add(allocation)
    else:
        allocation.subtotal_cents = totals["subtotal_cents"]
        allocation.tax_cents = totals["tax_cents"]
        allocation.fee_cents = totals["fee_cents"]
        allocation.payout_cents = totals["total_cents"]

    pickup_window = payload.get("pickup_window") or {}
    start = pickup_window.get("start")
    end = pickup_window.get("end")
    now = datetime.now(tz=timezone.utc)
    try:
        start_dt = datetime.fromisoformat(start) if start else now
        end_dt = datetime.fromisoformat(end) if end else now
    except ValueError:
        return error("VALIDATION_ERROR", "pickup_window must be ISO-8601 datetimes", {"pickup_window": "invalid"})
    if end_dt < start_dt:
        return error("VALIDATION_ERROR", "pickup_window end must be after start", {"pickup_window": "invalid"})
    if order.pickup_schedule:
        order.pickup_schedule.requested_start = start_dt
        order.pickup_schedule.requested_end = end_dt
    else:
        schedule = PickupSchedule(
            order_id=order.id,
            requested_start=start_dt,
            requested_end=end_dt,
            pickup_code=secrets.token_hex(3),
        )
        db.session.add(schedule)

    if cart.promo_id:
        promo = db.session.get(Promotion, cart.promo_id)
        if promo:
            discount = apply_promo(cart, promo)
            db.session.add(
                PromotionRedemption(
                    promotion_id=promo.id,
                    customer_id=user.id,
                    order_id=order.id,
                    discount_cents=discount,
                    status=PromotionRedemptionStatus.APPLIED,
                    redeemed_at=datetime.now(tz=timezone.utc),
                )
            )

    intent = (
        db.session.query(PaymentIntentRecord)
        .filter_by(order_id=order.id)
        .order_by(PaymentIntentRecord.created_at.desc())
        .first()
    )
    if intent and not order.receipt:
        receipt = OrderReceipt(
            order_id=order.id,
            customer_id=user.id,
            payment_intent_id=intent.id,
            amount_cents=order.total_cents,
            currency=order.currency,
            status=ChargeStatus.PENDING,
            provider="mock",
        )
        db.session.add(receipt)

    cart.items.clear()
    cart.promo_id = None
    cart.discount_cents = 0
    cart.subtotal_cents = 0
    cart.tax_cents = 0
    cart.fee_cents = 0
    cart.total_cents = 0

    db.session.commit()
    return ok({"order": order_summary(order)})


@orders_bp.get("/orders")
@require_auth
def list_orders():
    user = get_current_user()
    query = db.session.query(Order).filter_by(customer_id=user.id)
    status = request.args.get("status")
    if status:
        try:
            query = query.filter_by(status=OrderStatus(status))
        except ValueError:
            return error("VALIDATION_ERROR", "Invalid status", {"status": "invalid"})
    limit, offset, err = parse_pagination(request.args)
    if err:
        return err
    orders = query.order_by(Order.created_at.desc()).limit(limit).offset(offset).all()
    return ok({"orders": [order_summary(order) for order in orders], "limit": limit, "offset": offset})


@orders_bp.get("/orders/<uuid:order_id>")
@require_auth
def get_order(order_id):
    user = get_current_user()
    order = db.session.get(Order, order_id)
    if not order:
        return error("NOT_FOUND", "Order not found", status=404)
    if order.customer_id != user.id and not has_restaurant_access(
        user, order.restaurant_id, RestaurantStaffRole.VIEWER
    ):
        return error("FORBIDDEN", "Order access denied", status=403)
    return ok({"order": order_summary(order)})


@orders_bp.post("/orders/<uuid:order_id>/cancel")
@require_auth
def cancel_order(order_id):
    user = get_current_user()
    order = db.session.get(Order, order_id)
    if not order:
        return error("NOT_FOUND", "Order not found", status=404)
    if order.customer_id != user.id:
        return error("FORBIDDEN", "Order access denied", status=403)
    if order.status not in {OrderStatus.CREATED, OrderStatus.CONFIRMED}:
        return error("VALIDATION_ERROR", "Order cannot be cancelled", {"status": "invalid"})
    previous_status = order.status
    order.status = OrderStatus.CANCELLED
    db.session.add(
        OrderStatusHistory(
            order_id=order.id,
            from_status=previous_status,
            to_status=OrderStatus.CANCELLED,
            actor_id=user.id,
            note="Customer cancelled",
        )
    )
    db.session.commit()
    return ok({"order": order_summary(order)})


@orders_bp.post("/restaurant-admin/orders/<uuid:order_id>/status")
@require_auth
def update_order_status(order_id):
    payload, err = get_json(request)
    if err:
        return err
    to_status, err = parse_enum(payload.get("status"), OrderStatus, "status")
    if err:
        return err
    order = db.session.get(Order, order_id)
    if not order:
        return error("NOT_FOUND", "Order not found", status=404)

    if not has_restaurant_access(get_current_user(), order.restaurant_id, RestaurantStaffRole.MANAGER):
        return error("FORBIDDEN", "Restaurant access required", status=403)

    valid_transitions = {
        OrderStatus.CONFIRMED: {OrderStatus.PREPARING},
        OrderStatus.PREPARING: {OrderStatus.READY},
        OrderStatus.READY: {OrderStatus.COMPLETED},
    }
    allowed = valid_transitions.get(order.status, set())
    if to_status not in allowed:
        return error("VALIDATION_ERROR", "Invalid status transition", {"status": "invalid"})
    db.session.add(
        OrderStatusHistory(
            order_id=order.id,
            from_status=order.status,
            to_status=to_status,
            actor_id=get_current_user().id,
            note="Restaurant update",
        )
    )
    order.status = to_status
    db.session.commit()
    return ok({"order": order_summary(order)})
