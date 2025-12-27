from flask import Blueprint, request, current_app
from ..services.stripe_client import verify_webhook
from ..extensions import db
from ..models import Order, OrderStatus, PaymentIntentRecord, PaymentIntentStatus, OrderReceipt, ChargeStatus
from ..services.email_service import EmailService
import logging

webhooks_bp = Blueprint("webhooks", __name__, url_prefix="/webhooks")

@webhooks_bp.post("/stripe")
def stripe_webhook():
    payload = request.get_data()
    sig_header = request.headers.get("Stripe-Signature")

    event = verify_webhook(payload, sig_header)
    if not event:
        return "Invalid payload or signature", 400

    # Handle the event
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        handle_checkout_session_completed(session)
    elif event["type"] == "payment_intent.succeeded":
        intent = event["data"]["object"]
        handle_payment_intent_succeeded(intent)
    elif event["type"] == "payment_intent.payment_failed":
        intent = event["data"]["object"]
        handle_payment_intent_failed(intent)
    
    return {"status": "success"}, 200

def handle_checkout_session_completed(session):
    order_id = session.get("metadata", {}).get("order_id")
    if not order_id:
        return

    order = db.session.get(Order, order_id)
    if order:
        should_email = order.status != OrderStatus.CONFIRMED
        order.status = OrderStatus.CONFIRMED
        db.session.commit()
        if should_email:
            EmailService.send_order_confirmation(order.customer, order)

def handle_payment_intent_succeeded(intent):
    record = db.session.query(PaymentIntentRecord).filter_by(stripe_payment_intent_id=intent["id"]).first()
    if record:
        record.status = PaymentIntentStatus.SUCCEEDED
        order = record.order
        if order:
            should_email = order.status != OrderStatus.CONFIRMED
            order.status = OrderStatus.CONFIRMED
            # Ensure receipt exists
            receipt = db.session.query(OrderReceipt).filter_by(order_id=order.id).first()
            if receipt:
                receipt.status = ChargeStatus.SUCCEEDED
            db.session.commit()
            if should_email:
                EmailService.send_order_confirmation(order.customer, order)

def handle_payment_intent_failed(intent):
    record = db.session.query(PaymentIntentRecord).filter_by(stripe_payment_intent_id=intent["id"]).first()
    if record:
        record.status = PaymentIntentStatus.FAILED
        order = record.order
        if order:
            # Trigger failure email
            EmailService.send_email(
                order.customer.email,
                f"Payment Failed for Order #{order.id}",
                "emails/payment_failed.html",
                user=order.customer,
                order=order,
                error_message=intent.get("last_payment_error", {}).get("message", "Payment failed.")
            )
            db.session.commit()
