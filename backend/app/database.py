"""
Media directory helpers for the Beta Sigma backend.

There is no database anymore — all content (members, gallery, events,
announcements, rush info, donate/contact page info, contact messages) is
stored as JSON files under app/data/ (see app/content_store.py, app/roster.py,
and app/gallery_years.py) or as plain files on disk under media/.
"""

from pathlib import Path

from app.config import settings


def get_media_dir() -> Path:
    """
    Return the path to the media/ directory where uploaded files are stored.
    Creates the directory (and subdirectories) if they don't exist.

    Defaults to a folder next to the app's source code (fine for local dev).
    Set MEDIA_DIR to override — e.g. a mounted persistent volume in production,
    so uploaded photos survive redeploys instead of living inside the
    ephemeral container filesystem that gets rebuilt from git each time.
    """
    if settings.media_dir:
        media = Path(settings.media_dir)
    else:
        backend_root = Path(__file__).resolve().parent.parent
        media = backend_root / "media"
    # Ensure all category subdirectories exist on first run
    for subdir in ["gallery", "videos", "pledge_classes"]:
        (media / subdir).mkdir(parents=True, exist_ok=True)
    return media
