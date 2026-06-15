"""link projects and cleanup agents

Revision ID: 850b5ac488b1
Revises: 242e88a38b1f
Create Date: 2026-06-15 02:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '850b5ac488b1'
down_revision: Union[str, Sequence[str], None] = '242e88a38b1f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Ensure default migration tenant exists
    default_user_id = '00000000-0000-0000-0000-000000000000'
    default_project_id = '00000000-0000-0000-0000-000000000001'
    
    op.execute(f"""
        INSERT INTO users (id, email, password_hash, created_at)
        VALUES ('{default_user_id}', 'migration-default@axon.local', 'invalid-hash', now())
        ON CONFLICT (email) DO NOTHING
    """)
    op.execute(f"""
        INSERT INTO projects (id, name, owner_id, api_key_hash, created_at)
        VALUES ('{default_project_id}', 'Default Project', '{default_user_id}', 'invalid-hash', now())
        ON CONFLICT DO NOTHING
    """)

    # 2. Cleanup project_id formats to be UUID compliant
    for table in ['agents', 'memories', 'locks', 'receipts', 'messages']:
        op.execute(f"""
            UPDATE {table}
            SET project_id = '{default_project_id}'
            WHERE project_id IS NULL OR project_id = '' OR project_id NOT LIKE '________-____-____-____-____________'
        """)

    # 3. Alter column types to UUID and link foreign keys
    for table in ['agents', 'memories', 'locks', 'receipts', 'messages']:
        op.execute(f"ALTER TABLE {table} ALTER COLUMN project_id TYPE UUID USING project_id::UUID")
        op.create_foreign_key(
            f"fk_{table}_project_id",
            table, "projects",
            ["project_id"], ["id"],
            ondelete="CASCADE"
        )
        
    # 4. Remove api_key_hash from agents
    op.drop_column('agents', 'api_key_hash')


def downgrade() -> None:
    for table in ['agents', 'memories', 'locks', 'receipts', 'messages']:
        op.drop_constraint(f"fk_{table}_project_id", table, type_="foreignkey")
        op.execute(f"ALTER TABLE {table} ALTER COLUMN project_id TYPE VARCHAR(100)")
        
    op.add_column('agents', sa.Column('api_key_hash', sa.VARCHAR(255), nullable=True))
