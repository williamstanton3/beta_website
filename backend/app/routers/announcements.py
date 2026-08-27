"""
Announcements API routes.

Featured announcements appear prominently on the home page. Backed by
app/data/announcements.json (see app/content_store.py) instead of a database.
"""

from fastapi import APIRouter

from app import content_store
from app.models import AnnouncementResponse

router = APIRouter(prefix="/announcements", tags=["Announcements"])


def _load() -> list[dict]:
    return content_store.load("announcements.json", [])


@router.get("", response_model=list[AnnouncementResponse])
def list_announcements(featured_only: bool = False):
    """
    Return announcements, optionally filtered to featured items only.

    Query param `featured_only=true` is used by the home page hero section.
    """
    items = _load()
    if featured_only:
        items = [a for a in items if a["is_featured"]]
    items = sorted(items, key=lambda a: a["posted_at"], reverse=True)
    return [AnnouncementResponse(**a) for a in items]
