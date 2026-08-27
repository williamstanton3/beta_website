"""
Events API routes.

Powers the Events page calendar and list views.
"""

from fastapi import APIRouter, HTTPException

from app.database import get_db_connection
from app.models import EventResponse

router = APIRouter(prefix="/events", tags=["Events"])


def _row_to_event(row) -> EventResponse:
    """Convert a sqlite3.Row into a validated EventResponse."""
    return EventResponse(
        id=row["id"],
        title=row["title"],
        description=row["description"],
        event_date=row["event_date"],
        location=row["location"],
    )


@router.get("", response_model=list[EventResponse])
def list_events():
    """
    Return all chapter events ordered by date (soonest first).

    The frontend splits these into upcoming vs. past based on today's date.
    """
    with get_db_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM events ORDER BY event_date ASC"
        ).fetchall()

    return [_row_to_event(row) for row in rows]


@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: int):
    """Return one event by ID."""
    with get_db_connection() as conn:
        row = conn.execute(
            "SELECT * FROM events WHERE id = ?",
            (event_id,),
        ).fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail="Event not found")

    return _row_to_event(row)
