from typing import Any


def _iso(dt):
    return dt.isoformat() if dt else None


def user_summary(user) -> dict[str, Any]:
    return {
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role.value if user.role else None,
        "is_active": user.is_active,
        "created_at": _iso(user.created_at),
    }


def restaurant_summary(restaurant) -> dict[str, Any]:
    return {
        "id": str(restaurant.id),
        "name": restaurant.name,
        "status": restaurant.status.value if restaurant.status else None,
        "cuisines": restaurant.cuisines or [],
        "phone": restaurant.phone,
        "email": restaurant.email,
    }


def address_summary(address) -> dict[str, Any] | None:
    if not address:
        return None
    return {
        "id": str(address.id),
        "line1": address.line1,
        "line2": address.line2,
        "city": address.city,
        "state": address.state,
        "postal_code": address.postal_code,
        "country": address.country,
        "latitude": float(address.latitude) if address.latitude is not None else None,
        "longitude": float(address.longitude) if address.longitude is not None else None,
    }


def menu_item_option(option) -> dict[str, Any]:
    return {
        "id": str(option.id),
        "name": option.name,
        "price_delta_cents": option.price_delta_cents,
        "is_active": option.is_active,
    }


def menu_item_option_group(group) -> dict[str, Any]:
    return {
        "id": str(group.id),
        "name": group.name,
        "min_choices": group.min_choices,
        "max_choices": group.max_choices,
        "is_required": group.is_required,
        "is_active": group.is_active,
        "options": [menu_item_option(option) for option in group.options if option.is_active],
    }


def menu_item_summary(item) -> dict[str, Any]:
    return {
        "id": str(item.id),
        "name": item.name,
        "description": item.description,
        "base_price_cents": item.base_price_cents,
        "price_pickup_cents": item.price_pickup_cents,
        "price_delivery_cents": item.price_delivery_cents,
        "tags": item.tags or [],
        "is_active": item.is_active,
        "out_of_stock_until": _iso(item.out_of_stock_until),
        "display_order": item.display_order,
        "stock_quantity": item.stock_quantity,
        "track_stock": item.track_stock,
        "option_groups": [menu_item_option_group(group) for group in item.option_groups if group.is_active],
    }


def menu_category_summary(category) -> dict[str, Any]:
    return {
        "id": str(category.id),
        "name": category.name,
        "sort_order": category.sort_order,
        "is_active": category.is_active,
        "items": [menu_item_summary(item) for item in category.items if item.is_active],
    }


def menu_summary(menu) -> dict[str, Any]:
    return {
        "id": str(menu.id),
        "name": menu.name,
        "is_active": menu.is_active,
        "categories": [menu_category_summary(cat) for cat in menu.categories if cat.is_active],
    }


def cart_item_summary(item) -> dict[str, Any]:
    return {
        "id": str(item.id),
        "menu_item_id": str(item.menu_item_id) if item.menu_item_id else None,
        "name": item.name_snapshot,
        "base_price_cents": item.base_price_cents,
        "quantity": item.quantity,
        "notes": item.notes,
        "options": [
            {
                "id": str(option.id),
                "option_id": str(option.option_id) if option.option_id else None,
                "option_group_id": str(option.option_group_id) if option.option_group_id else None,
                "name": option.name_snapshot,
                "price_delta_cents": option.price_delta_cents,
            }
            for option in item.options
        ],
    }


def cart_summary(cart, totals: dict[str, Any] | None = None) -> dict[str, Any]:
    return {
        "id": str(cart.id),
        "restaurant_id": str(cart.restaurant_id),
        "order_type": cart.order_type.value if cart.order_type else None,
        "notes": cart.notes,
        "promo_id": str(cart.promo_id) if cart.promo_id else None,
        "membership_id": str(cart.membership_id) if cart.membership_id else None,
        "items": [cart_item_summary(item) for item in cart.items],
        "totals": totals or {
            "subtotal_cents": cart.subtotal_cents,
            "tax_cents": cart.tax_cents,
            "fee_cents": cart.fee_cents,
            "discount_cents": cart.discount_cents,
            "total_cents": cart.total_cents,
        },
    }


def order_summary(order) -> dict[str, Any]:
    return {
        "id": str(order.id),
        "restaurant_id": str(order.restaurant_id),
        "customer_id": str(order.customer_id),
        "order_type": order.order_type.value if order.order_type else None,
        "status": order.status.value if order.status else None,
        "currency": order.currency,
        "placed_at": _iso(order.placed_at),
        "totals": {
            "subtotal_cents": order.subtotal_cents,
            "tax_cents": order.tax_cents,
            "fee_cents": order.fee_cents,
            "discount_cents": order.discount_cents,
            "total_cents": order.total_cents,
        },
        "items": [
            {
                "id": str(item.id),
                "menu_item_id": str(item.menu_item_id) if item.menu_item_id else None,
                "name": item.name_snapshot,
                "base_price_cents": item.base_price_cents,
                "quantity": item.quantity,
                "total_price_cents": item.total_price_cents,
                "notes": item.notes,
                "options": [
                    {
                        "id": str(option.id),
                        "option_id": str(option.option_id) if option.option_id else None,
                        "option_group_id": str(option.option_group_id) if option.option_group_id else None,
                        "name": option.name_snapshot,
                        "price_delta_cents": option.price_delta_cents,
                    }
                    for option in item.options
                ],
            }
            for item in order.items
        ],
    }
