"""
Beta Sigma Fraternity — FastAPI Application Entry Point

Run locally:
    cd backend
    pip install -r requirements.txt
    uvicorn app.main:app --reload --port 8000

Interactive API docs: http://localhost:8000/docs
Admin panel:          http://localhost:5173/admin  (after starting the frontend)
"""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import get_media_dir, init_database
from app.routers import about, announcements, contact, events, members, rush
from app.routers import (
    admin_announcements,
    admin_contact,
    admin_donate,
    admin_events,
    admin_members,
    admin_pledge_classes,
    admin_gallery,
    auth_router,
    gallery,
)
from app.seed_data import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup hooks run before the server accepts requests:
      1. Create all SQLite tables (safe to run repeatedly)
      2. Ensure media/ subdirectories exist
      3. Seed demo content if tables are empty
    """
    init_database()
    get_media_dir()     # creates media/ subdirectories if missing
    seed_database()
    yield
    # No teardown needed for SQLite in this demo


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(
    title=settings.app_name,
    version=settings.api_version,
    description="REST API powering the Beta Sigma fraternity website and admin panel.",
    lifespan=lifespan,
)

# Allow the React dev server (and production frontend) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Static file serving — uploaded images and videos
# The media/ folder lives next to this file's package at backend/media/
# ---------------------------------------------------------------------------

media_path = Path(__file__).resolve().parent.parent / "media"
media_path.mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=str(media_path)), name="media")

# ---------------------------------------------------------------------------
# API routes
# ---------------------------------------------------------------------------

API_PREFIX = "/api"

# Public read-only routes (no auth required)
app.include_router(members.router,       prefix=API_PREFIX)
app.include_router(events.router,        prefix=API_PREFIX)
app.include_router(announcements.router, prefix=API_PREFIX)
app.include_router(rush.router,          prefix=API_PREFIX)
app.include_router(contact.router,       prefix=API_PREFIX)
app.include_router(about.router,         prefix=API_PREFIX)
app.include_router(gallery.router,       prefix=API_PREFIX)   # new public gallery

# Auth (login/logout — no auth required on these obviously)
app.include_router(auth_router.router, prefix=API_PREFIX)

# Admin routes (all require JWT token via require_auth dependency)
app.include_router(admin_members.router,       prefix=API_PREFIX)
app.include_router(admin_events.router,        prefix=API_PREFIX)
app.include_router(admin_announcements.router, prefix=API_PREFIX)
app.include_router(admin_gallery.router,       prefix=API_PREFIX)
app.include_router(admin_pledge_classes.router,prefix=API_PREFIX)
app.include_router(admin_donate.router,        prefix=API_PREFIX)
app.include_router(admin_contact.router,       prefix=API_PREFIX)


# ---------------------------------------------------------------------------
# Root + health
# ---------------------------------------------------------------------------

@app.get("/")
def root():
    return {
        "message": "Welcome to the Beta Sigma Fraternity API",
        "docs":    "/docs",
        "version": settings.api_version,
    }


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": settings.app_name}
