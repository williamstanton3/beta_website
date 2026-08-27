"""
Members (Brothers) API routes.

Returns the roster grouped by pledge class year. Active pledge classes
(app/data/pledge_classes/actives/) come first; alumni classes
(app/data/pledge_classes/alumni/) follow in reverse-chronological order.
Headshots are attached by matching each person's name to a file in
media/pledge_classes/{year}/.
"""

from fastapi import APIRouter, Request

from app.models import PledgeClassGroupResponse, PledgeClassMemberResponse
from app.roster import (
    find_photo_filename,
    list_active_years,
    list_alumni_years,
    load_year,
    photo_version,
)

router = APIRouter(prefix="/members", tags=["Members"])


def _build_group(
    year: int, member_type: str, base: str
) -> PledgeClassGroupResponse | None:
    roster = load_year(year)
    members = []
    for person in roster:
        photo = find_photo_filename(year, person["first_name"], person["last_name"])
        members.append(
            PledgeClassMemberResponse(
                first_name=person["first_name"],
                last_name=person["last_name"],
                roles=[r for r in person.get("roles", []) if r],
                major=person.get("major", ""),
                hometown=person.get("hometown", ""),
                bio=person.get("bio", ""),
                image_url=(
                    f"{base}/media/pledge_classes/{year}/{photo}?v={photo_version(year, photo)}"
                    if photo else None
                ),
            )
        )
    members.sort(key=lambda m: (m.last_name, m.first_name))
    if not members:
        return None
    return PledgeClassGroupResponse(year=year, member_type=member_type, members=members)


@router.get("/by-pledge-class", response_model=list[PledgeClassGroupResponse])
def list_members_by_pledge_class(request: Request):
    """
    Return every brother grouped by pledge class year, newest first.

    Active classes (2024+) come before alumni classes.
    """
    base   = str(request.base_url).rstrip("/")
    groups = []

    for year in list_active_years():
        g = _build_group(year, "active", base)
        if g:
            groups.append(g)

    for year in list_alumni_years():
        g = _build_group(year, "alumni", base)
        if g:
            groups.append(g)

    return groups
