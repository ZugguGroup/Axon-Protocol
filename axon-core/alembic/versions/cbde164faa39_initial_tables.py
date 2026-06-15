"""initial_tables

Revision ID: cbde164faa39
Revises: 
Create Date: 2026-06-07 23:32:12.414720

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
import pgvector

# revision identifiers, used by Alembic.
revision: str = 'cbde164faa39'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create pgvector extension if not exists
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    # 2. Create agents table
    op.create_table(
        'agents',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('project_id', sa.String(length=100), nullable=False),
        sa.Column('org_id', sa.String(length=100), nullable=True),
        sa.Column('api_key_hash', sa.String(length=255), nullable=False),
        sa.Column('capabilities', sa.JSON(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='active'),
        sa.Column('last_seen_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_agents_project_id', 'agents', ['project_id'])
    op.create_index('ix_agents_org_id', 'agents', ['org_id'])

    # 3. Create memories table
    op.create_table(
        'memories',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('agent_id', sa.UUID(), nullable=False),
        sa.Column('project_id', sa.String(length=100), nullable=False),
        sa.Column('org_id', sa.String(length=100), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('embedding', pgvector.sqlalchemy.Vector(dim=384), nullable=False),
        sa.Column('tags', sa.JSON(), nullable=False),
        sa.Column('scope', sa.String(length=20), nullable=False, server_default='project'),
        sa.Column('ttl', sa.Integer(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_memories_agent_id', 'memories', ['agent_id'])
    op.create_index('ix_memories_project_id', 'memories', ['project_id'])
    op.create_index('ix_memories_project_scope', 'memories', ['project_id', 'scope'])

    # 4. Create locks table
    op.create_table(
        'locks',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('resource_id', sa.String(length=500), nullable=False),
        sa.Column('project_id', sa.String(length=100), nullable=False),
        sa.Column('agent_id', sa.UUID(), nullable=False),
        sa.Column('metadata', sa.JSON(), nullable=False),
        sa.Column('locked_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('resource_id', 'project_id', name='uq_lock_resource_project')
    )

    # 5. Create receipts table
    op.create_table(
        'receipts',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('agent_id', sa.UUID(), nullable=False),
        sa.Column('project_id', sa.String(length=100), nullable=False),
        sa.Column('org_id', sa.String(length=100), nullable=True),
        sa.Column('input_text', sa.Text(), nullable=False),
        sa.Column('input_hash', sa.String(length=64), nullable=False),
        sa.Column('reasoning_steps', sa.JSON(), nullable=False),
        sa.Column('steps_hash', sa.String(length=64), nullable=False),
        sa.Column('output_text', sa.Text(), nullable=False),
        sa.Column('output_hash', sa.String(length=64), nullable=False),
        sa.Column('chain_hash', sa.String(length=64), nullable=False),
        sa.Column('signature', sa.String(length=128), nullable=False),
        sa.Column('parent_receipt_id', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_receipts_agent_id', 'receipts', ['agent_id'])
    op.create_index('ix_receipts_project_id', 'receipts', ['project_id'])


def downgrade() -> None:
    op.drop_table('receipts')
    op.drop_table('locks')
    op.drop_table('memories')
    op.drop_table('agents')
