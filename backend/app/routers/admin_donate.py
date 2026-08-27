"""
Admin endpoint for editing the donation page content.
Officers can change the headline, text, payment link, and impact bullets
without redeploying the app. Backed by app/data/donate_info.json.
"""

from fastapi import APIRouter, Depends

from app import content_store
from app.auth import require_auth
from app.models import DonateInfoResponse, DonateInfoUpdate

router = APIRouter(prefix="/admin/donate", tags=["Admin — Donate"])

DEFAULT_DONATE_INFO = {
    "headline": "Support Beta Sigma",
    "mission_text": "Your donation supports brotherhood, scholarship, and service.",
    "impact_bullets": [],
    "payment_link": "#",
    "payment_button_text": "Donate Now",
    "goal_amount": None,
}


def _load() -> dict:
    return content_store.load("donate_info.json", DEFAULT_DONATE_INFO)


def _save(data: dict) -> None:
    content_store.save("donate_info.json", data)


@router.get("", response_model=DonateInfoResponse)
def get_donate_info_admin(_=Depends(require_auth)):
    """Return the current donation page content for editing."""
    return DonateInfoResponse(id=1, **_load())


@router.put("", response_model=DonateInfoResponse)
def update_donate_info(payload: DonateInfoUpdate, _=Depends(require_auth)):
    """Update the donation page content. All fields are optional."""
    data = _load()
    updates = payload.model_dump(exclude_unset=True)
    data.update({k: v for k, v in updates.items() if v is not None})
    _save(data)
    return DonateInfoResponse(id=1, **data)
