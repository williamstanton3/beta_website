"""
Admin endpoint for editing the donation page content.
Officers can change the headline, text, payment link, and impact bullets
without redeploying the app.
"""

import json

from fastapi import APIRouter, Depends, HTTPException

from app.auth import require_auth
from app.database import get_db_connection
from app.models import DonateInfoResponse, DonateInfoUpdate

router = APIRouter(prefix="/admin/donate", tags=["Admin — Donate"])


def _row_to_response(row) -> DonateInfoResponse:
    return DonateInfoResponse(
        id=row["id"],
        headline=row["headline"],
        mission_text=row["mission_text"],
        impact_bullets=json.loads(row["impact_bullets"]),
        payment_link=row["payment_link"],
        payment_button_text=row["payment_button_text"],
        goal_amount=row["goal_amount"],
    )


@router.get("", response_model=DonateInfoResponse)
def get_donate_info_admin(_=Depends(require_auth)):
    """Return the current donation page content for editing."""
    with get_db_connection() as conn:
        row = conn.execute("SELECT * FROM donate_info ORDER BY id LIMIT 1").fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Donation info not configured yet.")
    return _row_to_response(row)


@router.put("", response_model=DonateInfoResponse)
def update_donate_info(payload: DonateInfoUpdate, _=Depends(require_auth)):
    """Update the donation page content. All fields are optional."""
    with get_db_connection() as conn:
        row = conn.execute("SELECT * FROM donate_info ORDER BY id LIMIT 1").fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Donation info not configured yet.")

        conn.execute(
            """
            UPDATE donate_info SET
                headline=?, mission_text=?, impact_bullets=?,
                payment_link=?, payment_button_text=?, goal_amount=?
            WHERE id=?
            """,
            (
                payload.headline             if payload.headline is not None             else row["headline"],
                payload.mission_text         if payload.mission_text is not None         else row["mission_text"],
                json.dumps(payload.impact_bullets) if payload.impact_bullets is not None else row["impact_bullets"],
                payload.payment_link         if payload.payment_link is not None         else row["payment_link"],
                payload.payment_button_text  if payload.payment_button_text is not None  else row["payment_button_text"],
                payload.goal_amount          if payload.goal_amount is not None          else row["goal_amount"],
                row["id"],
            ),
        )
        updated = conn.execute("SELECT * FROM donate_info WHERE id = ?", (row["id"],)).fetchone()
    return _row_to_response(updated)
