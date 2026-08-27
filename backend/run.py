"""
Convenience script to start the Beta Sigma backend server.

Usage:
    cd backend
    python run.py
"""

import uvicorn

if __name__ == "__main__":
    # reload=True enables auto-restart when code changes (development only)
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
