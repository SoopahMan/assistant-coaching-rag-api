"""Add initial admin user and auth_users table

Revision ID: 1234567890cd
Revises:
Create Date: 2025-08-20 11:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import bcrypt # Impor library bcrypt

# revision identifiers, used by Alembic.
revision: str = '1234567890cd'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Buat tabel auth_users
    op.create_table(
        'auth_users',
        sa.Column('user_id', sa.BigInteger(), primary_key=True, nullable=False),
        sa.Column('username', sa.String(255), nullable=False),
        sa.Column('password', sa.String(255), nullable=False),
        sa.Column('role', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )
    
    hashed_password = bcrypt.hashpw(b'admin123', bcrypt.gensalt()).decode('utf-8')
    
    op.bulk_insert(
        sa.table(
            'auth_users',
            sa.column('username', sa.String(255)),
            sa.column('password', sa.String(255)),
            sa.column('role', sa.Text()),
        ),
        [
            {
                'username': 'admin',
                'password': hashed_password,
                'role': 'admin'
            }
        ]
    )

def downgrade() -> None:
    # Hapus tabel saat downgrade
    op.drop_table('auth_users')