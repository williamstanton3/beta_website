"""
Admin CRUD endpoints for rush/recruitment page content sections.
All routes require a valid JWT token. Backed by app/data/rush_info.json.
"""

from fastapi import APIRouter, Depends, HTTPException

from app import content_store
from app.auth import require_auth
from app.models import RushInfoCreate, RushInfoResponse, RushInfoUpdate

router = APIRouter(prefix="/admin/rush", tags=["Admin — Rush"])


def _load() -> list[dict]:
    return content_store.load("rush_info.json", [])


def _save(items: list[dict]) -> None:
    content_store.save("rush_info.json", items)


@router.get("", response_model=list[RushInfoResponse])
def list_rush_info_admin(_=Depends(require_auth)):
    """Return all rush sections ordered for the admin panel."""
    items = sorted(_load(), key=lambda r: r["display_order"])
    return [RushInfoResponse(**r) for r in items]


@router.post("", response_model=RushInfoResponse, status_code=201)
def create_rush_info(payload: RushInfoCreate, _=Depends(require_auth)):
    """Add a new rush page content section."""
    items = _load()
    section = {"id": content_store.next_id(items), **payload.model_dump()}
    items.append(section)
    _save(items)
    return RushInfoResponse(**section)


@router.put("/{section_id}", response_model=RushInfoResponse)
def update_rush_info(section_id: int, payload: RushInfoUpdate, _=Depends(require_auth)):
    """Update a rush section's text or display order."""
    items = _load()
    for item in items:
        if item["id"] == section_id:
            updates = payload.model_dump(exclude_unset=True)
            item.update({k: v for k, v in updates.items() if v is not None})
            _save(items)
            return RushInfoResponse(**item)
    raise HTTPException(status_code=404, detail="Rush section not found")


@router.delete("/{section_id}", status_code=204)
def delete_rush_info(section_id: int, _=Depends(require_auth)):
    """Delete a rush page section."""
    items = _load()
    remaining = [r for r in items if r["id"] != section_id]
    if len(remaining) == len(items):
        raise HTTPException(status_code=404, detail="Rush section not found")
    _save(remaining)
