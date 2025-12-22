from enum import Enum

import bcrypt

from sqlalchemy import CheckConstraint, Index, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import validates

from .extensions import db
from .model_helpers import (
    BaseModel,
    SoftDeleteMixin,
    normalize_lower,
    validate_non_negative,
    validate_percent,
)


class UserRoleType(str, Enum):
    CUSTOMER = "customer"
    COURIER = "courier"
    RESTAURANT_OWNER = "restaurant_owner"
    STAFF = "staff"
    ADMIN = "admin"


class RestaurantStaffRole(str, Enum):
    OWNER = "owner"
    MANAGER = "manager"
    MENU_EDITOR = "menu_editor"
    VIEWER = "viewer"


class RestaurantStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"


class MenuVersionStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class OrderType(str, Enum):
    PICKUP = "pickup"
    DELIVERY = "delivery"


class OrderStatus(str, Enum):
    CREATED = "created"
    CONFIRMED = "confirmed"
    PREPARING = "preparing"
    READY = "ready"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class AdjustmentType(str, Enum):
    SERVICE_FEE = "service_fee"
    MEMBERSHIP_DISCOUNT = "membership_discount"
    PROMO_DISCOUNT = "promo_discount"
    REFUND = "refund"
    OTHER = "other"


class DeliveryTaskStatus(str, Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    PICKED_UP = "picked_up"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class CourierAssignmentStatus(str, Enum):
    OFFERED = "offered"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    CANCELLED = "cancelled"


class PromotionType(str, Enum):
    PERCENT = "percent"
    FIXED = "fixed"
    FREE_DELIVERY = "free_delivery"
    BOGO = "bogo"


class PromotionScope(str, Enum):
    ORDER = "order"
    ITEM = "item"
    RESTAURANT = "restaurant"
    GLOBAL = "global"


class PromotionRedemptionStatus(str, Enum):
    APPLIED = "applied"
    VOIDED = "voided"
    REVERSED = "reversed"


class MembershipStatus(str, Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class MembershipSource(str, Enum):
    PAID = "paid"
    EARNED = "earned"


class SupportTicketStatus(str, Enum):
    OPEN = "open"
    PENDING = "pending"
    RESOLVED = "resolved"
    CLOSED = "closed"


class NotificationStatus(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"
    READ = "read"


class PaymentIntentStatus(str, Enum):
    REQUIRES_PAYMENT_METHOD = "requires_payment_method"
    REQUIRES_CONFIRMATION = "requires_confirmation"
    REQUIRES_ACTION = "requires_action"
    PROCESSING = "processing"
    SUCCEEDED = "succeeded"
    CANCELED = "canceled"


class ChargeStatus(str, Enum):
    PENDING = "pending"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    REFUNDED = "refunded"


class TransferStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    CANCELED = "canceled"


class TransferType(str, Enum):
    RESTAURANT_PAYOUT = "restaurant_payout"
    COURIER_PAYOUT = "courier_payout"
    PLATFORM_FEE_SHARE = "platform_fee_share"
    REFUND_REVERSAL = "refund_reversal"


class RefundStatus(str, Enum):
    PENDING = "pending"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELED = "canceled"


class PayoutStatus(str, Enum):
    PENDING = "pending"
    IN_TRANSIT = "in_transit"
    PAID = "paid"
    FAILED = "failed"
    CANCELED = "canceled"


class AddressType(str, Enum):
    HOME = "home"
    WORK = "work"
    RESTAURANT = "restaurant"
    CUSTOM = "custom"


class RatingTarget(str, Enum):
    RESTAURANT = "restaurant"
    COURIER = "courier"


class User(BaseModel):
    __tablename__ = "users"

    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(32))
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum(UserRoleType, name="user_role_type"), nullable=False)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    last_login_at = db.Column(db.DateTime(timezone=True))

    customer_profile = db.relationship(
        "CustomerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    courier_profile = db.relationship(
        "CourierProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    owner_profile = db.relationship(
        "RestaurantOwnerProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    staff_assignments = db.relationship("RestaurantStaffUser", back_populates="user")
    user_roles = db.relationship("UserRole", back_populates="user", cascade="all, delete-orphan")
    addresses = db.relationship("Address", back_populates="user")
    notifications = db.relationship("Notification", back_populates="user")
    audit_logs = db.relationship("AuditLog", back_populates="actor")
    orders = db.relationship("Order", back_populates="customer")
    memberships = db.relationship("CustomerMembership", back_populates="customer")
    restaurant_likes = db.relationship(
        "RestaurantLike", back_populates="user", cascade="all, delete-orphan"
    )
    liked_restaurants = db.relationship(
        "Restaurant", secondary="restaurant_likes", viewonly=True
    )
    order_receipts = db.relationship(
        "OrderReceipt", back_populates="customer", cascade="all, delete-orphan"
    )
    membership_receipts = db.relationship(
        "MembershipReceipt", back_populates="customer", cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint("email = lower(email)", name="ck_users_email_lower"),
        Index("ix_users_email_lower", func.lower(email), unique=True),
        Index("ix_users_created_at", "created_at"),
    )

    @validates("email")
    def _normalize_email(self, key, value):
        return normalize_lower(value)

    def set_password(self, password: str) -> None:
        password_bytes = password.encode("utf-8")
        self.password_hash = bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode("utf-8")

    def check_password(self, password: str) -> bool:
        if not self.password_hash:
            return False
        return bcrypt.checkpw(password.encode("utf-8"), self.password_hash.encode("utf-8"))

    def __repr__(self) -> str:
        return f"<User {self.id} {self.email}>"


class CustomerProfile(BaseModel):
    __tablename__ = "customer_profiles"

    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False, unique=True, index=True)
    default_payment_method_id = db.Column(UUID(as_uuid=True), db.ForeignKey("payment_methods.id"))
    notification_prefs = db.Column(JSONB, default=dict)
    membership_tier_id = db.Column(UUID(as_uuid=True), db.ForeignKey("membership_tiers.id"))

    user = db.relationship("User", back_populates="customer_profile")
    default_payment_method = db.relationship("PaymentMethod")
    membership_tier = db.relationship("MembershipTier")


class CourierProfile(BaseModel):
    __tablename__ = "courier_profiles"

    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False, unique=True, index=True)
    vehicle_type = db.Column(db.String(64))
    capacity = db.Column(db.Integer)
    is_online = db.Column(db.Boolean, nullable=False, default=False)
    rating = db.Column(db.Numeric(3, 2))
    documents = db.Column(JSONB, default=dict)

    user = db.relationship("User", back_populates="courier_profile")


class RestaurantOwnerProfile(BaseModel):
    __tablename__ = "restaurant_owner_profiles"

    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False, unique=True, index=True)
    verification_status = db.Column(db.String(64))
    stripe_account_id = db.Column(UUID(as_uuid=True), db.ForeignKey("stripe_accounts.id"))

    user = db.relationship("User", back_populates="owner_profile")
    stripe_account = db.relationship("StripeAccount", foreign_keys=[stripe_account_id])


class Role(BaseModel):
    __tablename__ = "roles"
    __table_args__ = (UniqueConstraint("name", name="uq_roles_name"),)

    name = db.Column(db.String(64), nullable=False)
    description = db.Column(db.String(255))

    role_permissions = db.relationship(
        "RolePermission", back_populates="role", cascade="all, delete-orphan"
    )
    user_roles = db.relationship("UserRole", back_populates="role")


class Permission(BaseModel):
    __tablename__ = "permissions"
    __table_args__ = (UniqueConstraint("name", name="uq_permissions_name"),)

    name = db.Column(db.String(128), nullable=False)
    description = db.Column(db.String(255))

    role_permissions = db.relationship(
        "RolePermission", back_populates="permission", cascade="all, delete-orphan"
    )


class RolePermission(BaseModel):
    __tablename__ = "role_permissions"
    __table_args__ = (UniqueConstraint("role_id", "permission_id", name="uq_role_permissions"),)

    role_id = db.Column(UUID(as_uuid=True), db.ForeignKey("roles.id"), nullable=False, index=True)
    permission_id = db.Column(UUID(as_uuid=True), db.ForeignKey("permissions.id"), nullable=False, index=True)

    role = db.relationship("Role", back_populates="role_permissions")
    permission = db.relationship("Permission", back_populates="role_permissions")


class UserRole(BaseModel):
    __tablename__ = "user_roles"
    __table_args__ = (UniqueConstraint("user_id", "role_id", "restaurant_id", name="uq_user_roles"),)

    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False, index=True)
    role_id = db.Column(UUID(as_uuid=True), db.ForeignKey("roles.id"), nullable=False, index=True)
    restaurant_id = db.Column(UUID(as_uuid=True), db.ForeignKey("restaurants.id"), index=True)

    user = db.relationship("User", back_populates="user_roles")
    role = db.relationship("Role", back_populates="user_roles")
    restaurant = db.relationship("Restaurant", back_populates="user_roles")


class Restaurant(BaseModel):
    __tablename__ = "restaurants"
    __table_args__ = (Index("ix_restaurants_created_at", "created_at"),)

    name = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(32))
    email = db.Column(db.String(255))
    status = db.Column(db.Enum(RestaurantStatus, name="restaurant_status"), nullable=False)
    cuisines = db.Column(ARRAY(db.String(64)))
    owner_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False, index=True)
    address_id = db.Column(UUID(as_uuid=True), db.ForeignKey("addresses.id"))
    stripe_account_id = db.Column(UUID(as_uuid=True), db.ForeignKey("stripe_accounts.id"))

    owner = db.relationship("User")
    address = db.relationship("Address", foreign_keys=[address_id])
    stripe_account = db.relationship("StripeAccount", foreign_keys=[stripe_account_id])
    configuration = db.relationship(
        "RestaurantConfiguration", back_populates="restaurant", uselist=False, cascade="all, delete-orphan"
    )
    order_type_configuration = db.relationship(
        "OrderTypeConfiguration", back_populates="restaurant", uselist=False, cascade="all, delete-orphan"
    )
    menus = db.relationship("Menu", back_populates="restaurant")
    menu_versions = db.relationship("MenuVersion", back_populates="restaurant")
    staff_users = db.relationship("RestaurantStaffUser", back_populates="restaurant")
    user_roles = db.relationship("UserRole", back_populates="restaurant")
    orders = db.relationship("Order", back_populates="restaurant")
    delivery_tasks = db.relationship("DeliveryTask", back_populates="restaurant")
    likes = db.relationship("RestaurantLike", back_populates="restaurant", cascade="all, delete-orphan")
    liked_by = db.relationship("User", secondary="restaurant_likes", viewonly=True)
    order_allocations = db.relationship(
        "OrderRestaurantAllocation", back_populates="restaurant", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Restaurant {self.id} {self.name}>"


class RestaurantConfiguration(BaseModel):
    __tablename__ = "restaurant_configurations"

    restaurant_id = db.Column(UUID(as_uuid=True), db.ForeignKey("restaurants.id"), nullable=False, unique=True)
    prep_time_minutes = db.Column(db.Integer, nullable=False, default=0)
    min_order_cents = db.Column(db.Integer, nullable=False, default=0)
    fee_settings = db.Column(JSONB, default=dict)
    tax_settings = db.Column(JSONB, default=dict)
    throttles = db.Column(JSONB, default=dict)

    restaurant = db.relationship("Restaurant", back_populates="configuration")

    @validates("prep_time_minutes", "min_order_cents")
    def _validate_non_negative(self, key, value):
        return validate_non_negative(value, key)


class OrderTypeConfiguration(BaseModel):
    __tablename__ = "order_type_configurations"

    restaurant_id = db.Column(UUID(as_uuid=True), db.ForeignKey("restaurants.id"), nullable=False, unique=True)
    supports_delivery = db.Column(db.Boolean, nullable=False, default=False)
    supports_pickup = db.Column(db.Boolean, nullable=False, default=True)
    prep_time_delivery_minutes = db.Column(db.Integer, default=0)
    prep_time_pickup_minutes = db.Column(db.Integer, default=0)
    pickup_hours = db.Column(JSONB, default=dict)

    restaurant = db.relationship("Restaurant", back_populates="order_type_configuration")

    @validates("prep_time_delivery_minutes", "prep_time_pickup_minutes")
    def _validate_non_negative(self, key, value):
        return validate_non_negative(value, key)


class RestaurantStaffUser(BaseModel):
    __tablename__ = "restaurant_staff_users"
    __table_args__ = (UniqueConstraint("user_id", "restaurant_id", name="uq_restaurant_staff"),)

    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False, index=True)
    restaurant_id = db.Column(UUID(as_uuid=True), db.ForeignKey("restaurants.id"), nullable=False, index=True)
    role = db.Column(db.Enum(RestaurantStaffRole, name="restaurant_staff_role"), nullable=False)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    user = db.relationship("User", back_populates="staff_assignments")
    restaurant = db.relationship("Restaurant", back_populates="staff_users")


class Menu(BaseModel):
    __tablename__ = "menus"
    __table_args__ = (Index("ix_menus_restaurant_active", "restaurant_id"),)

    restaurant_id = db.Column(UUID(as_uuid=True), db.ForeignKey("restaurants.id"), nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    restaurant = db.relationship("Restaurant", back_populates="menus")
    categories = db.relationship("MenuCategory", back_populates="menu")
    items = db.relationship("MenuItem", back_populates="menu")


class MenuCategory(SoftDeleteMixin, BaseModel):
    __tablename__ = "menu_categories"
    __table_args__ = (Index("ix_menu_categories_menu_active", "menu_id", "is_active"),)

    restaurant_id = db.Column(UUID(as_uuid=True), db.ForeignKey("restaurants.id"), nullable=False, index=True)
    menu_id = db.Column(UUID(as_uuid=True), db.ForeignKey("menus.id"), nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False)
    sort_order = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    menu = db.relationship("Menu", back_populates="categories")
    items = db.relationship("MenuItem", back_populates="category")


class MenuItem(SoftDeleteMixin, BaseModel):
    __tablename__ = "menu_items"
    __table_args__ = (
        Index("ix_menu_items_menu_active", "menu_id", "is_active"),
        Index("ix_menu_items_restaurant_active", "restaurant_id", "is_active"),
    )

    restaurant_id = db.Column(UUID(as_uuid=True), db.ForeignKey("restaurants.id"), nullable=False, index=True)
    menu_id = db.Column(UUID(as_uuid=True), db.ForeignKey("menus.id"), nullable=False, index=True)
    category_id = db.Column(UUID(as_uuid=True), db.ForeignKey("menu_categories.id"), index=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    base_price_cents = db.Column(db.Integer, nullable=False)
    price_delivery_cents = db.Column(db.Integer)
    price_pickup_cents = db.Column(db.Integer)
    tags = db.Column(ARRAY(db.String(64)))
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    out_of_stock_until = db.Column(db.DateTime(timezone=True))
    display_order = db.Column(db.Integer, default=0)

    menu = db.relationship("Menu", back_populates="items")
    category = db.relationship("MenuCategory", back_populates="items")
    option_groups = db.relationship("MenuItemOptionGroup", back_populates="menu_item")
    availability_rules = db.relationship("AvailabilityRule", back_populates="menu_item")

    @validates("base_price_cents", "price_delivery_cents", "price_pickup_cents")
    def _validate_prices(self, key, value):
        if value is None:
            return value
        return validate_non_negative(value, key)


class MenuItemOptionGroup(SoftDeleteMixin, BaseModel):
    __tablename__ = "menu_item_option_groups"
    __table_args__ = (Index("ix_option_groups_menu_item_active", "menu_item_id", "is_active"),)

    menu_item_id = db.Column(UUID(as_uuid=True), db.ForeignKey("menu_items.id"), nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False)
    min_choices = db.Column(db.Integer, default=0)
    max_choices = db.Column(db.Integer, default=0)
    is_required = db.Column(db.Boolean, nullable=False, default=False)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    menu_item = db.relationship("MenuItem", back_populates="option_groups")
    options = db.relationship("MenuItemOption", back_populates="option_group")

    @validates("min_choices", "max_choices")
    def _validate_min_max(self, key, value):
        return validate_non_negative(value, key)


class MenuItemOption(SoftDeleteMixin, BaseModel):
    __tablename__ = "menu_item_options"
    __table_args__ = (Index("ix_menu_item_options_group_active", "option_group_id", "is_active"),)

    option_group_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("menu_item_option_groups.id"), nullable=False, index=True
    )
    name = db.Column(db.String(120), nullable=False)
    price_delta_cents = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    option_group = db.relationship("MenuItemOptionGroup", back_populates="options")

    @validates("price_delta_cents")
    def _validate_delta(self, key, value):
        return validate_non_negative(value, key)


class AvailabilityRule(BaseModel):
    __tablename__ = "availability_rules"
    __table_args__ = (Index("ix_availability_rules_menu_item", "menu_item_id"),)

    menu_item_id = db.Column(UUID(as_uuid=True), db.ForeignKey("menu_items.id"), index=True)
    menu_category_id = db.Column(UUID(as_uuid=True), db.ForeignKey("menu_categories.id"), index=True)
    day_of_week = db.Column(db.SmallInteger)
    start_time = db.Column(db.Time)
    end_time = db.Column(db.Time)
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    menu_item = db.relationship("MenuItem", back_populates="availability_rules")
    menu_category = db.relationship("MenuCategory")


class MenuVersion(BaseModel):
    __tablename__ = "menu_versions"
    __table_args__ = (UniqueConstraint("restaurant_id", "version_number", name="uq_menu_version_number"),)

    restaurant_id = db.Column(UUID(as_uuid=True), db.ForeignKey("restaurants.id"), nullable=False, index=True)
    version_number = db.Column(db.Integer, nullable=False)
    status = db.Column(db.Enum(MenuVersionStatus, name="menu_version_status"), nullable=False)
    published_by_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), index=True)
    published_at = db.Column(db.DateTime(timezone=True))

    restaurant = db.relationship("Restaurant", back_populates="menu_versions")
    published_by = db.relationship("User")
    change_logs = db.relationship("MenuChangeLog", back_populates="menu_version")


class MenuChangeLog(BaseModel):
    __tablename__ = "menu_change_logs"
    __table_args__ = (Index("ix_menu_change_logs_entity", "entity_type", "entity_id"),)

    menu_version_id = db.Column(UUID(as_uuid=True), db.ForeignKey("menu_versions.id"), index=True)
    actor_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), index=True)
    entity_type = db.Column(db.String(64), nullable=False)
    entity_id = db.Column(UUID(as_uuid=True), nullable=False)
    change_type = db.Column(db.String(64), nullable=False)
    before_snapshot = db.Column(JSONB)
    after_snapshot = db.Column(JSONB)
    metadata_json = db.Column("metadata", JSONB, default=dict)

    menu_version = db.relationship("MenuVersion", back_populates="change_logs")
    actor = db.relationship("User")


class Address(BaseModel):
    __tablename__ = "addresses"
    __table_args__ = (Index("ix_addresses_user_type", "user_id", "type"),)

    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), index=True)
    restaurant_id = db.Column(UUID(as_uuid=True), db.ForeignKey("restaurants.id"), index=True)
    label = db.Column(db.String(120))
    type = db.Column(db.Enum(AddressType, name="address_type"), nullable=False)
    line1 = db.Column(db.String(255), nullable=False)
    line2 = db.Column(db.String(255))
    city = db.Column(db.String(120), nullable=False)
    state = db.Column(db.String(120))
    postal_code = db.Column(db.String(32))
    country = db.Column(db.String(2), nullable=False, default="US")
    latitude = db.Column(db.Numeric(9, 6))
    longitude = db.Column(db.Numeric(9, 6))

    user = db.relationship("User", back_populates="addresses")


class RestaurantLike(BaseModel):
    __tablename__ = "restaurant_likes"
    __table_args__ = (UniqueConstraint("user_id", "restaurant_id", name="uq_restaurant_likes"),)

    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False, index=True)
    restaurant_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("restaurants.id"), nullable=False, index=True
    )

    user = db.relationship("User", back_populates="restaurant_likes")
    restaurant = db.relationship("Restaurant", back_populates="likes")


class Cart(BaseModel):
    __tablename__ = "carts"
    __table_args__ = (Index("ix_carts_customer_active", "customer_id", "restaurant_id"),)

    customer_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), index=True)
    restaurant_id = db.Column(UUID(as_uuid=True), db.ForeignKey("restaurants.id"), nullable=False, index=True)
    order_type = db.Column(db.Enum(OrderType, name="order_type"), nullable=False)
    notes = db.Column(db.Text)
    promo_id = db.Column(UUID(as_uuid=True), db.ForeignKey("promotions.id"), index=True)
    membership_id = db.Column(UUID(as_uuid=True), db.ForeignKey("customer_memberships.id"), index=True)
    subtotal_cents = db.Column(db.Integer, nullable=False, default=0)
    tax_cents = db.Column(db.Integer, nullable=False, default=0)
    fee_cents = db.Column(db.Integer, nullable=False, default=0)
    discount_cents = db.Column(db.Integer, nullable=False, default=0)
    total_cents = db.Column(db.Integer, nullable=False, default=0)

    customer = db.relationship("User")
    restaurant = db.relationship("Restaurant", foreign_keys=[restaurant_id])
    items = db.relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")
    promo = db.relationship("Promotion")
    membership = db.relationship("CustomerMembership")

    @validates("subtotal_cents", "tax_cents", "fee_cents", "discount_cents", "total_cents")
    def _validate_amounts(self, key, value):
        return validate_non_negative(value, key)


class CartItem(BaseModel):
    __tablename__ = "cart_items"
    __table_args__ = (Index("ix_cart_items_cart", "cart_id"),)

    cart_id = db.Column(UUID(as_uuid=True), db.ForeignKey("carts.id"), nullable=False, index=True)
    menu_item_id = db.Column(UUID(as_uuid=True), db.ForeignKey("menu_items.id"), index=True)
    name_snapshot = db.Column(db.String(120), nullable=False)
    base_price_cents = db.Column(db.Integer, nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    notes = db.Column(db.Text)

    cart = db.relationship("Cart", back_populates="items")
    menu_item = db.relationship("MenuItem")
    options = db.relationship("CartItemOption", back_populates="cart_item", cascade="all, delete-orphan")

    @validates("quantity", "base_price_cents")
    def _validate_quantity(self, key, value):
        return validate_non_negative(value, key)


class CartItemOption(BaseModel):
    __tablename__ = "cart_item_options"
    __table_args__ = (Index("ix_cart_item_options_cart_item", "cart_item_id"),)

    cart_item_id = db.Column(UUID(as_uuid=True), db.ForeignKey("cart_items.id"), nullable=False, index=True)
    option_id = db.Column(UUID(as_uuid=True), db.ForeignKey("menu_item_options.id"), index=True)
    option_group_id = db.Column(UUID(as_uuid=True), db.ForeignKey("menu_item_option_groups.id"), index=True)
    name_snapshot = db.Column(db.String(120), nullable=False)
    price_delta_cents = db.Column(db.Integer, default=0)

    cart_item = db.relationship("CartItem", back_populates="options")
    option = db.relationship("MenuItemOption")
    option_group = db.relationship("MenuItemOptionGroup")

    @validates("price_delta_cents")
    def _validate_delta(self, key, value):
        return validate_non_negative(value, key)


class Order(BaseModel):
    __tablename__ = "orders"
    __table_args__ = (
        Index("ix_orders_created_at", "created_at"),
        Index("ix_orders_status", "status"),
        Index("ix_orders_restaurant_created_at", "restaurant_id", "created_at"),
    )

    customer_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False, index=True)
    restaurant_id = db.Column(UUID(as_uuid=True), db.ForeignKey("restaurants.id"), nullable=False, index=True)
    order_type = db.Column(db.Enum(OrderType, name="order_type"), nullable=False)
    status = db.Column(db.Enum(OrderStatus, name="order_status"), nullable=False)
    currency = db.Column(db.String(3), nullable=False, default="USD")
    subtotal_cents = db.Column(db.Integer, nullable=False, default=0)
    tax_cents = db.Column(db.Integer, nullable=False, default=0)
    fee_cents = db.Column(db.Integer, nullable=False, default=0)
    discount_cents = db.Column(db.Integer, nullable=False, default=0)
    total_cents = db.Column(db.Integer, nullable=False, default=0)
    promo_id = db.Column(UUID(as_uuid=True), db.ForeignKey("promotions.id"), index=True)
    membership_id = db.Column(UUID(as_uuid=True), db.ForeignKey("customer_memberships.id"), index=True)
    placed_at = db.Column(db.DateTime(timezone=True))

    customer = db.relationship("User", back_populates="orders")
    restaurant = db.relationship("Restaurant", back_populates="orders")
    promo = db.relationship("Promotion")
    membership = db.relationship("CustomerMembership")
    items = db.relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    status_history = db.relationship(
        "OrderStatusHistory", back_populates="order", cascade="all, delete-orphan"
    )
    pickup_schedule = db.relationship(
        "PickupSchedule", back_populates="order", uselist=False, cascade="all, delete-orphan"
    )
    adjustments = db.relationship(
        "OrderAdjustment", back_populates="order", cascade="all, delete-orphan"
    )
    delivery_task = db.relationship("DeliveryTask", back_populates="order", uselist=False)
    receipt = db.relationship(
        "OrderReceipt", back_populates="order", uselist=False, cascade="all, delete-orphan"
    )
    allocations = db.relationship(
        "OrderRestaurantAllocation", back_populates="order", cascade="all, delete-orphan"
    )

    @validates("subtotal_cents", "tax_cents", "fee_cents", "discount_cents", "total_cents")
    def _validate_amounts(self, key, value):
        return validate_non_negative(value, key)


class OrderItem(BaseModel):
    __tablename__ = "order_items"
    __table_args__ = (Index("ix_order_items_order", "order_id"),)

    order_id = db.Column(UUID(as_uuid=True), db.ForeignKey("orders.id"), nullable=False, index=True)
    menu_item_id = db.Column(UUID(as_uuid=True), db.ForeignKey("menu_items.id"), index=True)
    name_snapshot = db.Column(db.String(120), nullable=False)
    base_price_cents = db.Column(db.Integer, nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    total_price_cents = db.Column(db.Integer, nullable=False)
    notes = db.Column(db.Text)

    order = db.relationship("Order", back_populates="items")
    menu_item = db.relationship("MenuItem")
    options = db.relationship("OrderItemOption", back_populates="order_item", cascade="all, delete-orphan")

    @validates("base_price_cents", "total_price_cents", "quantity")
    def _validate_amounts(self, key, value):
        return validate_non_negative(value, key)


class OrderRestaurantAllocation(BaseModel):
    __tablename__ = "order_restaurant_allocations"
    __table_args__ = (
        UniqueConstraint("order_id", "restaurant_id", name="uq_order_restaurant_allocations"),
    )

    order_id = db.Column(UUID(as_uuid=True), db.ForeignKey("orders.id"), nullable=False, index=True)
    restaurant_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("restaurants.id"), nullable=False, index=True
    )
    subtotal_cents = db.Column(db.Integer, nullable=False, default=0)
    tax_cents = db.Column(db.Integer, nullable=False, default=0)
    fee_cents = db.Column(db.Integer, nullable=False, default=0)
    payout_cents = db.Column(db.Integer, nullable=False, default=0)

    order = db.relationship("Order", back_populates="allocations")
    restaurant = db.relationship("Restaurant", back_populates="order_allocations")

    @validates("subtotal_cents", "tax_cents", "fee_cents", "payout_cents")
    def _validate_amounts(self, key, value):
        return validate_non_negative(value, key)


class OrderItemOption(BaseModel):
    __tablename__ = "order_item_options"
    __table_args__ = (Index("ix_order_item_options_order_item", "order_item_id"),)

    order_item_id = db.Column(UUID(as_uuid=True), db.ForeignKey("order_items.id"), nullable=False, index=True)
    option_id = db.Column(UUID(as_uuid=True), db.ForeignKey("menu_item_options.id"), index=True)
    option_group_id = db.Column(UUID(as_uuid=True), db.ForeignKey("menu_item_option_groups.id"), index=True)
    name_snapshot = db.Column(db.String(120), nullable=False)
    price_delta_cents = db.Column(db.Integer, nullable=False, default=0)

    order_item = db.relationship("OrderItem", back_populates="options")
    option = db.relationship("MenuItemOption")
    option_group = db.relationship("MenuItemOptionGroup")

    @validates("price_delta_cents")
    def _validate_delta(self, key, value):
        return validate_non_negative(value, key)


class OrderStatusHistory(BaseModel):
    __tablename__ = "order_status_history"
    __table_args__ = (Index("ix_order_status_history_order", "order_id"),)

    order_id = db.Column(UUID(as_uuid=True), db.ForeignKey("orders.id"), nullable=False, index=True)
    from_status = db.Column(db.Enum(OrderStatus, name="order_status"), nullable=False)
    to_status = db.Column(db.Enum(OrderStatus, name="order_status"), nullable=False)
    actor_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), index=True)
    note = db.Column(db.Text)

    order = db.relationship("Order", back_populates="status_history")
    actor = db.relationship("User")


class PickupSchedule(BaseModel):
    __tablename__ = "pickup_schedules"
    __table_args__ = (UniqueConstraint("order_id", name="uq_pickup_schedule_order"),)

    order_id = db.Column(UUID(as_uuid=True), db.ForeignKey("orders.id"), nullable=False, unique=True, index=True)
    requested_start = db.Column(db.DateTime(timezone=True), nullable=False)
    requested_end = db.Column(db.DateTime(timezone=True), nullable=False)
    confirmed_time = db.Column(db.DateTime(timezone=True))
    pickup_code = db.Column(db.String(32), nullable=False)
    arrived_at = db.Column(db.DateTime(timezone=True))

    order = db.relationship("Order", back_populates="pickup_schedule")


class OrderAdjustment(BaseModel):
    __tablename__ = "order_adjustments"
    __table_args__ = (Index("ix_order_adjustments_order", "order_id"),)

    order_id = db.Column(UUID(as_uuid=True), db.ForeignKey("orders.id"), nullable=False, index=True)
    type = db.Column(db.Enum(AdjustmentType, name="adjustment_type"), nullable=False)
    amount_cents = db.Column(db.Integer, nullable=False)
    description = db.Column(db.String(255))

    order = db.relationship("Order", back_populates="adjustments")


class DeliveryTask(BaseModel):
    __tablename__ = "delivery_tasks"
    __table_args__ = (Index("ix_delivery_tasks_status", "status"),)

    order_id = db.Column(UUID(as_uuid=True), db.ForeignKey("orders.id"), nullable=False, unique=True, index=True)
    restaurant_id = db.Column(UUID(as_uuid=True), db.ForeignKey("restaurants.id"), index=True)
    pickup_address_id = db.Column(UUID(as_uuid=True), db.ForeignKey("addresses.id"))
    dropoff_address_id = db.Column(UUID(as_uuid=True), db.ForeignKey("addresses.id"))
    status = db.Column(db.Enum(DeliveryTaskStatus, name="delivery_task_status"), nullable=False)
    eta = db.Column(db.DateTime(timezone=True))

    order = db.relationship("Order", back_populates="delivery_task")
    restaurant = db.relationship("Restaurant", back_populates="delivery_tasks")
    pickup_address = db.relationship("Address", foreign_keys=[pickup_address_id])
    dropoff_address = db.relationship("Address", foreign_keys=[dropoff_address_id])
    courier_assignments = db.relationship(
        "CourierAssignment", back_populates="delivery_task", cascade="all, delete-orphan"
    )
    location_updates = db.relationship(
        "CourierLocationUpdate", back_populates="delivery_task", cascade="all, delete-orphan"
    )


class CourierAssignment(BaseModel):
    __tablename__ = "courier_assignments"
    __table_args__ = (Index("ix_courier_assignments_task", "delivery_task_id"),)

    delivery_task_id = db.Column(UUID(as_uuid=True), db.ForeignKey("delivery_tasks.id"), nullable=False, index=True)
    courier_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False, index=True)
    status = db.Column(db.Enum(CourierAssignmentStatus, name="courier_assignment_status"), nullable=False)
    accepted_at = db.Column(db.DateTime(timezone=True))

    delivery_task = db.relationship("DeliveryTask", back_populates="courier_assignments")
    courier = db.relationship("User")


class CourierLocationUpdate(BaseModel):
    __tablename__ = "courier_location_updates"
    __table_args__ = (Index("ix_courier_location_updates_courier", "courier_id"),)

    courier_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False, index=True)
    delivery_task_id = db.Column(UUID(as_uuid=True), db.ForeignKey("delivery_tasks.id"), index=True)
    latitude = db.Column(db.Numeric(9, 6), nullable=False)
    longitude = db.Column(db.Numeric(9, 6), nullable=False)
    recorded_at = db.Column(
        db.DateTime(timezone=True), nullable=False, server_default=db.func.now()
    )

    courier = db.relationship("User")
    delivery_task = db.relationship("DeliveryTask", back_populates="location_updates")


class RoutePlan(BaseModel):
    __tablename__ = "route_plans"

    restaurant_id = db.Column(UUID(as_uuid=True), db.ForeignKey("restaurants.id"), index=True)
    courier_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), index=True)
    status = db.Column(db.String(64))
    metadata_json = db.Column("metadata", JSONB, default=dict)

    restaurant = db.relationship("Restaurant", foreign_keys=[restaurant_id])
    courier = db.relationship("User")


class ServiceArea(BaseModel):
    __tablename__ = "service_areas"
    __table_args__ = (Index("ix_service_areas_active", "is_active"),)

    name = db.Column(db.String(120), nullable=False)
    polygon = db.Column(JSONB, nullable=False)
    is_active = db.Column(db.Boolean, nullable=False, default=True)


class StripeAccount(BaseModel):
    __tablename__ = "stripe_accounts"
    __table_args__ = (UniqueConstraint("stripe_account_id", name="uq_stripe_account_id"),)

    stripe_account_id = db.Column(db.String(255), nullable=False)
    account_type = db.Column(db.String(64))
    onboarding_status = db.Column(db.String(64))
    requirements = db.Column(JSONB, default=dict)
    restaurant_id = db.Column(UUID(as_uuid=True), db.ForeignKey("restaurants.id"), index=True)
    courier_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), index=True)

    restaurant = db.relationship("Restaurant")
    courier = db.relationship("User")


class PaymentMethod(BaseModel):
    __tablename__ = "payment_methods"
    __table_args__ = (UniqueConstraint("stripe_payment_method_id", name="uq_payment_method_id"),)

    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False, index=True)
    stripe_payment_method_id = db.Column(db.String(255), nullable=False)
    brand = db.Column(db.String(64))
    last4 = db.Column(db.String(4))
    exp_month = db.Column(db.Integer)
    exp_year = db.Column(db.Integer)
    stripe_customer_id = db.Column(db.String(255))

    user = db.relationship("User")


class PaymentIntentRecord(BaseModel):
    __tablename__ = "payment_intent_records"
    __table_args__ = (
        UniqueConstraint("stripe_payment_intent_id", name="uq_payment_intent_id"),
        Index("ix_payment_intents_restaurant_created_at", "restaurant_id", "created_at"),
    )

    stripe_payment_intent_id = db.Column(db.String(255), nullable=False)
    order_id = db.Column(UUID(as_uuid=True), db.ForeignKey("orders.id"), nullable=False, index=True)
    restaurant_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("restaurants.id"), nullable=False, index=True
    )
    amount_cents = db.Column(db.Integer, nullable=False)
    currency = db.Column(db.String(3), nullable=False)
    status = db.Column(db.Enum(PaymentIntentStatus, name="payment_intent_status"), nullable=False)
    client_secret = db.Column(db.String(255))
    error = db.Column(JSONB)

    order = db.relationship("Order")
    restaurant = db.relationship("Restaurant")

    @validates("amount_cents")
    def _validate_amount(self, key, value):
        return validate_non_negative(value, key)


class ChargeRecord(BaseModel):
    __tablename__ = "charge_records"
    __table_args__ = (UniqueConstraint("stripe_charge_id", name="uq_charge_id"),)

    stripe_charge_id = db.Column(db.String(255), nullable=False)
    payment_intent_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("payment_intent_records.id"), nullable=False, index=True
    )
    restaurant_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("restaurants.id"), nullable=False, index=True
    )
    amount_cents = db.Column(db.Integer, nullable=False)
    status = db.Column(db.Enum(ChargeStatus, name="charge_status"), nullable=False)
    refunded_amount_cents = db.Column(db.Integer, default=0)

    payment_intent = db.relationship("PaymentIntentRecord")
    restaurant = db.relationship("Restaurant")

    @validates("amount_cents", "refunded_amount_cents")
    def _validate_amount(self, key, value):
        return validate_non_negative(value, key)


class RefundRecord(BaseModel):
    __tablename__ = "refund_records"
    __table_args__ = (UniqueConstraint("stripe_refund_id", name="uq_refund_id"),)

    stripe_refund_id = db.Column(db.String(255), nullable=False)
    payment_intent_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("payment_intent_records.id"), nullable=False, index=True
    )
    amount_cents = db.Column(db.Integer, nullable=False)
    reason = db.Column(db.String(255))
    status = db.Column(db.Enum(RefundStatus, name="refund_status"), nullable=False)

    payment_intent = db.relationship("PaymentIntentRecord")

    @validates("amount_cents")
    def _validate_amount(self, key, value):
        return validate_non_negative(value, key)


class OrderReceipt(BaseModel):
    __tablename__ = "order_receipts"
    __table_args__ = (UniqueConstraint("order_id", name="uq_order_receipts_order"),)

    order_id = db.Column(UUID(as_uuid=True), db.ForeignKey("orders.id"), nullable=False, index=True)
    customer_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False, index=True)
    payment_intent_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("payment_intent_records.id"), index=True
    )
    charge_id = db.Column(UUID(as_uuid=True), db.ForeignKey("charge_records.id"), index=True)
    amount_cents = db.Column(db.Integer, nullable=False)
    currency = db.Column(db.String(3), nullable=False, default="USD")
    status = db.Column(db.Enum(ChargeStatus, name="receipt_status"), nullable=False)
    provider = db.Column(db.String(64))
    provider_receipt_id = db.Column(db.String(255))
    receipt_url = db.Column(db.String(255))
    issued_at = db.Column(db.DateTime(timezone=True))
    metadata_json = db.Column("metadata", JSONB, default=dict)

    order = db.relationship("Order", back_populates="receipt")
    customer = db.relationship("User", back_populates="order_receipts")
    payment_intent = db.relationship("PaymentIntentRecord")
    charge = db.relationship("ChargeRecord")

    @validates("amount_cents")
    def _validate_amount(self, key, value):
        return validate_non_negative(value, key)


class TransferRecord(BaseModel):
    __tablename__ = "transfer_records"
    __table_args__ = (
        UniqueConstraint("stripe_transfer_id", name="uq_transfer_id"),
        UniqueConstraint(
            "order_id",
            "transfer_type",
            "destination_stripe_account_id",
            name="uq_transfer_order_type_destination",
        ),
    )

    stripe_transfer_id = db.Column(db.String(255), nullable=False)
    order_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("orders.id"), nullable=False, index=True
    )
    restaurant_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("restaurants.id"), nullable=False, index=True
    )
    destination_stripe_account_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("stripe_accounts.id"), nullable=False, index=True
    )
    payout_id = db.Column(UUID(as_uuid=True), db.ForeignKey("payouts.id"), index=True)
    amount_cents = db.Column(db.Integer, nullable=False)
    currency = db.Column(db.String(3), nullable=False, default="USD")
    transfer_type = db.Column(db.Enum(TransferType, name="transfer_type"), nullable=False)
    status = db.Column(db.Enum(TransferStatus, name="transfer_status"), nullable=False)

    payout = db.relationship("Payout", back_populates="transfers")
    order = db.relationship("Order")
    restaurant = db.relationship("Restaurant")
    destination_stripe_account = db.relationship("StripeAccount")

    @validates("amount_cents")
    def _validate_amount(self, key, value):
        return validate_non_negative(value, key)


class Payout(BaseModel):
    __tablename__ = "payouts"
    __table_args__ = (
        Index("ix_payouts_status", "status"),
        CheckConstraint(
            "(restaurant_id IS NOT NULL AND courier_id IS NULL) OR "
            "(restaurant_id IS NULL AND courier_id IS NOT NULL)",
            name="ck_payouts_one_owner",
        ),
    )

    stripe_payout_id = db.Column(db.String(255))
    start_at = db.Column(db.DateTime(timezone=True), nullable=False)
    end_at = db.Column(db.DateTime(timezone=True), nullable=False)
    total_amount_cents = db.Column(db.Integer, nullable=False, default=0)
    status = db.Column(db.Enum(PayoutStatus, name="payout_status"), nullable=False)
    restaurant_id = db.Column(UUID(as_uuid=True), db.ForeignKey("restaurants.id"), index=True)
    courier_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), index=True)

    transfers = db.relationship("TransferRecord", back_populates="payout", cascade="all, delete-orphan")
    restaurant = db.relationship("Restaurant")
    courier = db.relationship("User")

    @validates("total_amount_cents")
    def _validate_amount(self, key, value):
        return validate_non_negative(value, key)


class Promotion(SoftDeleteMixin, BaseModel):
    __tablename__ = "promotions"

    code = db.Column(db.String(64), nullable=False)
    code_normalized = db.Column(db.String(64), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    type = db.Column(db.Enum(PromotionType, name="promotion_type"), nullable=False)
    scope = db.Column(db.Enum(PromotionScope, name="promotion_scope"), nullable=False)
    min_order_cents = db.Column(db.Integer, default=0)
    rules = db.Column(JSONB, default=dict)
    starts_at = db.Column(db.DateTime(timezone=True))
    ends_at = db.Column(db.DateTime(timezone=True))
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    conditions = db.relationship(
        "PromotionCondition", back_populates="promotion", cascade="all, delete-orphan"
    )
    redemptions = db.relationship("PromotionRedemption", back_populates="promotion")

    __table_args__ = (
        CheckConstraint("code_normalized = lower(code)", name="ck_promotions_code_normalized"),
        Index("ix_promotions_code_normalized", "code_normalized", unique=True),
        Index("ix_promotions_active", "is_active"),
    )

    @validates("code", "code_normalized")
    def _normalize_code(self, key, value):
        normalized = normalize_lower(value)
        if key == "code":
            self.code_normalized = normalized
        return normalized

    @validates("min_order_cents")
    def _validate_min_order(self, key, value):
        return validate_non_negative(value, key)


class PromotionCondition(BaseModel):
    __tablename__ = "promotion_conditions"

    promotion_id = db.Column(UUID(as_uuid=True), db.ForeignKey("promotions.id"), nullable=False, index=True)
    rules = db.Column(JSONB, default=dict)

    promotion = db.relationship("Promotion", back_populates="conditions")


class PromotionRedemption(BaseModel):
    __tablename__ = "promotion_redemptions"
    __table_args__ = (Index("ix_promo_redemptions_customer", "customer_id"),)

    promotion_id = db.Column(UUID(as_uuid=True), db.ForeignKey("promotions.id"), nullable=False, index=True)
    customer_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False, index=True)
    order_id = db.Column(UUID(as_uuid=True), db.ForeignKey("orders.id"), index=True)
    discount_cents = db.Column(db.Integer, nullable=False, default=0)
    status = db.Column(
        db.Enum(PromotionRedemptionStatus, name="promotion_redemption_status"), nullable=False
    )
    redeemed_at = db.Column(db.DateTime(timezone=True))

    promotion = db.relationship("Promotion", back_populates="redemptions")
    customer = db.relationship("User")
    order = db.relationship("Order")

    @validates("discount_cents")
    def _validate_discount(self, key, value):
        return validate_non_negative(value, key)


class Coupon(BaseModel):
    __tablename__ = "coupons"
    __table_args__ = (UniqueConstraint("code", name="uq_coupon_code"),)

    code = db.Column(db.String(64), nullable=False)
    description = db.Column(db.String(255))
    max_redemptions = db.Column(db.Integer)
    per_customer_limit = db.Column(db.Integer)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    @validates("max_redemptions", "per_customer_limit")
    def _validate_limits(self, key, value):
        if value is None:
            return value
        return validate_non_negative(value, key)


class MembershipTier(BaseModel):
    __tablename__ = "membership_tiers"
    __table_args__ = (UniqueConstraint("name", name="uq_membership_tiers_name"),)

    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    eligibility = db.Column(JSONB, default=dict)
    discount_percent = db.Column(db.Integer, default=0)
    fee_rules = db.Column(JSONB, default=dict)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    benefits = db.relationship("TierBenefit", back_populates="tier", cascade="all, delete-orphan")

    @validates("discount_percent")
    def _validate_discount(self, key, value):
        return validate_percent(value, key)


class MembershipBenefit(BaseModel):
    __tablename__ = "membership_benefits"
    __table_args__ = (UniqueConstraint("name", name="uq_membership_benefits_name"),)

    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)

    tiers = db.relationship("TierBenefit", back_populates="benefit", cascade="all, delete-orphan")


class TierBenefit(BaseModel):
    __tablename__ = "tier_benefits"
    __table_args__ = (UniqueConstraint("tier_id", "benefit_id", name="uq_tier_benefit"),)

    tier_id = db.Column(UUID(as_uuid=True), db.ForeignKey("membership_tiers.id"), nullable=False, index=True)
    benefit_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("membership_benefits.id"), nullable=False, index=True
    )
    benefit_params = db.Column(JSONB, default=dict)

    tier = db.relationship("MembershipTier", back_populates="benefits")
    benefit = db.relationship("MembershipBenefit", back_populates="tiers")


class CustomerMembership(BaseModel):
    __tablename__ = "customer_memberships"
    __table_args__ = (Index("ix_customer_memberships_status", "status"),)

    customer_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False, index=True)
    tier_id = db.Column(UUID(as_uuid=True), db.ForeignKey("membership_tiers.id"), nullable=False, index=True)
    status = db.Column(db.Enum(MembershipStatus, name="membership_status"), nullable=False)
    source = db.Column(db.Enum(MembershipSource, name="membership_source"), nullable=False)
    started_at = db.Column(db.DateTime(timezone=True), nullable=False)
    ends_at = db.Column(db.DateTime(timezone=True))

    customer = db.relationship("User", back_populates="memberships")
    tier = db.relationship("MembershipTier")
    history = db.relationship(
        "MembershipHistory", back_populates="membership", cascade="all, delete-orphan"
    )
    subscription = db.relationship(
        "MembershipSubscription", back_populates="membership", uselist=False, cascade="all, delete-orphan"
    )
    receipts = db.relationship(
        "MembershipReceipt", back_populates="membership", cascade="all, delete-orphan"
    )


class MembershipSubscription(BaseModel):
    __tablename__ = "membership_subscriptions"
    __table_args__ = (UniqueConstraint("stripe_subscription_id", name="uq_membership_subscription_id"),)

    membership_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("customer_memberships.id"), nullable=False, unique=True, index=True
    )
    stripe_subscription_id = db.Column(db.String(255), nullable=False)
    plan = db.Column(db.String(120))
    billing_cycle = db.Column(db.String(64))
    status = db.Column(db.Enum(MembershipStatus, name="membership_status"), nullable=False)

    membership = db.relationship("CustomerMembership", back_populates="subscription")


class MembershipHistory(BaseModel):
    __tablename__ = "membership_history"
    __table_args__ = (Index("ix_membership_history_membership", "membership_id"),)

    membership_id = db.Column(UUID(as_uuid=True), db.ForeignKey("customer_memberships.id"), nullable=False, index=True)
    previous_tier_id = db.Column(UUID(as_uuid=True), db.ForeignKey("membership_tiers.id"), index=True)
    new_tier_id = db.Column(UUID(as_uuid=True), db.ForeignKey("membership_tiers.id"), index=True)
    changed_at = db.Column(db.DateTime(timezone=True), nullable=False)
    reason = db.Column(db.String(255))

    membership = db.relationship("CustomerMembership", back_populates="history")
    previous_tier = db.relationship("MembershipTier", foreign_keys=[previous_tier_id])
    new_tier = db.relationship("MembershipTier", foreign_keys=[new_tier_id])


class MembershipReceipt(BaseModel):
    __tablename__ = "membership_receipts"

    membership_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("customer_memberships.id"), nullable=False, index=True
    )
    customer_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False, index=True)
    amount_cents = db.Column(db.Integer, nullable=False)
    currency = db.Column(db.String(3), nullable=False, default="USD")
    status = db.Column(db.Enum(ChargeStatus, name="membership_receipt_status"), nullable=False)
    period_start = db.Column(db.DateTime(timezone=True))
    period_end = db.Column(db.DateTime(timezone=True))
    provider = db.Column(db.String(64))
    provider_invoice_id = db.Column(db.String(255))
    receipt_url = db.Column(db.String(255))
    issued_at = db.Column(db.DateTime(timezone=True))
    metadata_json = db.Column("metadata", JSONB, default=dict)

    membership = db.relationship("CustomerMembership", back_populates="receipts")
    customer = db.relationship("User", back_populates="membership_receipts")

    @validates("amount_cents")
    def _validate_amount(self, key, value):
        return validate_non_negative(value, key)


class Rating(BaseModel):
    __tablename__ = "ratings"
    __table_args__ = (Index("ix_ratings_target", "target_type", "target_id"),)

    target_type = db.Column(db.Enum(RatingTarget, name="rating_target"), nullable=False)
    target_id = db.Column(UUID(as_uuid=True), nullable=False)
    order_id = db.Column(UUID(as_uuid=True), db.ForeignKey("orders.id"), index=True)
    rater_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False, index=True)
    stars = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text)
    tags = db.Column(ARRAY(db.String(64)))

    order = db.relationship("Order")
    rater = db.relationship("User")

    @validates("stars")
    def _validate_stars(self, key, value):
        if value is None:
            return value
        if not 1 <= value <= 5:
            raise ValueError("stars must be between 1 and 5")
        return value


class SupportTicket(BaseModel):
    __tablename__ = "support_tickets"
    __table_args__ = (Index("ix_support_tickets_status", "status"),)

    customer_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), index=True)
    order_id = db.Column(UUID(as_uuid=True), db.ForeignKey("orders.id"), index=True)
    category = db.Column(db.String(120), nullable=False)
    status = db.Column(db.Enum(SupportTicketStatus, name="support_ticket_status"), nullable=False)
    resolution = db.Column(db.Text)

    customer = db.relationship("User")
    order = db.relationship("Order")


class Notification(BaseModel):
    __tablename__ = "notifications"
    __table_args__ = (Index("ix_notifications_user_status", "user_id", "status"),)

    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False, index=True)
    type = db.Column(db.String(64), nullable=False)
    payload = db.Column(JSONB, default=dict)
    status = db.Column(db.Enum(NotificationStatus, name="notification_status"), nullable=False)
    sent_at = db.Column(db.DateTime(timezone=True))

    user = db.relationship("User", back_populates="notifications")


class AuditLog(BaseModel):
    __tablename__ = "audit_logs"
    __table_args__ = (Index("ix_audit_logs_entity", "entity_type", "entity_id"),)

    actor_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), index=True)
    action = db.Column(db.String(120), nullable=False)
    entity_type = db.Column(db.String(64), nullable=False)
    entity_id = db.Column(UUID(as_uuid=True), nullable=False)
    metadata_json = db.Column("metadata", JSONB, default=dict)
    ip_address = db.Column(db.String(64))
    user_agent = db.Column(db.String(255))

    actor = db.relationship("User", back_populates="audit_logs")
