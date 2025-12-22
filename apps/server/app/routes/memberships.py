from flask import Blueprint, request

from ..auth_helpers import get_current_user, require_auth
from ..extensions import db
from ..models import CustomerMembership, MembershipSource, MembershipStatus, MembershipTier
from .response import error, ok
from .validators import get_json, parse_uuid


memberships_bp = Blueprint("memberships", __name__, url_prefix="/memberships")


@memberships_bp.get("/tiers")
def list_tiers():
    tiers = db.session.query(MembershipTier).order_by(MembershipTier.created_at.asc()).all()
    return ok(
        {
            "tiers": [
                {
                    "id": str(tier.id),
                    "name": tier.name,
                    "description": tier.description,
                    "discount_percent": tier.discount_percent,
                    "fee_rules": tier.fee_rules,
                    "is_active": tier.is_active,
                }
                for tier in tiers
            ]
        }
    )


@memberships_bp.post("/subscribe")
@require_auth
def subscribe():
    payload, err = get_json(request)
    if err:
        return err
    tier_id, err = parse_uuid(payload.get("tier_id"), "tier_id")
    if err:
        return err
    tier = db.session.get(MembershipTier, tier_id)
    if not tier:
        return error("NOT_FOUND", "Tier not found", status=404)
    if not tier.is_active:
        return error("VALIDATION_ERROR", "Tier is inactive", {"tier_id": "inactive"})
    user = get_current_user()
    existing = (
        db.session.query(CustomerMembership)
        .filter_by(customer_id=user.id, status=MembershipStatus.ACTIVE)
        .first()
    )
    if existing:
        return error("CONFLICT", "Membership already active", status=409)
    membership = CustomerMembership(
        customer_id=user.id,
        tier_id=tier.id,
        status=MembershipStatus.ACTIVE,
        source=MembershipSource.PAID,
    )
    db.session.add(membership)
    db.session.commit()
    return ok({"membership_id": str(membership.id)}, status=201)


@memberships_bp.post("/cancel")
@require_auth
def cancel():
    user = get_current_user()
    membership = (
        db.session.query(CustomerMembership)
        .filter_by(customer_id=user.id, status=MembershipStatus.ACTIVE)
        .first()
    )
    if not membership:
        return error("NOT_FOUND", "Active membership not found", status=404)
    membership.status = MembershipStatus.CANCELLED
    db.session.commit()
    return ok({"membership_id": str(membership.id), "status": membership.status.value})


@memberships_bp.get("/me")
@require_auth
def me_membership():
    user = get_current_user()
    membership = (
        db.session.query(CustomerMembership)
        .filter_by(customer_id=user.id)
        .order_by(CustomerMembership.created_at.desc())
        .first()
    )
    if not membership:
        return ok({"membership": None})
    return ok(
        {
            "membership": {
                "id": str(membership.id),
                "tier_id": str(membership.tier_id),
                "status": membership.status.value,
                "source": membership.source.value if membership.source else None,
            },
            "receipts": [
                {
                    "id": str(receipt.id),
                    "status": receipt.status.value,
                    "amount_cents": receipt.amount_cents,
                }
                for receipt in membership.receipts
            ],
        }
    )
