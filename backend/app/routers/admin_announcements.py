"""
Admin CRUD endpoints for news announcements.
All routes require a valid JWT token.
"""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException

from app.auth import require_auth
from app.database import get_db_connection
from app.models import AnnouncementCreate, AnnouncementResponse, AnnouncementUpdate

router = APIRouter(prefix="/admin/announcements", tags=["Admin — Announcements"])


@router.get("", response_model=list[AnnouncementResponse])
def list_announcements_admin(_=Depends(require_auth)):
    """Return all announcements for the admin panel."""
    with get_db_connection() as conn:
        rows = conn.execute("SELECT * FROM announcements ORDER BY posted_at DESC").fetchall()
    return [AnnouncementResponse(
        id=r["id"], title=r["title"], content=r["content"],
        posted_at=r["posted_at"], is_featured=bool(r["is_featured"]),
    ) for r in rows]


@router.post("", response_model=AnnouncementResponse, status_code=201)
def create_announcement(payload: AnnouncementCreate, _=Depends(require_auth)):
    """Post a new announcement. posted_at is set automatically to now."""
    posted_at = datetime.utcnow().strftime("%Y-%m-%d")
    with get_db_connection() as conn:
        cursor = conn.execute(
            "INSERT INTO announcements (title, content, posted_at, is_featured) VALUES (?, ?, ?, ?)",
            (payload.title, payload.content, posted_at, int(payload.is_featured)),
        )
        row = conn.execute("SELECT * FROM announcements WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return AnnouncementResponse(
        id=row["id"], title=row["title"], content=row["content"],
        posted_at=row["posted_at"], is_featured=bool(row["is_featured"]),
    )


@router.put("/{ann_id}", response_model=AnnouncementResponse)
def update_announcement(ann_id: int, payload: AnnouncementUpdate, _=Depends(require_auth)):
    """Update an announcement's text or featured status."""
    with get_db_connection() as conn:
        row = conn.execute("SELECT * FROM announcements WHERE id = ?", (ann_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Announcement not found")
        conn.execute(
            "UPDATE announcements SET title=?, content=?, is_featured=? WHERE id=?",
            (
                payload.title       if payload.title is not None       else row["title"],
                payload.content     if payload.content is not None     else row["content"],
                int(payload.is_featured) if payload.is_featured is not None else row["is_featured"],
                ann_id,
            ),
        )
        updated = conn.execute("SELECT * FROM announcements WHERE id = ?", (ann_id,)).fetchone()
    return AnnouncementResponse(
        id=updated["id"], title=updated["title"], content=updated["content"],
        posted_at=updated["posted_at"], is_featured=bool(updated["is_featured"]),
    )


@router.delete("/{ann_id}", status_code=204)
def delete_announcement(ann_id: int, _=Depends(require_auth)):
    """Delete an announcement."""
    with get_db_connection() as conn:
        if not conn.execute("SELECT id FROM announcements WHERE id = ?", (ann_id,)).fetchone():
            raise HTTPException(status_code=404, detail="Announcement not found")
        conn.execute("DELETE FROM announcements WHERE id = ?", (ann_id,))
