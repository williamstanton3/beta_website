"""
Shared helpers for the JSON-backed pledge class roster.

Pledge class years are split into two subdirectories:

  app/data/pledge_classes/actives/   — current active brothers (2024, 2025, 2026 …)
  app/data/pledge_classes/alumni/    — alumni pledge classes (2003 – 2023 …)

Each file contains an array of brother records (name, roles, major, hometown, bio).
These JSON files are the single source of truth for the roster — both the public
Brothers page and the admin panel read and write them directly.

Headshots are NOT referenced in the JSON.  Instead they're matched by filename
convention — a photo named "FirstName_LastName.<ext>" inside
media/pledge_classes/{year}/ is automatically attached to the matching person.
"""

import json
import re
from pathlib import Path

from app.content_store import DATA_DIR as APP_DATA_DIR
from app.database import get_media_dir

DATA_DIR    = APP_DATA_DIR / "pledge_classes"
ACTIVES_DIR = DATA_DIR / "actives"
ALUMNI_DIR  = DATA_DIR / "alumni"

ROSTER_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
_NAME_TOKEN = re.compile(r"^[A-Za-z][A-Za-z'\-]*$")


def _normalize(text: str) -> str:
    return "".join(ch.lower() for ch in text if ch.isalpha())


def slugify(first_name: str, last_name: str) -> str:
    raw  = f"{first_name}-{last_name}".lower()
    slug = re.sub(r"[^a-z0-9]+", "-", raw).strip("-")
    return slug or "brother"


# ---------------------------------------------------------------------------
# Year discovery
# ---------------------------------------------------------------------------

def _years_in(directory: Path) -> list[int]:
    if not directory.is_dir():
        return []
    return sorted(
        [int(f.stem) for f in directory.glob("*.json") if f.stem.isdigit()],
        reverse=True,
    )


def list_active_years() -> list[int]:
    return _years_in(ACTIVES_DIR)


def list_alumni_years() -> list[int]:
    return _years_in(ALUMNI_DIR)


def list_years() -> list[int]:
    """Return all years (actives + alumni), newest first. Used by admin."""
    combined = set(list_active_years()) | set(list_alumni_years())
    return sorted(combined, reverse=True)


def is_alumni_year(year: int) -> bool:
    return (ALUMNI_DIR / f"{year}.json").exists()


# ---------------------------------------------------------------------------
# Load / save
# ---------------------------------------------------------------------------

def _year_path(year: int) -> Path:
    """
    Find the correct file regardless of which subdir it lives in.
    For new files (neither subdir has it yet): years >= 2024 go to actives,
    earlier years go to alumni.
    """
    active_path = ACTIVES_DIR / f"{year}.json"
    alumni_path = ALUMNI_DIR / f"{year}.json"
    if active_path.exists():
        return active_path
    if alumni_path.exists():
        return alumni_path
    # New file: route by year
    return active_path if year >= 2024 else alumni_path


def load_year(year: int) -> list[dict]:
    path = _year_path(year)
    if not path.exists():
        return []
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def save_year(year: int, members: list[dict]) -> None:
    """Save roster to the correct subdir (preserves wherever it currently lives)."""
    path = _year_path(year)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(members, f, indent=2)
        f.write("\n")


def save_year_alumni(year: int, members: list[dict]) -> None:
    """Explicitly save to the alumni subdir (used when moving a year)."""
    ALUMNI_DIR.mkdir(parents=True, exist_ok=True)
    path = ALUMNI_DIR / f"{year}.json"
    with path.open("w", encoding="utf-8") as f:
        json.dump(members, f, indent=2)
        f.write("\n")


# ---------------------------------------------------------------------------
# Photo helpers
# ---------------------------------------------------------------------------

def photo_version(year: int, filename: str) -> int:
    try:
        return int((get_media_dir() / "pledge_classes" / str(year) / filename).stat().st_mtime)
    except OSError:
        return 0


def find_photo_filename(year: int, first_name: str, last_name: str) -> str | None:
    year_dir = get_media_dir() / "pledge_classes" / str(year)
    if not year_dir.is_dir():
        return None
    target = _normalize(first_name) + _normalize(last_name)
    for file in year_dir.iterdir():
        if not file.is_file() or file.suffix.lower() not in ROSTER_IMAGE_EXTENSIONS:
            continue
        parts = file.stem.split("_")
        if len(parts) != 2 or not (_NAME_TOKEN.match(parts[0]) and _NAME_TOKEN.match(parts[1])):
            continue
        if _normalize(parts[0]) + _normalize(parts[1]) == target:
            return file.name
    return None
