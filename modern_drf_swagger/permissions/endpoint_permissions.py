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

        # Super Admins and Admins have access to everything
        if team_memberships.filter(
            role__in=[UserRole.SUPER_ADMIN, UserRole.ADMIN]
        ).exists():
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

        # Super Admins and Admins have access to everything
        if team_memberships.filter(
            role__in=[UserRole.SUPER_ADMIN, UserRole.ADMIN]
        ).exists():
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

    def get_user_role(self):
        """
        Get the highest role of the user.

        Returns:
            str: The highest role (SUPER_ADMIN, ADMIN, DEVELOPER, or VIEWER)
        """
        if not self.user or not self.user.is_authenticated:
            return None

        # Superusers are treated as Super Admins
        if self.user.is_superuser:
            return UserRole.SUPER_ADMIN

        # Check cache
        cache_key = f"modern_drf_swagger:user_role:{self.user.id}"
        cached_result = cache.get(cache_key)
        if cached_result is not None:
            return cached_result

        # Get user's team memberships
        team_memberships = TeamMember.objects.filter(user=self.user).select_related(
            "team"
        )

        # Role hierarchy: SUPER_ADMIN > ADMIN > DEVELOPER > VIEWER
        role_priority = {
            UserRole.SUPER_ADMIN: 4,
            UserRole.ADMIN: 3,
            UserRole.DEVELOPER: 2,
            UserRole.VIEWER: 1,
        }

        highest_role = None
        highest_priority = 0

        for membership in team_memberships:
            priority = role_priority.get(membership.role, 0)
            if priority > highest_priority:
                highest_priority = priority
                highest_role = membership.role

        cache.set(cache_key, highest_role, self.CACHE_TIMEOUT)
        return highest_role

    def can_send_request(self):
        """
        Check if user can send API requests.
        Only SUPER_ADMIN, ADMIN, and DEVELOPER roles can send requests.
        VIEWER role can only view endpoints but not send requests.

        Returns:
            bool: True if user can send requests, False otherwise
        """
        if not self.user or not self.user.is_authenticated:
            return False

        # Superusers can send requests
        if self.user.is_superuser:
            return True

        # Check cache
        cache_key = f"modern_drf_swagger:can_send:{self.user.id}"
        cached_result = cache.get(cache_key)
        if cached_result is not None:
            return cached_result

        role = self.get_user_role()
        can_send = role in [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DEVELOPER]

        cache.set(cache_key, can_send, self.CACHE_TIMEOUT)
        return can_send

    def can_view_analytics(self):
        """
        Check if user can view analytics page.
        VIEWER role cannot view analytics.

        Returns:
            bool: True if user can view analytics, False otherwise
        """
        if not self.user or not self.user.is_authenticated:
            return False

        role = self.get_user_role()
        return role in [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DEVELOPER]

    def can_view_all_analytics(self):
        """
        Check if user can view analytics for all users.
        Only SUPER_ADMIN and ADMIN can view all analytics.
        DEVELOPER can only view their own analytics.

        Returns:
            bool: True if user can view all analytics, False otherwise
        """
        if not self.user or not self.user.is_authenticated:
            return False

        role = self.get_user_role()
        return role in [UserRole.SUPER_ADMIN, UserRole.ADMIN]

    def can_view_history(self):
        """
        Check if user can view request history.
        VIEWER cannot view history.

        Returns:
            bool: True if user can view history, False otherwise
        """
        if not self.user or not self.user.is_authenticated:
            return False

        role = self.get_user_role()
        return role in [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DEVELOPER]

    @staticmethod
    def clear_cache_for_user(user):
        """Clear all permission cache for a specific user"""
        if not user or not hasattr(user, "id"):
            return

        # Clear all cache keys for this user
        cache_patterns = [
            f"modern_drf_swagger:perm:{user.id}:*",
            f"modern_drf_swagger:allowed_endpoints:{user.id}",
            f"modern_drf_swagger:user_role:{user.id}",
            f"modern_drf_swagger:can_send:{user.id}",
        ]

        # Django's cache doesn't support wildcard deletion by default
        # So we delete specific known keys
        cache.delete_many(
            [
                f"modern_drf_swagger:allowed_endpoints:{user.id}",
                f"modern_drf_swagger:user_role:{user.id}",
                f"modern_drf_swagger:can_send:{user.id}",
            ]
        )

        # Note: Individual endpoint permission caches (with path:method)
        # will expire naturally after CACHE_TIMEOUT
