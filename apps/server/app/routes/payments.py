from flask import Blueprint, request

from ..auth_helpers import get_current_user, require_auth
from ..extensions import db
from ..models import MembershipReceipt, OrderReceipt, PaymentMethod
from ..services.email_service import EmailService
from .response import error, ok
from .validators import get_json


payments_bp = Blueprint("payments", __name__, url_prefix="/payments")
receipts_bp = Blueprint("receipts", __name__, url_prefix="/receipts")


@payments_bp.get("/methods")
@require_auth
def list_payment_methods():
    user = get_current_user()
    methods = db.session.query(PaymentMethod).filter_by(user_id=user.id).all()
    return ok(
        {
            "methods": [
                {
                    "id": str(method.id),
                    "brand": method.brand,
                    "last4": method.last4,
                    "exp_month": method.exp_month,
                    "exp_year": method.exp_year,
                }
                for method in methods
            ]
        }
    )


@payments_bp.post("/methods")
@require_auth
def attach_payment_method():
    payload, err = get_json(request)
    if err:
        return err
    user = get_current_user()
    stripe_payment_method_id = payload.get("stripe_payment_method_id")
    if not stripe_payment_method_id:
        return error("VALIDATION_ERROR", "stripe_payment_method_id is required", {"stripe_payment_method_id": "required"})
    method = PaymentMethod(
        user_id=user.id,
        stripe_payment_method_id=stripe_payment_method_id,
        brand=payload.get("brand"),
        last4=payload.get("last4"),
        exp_month=payload.get("exp_month"),
        exp_year=payload.get("exp_year"),
        stripe_customer_id=payload.get("stripe_customer_id"),
    )
    db.session.add(method)
    db.session.commit()
    EmailService.send_payment_method_updated(user, method)
    return ok({"payment_method_id": str(method.id)}, status=201)


@receipts_bp.get("/orders/<uuid:order_id>")
@require_auth
def get_order_receipt(order_id):
    user = get_current_user()
    receipt = db.session.query(OrderReceipt).filter_by(order_id=order_id, customer_id=user.id).first()
    if not receipt:
        return error("NOT_FOUND", "Receipt not found", status=404)
    return ok(
        {
            "receipt": {
                "id": str(receipt.id),
                "status": receipt.status.value,
                "amount_cents": receipt.amount_cents,
                "currency": receipt.currency,
                "receipt_url": receipt.receipt_url,
            }
        }
    )


@receipts_bp.get("/memberships/<uuid:membership_id>")
@require_auth
def get_membership_receipt(membership_id):
    user = get_current_user()
    receipt = (
        db.session.query(MembershipReceipt)
        .filter_by(membership_id=membership_id, customer_id=user.id)
        .order_by(MembershipReceipt.created_at.desc())
        .first()
    )
    if not receipt:
        return error("NOT_FOUND", "Receipt not found", status=404)
    return ok(
        {
            "receipt": {
                "id": str(receipt.id),
                "status": receipt.status.value,
                "amount_cents": receipt.amount_cents,
                "currency": receipt.currency,
                "receipt_url": receipt.receipt_url,
            }
        }
    )
