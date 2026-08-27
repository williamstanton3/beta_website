"""
Announcements API routes.

Featured announcements appear prominently on the home page.
"""

from fastapi import APIRouter

from app.database import get_db_connection
from app.models import AnnouncementResponse

router = APIRouter(prefix="/announcements", tags=["Announcements"])


def _row_to_announcement(row) -> AnnouncementResponse:
    """Convert a sqlite3.Row into an AnnouncementResponse."""
    return AnnouncementResponse(
        id=row["id"],
        title=row["title"],
        content=row["content"],
        posted_at=row["posted_at"],
        is_featured=bool(row["is_featured"]),
    )


@router.get("", response_model=list[AnnouncementResponse])
def list_announcements(featured_only: bool = False):
    """
    Return announcements, optionally filtered to featured items only.

    Query param `featured_only=true` is used by the home page hero section.
    """
    with get_db_connection() as conn:
        if featured_only:
            rows = conn.execute(
                """
                SELECT * FROM announcements
                WHERE is_featured = 1
                ORDER BY posted_at DESC
                """
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM announcements ORDER BY posted_at DESC"
            ).fetchall()

    return [_row_to_announcement(row) for row in rows]
