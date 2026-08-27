"""
Application configuration for the Beta Sigma backend.

Centralizes environment-driven settings so the rest of the app
does not hard-code hostnames, ports, or database paths.

To override any setting, create backend/.env and set the variable there.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Runtime settings loaded from environment variables (with safe defaults)."""

    # Human-readable name shown in API docs and health checks
    app_name: str = "Beta Sigma Fraternity API"

    # Allowed browser origins for CORS (the Vite dev server runs on 5173 by default)
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # API metadata
    api_version: str = "1.0.0"

    # --------------------------------------------------------------------------
    # Admin panel authentication
    # --------------------------------------------------------------------------

    # Single admin password — CHANGE THIS before deploying!
    # Set via ADMIN_PASSWORD env var or in backend/.env
    admin_password: str = "BetaSigma2024!"

    # Secret key used to sign JWT tokens — make it long and random in production
    jwt_secret_key: str = "change-this-to-a-long-random-string-in-production"

    # How many hours a login session lasts before the token expires
    jwt_expire_hours: int = 8

    # --------------------------------------------------------------------------
    # Storage locations
    # --------------------------------------------------------------------------

    # Where JSON content (app/data/) and uploaded media (media/) are stored.
    # Left unset, both default to folders next to the app's source code — fine
    # for local development. In production (e.g. Railway), point these at a
    # mounted persistent volume so admin edits/uploads survive redeploys,
    # since the source code itself is rebuilt fresh on every deploy.
    data_dir: str | None = None
    media_dir: str | None = None

    class Config:
        # Automatically load variables from a .env file if it exists
        env_file = ".env"
        env_file_encoding = "utf-8"


# Single shared settings instance imported across the backend
settings = Settings()
