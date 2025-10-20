"""merge heads

Revision ID: cd1fcf3c9dd0
Revises: ff380ad3f9a6, b17623991d40
Create Date: 2025-08-28 11:57:15.447358

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cd1fcf3c9dd0'
down_revision: Union[str, Sequence[str], None] = ('ff380ad3f9a6', 'b17623991d40')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
