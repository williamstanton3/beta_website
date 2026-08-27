"""
Public gallery API routes — no auth required.

Returns photos/videos for the public Gallery page and the pledge class sections.
"""

from pathlib import Path

from fastapi import APIRouter, Request

from app import content_store
from app.gallery_years import VIDEO_EXTENSIONS, list_photos, list_year_folders, photo_version
from app.models import DonateInfoResponse, GalleryPhotoResponse, GalleryYearGroupResponse, PledgeClassMediaResponse
from app.routers.admin_donate import DEFAULT_DONATE_INFO

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

def _load_pledge_media() -> list[dict]:
    return content_store.load("pledge_class_media.json", [])


@router.get("/pledge-classes", response_model=list[PledgeClassMediaResponse])
def list_pledge_classes(request: Request, year: int | None = None):
    """
    Return pledge class media, optionally filtered by year.

    Query param: ?year=2025  (optional)
    """
    items = _load_pledge_media()
    if year:
        items = [m for m in items if m["year"] == year]
    items = sorted(items, key=lambda m: (-m["year"], m["display_order"]))

    return [
        PledgeClassMediaResponse(
            id=m["id"],
            year=m["year"],
            title=m["title"] or "",
            file_url=_media_url(request, m["file_path"]),
            media_type=m["media_type"],
            display_order=m["display_order"],
            uploaded_at=m["uploaded_at"],
        )
        for m in items
    ]


@router.get("/pledge-classes/years")
def list_pledge_years():
    """Return the list of years that have pledge class media, newest first."""
    years = {m["year"] for m in _load_pledge_media()}
    return sorted(years, reverse=True)


# --------------------------------------------------------------------------- #
# Donation page info                                                           #
# --------------------------------------------------------------------------- #

@router.get("/donate-info", response_model=DonateInfoResponse)
def get_donate_info():
    """Return the donation page content for the public Donate page."""
    data = content_store.load("donate_info.json", DEFAULT_DONATE_INFO)
    return DonateInfoResponse(id=1, **data)
