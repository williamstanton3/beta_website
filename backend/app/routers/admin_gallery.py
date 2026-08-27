"""
Admin endpoints for the chapter photo/video gallery.

Photos live directly in media/gallery/{year-range}/ (e.g. "25-26") — there's
no database table. Officers can create a new year folder, upload photos to
one, replace a photo (used by the crop tool to save a re-cropped version
over the original), and delete photos. The public Gallery page reads the
same folders directly (see app/routers/gallery.py).
"""

import uuid
from pathlib import Path

from fastapi import APIRouter, Body, Depends, File, HTTPException, Request, UploadFile

from app.auth import require_auth
from app.gallery_years import (
    IMAGE_EXTENSIONS,
    VIDEO_EXTENSIONS,
    gallery_root,
    is_valid_year_folder,
    list_photos,
    list_year_folders,
    photo_version,
    year_dir,
)
from app.models import AdminGalleryPhotoResponse, GalleryYearFolderResponse

router = APIRouter(prefix="/admin/gallery", tags=["Admin — Gallery"])

ALLOWED_EXTENSIONS = IMAGE_EXTENSIONS | VIDEO_EXTENSIONS


def _build_url(request: Request, folder: str, filename: str) -> str:
    base = str(request.base_url).rstrip("/")
    return f"{base}/media/gallery/{folder}/{filename}?v={photo_version(folder, filename)}"


def _to_photo_response(request: Request, folder: str, filename: str) -> AdminGalleryPhotoResponse:
    suffix = Path(filename).suffix.lower()
    return AdminGalleryPhotoResponse(
        filename=filename,
        file_url=_build_url(request, folder, filename),
        media_type="video" if suffix in VIDEO_EXTENSIONS else "image",
    )


# --------------------------------------------------------------------------- #
# Year folders                                                                 #
# --------------------------------------------------------------------------- #

@router.get("/years", response_model=list[GalleryYearFolderResponse])
def list_years_admin(_=Depends(require_auth)):
    """Return every year folder (including empty ones) for the admin year picker."""
    return [GalleryYearFolderResponse(**f) for f in list_year_folders()]


@router.post("/years", response_model=GalleryYearFolderResponse, status_code=201)
def create_year_folder(folder: str = Body(..., embed=True), _=Depends(require_auth)):
    """
    Create a new (empty) year folder, e.g. folder="26-27".

    Idempotent — creating a folder that already exists just returns it.
    """
    if not is_valid_year_folder(folder):
        raise HTTPException(status_code=400, detail="Folder must be an academic year (e.g. '26-27') or a decade (e.g. '1990s').")
    year_dir(folder)
    match = [f for f in list_year_folders() if f["folder"] == folder]
    return GalleryYearFolderResponse(**match[0])


# --------------------------------------------------------------------------- #
# Photos within a year folder                                                  #
# --------------------------------------------------------------------------- #

@router.get("/years/{folder}/photos", response_model=list[AdminGalleryPhotoResponse])
def list_photos_admin(folder: str, request: Request, _=Depends(require_auth)):
    """Return every photo/video in one year folder."""
    if not is_valid_year_folder(folder):
        raise HTTPException(status_code=400, detail="Invalid year folder.")
    return [_to_photo_response(request, folder, name) for name in list_photos(folder)]


@router.post("/years/{folder}/photos", response_model=AdminGalleryPhotoResponse, status_code=201)
async def upload_photo(
    folder: str,
    request: Request,
    file: UploadFile = File(...),
    _=Depends(require_auth),
):
    """Add a new photo or video to a year folder (saved with a generated filename)."""
    if not is_valid_year_folder(folder):
        raise HTTPException(status_code=400, detail="Invalid year folder.")
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided.")

    suffix = Path(file.filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{suffix}' not supported. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    filename = f"{uuid.uuid4()}{suffix}"
    dest = year_dir(folder) / filename
    dest.write_bytes(await file.read())

    return _to_photo_response(request, folder, filename)


@router.put("/years/{folder}/photos/{filename}", response_model=AdminGalleryPhotoResponse)
async def replace_photo(
    folder: str,
    filename: str,
    request: Request,
    file: UploadFile = File(...),
    _=Depends(require_auth),
):
    """
    Overwrite an existing photo's bytes in place (same filename/URL).

    Used by the crop tool to save a re-cropped version of a photo that's
    already in the gallery, without changing its URL or position.
    """
    if not is_valid_year_folder(folder):
        raise HTTPException(status_code=400, detail="Invalid year folder.")
    existing = year_dir(folder) / filename
    if not existing.exists():
        raise HTTPException(status_code=404, detail="Photo not found")

    existing.write_bytes(await file.read())
    return _to_photo_response(request, folder, filename)


@router.delete("/years/{folder}/photos/{filename}", status_code=204)
def delete_photo(folder: str, filename: str, _=Depends(require_auth)):
    """Delete a photo or video from a year folder."""
    if not is_valid_year_folder(folder):
        raise HTTPException(status_code=400, detail="Invalid year folder.")
    path = gallery_root() / folder / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="Photo not found")
    path.unlink()
