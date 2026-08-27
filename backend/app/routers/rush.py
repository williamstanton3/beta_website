"""
Rush (recruitment) API routes.

Delivers structured content blocks for the Rush page.
"""

from fastapi import APIRouter

from app.database import get_db_connection
from app.models import RushInfoResponse

router = APIRouter(prefix="/rush", tags=["Rush"])


@router.get("", response_model=list[RushInfoResponse])
def list_rush_info():
    """
    Return all rush information sections in display order.

    Each section becomes a card on the frontend Rush page.
    """
    with get_db_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM rush_info ORDER BY display_order ASC"
        ).fetchall()

    return [
        RushInfoResponse(
            id=row["id"],
            section_title=row["section_title"],
            section_content=row["section_content"],
            display_order=row["display_order"],
        )
        for row in rows
    ]
