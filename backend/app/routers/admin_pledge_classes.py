"""
Admin endpoints for pledge class photos and videos.

Each pledge class year gets its own subfolder under media/pledge_classes/{year}/.
Officers can upload photos per year, view all years, and delete items.
Metadata (title, display order, upload time) lives in
app/data/pledge_class_media.json — the files themselves stay on disk.
"""

import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile

from app import content_store
from app.auth import require_auth
from app.database import get_media_dir
from app.models import PledgeClassMediaResponse

router = APIRouter(prefix="/admin/pledge-classes", tags=["Admin — Pledge Classes"])

ALLOWED_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg",
    ".mp4", ".mov", ".webm",
}
VIDEO_EXTENSIONS = {".mp4", ".mov", ".webm"}


def _load() -> list[dict]:
    return content_store.load("pledge_class_media.json", [])


def _save(items: list[dict]) -> None:
    content_store.save("pledge_class_media.json", items)


def _build_file_url(request: Request, file_path: str) -> str:
    base = str(request.base_url).rstrip("/")
    return f"{base}/media/{file_path}"


def _row_to_response(row: dict, request: Request) -> PledgeClassMediaResponse:
    return PledgeClassMediaResponse(
        id=row["id"],
        year=row["year"],
        title=row["title"] or "",
        file_url=_build_file_url(request, row["file_path"]),
        media_type=row["media_type"],
        display_order=row["display_order"],
        uploaded_at=row["uploaded_at"],
    )


@router.get("", response_model=list[PledgeClassMediaResponse])
def list_all_pledge_media(request: Request, _=Depends(require_auth)):
    """Return all pledge class media sorted by year and order (admin view)."""
    items = sorted(_load(), key=lambda m: (-m["year"], m["display_order"]))
    return [_row_to_response(m, request) for m in items]


@router.get("/years")
def list_pledge_years(_=Depends(require_auth)):
    """Return the distinct years that have pledge class media uploaded."""
    years = {m["year"] for m in _load()}
    return sorted(years, reverse=True)


@router.post("", response_model=PledgeClassMediaResponse, status_code=201)
async def upload_pledge_media(
    request: Request,
    year: int = Form(...),
    title: str = Form(""),
    display_order: int = Form(0),
    file: UploadFile = File(...),
    _=Depends(require_auth),
):
    """
    Upload a photo or video for a specific pledge class year.

    Files are saved to backend/media/pledge_classes/{year}/ and the year
    subdirectory is created automatically if it doesn't exist.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided.")

    suffix = Path(file.filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type '{suffix}' not supported.")

    media_type = "video" if suffix in VIDEO_EXTENSIONS else "image"

    # Ensure the year subdirectory exists
    year_dir = get_media_dir() / "pledge_classes" / str(year)
    year_dir.mkdir(parents=True, exist_ok=True)

    # Save with UUID filename
    filename = f"pledge_classes/{year}/{uuid.uuid4()}{suffix}"
    dest = get_media_dir() / filename
    content = await file.read()
    dest.write_bytes(content)

    items = _load()
    item = {
        "id": content_store.next_id(items),
        "year": year,
        "title": title or f"Class of {year}",
        "file_path": filename,
        "media_type": media_type,
        "display_order": display_order,
        "uploaded_at": datetime.utcnow().isoformat(),
    }
    items.append(item)
    _save(items)

    return _row_to_response(item, request)


@router.delete("/{item_id}", status_code=204)
def delete_pledge_media(item_id: int, _=Depends(require_auth)):
    """Delete a pledge class media item and its file from disk."""
    items = _load()
    item = next((m for m in items if m["id"] == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    file_path = get_media_dir() / item["file_path"]
    if file_path.exists() and not str(item["file_path"]).endswith(".svg"):
        file_path.unlink(missing_ok=True)

    _save([m for m in items if m["id"] != item_id])
