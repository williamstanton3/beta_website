"""
Public gallery API routes — no auth required.

Returns photos/videos for the public Gallery page and the pledge class sections.
"""

import json
from pathlib import Path

from fastapi import APIRouter, Request

from app.database import get_db_connection
from app.gallery_years import VIDEO_EXTENSIONS, list_photos, list_year_folders, photo_version
from app.models import DonateInfoResponse, GalleryPhotoResponse, GalleryYearGroupResponse, PledgeClassMediaResponse

router = APIRouter(prefix="/gallery", tags=["Gallery"])


def _media_url(request: Request, file_path: str) -> str:
    base = str(request.base_url).rstrip("/")
    return f"{base}/media/{file_path}"


# --------------------------------------------------------------------------- #
# Chapter gallery — grouped by academic year folder                           #
# --------------------------------------------------------------------------- #

@router.get("/by-year", response_model=list[GalleryYearGroupResponse])
def list_gallery_by_year(request: Request):
    """
    Return chapter photos/videos grouped by academic year, newest first.

    Scans media/gallery/{year-range}/ (e.g. "25-26") for image and video
    files — no database or captions involved, just what's on disk.
    """
    base = str(request.base_url).rstrip("/")

    groups: list[GalleryYearGroupResponse] = []
    for entry in list_year_folders():
        filenames = list_photos(entry["folder"])
        if not filenames:
            continue
        photos = [
            GalleryPhotoResponse(
                file_url=f"{base}/media/gallery/{entry['folder']}/{name}?v={photo_version(entry['folder'], name)}",
                media_type="video" if Path(name).suffix.lower() in VIDEO_EXTENSIONS else "image",
            )
            for name in filenames
        ]
        groups.append(GalleryYearGroupResponse(label=entry["label"], photos=photos))

    return groups


# --------------------------------------------------------------------------- #
# Pledge class media                                                           #
# --------------------------------------------------------------------------- #

@router.get("/pledge-classes", response_model=list[PledgeClassMediaResponse])
def list_pledge_classes(request: Request, year: int | None = None):
    """
    Return pledge class media, optionally filtered by year.

    Query param: ?year=2025  (optional)
    """
    with get_db_connection() as conn:
        if year:
            rows = conn.execute(
                "SELECT * FROM pledge_class_media WHERE year=? ORDER BY display_order ASC",
                (year,),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM pledge_class_media ORDER BY year DESC, display_order ASC"
            ).fetchall()

    return [
        PledgeClassMediaResponse(
            id=r["id"],
            year=r["year"],
            title=r["title"] or "",
            file_url=_media_url(request, r["file_path"]),
            media_type=r["media_type"],
            display_order=r["display_order"],
            uploaded_at=r["uploaded_at"],
        )
        for r in rows
    ]


@router.get("/pledge-classes/years")
def list_pledge_years():
    """Return the list of years that have pledge class media, newest first."""
    with get_db_connection() as conn:
        rows = conn.execute(
            "SELECT DISTINCT year FROM pledge_class_media ORDER BY year DESC"
        ).fetchall()
    return [r["year"] for r in rows]


# --------------------------------------------------------------------------- #
# Donation page info                                                           #
# --------------------------------------------------------------------------- #

@router.get("/donate-info", response_model=DonateInfoResponse)
def get_donate_info():
    """Return the donation page content for the public Donate page."""
    with get_db_connection() as conn:
        row = conn.execute("SELECT * FROM donate_info ORDER BY id LIMIT 1").fetchone()
    if not row:
        return DonateInfoResponse(
            id=0,
            headline="Support Beta Sigma",
            mission_text="Your donation supports brotherhood, scholarship, and service.",
            impact_bullets=[],
            payment_link="#",
            payment_button_text="Donate Now",
            goal_amount=None,
        )
    return DonateInfoResponse(
        id=row["id"],
        headline=row["headline"],
        mission_text=row["mission_text"],
        impact_bullets=json.loads(row["impact_bullets"]),
        payment_link=row["payment_link"],
        payment_button_text=row["payment_button_text"],
        goal_amount=row["goal_amount"],
    )
