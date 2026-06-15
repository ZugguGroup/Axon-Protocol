"""add messages table

Revision ID: ea0f85b7364b
Revises: cbde164faa39
Create Date: 2026-06-14 23:25:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'ea0f85b7364b'
down_revision: Union[str, Sequence[str], None] = 'cbde164faa39'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'messages',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('sender_id', sa.UUID(), nullable=False),
        sa.Column('recipient_id', sa.UUID(), nullable=True),
        sa.Column('project_id', sa.String(length=100), nullable=False),
        sa.Column('topic', sa.String(length=255), nullable=True),
        sa.Column('payload', sa.JSON(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='sent'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['sender_id'], ['agents.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['recipient_id'], ['agents.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_messages_project_id', 'messages', ['project_id'])
    op.create_index('ix_messages_topic', 'messages', ['topic'])


def downgrade() -> None:
    op.drop_table('messages')
