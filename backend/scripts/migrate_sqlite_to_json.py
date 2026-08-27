"""
One-time migration: export live SQLite content into the new JSON content
store (app/data/*.json), before the SQLite-backed routers are retired.

Safe to re-run — it always reflects the current state of beta_sigma.db.
Run from the backend/ directory:

    python3 scripts/migrate_sqlite_to_json.py
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import content_store
from app.database import get_db_connection


def migrate():
    with get_db_connection() as conn:
        events = [
            {
                "id": r["id"],
                "title": r["title"],
                "description": r["description"],
                "event_date": r["event_date"],
                "location": r["location"],
            }
            for r in conn.execute("SELECT * FROM events ORDER BY event_date ASC").fetchall()
        ]

        announcements = [
            {
                "id": r["id"],
                "title": r["title"],
                "content": r["content"],
                "posted_at": r["posted_at"],
                "is_featured": bool(r["is_featured"]),
            }
            for r in conn.execute("SELECT * FROM announcements ORDER BY posted_at DESC").fetchall()
        ]

        rush_info = [
            {
                "id": r["id"],
                "section_title": r["section_title"],
                "section_content": r["section_content"],
                "display_order": r["display_order"],
            }
            for r in conn.execute("SELECT * FROM rush_info ORDER BY display_order ASC").fetchall()
        ]

        contact_messages = [
            {
                "id": r["id"],
                "name": r["name"],
                "email": r["email"],
                "subject": r["subject"],
                "message": r["message"],
                "submitted_at": r["submitted_at"],
            }
            for r in conn.execute("SELECT * FROM contact_messages ORDER BY submitted_at DESC").fetchall()
        ]

        pledge_class_media = [
            {
                "id": r["id"],
                "year": r["year"],
                "title": r["title"] or "",
                "file_path": r["file_path"],
                "media_type": r["media_type"],
                "display_order": r["display_order"],
                "uploaded_at": r["uploaded_at"],
            }
            for r in conn.execute(
                "SELECT * FROM pledge_class_media ORDER BY year DESC, display_order ASC"
            ).fetchall()
        ]

        donate_row = conn.execute("SELECT * FROM donate_info ORDER BY id LIMIT 1").fetchone()
        donate_info = (
            {
                "headline": donate_row["headline"],
                "mission_text": donate_row["mission_text"],
                "impact_bullets": json.loads(donate_row["impact_bullets"]),
                "payment_link": donate_row["payment_link"],
                "payment_button_text": donate_row["payment_button_text"],
                "goal_amount": donate_row["goal_amount"],
            }
            if donate_row
            else None
        )

        contact_row = conn.execute("SELECT * FROM contact_info ORDER BY id LIMIT 1").fetchone()
        contact_info = (
            {
                "president_name": contact_row["president_name"],
                "president_email": contact_row["president_email"],
            }
            if contact_row
            else None
        )

    content_store.save("events.json", events)
    content_store.save("announcements.json", announcements)
    content_store.save("rush_info.json", rush_info)
    content_store.save("contact_messages.json", contact_messages)
    content_store.save("pledge_class_media.json", pledge_class_media)
    if donate_info is not None:
        content_store.save("donate_info.json", donate_info)
    if contact_info is not None:
        content_store.save("contact_info.json", contact_info)

    print(f"events.json:             {len(events)} rows")
    print(f"announcements.json:      {len(announcements)} rows")
    print(f"rush_info.json:          {len(rush_info)} rows")
    print(f"contact_messages.json:   {len(contact_messages)} rows")
    print(f"pledge_class_media.json: {len(pledge_class_media)} rows")
    print(f"donate_info.json:        {'migrated' if donate_info else 'no row found, skipped'}")
    print(f"contact_info.json:       {'migrated' if contact_info else 'no row found, skipped'}")


if __name__ == "__main__":
    migrate()
