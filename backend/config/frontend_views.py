"""Serve hardened static PWA frontend files & legacy 301 redirects via Django."""

import mimetypes
from pathlib import Path

from django.conf import settings
from django.http import FileResponse, HttpResponse, HttpResponsePermanentRedirect

FRONTEND_DIR = (settings.BASE_DIR.parent / "frontend").resolve()

LEGACY_RECITER_REDIRECTS = {
    "pages/reciter-alafasy.html": "/pages/reciter.html?id=mishary_alafasy",
    "pages/reciter-abdulbasit.html": "/pages/reciter.html?id=abdulbasit",
    "pages/reciter-ghamdi.html": "/pages/reciter.html?id=ghamdi",
    "pages/reciter-minshawi.html": "/pages/reciter.html?id=minshawi",
    "pages/reciter-maher.html": "/pages/reciter.html?id=maher",
    "pages/reciter-islam-sobhi.html": "/pages/reciter.html?id=islam_sobhi",
    "pages/reciter-yasser.html": "/pages/reciter.html?id=yasser_dosari",
    "pages/reciter-sherif-mostafa.html": "/pages/reciter.html?id=sherif_mostafa",
    "pages/reciter-abdurrahman-mossad.html": "/pages/reciter.html?id=abdurrahman_mossad",
    "pages/reciter-raad-kurdi.html": "/pages/reciter.html?id=raad_kurdi",
}

IMMUTABLE_EXTS = {".css", ".js", ".png", ".webp", ".ico", ".svg", ".woff2", ".json"}


def _serve_file(path: Path, status_code: int = 200) -> HttpResponse:
    content_type, _ = mimetypes.guess_type(str(path))
    if path.suffix == ".js":
        content_type = "application/javascript; charset=utf-8"
    elif path.suffix == ".html":
        content_type = "text/html; charset=utf-8"
    elif path.suffix == ".json":
        content_type = "application/json; charset=utf-8"
    elif path.suffix == ".webp":
        content_type = "image/webp"

    response = FileResponse(
        path.open("rb"), content_type=content_type or "application/octet-stream"
    )
    response.status_code = status_code
    if path.suffix == ".html" or path.name == "sw.js":
        response["Cache-Control"] = "no-cache, no-store, must-revalidate"
    elif path.suffix in IMMUTABLE_EXTS:
        response["Cache-Control"] = "public, max-age=31536000, immutable"
    return response


def serve_frontend(request, rel_path: str = ""):
    """Resolve and stream files strictly inside FRONTEND_DIR, preserving 301s and custom 404."""
    clean_rel = (rel_path or "").lstrip("/")
    if clean_rel in LEGACY_RECITER_REDIRECTS:
        return HttpResponsePermanentRedirect(LEGACY_RECITER_REDIRECTS[clean_rel])

    if not FRONTEND_DIR.exists():
        return HttpResponse("Not Found", status=404, content_type="text/plain")

    target = FRONTEND_DIR / ("index.html" if not clean_rel else clean_rel)
    resolved = target.resolve()
    if resolved != FRONTEND_DIR and not resolved.is_relative_to(FRONTEND_DIR):
        return HttpResponse("Forbidden", status=403, content_type="text/plain")

    if resolved.is_dir():
        resolved = resolved / "index.html"
    elif not resolved.exists() and not Path(clean_rel).suffix:
        html_candidate = FRONTEND_DIR / f"{clean_rel}.html"
        if html_candidate.resolve().is_relative_to(FRONTEND_DIR) and html_candidate.is_file():
            resolved = html_candidate.resolve()

    if resolved.is_file():
        return _serve_file(resolved, status_code=200)

    not_found_page = FRONTEND_DIR / "404.html"
    if not_found_page.is_file():
        return _serve_file(not_found_page, status_code=404)
    return HttpResponse("Not Found", status=404, content_type="text/plain")
