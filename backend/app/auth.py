"""
JWT authentication utilities for the Beta Sigma admin panel.

Flow:
  1. Officer POSTs password to POST /api/auth/login
  2. Backend verifies password and returns a signed JWT token
  3. Officer stores token in browser (localStorage via React context)
  4. Every admin request includes: Authorization: Bearer <token>
  5. require_auth dependency verifies the token on each protected endpoint
"""

import jwt
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.config import settings

# FastAPI dependency that extracts the Bearer token from the Authorization header
_bearer_scheme = HTTPBearer()


def create_admin_token() -> str:
    """
    Generate a signed JWT token for an authenticated admin session.

    The token expires after jwt_expire_hours (default: 8 hours).
    """
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.jwt_expire_hours)
    payload = {
        "sub": "admin",          # subject — who this token represents
        "exp": expire,            # expiration timestamp (checked automatically by PyJWT)
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm="HS256")


def require_auth(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
) -> dict:
    """
    FastAPI dependency — validates the Bearer token on every admin endpoint.

    Usage:
        @router.post("/something")
        def protected_endpoint(user = Depends(require_auth)):
            ...

    Raises 401 if the token is missing, expired, or tampered with.
    """
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.jwt_secret_key,
            algorithms=["HS256"],
        )
        return payload  # contains {"sub": "admin", "exp": ...}

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired — please log in again.",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials.",
        )
