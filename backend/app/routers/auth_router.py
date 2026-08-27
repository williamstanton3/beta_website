"""
Authentication routes for the Beta Sigma admin panel.

There is only one admin account — identified by a single shared password
stored in the .env file. This is appropriate for a small fraternity website
managed by a handful of officers.

For a larger multi-user system you would add a users table and bcrypt hashing.
"""

import secrets

from fastapi import APIRouter, HTTPException, status

from app.auth import create_admin_token
from app.config import settings
from app.models import LoginRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    """
    Verify the admin password and return a JWT token.

    Uses secrets.compare_digest for timing-safe comparison
    to prevent timing-based password guessing attacks.
    """
    # Compare in constant time so attackers can't measure response speed
    password_correct = secrets.compare_digest(
        payload.password.encode("utf-8"),
        settings.admin_password.encode("utf-8"),
    )

    if not password_correct:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password.",
        )

    token = create_admin_token()
    return TokenResponse(token=token, expires_in_hours=settings.jwt_expire_hours)


@router.post("/logout")
def logout():
    """
    Logout is handled client-side (delete the token from localStorage).
    This endpoint exists as a clear signal that the action was intentional.
    """
    return {"message": "Logged out successfully."}
