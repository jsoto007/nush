from datetime import datetime, timedelta, timezone

from flask import Blueprint, request
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from ..auth_helpers import get_current_user, login_user, logout_user, require_auth
from ..extensions import db, limiter
from ..model_helpers import normalize_lower
from ..models import CustomerProfile, Order, RestaurantLike, User, UserRoleType
from .response import error, ok
from .serializers import user_summary
from .validators import get_json
from ..services.email_service import EmailService
import secrets


auth_bp = Blueprint("auth", __name__, url_prefix="/auth")


@auth_bp.post("/register")
@limiter.limit("10/minute")
def register():
    payload, err = get_json(request)
    if err:
        return err

    name = (payload.get("name") or "").strip()
    email = normalize_lower(payload.get("email"))
    password = payload.get("password")
    phone = payload.get("phone")

    if not name or not email or not password:
        return error(
            "VALIDATION_ERROR",
            "name, email, and password are required",
            {"name": "required", "email": "required", "password": "required"},
        )

    existing = db.session.query(User).filter(func.lower(User.email) == email).first()
    if existing:
        return error("CONFLICT", "Email already registered", {"email": "exists"}, status=409)

    user = User(name=name, email=email, phone=phone, role=UserRoleType.CUSTOMER)
    user.set_password(password)
    profile = CustomerProfile(user=user)
    db.session.add_all([user, profile])
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return error("CONFLICT", "Email already registered", {"email": "exists"}, status=409)

    login_user(user)

    # Email verification
    token = secrets.token_urlsafe(32)
    user.verification_token = token
    user.verification_expires_at = datetime.now(tz=timezone.utc).replace(microsecond=0) # Simple expiry logic could be added
    db.session.commit()
    EmailService.send_verification_email(user, token)
    EmailService.send_internal_account_notification(user)

    return ok({"user": user_summary(user)}, status=201)


@auth_bp.post("/login")
@limiter.limit("20/minute")
def login():
    payload, err = get_json(request)
    if err:
        return err

    email = normalize_lower(payload.get("email"))
    password = payload.get("password")
    if not email or not password:
        return error(
            "VALIDATION_ERROR",
            "email and password are required",
            {"email": "required", "password": "required"},
        )

    user = db.session.query(User).filter(func.lower(User.email) == email).first()
    if not user or not user.check_password(password):
        return error("AUTH_REQUIRED", "Invalid credentials", status=401)
    if not user.is_active:
        return error("FORBIDDEN", "User is inactive", status=403)

    # Login alert (basic check - could be improved with IP/UA history)
    ip_address = request.remote_addr
    user_agent = request.headers.get("User-Agent")
    EmailService.send_login_alert(user, ip_address, user_agent)

    user.last_login_at = datetime.now(tz=timezone.utc)
    db.session.commit()
    login_user(user)
    return ok({"user": user_summary(user)})


@auth_bp.post("/logout")
def logout():
    logout_user()
    return ok({"logged_out": True})


@auth_bp.post("/forgot-password")
@limiter.limit("5/minute")
def forgot_password():
    payload, err = get_json(request)
    if err:
        return err
    email = normalize_lower(payload.get("email"))
    if not email:
        return error("VALIDATION_ERROR", "email is required", {"email": "required"})
    
    user = db.session.query(User).filter(func.lower(User.email) == email).first()
    if user:
        token = secrets.token_urlsafe(32)
        user.password_reset_token = token
        user.password_reset_expires_at = datetime.now(tz=timezone.utc) + timedelta(hours=1)
        db.session.commit()
        EmailService.send_password_reset(user, token)
        
    return ok({"message": "If an account exists, a reset link has been sent."})


@auth_bp.post("/reset-password")
@limiter.limit("5/minute")
def reset_password():
    payload, err = get_json(request)
    if err:
        return err
    token = payload.get("token")
    new_password = payload.get("password")
    if not token or not new_password:
        return error("VALIDATION_ERROR", "token and password are required")
    
    user = db.session.query(User).filter(
        User.password_reset_token == token,
        User.password_reset_expires_at > datetime.now(tz=timezone.utc)
    ).first()
    
    if not user:
        return error("VALIDATION_ERROR", "Invalid or expired token")
    
    user.set_password(new_password)
    user.password_reset_token = None
    user.password_reset_expires_at = None
    db.session.commit()
    EmailService.send_password_changed(user)
    
    return ok({"message": "Password updated successfully."})


@auth_bp.post("/verify-email")
def verify_email():
    payload, err = get_json(request)
    if err:
        return err
    token = payload.get("token")
    if not token:
        return error("VALIDATION_ERROR", "token is required")
    
    user = db.session.query(User).filter_by(verification_token=token).first()
    if not user:
        return error("VALIDATION_ERROR", "Invalid verification link")
    
    user.is_email_verified = True
    user.verification_token = None
    db.session.commit()
    
    return ok({"message": "Email verified successfully."})


@auth_bp.get("/me")
@require_auth
def me():
    user = get_current_user()
    orders_count = db.session.query(Order).filter(Order.customer_id == user.id).count()
    likes_count = db.session.query(RestaurantLike).filter(RestaurantLike.user_id == user.id).count()
    profile = user.customer_profile
    profile_summary = {
        "id": str(profile.id) if profile else None,
        "membership_tier_id": str(profile.membership_tier_id) if profile else None,
        "default_payment_method_id": str(profile.default_payment_method_id) if profile else None,
    }
    return ok(
        {
            "user": user_summary(user),
            "customer_profile": profile_summary,
            "counts": {"orders": orders_count, "likes": likes_count},
        }
    )
