import os


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///nush.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "")
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = os.getenv("SESSION_COOKIE_SAMESITE", "Lax")
    SESSION_COOKIE_SECURE = os.getenv("SESSION_COOKIE_SECURE", "false").lower() == "true"
    PAYMENTS_MOCK_MODE = os.getenv("PAYMENTS_MOCK_MODE", "true").lower() == "true"
    GUEST_CART_COOKIE_NAME = os.getenv("GUEST_CART_COOKIE_NAME", "guest_cart_id")
    STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
    STRIPE_API_VERSION = os.getenv("STRIPE_API_VERSION", "")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
    MAILGUN_DOMAIN = os.getenv("MAILGUN_DOMAIN", "")
    MAILGUN_API_KEY = os.getenv("MAILGUN_API_KEY", "")
    MAILGUN_FROM = os.getenv("MAILGUN_FROM", "")
    MAILGUN_SENDER = os.getenv("MAILGUN_SENDER", "")
    MAILGUN_FROM_EMAIL = os.getenv("MAILGUN_FROM_EMAIL", "")
    MAILGUN_BASE_URL = os.getenv("MAILGUN_BASE_URL", "")
    MAILGUN_API_BASE = os.getenv("MAILGUN_API_BASE", "")
    INTERNAL_NOTIFICATION_EMAIL = os.getenv("INTERNAL_NOTIFICATION_EMAIL", "nush@sotodev.com")
