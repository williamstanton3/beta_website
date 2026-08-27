"""
Admin CRUD endpoints for news announcements.
All routes require a valid JWT token. Backed by app/data/announcements.json.
"""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException

from app import content_store
from app.auth import require_auth
from app.models import AnnouncementCreate, AnnouncementResponse, AnnouncementUpdate

router = APIRouter(prefix="/admin/announcements", tags=["Admin — Announcements"])


def _load() -> list[dict]:
    return content_store.load("announcements.json", [])


def _save(items: list[dict]) -> None:
    content_store.save("announcements.json", items)


@router.get("", response_model=list[AnnouncementResponse])
def list_announcements_admin(_=Depends(require_auth)):
    """Return all announcements for the admin panel."""
    items = sorted(_load(), key=lambda a: a["posted_at"], reverse=True)
    return [AnnouncementResponse(**a) for a in items]


@router.post("", response_model=AnnouncementResponse, status_code=201)
def create_announcement(payload: AnnouncementCreate, _=Depends(require_auth)):
    """Post a new announcement. posted_at is set automatically to now."""
    items = _load()
    announcement = {
        "id": content_store.next_id(items),
        "title": payload.title,
        "content": payload.content,
        "posted_at": datetime.utcnow().strftime("%Y-%m-%d"),
        "is_featured": payload.is_featured,
    }
    items.append(announcement)
    _save(items)
    return AnnouncementResponse(**announcement)


@router.put("/{ann_id}", response_model=AnnouncementResponse)
def update_announcement(ann_id: int, payload: AnnouncementUpdate, _=Depends(require_auth)):
    """Update an announcement's text or featured status."""
    items = _load()
    for item in items:
        if item["id"] == ann_id:
            updates = payload.model_dump(exclude_unset=True)
            item.update({k: v for k, v in updates.items() if v is not None})
            _save(items)
            return AnnouncementResponse(**item)
    raise HTTPException(status_code=404, detail="Announcement not found")


@router.delete("/{ann_id}", status_code=204)
def delete_announcement(ann_id: int, _=Depends(require_auth)):
    """Delete an announcement."""
    items = _load()
    remaining = [a for a in items if a["id"] != ann_id]
    if len(remaining) == len(items):
        raise HTTPException(status_code=404, detail="Announcement not found")
    _save(remaining)
