"""
Contact form API routes.

Accepts messages from the website and persists them for chapter officers.
Backed by app/data/contact_info.json and app/data/contact_messages.json
(see app/content_store.py) instead of a database.
"""

from datetime import datetime

from fastapi import APIRouter

from app import content_store
from app.models import ContactInfoResponse, ContactMessageCreate, ContactMessageResponse
from app.routers.admin_contact import DEFAULT_CONTACT_INFO

router = APIRouter(prefix="/contact", tags=["Contact"])


@router.get("/info", response_model=ContactInfoResponse)
def get_contact_info():
    """Return the chapter president's name/email for the Contact page sidebar."""
    return ContactInfoResponse(**content_store.load("contact_info.json", DEFAULT_CONTACT_INFO))


@router.post("", response_model=ContactMessageResponse, status_code=201)
def submit_contact_message(payload: ContactMessageCreate):
    """
    Save a contact form submission for officers to review in the admin panel.

    In production you might also send email notifications here.
    """
    messages = content_store.load("contact_messages.json", [])
    message = {
        "id": content_store.next_id(messages),
        "name": payload.name,
        "email": payload.email,
        "subject": payload.subject,
        "message": payload.message,
        "submitted_at": datetime.utcnow().isoformat(),
    }
    messages.append(message)
    content_store.save("contact_messages.json", messages)

    return ContactMessageResponse(id=message["id"])
