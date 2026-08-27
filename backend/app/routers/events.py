"""
Events API routes.

Powers the Events page calendar and list views. Backed by
app/data/events.json (see app/content_store.py) instead of a database.
"""

from fastapi import APIRouter, HTTPException

from app import content_store
from app.models import EventResponse

router = APIRouter(prefix="/events", tags=["Events"])

DEFAULT_EVENTS: list[dict] = []


def _load() -> list[dict]:
    return content_store.load("events.json", DEFAULT_EVENTS)


@router.get("", response_model=list[EventResponse])
def list_events():
    """
    Return all chapter events ordered by date (soonest first).

    The frontend splits these into upcoming vs. past based on today's date.
    """
    events = sorted(_load(), key=lambda e: e["event_date"])
    return [EventResponse(**e) for e in events]


@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: int):
    """Return one event by ID."""
    for event in _load():
        if event["id"] == event_id:
            return EventResponse(**event)
    raise HTTPException(status_code=404, detail="Event not found")
