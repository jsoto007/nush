import os

try:
    import stripe
except ImportError:  # pragma: no cover - optional dependency
    stripe = None


def configure_stripe():
    if stripe is None:
        return None
    stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
    api_version = os.getenv("STRIPE_API_VERSION")
    if api_version:
        stripe.api_version = api_version
    return stripe


def create_payment_intent(amount_cents: int, currency: str, metadata: dict | None = None):
    client = configure_stripe()
    if client is None or not client.api_key:
        return None
    return client.PaymentIntent.create(
        amount=amount_cents,
        currency=currency,
        metadata=metadata or {},
        automatic_payment_methods={"enabled": True},
    )


def create_checkout_session(
    line_items: list,
    success_url: str,
    cancel_url: str,
    metadata: dict | None = None,
    customer_email: str | None = None,
):
    client = configure_stripe()
    if client is None or not client.api_key:
        return None
    return client.checkout.Session.create(
        payment_method_types=["card"],
        line_items=line_items,
        mode="payment",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata or {},
        customer_email=customer_email,
    )


def verify_webhook(payload, sig_header):
    client = configure_stripe()
    if client is None:
        return None
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    try:
        event = client.Webhook.construct_event(payload, sig_header, webhook_secret)
        return event
    except (ValueError, client.error.SignatureVerificationError):
        return None
