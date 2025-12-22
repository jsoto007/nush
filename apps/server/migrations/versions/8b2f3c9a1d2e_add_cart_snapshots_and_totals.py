"""add cart snapshots and totals

Revision ID: 8b2f3c9a1d2e
Revises: 60cb4a17a107
Create Date: 2025-12-22 15:10:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "8b2f3c9a1d2e"
down_revision = "60cb4a17a107"
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column("carts", "customer_id", existing_type=sa.UUID(), nullable=True)

    op.add_column("carts", sa.Column("promo_id", sa.UUID(), nullable=True))
    op.add_column("carts", sa.Column("membership_id", sa.UUID(), nullable=True))
    op.add_column("carts", sa.Column("subtotal_cents", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("carts", sa.Column("tax_cents", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("carts", sa.Column("fee_cents", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("carts", sa.Column("discount_cents", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("carts", sa.Column("total_cents", sa.Integer(), nullable=False, server_default="0"))

    op.create_index("ix_carts_promo_id", "carts", ["promo_id"])
    op.create_index("ix_carts_membership_id", "carts", ["membership_id"])
    op.create_foreign_key("fk_carts_promo_id_promotions", "carts", "promotions", ["promo_id"], ["id"])
    op.create_foreign_key(
        "fk_carts_membership_id_customer_memberships",
        "carts",
        "customer_memberships",
        ["membership_id"],
        ["id"],
    )

    op.add_column(
        "cart_items",
        sa.Column("name_snapshot", sa.String(length=120), nullable=False, server_default=""),
    )
    op.add_column(
        "cart_items",
        sa.Column("base_price_cents", sa.Integer(), nullable=False, server_default="0"),
    )


def downgrade():
    op.drop_column("cart_items", "base_price_cents")
    op.drop_column("cart_items", "name_snapshot")

    op.drop_constraint("fk_carts_membership_id_customer_memberships", "carts", type_="foreignkey")
    op.drop_constraint("fk_carts_promo_id_promotions", "carts", type_="foreignkey")
    op.drop_index("ix_carts_membership_id", table_name="carts")
    op.drop_index("ix_carts_promo_id", table_name="carts")

    op.drop_column("carts", "total_cents")
    op.drop_column("carts", "discount_cents")
    op.drop_column("carts", "fee_cents")
    op.drop_column("carts", "tax_cents")
    op.drop_column("carts", "subtotal_cents")
    op.drop_column("carts", "membership_id")
    op.drop_column("carts", "promo_id")

    op.alter_column("carts", "customer_id", existing_type=sa.UUID(), nullable=False)
