from datetime import datetime, timezone

from ..models import AdjustmentType, Promotion, PromotionScope, PromotionType


def _tax_from_settings(subtotal_cents: int, tax_settings: dict) -> int:
    if not tax_settings:
        return 0
    rate = tax_settings.get("rate_percent")
    if rate is None:
        return 0
    return int(subtotal_cents * (rate / 100.0))


def _fee_from_settings(subtotal_cents: int, fee_settings: dict) -> int:
    if not fee_settings:
        return 0
    flat = fee_settings.get("flat_cents", 0)
    rate = fee_settings.get("rate_percent", 0)
    return int(flat + subtotal_cents * (rate / 100.0))


def _compute_subtotal(cart) -> int:
    subtotal_cents = 0
    for item in cart.items:
        base = item.base_price_cents or 0
        options_total = sum(option.price_delta_cents for option in item.options)
        subtotal_cents += (base + options_total) * item.quantity
    return subtotal_cents


def compute_cart_totals(cart) -> dict:
    subtotal_cents = _compute_subtotal(cart)

    restaurant = cart.restaurant
    tax_cents = _tax_from_settings(subtotal_cents, restaurant.configuration.tax_settings if restaurant else {})
    fee_cents = _fee_from_settings(subtotal_cents, restaurant.configuration.fee_settings if restaurant else {})
    discount_cents = cart.discount_cents or 0
    total_cents = max(0, subtotal_cents + tax_cents + fee_cents - discount_cents)
    return {
        "subtotal_cents": subtotal_cents,
        "tax_cents": tax_cents,
        "fee_cents": fee_cents,
        "discount_cents": discount_cents,
        "total_cents": total_cents,
    }


def apply_promo(cart, promo: Promotion) -> int:
    now = datetime.now(tz=timezone.utc)
    if not promo.is_active:
        return 0
    if promo.scope != PromotionScope.ORDER:
        return 0
    if promo.starts_at and promo.starts_at > now:
        return 0
    if promo.ends_at and promo.ends_at < now:
        return 0

    subtotal = _compute_subtotal(cart)
    if subtotal < (promo.min_order_cents or 0):
        return 0

    if promo.type == PromotionType.PERCENT:
        percent = promo.rules.get("percent", 0)
        return int(subtotal * (percent / 100.0))
    if promo.type == PromotionType.FIXED:
        return min(subtotal, promo.rules.get("amount_cents", 0))
    if promo.type == PromotionType.FREE_DELIVERY:
        return totals["fee_cents"]
    if promo.type == PromotionType.BOGO:
        return promo.rules.get("discount_cents", 0)
    return 0


def promo_adjustment(discount_cents: int) -> dict:
    return {
        "type": AdjustmentType.PROMO_DISCOUNT,
        "amount_cents": discount_cents,
        "description": "Promotion discount",
    }
