from fastapi import HTTPException, Request

from auth import verify_admin_session


def require_admin(request: Request):
    """
    Dependency that requires admin authentication.
    Returns 404 if not authenticated (to hide admin panel existence).
    """
    if not verify_admin_session(request):
        raise HTTPException(status_code=404, detail="Not found")
    return True
