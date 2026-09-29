"""usuarios con auth

Revision ID: 99c4bc711470
Revises: 7901d431595c
Create Date: 2026-09-29 13:31:00.238591

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '99c4bc711470'
down_revision: Union[str, Sequence[str], None] = '7901d431595c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
