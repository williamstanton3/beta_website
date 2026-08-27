"""
Generic JSON-file-backed content store.

Used for simple admin-editable content — events, announcements, rush info,
donate/contact page info, pledge class media, and contact messages — that
doesn't need real relational queries, just "load it, maybe change it, save
it back." This mirrors the pattern already proven out for the roster
(app/roster.py) and gallery (app/gallery_years.py), just generalized.

Writes are atomic: we write to a temp file in the same directory, then
os.replace() it over the real file, so a crash or an overlapping request
mid-write can never leave a half-written, corrupted JSON file behind. A
per-file lock also serializes writes within this process.
"""

import json
import threading
from pathlib import Path
from typing import Any

from app.config import settings

# Defaults to a folder next to the app's source code (fine for local dev).
# Set DATA_DIR to override — e.g. a mounted persistent volume in production,
# so admin edits survive redeploys instead of living inside the ephemeral
# container filesystem that gets rebuilt from git each time.
DATA_DIR = Path(settings.data_dir) if settings.data_dir else Path(__file__).resolve().parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

_locks: dict[str, threading.Lock] = {}
_locks_guard = threading.Lock()


def _lock_for(path: Path) -> threading.Lock:
    key = str(path)
    with _locks_guard:
        if key not in _locks:
            _locks[key] = threading.Lock()
        return _locks[key]


def _path(name: str) -> Path:
    return DATA_DIR / name


def load(name: str, default: Any) -> Any:
    """
    Load JSON content from app/data/{name}.

    If the file doesn't exist yet, it's created with `default` (so a fresh
    checkout of the project starts with sensible demo content, same as the
    old seed_database() did for SQLite).
    """
    path = _path(name)
    if not path.exists():
        save(name, default)
        return default
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def save(name: str, data: Any) -> None:
    """Atomically overwrite app/data/{name} with `data`."""
    path = _path(name)
    with _lock_for(path):
        tmp = path.with_suffix(path.suffix + ".tmp")
        with tmp.open("w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
            f.write("\n")
        tmp.replace(path)


def next_id(items: list[dict]) -> int:
    """Return the next integer id for a list of dict records with an 'id' field."""
    return max((item.get("id", 0) for item in items), default=0) + 1
