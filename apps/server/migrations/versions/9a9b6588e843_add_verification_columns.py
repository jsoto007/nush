"""Add verification columns

Revision ID: 9a9b6588e843
Revises: d3684eed2e98
Create Date: 2025-12-25 15:20:44.713787

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9a9b6588e843'
down_revision = 'd3684eed2e98'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('verification_token', sa.String(length=128), nullable=True))
    op.add_column('users', sa.Column('verification_expires_at', sa.DateTime(timezone=True), nullable=True))
    # Corrected name to match model
    op.add_column('users', sa.Column('password_reset_token', sa.String(length=128), nullable=True))
    op.add_column('users', sa.Column('password_reset_expires_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('is_email_verified', sa.Boolean(), nullable=False, server_default='false'))


def downgrade():
    op.drop_column('users', 'is_email_verified')
    op.drop_column('users', 'password_reset_expires_at')
    op.drop_column('users', 'password_reset_token')
    op.drop_column('users', 'verification_expires_at')
    op.drop_column('users', 'verification_token')
