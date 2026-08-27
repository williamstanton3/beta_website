"""
Shared helpers for the year-folder-based chapter gallery.

Chapter photos live directly on disk under media/gallery/{folder}/ with no
database involved.  Two folder name formats are supported:

  Academic year  "25-26"   → displayed as "2025–26"
  Decade         "1990s"   → displayed as "1990s"

Both the public Gallery page and the admin panel read/write these folders
directly.
"""

import re
from pathlib import Path

from app.database import get_media_dir

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
VIDEO_EXTENSIONS = {".mp4", ".mov", ".webm"}
MEDIA_EXTENSIONS = IMAGE_EXTENSIONS | VIDEO_EXTENSIONS

YEAR_FOLDER_PATTERN   = re.compile(r"^(\d{2})-(\d{2})$")
DECADE_FOLDER_PATTERN = re.compile(r"^(\d{4})s$")


def parse_folder(name: str) -> tuple[int, str] | None:
    """
    Return (sort_key, display_label) for a valid folder name, or None.

    Academic year "25-26"  → (2025, "2025–26")
    Decade        "1990s"  → (1990, "1990s")
    """
    m = YEAR_FOLDER_PATTERN.match(name)
    if m:
        start, end = m.groups()
        return 2000 + int(start), f"20{start}\u2013{end}"
    m = DECADE_FOLDER_PATTERN.match(name)
    if m:
        decade = int(m.group(1))
        return decade, f"{decade}s"
    return None


# Keep old name as an alias so nothing outside this module breaks
def parse_year_folder(name: str) -> tuple[int, str] | None:
    return parse_folder(name)


def is_valid_year_folder(name: str) -> bool:
    """Accept both academic-year and decade folder names."""
    return parse_folder(name) is not None


def gallery_root() -> Path:
    root = get_media_dir() / "gallery"
    root.mkdir(parents=True, exist_ok=True)
    return root


def list_year_folders() -> list[dict]:
    """Return every valid folder (including empty ones), newest first."""
    root = gallery_root()
    folders = []
    for entry in root.iterdir():
        if not entry.is_dir():
            continue
        parsed = parse_folder(entry.name)
        if parsed:
            sort_key, label = parsed
            count = sum(
                1 for f in entry.iterdir() if f.is_file() and f.suffix.lower() in MEDIA_EXTENSIONS
            )
            folders.append({"folder": entry.name, "label": label, "sort_key": sort_key, "count": count})
    folders.sort(key=lambda f: f["sort_key"], reverse=True)
    return folders


def year_dir(folder: str) -> Path:
    d = gallery_root() / folder
    d.mkdir(parents=True, exist_ok=True)
    return d


def list_photos(folder: str) -> list[str]:
    """Return media filenames in a year folder, sorted alphabetically."""
    d = gallery_root() / folder
    if not d.is_dir():
        return []
    return sorted(
        f.name for f in d.iterdir() if f.is_file() and f.suffix.lower() in MEDIA_EXTENSIONS
    )


def photo_version(folder: str, filename: str) -> int:
    """
    A number that changes whenever a photo's bytes change (its mtime).

    Appended to media URLs as a `?v=` query param so browsers don't keep
    serving a stale cached copy after an admin replaces/re-crops a photo
    that keeps the same filename.
    """
    try:
        return int((gallery_root() / folder / filename).stat().st_mtime)
    except OSError:
        return 0
