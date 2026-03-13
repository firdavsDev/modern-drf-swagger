from django.conf import settings
from django.core.cache import cache

from ..models import EndpointPermission, TeamMember, UserRole


class EndpointPermissionChecker:
    """
    Checks endpoint permissions based on team memberships and endpoint permissions.
    Implements caching for performance.
    """

    CACHE_TIMEOUT = 300  # 5 minutes

    def __init__(self, user):
        self.user = user

    def _get_cache_key(self, path, method):
        """Generate cache key for permission check"""
        return f"modern_drf_swagger:perm:{self.user.id}:{path}:{method}"

    def check_access(self, path, method):
        """
        Check if user has access to the specified endpoint.

        Args:
            path (str): The endpoint path (e.g., /api/users/)
            method (str): HTTP method (GET, POST, etc.)

        Returns:
            bool: True if user has access, False otherwise
        """
        # If user is not authenticated, check ALLOW_ANONYMOUS setting
        if not self.user or not self.user.is_authenticated:
            portal_settings = getattr(settings, "MODERN_DRF_SWAGGER", {})
            return portal_settings.get("ALLOW_ANONYMOUS", False)

        # Superusers have access to everything
        if self.user.is_superuser:
            return True

        # Check cache first
        cache_key = self._get_cache_key(path, method)
        cached_result = cache.get(cache_key)
        if cached_result is not None:
            return cached_result

        # Get user's team memberships
        team_memberships = TeamMember.objects.filter(user=self.user).select_related(
            "team"
        )

        # Super Admins have access to everything
        if team_memberships.filter(role=UserRole.SUPER_ADMIN).exists():
            cache.set(cache_key, True, self.CACHE_TIMEOUT)
            return True

        # Check endpoint permissions for user's teams
        user_teams = [tm.team for tm in team_memberships]

        # Get permissions for this endpoint
        permissions = EndpointPermission.objects.filter(team__in=user_teams, path=path)

        for perm in permissions:
            # Check if method is allowed (* means all methods)
            allowed_methods = [m.strip().upper() for m in perm.methods.split(",")]
            if "*" in allowed_methods or method.upper() in allowed_methods:
                cache.set(cache_key, True, self.CACHE_TIMEOUT)
                return True

        # No permission found
        cache.set(cache_key, False, self.CACHE_TIMEOUT)
        return False

    def get_allowed_endpoints(self):
        """
        Get list of all endpoints the user has access to.

        Returns:
            list: List of dicts with 'path' and 'methods' keys
        """
        # Superusers have access to everything
        if self.user and self.user.is_authenticated and self.user.is_superuser:
            return None  # Return None to indicate "all endpoints"

        # If not authenticated and anonymous not allowed, return empty list
        if not self.user or not self.user.is_authenticated:
            portal_settings = getattr(settings, "MODERN_DRF_SWAGGER", {})
            if not portal_settings.get("ALLOW_ANONYMOUS", False):
                return []

        # Check cache
        cache_key = f"modern_drf_swagger:allowed_endpoints:{self.user.id if self.user else 'anon'}"
        cached_result = cache.get(cache_key)
        if cached_result is not None:
            return cached_result

        # Get user's team memberships
        team_memberships = TeamMember.objects.filter(user=self.user).select_related(
            "team"
        )

        # Super Admins have access to everything
        if team_memberships.filter(role=UserRole.SUPER_ADMIN).exists():
            cache.set(cache_key, None, self.CACHE_TIMEOUT)
            return None  # All endpoints

        # Get all endpoint permissions for user's teams
        user_teams = [tm.team for tm in team_memberships]
        permissions = EndpointPermission.objects.filter(team__in=user_teams).values(
            "path", "methods"
        )

        # Build list of allowed endpoints
        allowed = []
        for perm in permissions:
            allowed.append({"path": perm["path"], "methods": perm["methods"]})

        cache.set(cache_key, allowed, self.CACHE_TIMEOUT)
        return allowed

    @staticmethod
    def clear_cache_for_user(user):
        """Clear permission cache for a specific user"""
        # This is a simple implementation - in production you might want to use cache patterns
        # For now, we just let the cache expire naturally
        pass
