"""
Admin endpoint for editing the Contact page's president info.

Officers can update the president's name/email each year without
redeploying the app — see app/routers/contact.py for the public read side.
"""

from fastapi import APIRouter, Depends, HTTPException

from app.auth import require_auth
from app.database import get_db_connection
from app.models import ContactInfoResponse, ContactInfoUpdate

router = APIRouter(prefix="/admin/contact", tags=["Admin — Contact"])


def _row_to_response(row) -> ContactInfoResponse:
    return ContactInfoResponse(
        president_name=row["president_name"],
        president_email=row["president_email"],
    )


@router.get("", response_model=ContactInfoResponse)
def get_contact_info_admin(_=Depends(require_auth)):
    """Return the current president info for editing."""
    with get_db_connection() as conn:
        row = conn.execute("SELECT * FROM contact_info ORDER BY id LIMIT 1").fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Contact info not configured yet.")
    return _row_to_response(row)


@router.put("", response_model=ContactInfoResponse)
def update_contact_info(payload: ContactInfoUpdate, _=Depends(require_auth)):
    """Update the president's name/email. Both fields are optional."""
    with get_db_connection() as conn:
        row = conn.execute("SELECT * FROM contact_info ORDER BY id LIMIT 1").fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Contact info not configured yet.")

        conn.execute(
            "UPDATE contact_info SET president_name=?, president_email=? WHERE id=?",
            (
                payload.president_name if payload.president_name is not None else row["president_name"],
                payload.president_email if payload.president_email is not None else row["president_email"],
                row["id"],
            ),
        )
        updated = conn.execute("SELECT * FROM contact_info WHERE id = ?", (row["id"],)).fetchone()
    return _row_to_response(updated)
