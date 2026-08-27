"""
Rush (recruitment) API routes.

Delivers structured content blocks for the Rush page. Backed by
app/data/rush_info.json (see app/content_store.py) instead of a database.
"""

from fastapi import APIRouter

from app import content_store
from app.models import RushInfoResponse

router = APIRouter(prefix="/rush", tags=["Rush"])


def _load() -> list[dict]:
    return content_store.load("rush_info.json", [])


@router.get("", response_model=list[RushInfoResponse])
def list_rush_info():
    """
    Return all rush information sections in display order.

    Each section becomes a card on the frontend Rush page.
    """
    items = sorted(_load(), key=lambda r: r["display_order"])
    return [RushInfoResponse(**r) for r in items]
