"""
Admin CRUD endpoints for chapter events.
All routes require a valid JWT token. Backed by app/data/events.json.
"""

from fastapi import APIRouter, Depends, HTTPException

from app import content_store
from app.auth import require_auth
from app.models import EventCreate, EventResponse, EventUpdate

router = APIRouter(prefix="/admin/events", tags=["Admin — Events"])


def _load() -> list[dict]:
    return content_store.load("events.json", [])


def _save(events: list[dict]) -> None:
    content_store.save("events.json", events)


@router.get("", response_model=list[EventResponse])
def list_events_admin(_=Depends(require_auth)):
    """Return all events ordered by date for the admin events list."""
    events = sorted(_load(), key=lambda e: e["event_date"])
    return [EventResponse(**e) for e in events]


@router.post("", response_model=EventResponse, status_code=201)
def create_event(payload: EventCreate, _=Depends(require_auth)):
    """Create a new chapter event."""
    events = _load()
    event = {"id": content_store.next_id(events), **payload.model_dump()}
    events.append(event)
    _save(events)
    return EventResponse(**event)


@router.put("/{event_id}", response_model=EventResponse)
def update_event(event_id: int, payload: EventUpdate, _=Depends(require_auth)):
    """Update an existing event. Only include fields you want to change."""
    events = _load()
    for event in events:
        if event["id"] == event_id:
            updates = payload.model_dump(exclude_unset=True)
            event.update({k: v for k, v in updates.items() if v is not None})
            _save(events)
            return EventResponse(**event)
    raise HTTPException(status_code=404, detail="Event not found")


@router.delete("/{event_id}", status_code=204)
def delete_event(event_id: int, _=Depends(require_auth)):
    """Permanently delete an event."""
    events = _load()
    remaining = [e for e in events if e["id"] != event_id]
    if len(remaining) == len(events):
        raise HTTPException(status_code=404, detail="Event not found")
    _save(remaining)
