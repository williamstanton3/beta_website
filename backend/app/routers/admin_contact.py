"""
Admin endpoint for editing the Contact page's president info.

Officers can update the president's name/email each year without
redeploying the app — see app/routers/contact.py for the public read side.
Backed by app/data/contact_info.json.
"""

from fastapi import APIRouter, Depends

from app import content_store
from app.auth import require_auth
from app.models import ContactInfoResponse, ContactInfoUpdate

router = APIRouter(prefix="/admin/contact", tags=["Admin — Contact"])

DEFAULT_CONTACT_INFO = {"president_name": "", "president_email": ""}


def _load() -> dict:
    return content_store.load("contact_info.json", DEFAULT_CONTACT_INFO)


def _save(data: dict) -> None:
    content_store.save("contact_info.json", data)


@router.get("", response_model=ContactInfoResponse)
def get_contact_info_admin(_=Depends(require_auth)):
    """Return the current president info for editing."""
    return ContactInfoResponse(**_load())


@router.put("", response_model=ContactInfoResponse)
def update_contact_info(payload: ContactInfoUpdate, _=Depends(require_auth)):
    """Update the president's name/email. Both fields are optional."""
    data = _load()
    updates = payload.model_dump(exclude_unset=True)
    data.update({k: v for k, v in updates.items() if v is not None})
    _save(data)
    return ContactInfoResponse(**data)
