"""
Admin endpoints for viewing and deleting contact form submissions.
All routes require a valid JWT token. Backed by app/data/contact_messages.json.
"""

from fastapi import APIRouter, Depends, HTTPException

from app import content_store
from app.auth import require_auth
from app.models import ContactMessageAdminResponse

router = APIRouter(prefix="/admin/messages", tags=["Admin — Messages"])


def _load() -> list[dict]:
    return content_store.load("contact_messages.json", [])


def _save(items: list[dict]) -> None:
    content_store.save("contact_messages.json", items)


@router.get("", response_model=list[ContactMessageAdminResponse])
def list_messages_admin(_=Depends(require_auth)):
    """Return all contact form submissions, newest first."""
    items = sorted(_load(), key=lambda m: m["submitted_at"], reverse=True)
    return [ContactMessageAdminResponse(**m) for m in items]


@router.delete("/{message_id}", status_code=204)
def delete_message(message_id: int, _=Depends(require_auth)):
    """Delete a contact form submission once it's been handled."""
    items = _load()
    remaining = [m for m in items if m["id"] != message_id]
    if len(remaining) == len(items):
        raise HTTPException(status_code=404, detail="Message not found")
    _save(remaining)
