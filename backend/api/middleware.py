"""
Noor Al-Quran — Custom Security Middleware
Applies CSP, strict security headers, and protection against framing and content-type sniffing.
"""


class SecurityHeadersMiddleware:
    """
    Middleware that adds Content Security Policy (CSP), Referrer-Policy,
    and Permissions-Policy to all outgoing responses.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Strict Content Security Policy (zero inline allowances on frontend/API routes)
        if request.path.startswith("/api/"):
            response["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
        elif request.path.startswith("/admin/"):
            response["Content-Security-Policy"] = (
                "default-src 'self'; script-src 'self' 'unsafe-inline'; "
                "style-src 'self' 'unsafe-inline'; img-src 'self' data:; "
                "frame-ancestors 'none'; base-uri 'self'"
            )
        else:
            csp_policies = [
                "default-src 'self'",
                "script-src 'self'",
                "script-src-attr 'none'",
                "style-src 'self' https://fonts.googleapis.com",
                "style-src-attr 'none'",
                "font-src 'self' https://fonts.gstatic.com data:",
                "img-src 'self' data: https: blob:",
                "media-src 'self' https: blob: data:",
                "connect-src 'self' https://api.alquran.cloud https://api.aladhan.com "
                "https://cdn.islamic.network https://everyayah.com https://*.mp3quran.net "
                "https://download.quranplayermp3.com https://cdn.jsdelivr.net "
                "https://ipapi.co https://get.geojs.io "
                "https://nur-quran.onrender.com https://*.netlify.app",
                "object-src 'none'",
                "frame-ancestors 'none'",
                "base-uri 'self'",
                "form-action 'self'",
            ]
            response["Content-Security-Policy"] = "; ".join(csp_policies)

        # Additional protection headers
        response["X-Content-Type-Options"] = "nosniff"
        response["X-Frame-Options"] = "DENY"
        response["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response["Permissions-Policy"] = "geolocation=(self), microphone=(), camera=()"

        return response
