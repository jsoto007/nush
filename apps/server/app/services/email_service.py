import requests
from flask import current_app, render_template


class EmailService:
    @staticmethod
    def send_email(to_email, subject, template_name, **kwargs):
        """
        Sends an email using the Mailgun API.
        :param to_email: Recipient email address.
        :param subject: Email subject.
        :param template_name: Path to the Jinja2 template (e.g., 'emails/order_receipt.html').
        :param kwargs: Variables to pass to the template.
        """
        config = current_app.config
        mailgun_domain = config.get("MAILGUN_DOMAIN")
        mailgun_api_key = config.get("MAILGUN_API_KEY")
        sender_email = (
            config.get("MAILGUN_FROM")
            or config.get("MAILGUN_SENDER")
            or config.get("MAILGUN_FROM_EMAIL")
            or (f"no-reply@{mailgun_domain}" if mailgun_domain else None)
        )
        base_url = (
            config.get("MAILGUN_BASE_URL")
            or config.get("MAILGUN_API_BASE")
            or "https://api.mailgun.net"
        )

        if not mailgun_api_key or not mailgun_domain:
            current_app.logger.warning("Mailgun credentials not configured. Skipping email.")
            return False
        if not sender_email:
            current_app.logger.warning("Mailgun sender email not configured. Skipping email.")
            return False

        if "frontend_url" not in kwargs:
            kwargs["frontend_url"] = config.get("FRONTEND_URL", "")

        # Render HTML and Text versions
        html_content = render_template(template_name, **kwargs)
        
        # Simple text version (could be improved with a secondary text template if needed)
        text_content = kwargs.get('text_body', f"Please view this email in an HTML-compatible client. Subject: {subject}")

        try:
            response = requests.post(
                f"{base_url.rstrip('/')}/v3/{mailgun_domain}/messages",
                auth=("api", mailgun_api_key),
                data={
                    "from": sender_email,
                    "to": [to_email],
                    "subject": subject,
                    "text": text_content,
                    "html": html_content,
                },
                timeout=10
            )
            response.raise_for_status()
            return True
        except requests.exceptions.RequestException as e:
            response = getattr(e, "response", None)
            detail = f" status={response.status_code} body={response.text}" if response else ""
            current_app.logger.error(f"Failed to send email via Mailgun: {e}{detail}")
            return False

    @staticmethod
    def send_password_reset(user, token):
        reset_url = f"{current_app.config.get('FRONTEND_URL', '')}/reset-password?token={token}"
        return EmailService.send_email(
            user.email,
            "Password Reset Request",
            "emails/password_reset.html",
            user=user,
            reset_url=reset_url
        )

    @staticmethod
    def send_order_confirmation(user, order):
        return EmailService.send_email(
            user.email,
            f"Order Confirmation #{order.id}",
            "emails/order_receipt.html",
            user=user,
            order=order
        )

    @staticmethod
    def send_status_update(user, order):
        return EmailService.send_email(
            user.email,
            f"Update on your Order #{order.id}",
            "emails/order_status_update.html",
            user=user,
            order=order
        )
    
    @staticmethod
    def send_verification_email(user, token):
        verification_url = f"{current_app.config.get('FRONTEND_URL', '')}/verify-email?token={token}"
        return EmailService.send_email(
            user.email,
            "Verify Your Email",
            "emails/email_verification.html",
            user=user,
            verification_url=verification_url
        )

    @staticmethod
    def send_login_alert(user, ip_address, user_agent):
        return EmailService.send_email(
            user.email,
            "New Sign-In Alert",
            "emails/sign_in_alert.html",
            user=user,
            ip_address=ip_address,
            user_agent=user_agent
        )

    @staticmethod
    def send_password_changed(user):
        return EmailService.send_email(
            user.email,
            "Password Updated",
            "emails/password_changed.html",
            user=user
        )

    @staticmethod
    def send_payment_method_updated(user, payment_method):
        return EmailService.send_email(
            user.email,
            "Payment Method Updated",
            "emails/payment_method_updated.html",
            user=user,
            brand=payment_method.brand,
            last4=payment_method.last4,
            exp_month=payment_method.exp_month,
            exp_year=payment_method.exp_year
        )

    @staticmethod
    def send_invitation(email, restaurant_name, invite_url):
        return EmailService.send_email(
            email,
            f"Invitation to join {restaurant_name}",
            "emails/invitation.html",
            restaurant_name=restaurant_name,
            invite_url=invite_url
        )

    @staticmethod
    def send_marketing_email(user, subject, message):
        return EmailService.send_email(
            user.email,
            subject,
            "emails/marketing.html",
            user=user,
            message=message
        )

    @staticmethod
    def send_internal_account_notification(user):
        internal_email = current_app.config.get(
            "INTERNAL_NOTIFICATION_EMAIL", "nush@sotodev.com"
        )
        if not internal_email:
            current_app.logger.warning("Internal notification email not configured.")
            return False
        return EmailService.send_email(
            internal_email,
            "New Nush account created",
            "emails/internal_account_notification.html",
            user=user,
            text_body=f"New Nush account created: {user.name} <{user.email}>",
        )
