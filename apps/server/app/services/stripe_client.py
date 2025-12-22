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
