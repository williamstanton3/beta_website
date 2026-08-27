"""
Seed the database with sample Beta Sigma content.

Table rows are inserted only when a table is empty. Note that fraternity
brothers are NOT seeded here — the Brothers page roster lives in
app/data/pledge_classes/{year}.json (see app/roster.py).
"""

import json
from datetime import datetime

from app.database import get_db_connection


def _table_is_empty(conn, table_name: str) -> bool:
    """Return True if the given table has zero rows."""
    row = conn.execute(f"SELECT COUNT(*) AS count FROM {table_name}").fetchone()
    return row["count"] == 0


def seed_database() -> None:
    """
    Insert demo events, announcements, rush info, gallery, pledge classes,
    and donation content when each table is empty.
    """
    with get_db_connection() as conn:

        # ------------------------------------------------------------------ #
        # Events                                                               #
        # ------------------------------------------------------------------ #
        if _table_is_empty(conn, "events"):
            conn.executemany(
                "INSERT INTO events (title, description, event_date, location) VALUES (?, ?, ?, ?)",
                [
                    ("Homecoming 2026", "Beta Sigma's annual homecoming celebration.",                "2026-10-10", "Grove City College"),
                    ("Fall Retreat",    "Weekend brotherhood retreat — leadership and team building.", "2026-09-27", "Western Pennsylvania"),
                    ("Patio Night",     "Beta Sigma's signature all-campus event on the Lincoln Patio.", "2026-09-20", "Lincoln Patio"),
                ],
            )

        # ------------------------------------------------------------------ #
        # Announcements                                                        #
        # ------------------------------------------------------------------ #
        if _table_is_empty(conn, "announcements"):
            today = datetime.utcnow().strftime("%Y-%m-%d")
            conn.executemany(
                "INSERT INTO announcements (title, content, posted_at, is_featured) VALUES (?, ?, ?, ?)",
                [
                    ("Fall Rush Registration Open", "Sign up for rush events at Grove City College. We can't wait to meet you!", today, 1),
                    ("800+ Alumni Strong",            "Beta Sigma's alumni network spans decades of Grove City College graduates making an impact nationwide.", "2026-05-01", 1),
                    ("Patio Night — All Campus",      "Join us on the Lincoln Patio for one of our signature all-campus events.", "2026-06-10", 0),
                ],
            )

        # ------------------------------------------------------------------ #
        # Rush Info                                                            #
        # ------------------------------------------------------------------ #
        if _table_is_empty(conn, "rush_info"):
            conn.executemany(
                "INSERT INTO rush_info (section_title, section_content, display_order) VALUES (?, ?, ?)",
                [
                    ("Why Beta Sigma?",           "Founded in 1922 at Grove City College, Beta Sigma is built on integrity, quality, and tradition. We seek men who want to grow academically, lead on campus, and build lifelong brotherhood.", 1),
                    ("What to Expect During Rush","Rush is a mutual selection process. Come to our events on campus, ask questions, and get to know the chapter. There is no obligation — just show up as yourself.", 2),
                    ("Requirements",              "Prospective members must be enrolled at Grove City College, maintain good academic standing, and demonstrate character aligned with our fraternity values.", 3),
                    ("Important Dates",           "Rush Week: August 25–31, 2026 | Interviews: September 1–3 | Bid Day: September 5, 2026", 4),
                ],
            )

        # The public Gallery page's chapter photos section reads directly from
        # media/gallery/{year-range}/ folders (see app/routers/gallery.py) —
        # nothing to seed here.

        # Pledge class group photos/videos are uploaded by officers through the
        # admin panel (see admin_pledge_classes.py) — nothing to seed here.
        # The individual brother roster lives in app/data/pledge_classes/{year}.json
        # and is matched to headshots in media/pledge_classes/{year}/ (see app/roster.py).

        # ------------------------------------------------------------------ #
        # Donation Page Info                                                   #
        # ------------------------------------------------------------------ #
        if _table_is_empty(conn, "donate_info"):
            conn.execute(
                """
                INSERT INTO donate_info
                    (headline, mission_text, impact_bullets, payment_link, payment_button_text, goal_amount)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    "Support Beta Sigma at Grove City College",
                    "Your generous donation directly supports our 30+ active brothers, "
                    "chapter programming, and the traditions that have defined Beta Sigma "
                    "since 1922.",
                    json.dumps([
                        "Rush Events",
                        "Formal",
                        "Patio Night",
                        "Fall Party",
                    ]),
                    "#",   # Replace with your actual payment link
                    "Donate Now",
                    1000.0,
                ),
            )

        # ------------------------------------------------------------------ #
        # Contact Page — chapter president's info                             #
        # ------------------------------------------------------------------ #
        if _table_is_empty(conn, "contact_info"):
            conn.execute(
                "INSERT INTO contact_info (president_name, president_email) VALUES (?, ?)",
                ("Nico DAngelo", "DAngeloDJ23@GCC.EDU"),
            )
