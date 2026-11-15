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

        # Content Security Policy (CSP)
        csp_policies = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com data:",
            "img-src 'self' data: https: blob:",
            "media-src 'self' https: blob: data:",
            "connect-src 'self' https://api.alquran.cloud https://api.aladhan.com https://cdn.islamic.network https://everyayah.com https://*.mp3quran.net https://download.quranplayermp3.com https://ipapi.co https://get.geojs.io https://nur-quran.onrender.com https://*.netlify.app",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ]
        response['Content-Security-Policy'] = "; ".join(csp_policies)

        # Additional protection headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response['Permissions-Policy'] = 'geolocation=(self), microphone=(), camera=()'

        return response

