"""
Admin CRUD endpoints for fraternity members (brothers).

Brothers are stored in per-pledge-class-year JSON files under
app/data/pledge_classes/{year}.json (see app/roster.py) rather than a
database table, so these same files also drive the public Brothers page.
Headshots are matched by filename convention ("FirstName_LastName.<ext>")
in media/pledge_classes/{year}/, and kept in sync with the person's name
and pledge class year as they're edited here.
"""

import json
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile

from app.auth import require_auth
from app.database import get_media_dir
from app.models import RosterMemberResponse
from app.roster import find_photo_filename, is_alumni_year, list_years, load_year, photo_version, save_year, slugify

router = APIRouter(prefix="/admin/members", tags=["Admin — Members"])

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}


def _parse_roles(raw: str) -> list[str]:
    """Parse the JSON-encoded array sent by the admin form into a clean list of titles."""
    try:
        parsed = json.loads(raw)
    except (TypeError, ValueError):
        return []
    if not isinstance(parsed, list):
        return []
    return [str(r).strip() for r in parsed if str(r).strip()]


def _year_dir(year: int) -> Path:
    d = get_media_dir() / "pledge_classes" / str(year)
    d.mkdir(parents=True, exist_ok=True)
    return d


def _build_image_url(request: Request, year: int, filename: str | None) -> str | None:
    if not filename:
        return None
    base = str(request.base_url).rstrip("/")
    return f"{base}/media/pledge_classes/{year}/{filename}?v={photo_version(year, filename)}"


def _to_response(request: Request, year: int, person: dict) -> RosterMemberResponse:
    photo = find_photo_filename(year, person["first_name"], person["last_name"])
    return RosterMemberResponse(
        id=f"{year}-{person['id']}",
        first_name=person["first_name"],
        last_name=person["last_name"],
        class_year=year,
        major=person.get("major", ""),
        hometown=person.get("hometown", ""),
        roles=person.get("roles", []),
        email=person.get("email", ""),
        bio=person.get("bio", ""),
        image_url=_build_image_url(request, year, photo),
    )


def _parse_id(member_id: str) -> tuple[int, str]:
    year_str, _, slug = member_id.partition("-")
    if not year_str.isdigit() or not slug:
        raise HTTPException(status_code=404, detail="Member not found")
    return int(year_str), slug


def _unique_slug(first_name: str, last_name: str, roster: list[dict], skip_id: str | None = None) -> str:
    base_slug = slugify(first_name, last_name)
    taken = {p["id"] for p in roster if p["id"] != skip_id}
    slug = base_slug
    counter = 2
    while slug in taken:
        slug = f"{base_slug}-{counter}"
        counter += 1
    return slug


# --------------------------------------------------------------------------- #
# READ                                                                          #
# --------------------------------------------------------------------------- #

@router.get("", response_model=list[RosterMemberResponse])
def list_members_admin(request: Request, _=Depends(require_auth)):
    """Return every brother across all pledge class years for the admin table."""
    results = [
        _to_response(request, year, person)
        for year in list_years()
        for person in load_year(year)
    ]
    results.sort(key=lambda m: (-m.class_year, m.last_name))
    return results


# --------------------------------------------------------------------------- #
# CREATE — POST /api/admin/members                                              #
# --------------------------------------------------------------------------- #

@router.post("", response_model=RosterMemberResponse, status_code=201)
async def create_member(
    request: Request,
    first_name: str = Form(...),
    last_name: str = Form(...),
    class_year: int = Form(...),
    major: str = Form(""),
    hometown: str = Form(""),
    roles: str = Form("[]"),
    email: str = Form(""),
    bio: str = Form(""),
    photo: UploadFile | None = File(None),
    _=Depends(require_auth),
):
    """Add a new brother to their pledge class year's JSON roster."""
    roster = load_year(class_year)
    slug = _unique_slug(first_name, last_name, roster)

    if photo and photo.filename:
        suffix = Path(photo.filename).suffix.lower()
        if suffix not in ALLOWED_IMAGE_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Image type '{suffix}' not allowed. Use: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}",
            )
        dest = _year_dir(class_year) / f"{first_name}_{last_name}{suffix}"
        dest.write_bytes(await photo.read())

    person = {
        "id": slug,
        "first_name": first_name,
        "last_name": last_name,
        "roles": _parse_roles(roles),
        "major": major,
        "hometown": hometown,
        "email": email,
        "bio": bio,
    }
    roster.append(person)
    save_year(class_year, roster)

    return _to_response(request, class_year, person)


# --------------------------------------------------------------------------- #
# UPDATE — PUT /api/admin/members/{id}                                         #
# --------------------------------------------------------------------------- #

@router.put("/{member_id}", response_model=RosterMemberResponse)
async def update_member(
    member_id: str,
    request: Request,
    first_name: str = Form(None),
    last_name: str = Form(None),
    class_year: int = Form(None),
    major: str = Form(None),
    hometown: str = Form(None),
    roles: str = Form(None),
    email: str = Form(None),
    bio: str = Form(None),
    photo: UploadFile | None = File(None),
    _=Depends(require_auth),
):
    """
    Update a brother's info, optionally moving them to a different pledge
    class year and/or replacing their photo. When their name or year changes
    without a new photo upload, their existing headshot is renamed/moved to
    keep following them.
    """
    old_year, slug = _parse_id(member_id)
    roster = load_year(old_year)
    person = next((p for p in roster if p["id"] == slug), None)
    if person is None:
        raise HTTPException(status_code=404, detail="Member not found")

    old_first, old_last = person["first_name"], person["last_name"]
    new_first = first_name or old_first
    new_last = last_name or old_last
    new_year = class_year or old_year

    old_photo_name = find_photo_filename(old_year, old_first, old_last)

    if photo and photo.filename:
        suffix = Path(photo.filename).suffix.lower()
        if suffix not in ALLOWED_IMAGE_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"Image type '{suffix}' not allowed.")
        dest = _year_dir(new_year) / f"{new_first}_{new_last}{suffix}"
        dest.write_bytes(await photo.read())
        if old_photo_name and (new_year != old_year or dest.name != old_photo_name):
            (get_media_dir() / "pledge_classes" / str(old_year) / old_photo_name).unlink(missing_ok=True)
    elif old_photo_name and (new_first != old_first or new_last != old_last or new_year != old_year):
        old_path = get_media_dir() / "pledge_classes" / str(old_year) / old_photo_name
        new_path = _year_dir(new_year) / f"{new_first}_{new_last}{Path(old_photo_name).suffix}"
        if old_path.exists():
            old_path.rename(new_path)

    updated = {
        "id": person["id"],
        "first_name": new_first,
        "last_name": new_last,
        "roles": _parse_roles(roles) if roles is not None else person.get("roles", []),
        "major": major if major is not None else person.get("major", ""),
        "hometown": hometown if hometown is not None else person.get("hometown", ""),
        "email": email if email is not None else person.get("email", ""),
        "bio": bio if bio is not None else person.get("bio", ""),
    }

    if new_year != old_year:
        save_year(old_year, [p for p in roster if p["id"] != slug])
        new_roster = load_year(new_year)
        updated["id"] = _unique_slug(new_first, new_last, new_roster, skip_id=updated["id"])
        new_roster.append(updated)
        save_year(new_year, new_roster)
    else:
        for i, p in enumerate(roster):
            if p["id"] == slug:
                roster[i] = updated
                break
        save_year(old_year, roster)

    return _to_response(request, new_year, updated)


# --------------------------------------------------------------------------- #
# DELETE — DELETE /api/admin/members/{id}                                      #
# --------------------------------------------------------------------------- #

@router.delete("/{member_id}", status_code=204)
def delete_member(member_id: str, _=Depends(require_auth)):
    """
    Remove a brother from their pledge class roster.

    Note: their headshot file is left on disk (not deleted) in case it was
    added by mistake or the brother is re-added later.
    """
    year, slug = _parse_id(member_id)
    roster = load_year(year)
    filtered = [p for p in roster if p["id"] != slug]
    if len(filtered) == len(roster):
        raise HTTPException(status_code=404, detail="Member not found")
    save_year(year, filtered)
