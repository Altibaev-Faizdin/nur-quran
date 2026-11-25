"""Custom JWT authentication enforcing per-user password-version invalidation."""

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed


def password_version_hash(user) -> str:
    """Return a non-secret 12-char suffix of the salted password hash."""
    pw = getattr(user, "password", "") or ""
    return pw[-12:] if len(pw) >= 12 else pw


class PasswordVersionJWTAuthentication(JWTAuthentication):
    """Reject access tokens issued before password changes or account deletion."""

    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        token_pvh = validated_token.get("pvh")
        if token_pvh is None or token_pvh != password_version_hash(user):
            raise AuthenticationFailed(
                "Session has expired due to credential update.",
                code="password_changed",
            )
        return user
