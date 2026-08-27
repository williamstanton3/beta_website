"""
Admin CRUD endpoints for chapter events.
All routes require a valid JWT token.
"""

from fastapi import APIRouter, Depends, HTTPException

from app.auth import require_auth
from app.database import get_db_connection
from app.models import EventCreate, EventResponse, EventUpdate

router = APIRouter(prefix="/admin/events", tags=["Admin — Events"])


@router.get("", response_model=list[EventResponse])
def list_events_admin(_=Depends(require_auth)):
    """Return all events ordered by date for the admin events list."""
    with get_db_connection() as conn:
        rows = conn.execute("SELECT * FROM events ORDER BY event_date ASC").fetchall()
    return [
        EventResponse(id=r["id"], title=r["title"], description=r["description"],
                      event_date=r["event_date"], location=r["location"])
        for r in rows
    ]


@router.post("", response_model=EventResponse, status_code=201)
def create_event(payload: EventCreate, _=Depends(require_auth)):
    """Create a new chapter event."""
    with get_db_connection() as conn:
        cursor = conn.execute(
            "INSERT INTO events (title, description, event_date, location) VALUES (?, ?, ?, ?)",
            (payload.title, payload.description, payload.event_date, payload.location),
        )
        row = conn.execute("SELECT * FROM events WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return EventResponse(
        id=row["id"], title=row["title"], description=row["description"],
        event_date=row["event_date"], location=row["location"],
    )


@router.put("/{event_id}", response_model=EventResponse)
def update_event(event_id: int, payload: EventUpdate, _=Depends(require_auth)):
    """Update an existing event. Only include fields you want to change."""
    with get_db_connection() as conn:
        row = conn.execute("SELECT * FROM events WHERE id = ?", (event_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Event not found")

        # Merge: use submitted value if provided, else keep existing
        updated = {
            "title":       payload.title       or row["title"],
            "description": payload.description or row["description"],
            "event_date":  payload.event_date  or row["event_date"],
            "location":    payload.location    or row["location"],
        }
        conn.execute(
            "UPDATE events SET title=?, description=?, event_date=?, location=? WHERE id=?",
            (*updated.values(), event_id),
        )
        updated_row = conn.execute("SELECT * FROM events WHERE id = ?", (event_id,)).fetchone()
    return EventResponse(
        id=updated_row["id"], title=updated_row["title"], description=updated_row["description"],
        event_date=updated_row["event_date"], location=updated_row["location"],
    )


@router.delete("/{event_id}", status_code=204)
def delete_event(event_id: int, _=Depends(require_auth)):
    """Permanently delete an event."""
    with get_db_connection() as conn:
        if not conn.execute("SELECT id FROM events WHERE id = ?", (event_id,)).fetchone():
            raise HTTPException(status_code=404, detail="Event not found")
        conn.execute("DELETE FROM events WHERE id = ?", (event_id,))
