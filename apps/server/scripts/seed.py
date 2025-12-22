from __future__ import annotations

import argparse
import random

from faker import Faker

from app import create_app
from app.extensions import db
from app.models import (
    CustomerMembership,
    CustomerProfile,
    MembershipSource,
    MembershipStatus,
    MembershipTier,
    Menu,
    MenuCategory,
    MenuItem,
    MenuItemOption,
    MenuItemOptionGroup,
    OrderTypeConfiguration,
    Permission,
    Promotion,
    PromotionScope,
    PromotionType,
    Restaurant,
    RestaurantConfiguration,
    RestaurantStaffRole,
    RestaurantStaffUser,
    RestaurantStatus,
    Role,
    RolePermission,
    User,
    UserRoleType,
)


ROLE_DEFINITIONS = {
    "owner": [
        "menu.item.create",
        "menu.item.update",
        "menu.item.deactivate",
        "menu.price.update",
        "discount.apply",
        "order.view",
        "order.update_status",
        "payout.view",
    ],
    "manager": [
        "menu.item.create",
        "menu.item.update",
        "menu.item.deactivate",
        "menu.price.update",
        "discount.apply",
        "order.view",
        "order.update_status",
        "payout.view",
    ],
    "menu_editor": [
        "menu.item.create",
        "menu.item.update",
        "menu.item.deactivate",
        "menu.price.update",
    ],
    "viewer": [
        "order.view",
        "payout.view",
    ],
    "support": [
        "order.view",
        "order.update_status",
    ],
    "admin": [
        "menu.item.create",
        "menu.item.update",
        "menu.item.deactivate",
        "menu.price.update",
        "discount.apply",
        "order.view",
        "order.update_status",
        "payout.view",
    ],
}


fake = Faker()


def _get_or_create_user(email: str, role: UserRoleType, password: str, name: str | None = None):
    user = User.query.filter_by(email=email).first()
    if user:
        return user
    user = User(
        name=name or fake.name(),
        email=email,
        phone=fake.phone_number(),
        role=role,
        is_active=True,
    )
    user.set_password(password)
    db.session.add(user)
    db.session.flush()
    if role == UserRoleType.CUSTOMER and not user.customer_profile:
        db.session.add(CustomerProfile(user_id=user.id))
    return user


def _seed_restaurant(owner: User, index: int):
    restaurant = Restaurant(
        name=fake.company(),
        phone=fake.phone_number(),
        email=fake.company_email(),
        status=RestaurantStatus.ACTIVE,
        cuisines=[fake.word(), fake.word()],
        owner_id=owner.id,
    )
    db.session.add(restaurant)
    db.session.flush()
    db.session.add(RestaurantConfiguration(restaurant_id=restaurant.id))
    db.session.add(OrderTypeConfiguration(restaurant_id=restaurant.id, supports_pickup=True))
    db.session.add(
        RestaurantStaffUser(
            user_id=owner.id, restaurant_id=restaurant.id, role=RestaurantStaffRole.OWNER
        )
    )

    menu = Menu(restaurant_id=restaurant.id, name=f"Main Menu {index}", is_active=True)
    db.session.add(menu)
    db.session.flush()

    categories = []
    for c in range(2):
        category = MenuCategory(
            restaurant_id=restaurant.id,
            menu_id=menu.id,
            name=fake.word().title(),
            sort_order=c,
            is_active=True,
        )
        db.session.add(category)
        categories.append(category)

    db.session.flush()

    for category in categories:
        for _ in range(3):
            base_price = random.randint(800, 2200)
            item = MenuItem(
                restaurant_id=restaurant.id,
                menu_id=menu.id,
                category_id=category.id,
                name=fake.word().title(),
                description=fake.sentence(),
                base_price_cents=base_price,
                price_pickup_cents=base_price,
                tags=[fake.word()],
                is_active=True,
                display_order=random.randint(0, 10),
            )
            db.session.add(item)
            db.session.flush()

            group = MenuItemOptionGroup(
                menu_item_id=item.id,
                name="Add-ons",
                min_choices=0,
                max_choices=2,
                is_required=False,
                is_active=True,
            )
            db.session.add(group)
            db.session.flush()
            for _ in range(2):
                option = MenuItemOption(
                    option_group_id=group.id,
                    name=fake.word().title(),
                    price_delta_cents=random.randint(50, 250),
                    is_active=True,
                )
                db.session.add(option)

    return restaurant


def _seed_rbac_in_context() -> None:
    permissions = {}
    for perm_name in {p for perms in ROLE_DEFINITIONS.values() for p in perms}:
        permission = Permission.query.filter_by(name=perm_name).first()
        if not permission:
            permission = Permission(name=perm_name)
            db.session.add(permission)
        permissions[perm_name] = permission

    for role_name, perm_names in ROLE_DEFINITIONS.items():
        role = Role.query.filter_by(name=role_name).first()
        if not role:
            role = Role(name=role_name)
            db.session.add(role)
            db.session.flush()

        existing = {rp.permission_id for rp in RolePermission.query.filter_by(role_id=role.id).all()}
        for perm_name in perm_names:
            permission = permissions[perm_name]
            if permission.id in existing:
                continue
            db.session.add(RolePermission(role_id=role.id, permission_id=permission.id))

    db.session.commit()


def _seed_demo_in_context() -> None:
    admin = _get_or_create_user("admin@nush.local", UserRoleType.ADMIN, "admin123", name="Admin User")
    owner = _get_or_create_user(
        "owner@nush.local", UserRoleType.RESTAURANT_OWNER, "owner123", name="Owner User"
    )
    customer = _get_or_create_user(
        "customer@nush.local", UserRoleType.CUSTOMER, "customer123", name="Customer User"
    )
    _get_or_create_user("staff@nush.local", UserRoleType.STAFF, "staff123", name="Staff User")

    for i in range(2):
        _seed_restaurant(owner, i + 1)

    promo = Promotion.query.filter_by(code="WELCOME10").first()
    if not promo:
        promo = Promotion(
            code="WELCOME10",
            name="Welcome 10%",
            description="10% off order",
            type=PromotionType.PERCENT,
            scope=PromotionScope.ORDER,
            min_order_cents=0,
            rules={"percent": 10},
            is_active=True,
        )
        db.session.add(promo)

    tier = MembershipTier.query.filter_by(name="Gold").first()
    if not tier:
        tier = MembershipTier(
            name="Gold",
            description="Gold tier",
            discount_percent=10,
            fee_rules={"rate_percent": 0},
            is_active=True,
        )
        db.session.add(tier)
        db.session.flush()

    membership = (
        CustomerMembership.query.filter_by(customer_id=customer.id)
        .order_by(CustomerMembership.created_at.desc())
        .first()
    )
    if not membership:
        membership = CustomerMembership(
            customer_id=customer.id,
            tier_id=tier.id,
            status=MembershipStatus.ACTIVE,
            source=MembershipSource.PAID,
        )
        db.session.add(membership)

    db.session.commit()


def seed_rbac() -> None:
    app = create_app()
    with app.app_context():
        _seed_rbac_in_context()


def seed_demo() -> None:
    app = create_app()
    with app.app_context():
        _seed_demo_in_context()


def seed_all() -> None:
    app = create_app()
    with app.app_context():
        _seed_rbac_in_context()
        _seed_demo_in_context()


def _parse_args():
    parser = argparse.ArgumentParser(description="Seed RBAC and demo data.")
    parser.add_argument("--rbac", action="store_true", help="Seed RBAC roles and permissions")
    parser.add_argument("--demo", action="store_true", help="Seed demo users, restaurants, and menus")
    return parser.parse_args()


if __name__ == "__main__":
    args = _parse_args()
    if args.rbac and not args.demo:
        seed_rbac()
    elif args.demo and not args.rbac:
        seed_demo()
    else:
        seed_all()
