"""
Seed the JSON content store with sample Beta Sigma content.

Each file is created only if it doesn't already exist (see
app.content_store.load), so this is safe to call on every startup — it
never overwrites real content once it's been created. Note that fraternity
brothers are NOT seeded here — the Brothers page roster lives in
app/data/pledge_classes/{actives,alumni}/{year}.json (see app/roster.py).
"""

from datetime import datetime

from app import content_store


def seed_content() -> None:
    """Create default JSON content files for a fresh checkout of the project."""

    today = datetime.utcnow().strftime("%Y-%m-%d")

    content_store.load("events.json", [
        {"id": 1, "title": "Homecoming 2026", "description": "Beta Sigma's annual homecoming celebration.",
         "event_date": "2026-10-10", "location": "Grove City College"},
        {"id": 2, "title": "Fall Retreat", "description": "Weekend brotherhood retreat — leadership and team building.",
         "event_date": "2026-09-27", "location": "Western Pennsylvania"},
        {"id": 3, "title": "Patio Night", "description": "Beta Sigma's signature all-campus event on the Lincoln Patio.",
         "event_date": "2026-09-20", "location": "Lincoln Patio"},
    ])

    content_store.load("announcements.json", [
        {"id": 1, "title": "Fall Rush Registration Open",
         "content": "Sign up for rush events at Grove City College. We can't wait to meet you!",
         "posted_at": today, "is_featured": True},
        {"id": 2, "title": "800+ Alumni Strong",
         "content": "Beta Sigma's alumni network spans decades of Grove City College graduates making an impact nationwide.",
         "posted_at": "2026-05-01", "is_featured": True},
        {"id": 3, "title": "Patio Night — All Campus",
         "content": "Join us on the Lincoln Patio for one of our signature all-campus events.",
         "posted_at": "2026-06-10", "is_featured": False},
    ])

    content_store.load("rush_info.json", [
        {"id": 1, "section_title": "Why Beta Sigma?",
         "section_content": "Founded in 1922 at Grove City College, Beta Sigma is built on integrity, quality, and tradition. We seek men who want to grow academically, lead on campus, and build lifelong brotherhood.",
         "display_order": 1},
        {"id": 2, "section_title": "What to Expect During Rush",
         "section_content": "Rush is a mutual selection process. Come to our events on campus, ask questions, and get to know the chapter. There is no obligation — just show up as yourself.",
         "display_order": 2},
        {"id": 3, "section_title": "Requirements",
         "section_content": "Prospective members must be enrolled at Grove City College, maintain good academic standing, and demonstrate character aligned with our fraternity values.",
         "display_order": 3},
        {"id": 4, "section_title": "Important Dates",
         "section_content": "Rush Week: August 25–31, 2026 | Interviews: September 1–3 | Bid Day: September 5, 2026",
         "display_order": 4},
    ])

    content_store.load("donate_info.json", {
        "headline": "Support Beta Sigma at Grove City College",
        "mission_text": "Your generous donation directly supports our 30+ active brothers, "
                        "chapter programming, and the traditions that have defined Beta Sigma "
                        "since 1922.",
        "impact_bullets": ["Rush Events", "Formal", "Patio Night", "Fall Party"],
        "payment_link": "#",
        "payment_button_text": "Donate Now",
        "goal_amount": 1000.0,
    })

    content_store.load("contact_info.json", {
        "president_name": "Nico DAngelo",
        "president_email": "DAngeloDJ23@GCC.EDU",
    })

    content_store.load("contact_messages.json", [])
    content_store.load("pledge_class_media.json", [])
