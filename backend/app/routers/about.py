"""
Chapter About / static content API routes.

Some fraternity information rarely changes; we serve it from a single endpoint
so the About page can stay dynamic without hard-coding copy in the frontend.
"""

from fastapi import APIRouter

from app.models import ChapterInfoResponse

router = APIRouter(prefix="/about", tags=["About"])


@router.get("", response_model=ChapterInfoResponse)
def get_chapter_info():
    """
    Return Beta Sigma history, motto, values, and chapter facts.

    This content could later move into the database or a CMS.
    """
    return ChapterInfoResponse(
        name="Beta Sigma Fraternity",
        founded="1922 at Grove City College",
        campus="Grove City College",
        motto="Integrity. Quality. Tradition.",
        colors=["Black", "Red"],
        mascot="Bulldog",
        active_members="30+",
        alumni_count="800+",
        philanthropy="Campus and community service throughout Grove City and beyond",
        history=(
            "Founded in 1922 at Grove City College, Beta Sigma has spent more than a "
            "century building men of character on campus. What began as a small brotherhood "
            "has grown into a chapter of 30+ active members and more than 800 alumni "
            "across the country — united by integrity, quality, and tradition. "
            "From the Lincoln Patio to chapter events across campus, the Bulldog has "
            "been a fixture of Grove City College life for generations."
        ),
        values=[
            "Integrity — doing the right thing, even when no one is watching",
            "Quality — pursuing excellence in academics, leadership, and brotherhood",
            "Tradition — honoring our history while building the chapter's future",
        ],
    )
