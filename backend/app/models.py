"""
Pydantic schemas for request/response validation.

These models define the shape of JSON sent to and from the API.
They are separate from the SQLite tables so we can evolve the API
without tightly coupling to raw database column names.
"""

from pydantic import BaseModel, EmailStr, Field


# ---------------------------------------------------------------------------
# Members (Brothers) — stored in app/data/pledge_classes/{year}.json,
# not a database table. See app/roster.py for the file I/O helpers.
# ---------------------------------------------------------------------------

class PledgeClassMemberResponse(BaseModel):
    """A single brother, as shown on the public Brothers page."""

    first_name: str
    last_name: str
    roles: list[str] = []  # Empty for rank-and-file brothers; one or more titles for officers
    major: str = ""
    hometown: str = ""
    bio: str = ""
    image_url: str | None = None  # None until a matching headshot is found


class PledgeClassGroupResponse(BaseModel):
    """All brothers who pledged in a given year, for the grouped roster view."""

    year: int
    member_type: str = "active"  # "active" or "alumni"
    members: list[PledgeClassMemberResponse]


class RosterMemberResponse(BaseModel):
    """A single brother record for the admin roster table (includes id + year)."""

    id: str  # "{year}-{slug}", e.g. "2024-adam-weber"
    first_name: str
    last_name: str
    class_year: int
    major: str
    hometown: str
    roles: list[str] = []
    email: str = ""  # Admin-only — not exposed on the public Brothers page
    bio: str
    image_url: str | None = None


# ---------------------------------------------------------------------------
# Events
# ---------------------------------------------------------------------------

class EventBase(BaseModel):
    """Shared event fields."""

    title: str
    description: str
    event_date: str = Field(..., description="ISO date string, e.g. 2026-09-15")
    location: str


class EventCreate(EventBase):
    """Payload for creating a new event via the admin panel."""
    pass


class EventUpdate(BaseModel):
    """All fields optional so admin can patch individual fields."""
    title: str | None = None
    description: str | None = None
    event_date: str | None = None
    location: str | None = None


class EventResponse(EventBase):
    """Event record returned to the frontend."""

    id: int

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Announcements
# ---------------------------------------------------------------------------

class AnnouncementCreate(BaseModel):
    """Payload for creating a new announcement via the admin panel."""
    title: str
    content: str
    is_featured: bool = False


class AnnouncementUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    is_featured: bool | None = None


class AnnouncementResponse(BaseModel):
    """News item shown on the home page."""

    id: int
    title: str
    content: str
    posted_at: str
    is_featured: bool

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Rush Information
# ---------------------------------------------------------------------------

class RushInfoResponse(BaseModel):
    """A section of rush/recruitment content."""

    id: int
    section_title: str
    section_content: str
    display_order: int

    class Config:
        from_attributes = True


class RushInfoCreate(BaseModel):
    """Payload for creating a new rush info section via the admin panel."""
    section_title: str
    section_content: str
    display_order: int = 0


class RushInfoUpdate(BaseModel):
    """All fields optional so admin can patch individual fields."""
    section_title: str | None = None
    section_content: str | None = None
    display_order: int | None = None


# ---------------------------------------------------------------------------
# Contact Form
# ---------------------------------------------------------------------------

class ContactMessageCreate(BaseModel):
    """Incoming contact form submission from the website."""

    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    subject: str = Field(..., min_length=3, max_length=150)
    message: str = Field(..., min_length=10, max_length=2000)


class ContactMessageResponse(BaseModel):
    """Confirmation payload after a message is saved."""

    id: int
    message: str = "Thank you! Your message has been received."

    class Config:
        from_attributes = True


class ContactMessageAdminResponse(BaseModel):
    """A saved contact form submission, as shown in the admin Messages page."""

    id: int
    name: str
    email: str
    subject: str
    message: str
    submitted_at: str


# ---------------------------------------------------------------------------
# Gallery
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Gallery grouped by year (derived from media/gallery/{year-range}/ folders)
# ---------------------------------------------------------------------------

class GalleryPhotoResponse(BaseModel):
    """A single photo or video file, with no title/caption metadata."""

    file_url: str
    media_type: str      # 'image' or 'video'


class GalleryYearGroupResponse(BaseModel):
    """All chapter photos from one academic year folder, e.g. '2025–26'."""

    label: str
    photos: list[GalleryPhotoResponse]


class GalleryYearFolderResponse(BaseModel):
    """A year folder summary, for the admin year picker."""

    folder: str   # raw folder name, e.g. "25-26"
    label: str    # display label, e.g. "2025–26"
    count: int    # number of photos/videos currently in the folder


class AdminGalleryPhotoResponse(BaseModel):
    """A single photo or video in the admin gallery manager."""

    filename: str
    file_url: str
    media_type: str


# ---------------------------------------------------------------------------
# Pledge Class Media
# ---------------------------------------------------------------------------

class PledgeClassMediaResponse(BaseModel):
    """A single photo or video associated with a pledge class year."""

    id: int
    year: int
    title: str
    file_url: str        # Full URL the browser can load directly
    media_type: str
    display_order: int
    uploaded_at: str

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Donation Page Info
# ---------------------------------------------------------------------------

class DonateInfoResponse(BaseModel):
    """Content for the public Donate page."""

    id: int
    headline: str
    mission_text: str
    impact_bullets: list[str]    # Parsed from JSON string stored in DB
    payment_link: str
    payment_button_text: str
    goal_amount: float | None


class DonateInfoUpdate(BaseModel):
    """Admin update payload for donation page content."""
    headline: str | None = None
    mission_text: str | None = None
    impact_bullets: list[str] | None = None
    payment_link: str | None = None
    payment_button_text: str | None = None
    goal_amount: float | None = None


# ---------------------------------------------------------------------------
# Contact Page Info — currently just the chapter president's contact details
# ---------------------------------------------------------------------------

class ContactInfoResponse(BaseModel):
    """President contact details shown on the public Contact page."""

    president_name: str
    president_email: str


class ContactInfoUpdate(BaseModel):
    """Admin update payload for the Contact page's president info."""
    president_name: str | None = None
    president_email: str | None = None


# ---------------------------------------------------------------------------
# About / Chapter Info
# ---------------------------------------------------------------------------

class ChapterInfoResponse(BaseModel):
    """High-level fraternity history and values served to the About page."""

    name: str
    founded: str
    campus: str
    motto: str
    colors: list[str]
    mascot: str
    active_members: str
    alumni_count: str
    philanthropy: str
    history: str
    values: list[str]


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    """Admin login payload — just a password for this single-admin setup."""
    password: str


class TokenResponse(BaseModel):
    """JWT token returned after successful login."""
    token: str
    expires_in_hours: int
