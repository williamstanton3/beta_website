"""
Contact form API routes.

Accepts messages from the website and persists them for chapter officers.
"""

from datetime import datetime

from fastapi import APIRouter

from app.database import get_db_connection
from app.models import ContactInfoResponse, ContactMessageCreate, ContactMessageResponse

router = APIRouter(prefix="/contact", tags=["Contact"])


@router.get("/info", response_model=ContactInfoResponse)
def get_contact_info():
    """Return the chapter president's name/email for the Contact page sidebar."""
    with get_db_connection() as conn:
        row = conn.execute("SELECT * FROM contact_info ORDER BY id LIMIT 1").fetchone()
    if not row:
        return ContactInfoResponse(president_name="", president_email="")
    return ContactInfoResponse(
        president_name=row["president_name"],
        president_email=row["president_email"],
    )


@router.post("", response_model=ContactMessageResponse, status_code=201)
def submit_contact_message(payload: ContactMessageCreate):
    """
    Save a contact form submission to the database.

    In production you might also send email notifications here.
    For this demo we simply persist the message and return a thank-you response.
    """
    submitted_at = datetime.utcnow().isoformat()

    with get_db_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO contact_messages (name, email, subject, message, submitted_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                payload.name,
                payload.email,
                payload.subject,
                payload.message,
                submitted_at,
            ),
        )
        message_id = cursor.lastrowid

    return ContactMessageResponse(id=message_id)
