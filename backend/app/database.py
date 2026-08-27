"""
SQLite database helpers for the Beta Sigma backend.

We use the built-in sqlite3 module (no ORM) to keep the project easy to read
for newcomers. Each table maps to a fraternity content area on the website.
"""

import sqlite3
from contextlib import contextmanager
from pathlib import Path

from app.config import settings


def get_database_path() -> Path:
    """Resolve the SQLite file path relative to the backend directory."""
    backend_root = Path(__file__).resolve().parent.parent
    return backend_root / settings.database_path


def get_media_dir() -> Path:
    """
    Return the path to the media/ directory where uploaded files are stored.
    Creates the directory (and subdirectories) if they don't exist.
    """
    backend_root = Path(__file__).resolve().parent.parent
    media = backend_root / "media"
    # Ensure all category subdirectories exist on first run
    for subdir in ["gallery", "videos", "pledge_classes"]:
        (media / subdir).mkdir(parents=True, exist_ok=True)
    return media


@contextmanager
def get_db_connection():
    """
    Yield a SQLite connection with row objects (dict-like access by column name).

    Usage:
        with get_db_connection() as conn:
            rows = conn.execute("SELECT * FROM members").fetchall()
    """
    conn = sqlite3.connect(get_database_path())
    # Return rows as sqlite3.Row so we can access columns by name
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_database() -> None:
    """
    Create all tables if they do not already exist.

    Called once at application startup before seeding demo content.
    Adding a new table here is safe — existing tables are never dropped.
    """
    with get_db_connection() as conn:
        conn.executescript(
            """
            -- Note: fraternity brothers are NOT stored here. See app/roster.py —
            -- the Brothers page roster lives in app/data/pledge_classes/{year}.json.

            -- Upcoming and past chapter events
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                event_date TEXT NOT NULL,
                location TEXT NOT NULL,
                category TEXT NOT NULL
            );

            -- News and announcements shown on the home page
            CREATE TABLE IF NOT EXISTS announcements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                posted_at TEXT NOT NULL,
                is_featured INTEGER DEFAULT 0
            );

            -- Rush/recruitment information blocks
            CREATE TABLE IF NOT EXISTS rush_info (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                section_title TEXT NOT NULL,
                section_content TEXT NOT NULL,
                display_order INTEGER NOT NULL
            );

            -- Contact form submissions stored for chapter officers to review
            CREATE TABLE IF NOT EXISTS contact_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                subject TEXT NOT NULL,
                message TEXT NOT NULL,
                submitted_at TEXT NOT NULL
            );

            -- Note: chapter gallery photos are NOT stored here either. See
            -- app/gallery_years.py — they live directly in media/gallery/{year}/.

            -- Pledge class photos organized by year
            CREATE TABLE IF NOT EXISTS pledge_class_media (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                year INTEGER NOT NULL,
                title TEXT NOT NULL DEFAULT '',
                file_path TEXT NOT NULL,   -- relative path from media/ root
                media_type TEXT NOT NULL DEFAULT 'image',
                display_order INTEGER DEFAULT 0,
                uploaded_at TEXT NOT NULL
            );

            -- Donation page content (editable by admin)
            CREATE TABLE IF NOT EXISTS donate_info (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                headline TEXT NOT NULL,
                mission_text TEXT NOT NULL,
                impact_bullets TEXT NOT NULL DEFAULT '[]',  -- JSON array as text
                payment_link TEXT NOT NULL DEFAULT '#',
                payment_button_text TEXT NOT NULL DEFAULT 'Donate Now',
                goal_amount REAL DEFAULT 0
            );

            -- Contact page details (editable by admin) — currently just the
            -- chapter president's name/email, shown on the public Contact page.
            CREATE TABLE IF NOT EXISTS contact_info (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                president_name TEXT NOT NULL DEFAULT '',
                president_email TEXT NOT NULL DEFAULT ''
            );
            """
        )
