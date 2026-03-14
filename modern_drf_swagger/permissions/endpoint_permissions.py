import re
from urllib.parse import urlsplit

from django.conf import settings
from django.core.cache import cache

from ..models import EndpointPermission, TeamMember, UserRole


class EndpointPermissionChecker:
    """
    Checks endpoint permissions based on team memberships and endpoint permissions.
    Implements caching for performance.
    """

    CACHE_TIMEOUT = 60  # 1 minute
    CACHE_VERSION_KEY = "modern_drf_swagger:cache_version:{user_id}"
    ALL_METHODS = None
    SUPPORTED_HTTP_METHODS = {
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
        "HEAD",
    }
    ANY_METHOD_TOKENS = {"*", "ANY", "ALL"}

    def __init__(self, user):
        self.user = user

    def _get_user_cache_version(self):
        """Return a per-user cache version to invalidate stale permission entries."""
        if not self.user or not getattr(self.user, "id", None):
            return "anon"

        version_key = self.CACHE_VERSION_KEY.format(user_id=self.user.id)
        version = cache.get(version_key)
        if version is None:
            version = 1
            cache.set(version_key, version, None)
        return version

    def _build_cache_key(self, suffix):
        user_id = (
            self.user.id if self.user and getattr(self.user, "id", None) else "anon"
        )
        version = self._get_user_cache_version()
        return f"modern_drf_swagger:user:{user_id}:v{version}:{suffix}"

    def _get_cache_key(self, path, method):
        """Generate cache key for permission check"""
        normalized_path = self.normalize_path(path)
        normalized_method = (method or "").strip().upper()
        return self._build_cache_key(f"perm:{normalized_path}:{normalized_method}")

    @classmethod
    def normalize_path(cls, path):
        """Normalize incoming paths for consistent permission matching."""
        raw_path = str(path or "").strip()
        if not raw_path:
            return "/"

        parsed_path = urlsplit(raw_path).path or raw_path
        normalized_path = re.sub(r"/{2,}", "/", parsed_path)

        if not normalized_path.startswith("/"):
            normalized_path = f"/{normalized_path}"

        if normalized_path != "/" and normalized_path.endswith("/"):
            normalized_path = normalized_path.rstrip("/")

        return normalized_path or "/"

    @classmethod
    def _build_path_pattern(cls, path):
        escaped_path = re.escape(cls.normalize_path(path))
        return re.sub(r"\\\{[^/]+\\\}", r"[^/]+", escaped_path)

    @classmethod
    def paths_match(cls, permission_path, target_path):
        """Match concrete request paths and schema paths against saved permissions."""
        normalized_permission_path = cls.normalize_path(permission_path)
        normalized_target_path = cls.normalize_path(target_path)

        if normalized_permission_path == normalized_target_path:
            return True

        permission_pattern = cls._build_path_pattern(normalized_permission_path)
        if re.fullmatch(permission_pattern, normalized_target_path):
            return True

        target_pattern = cls._build_path_pattern(normalized_target_path)
        return re.fullmatch(target_pattern, normalized_permission_path) is not None

    @classmethod
    def parse_methods(cls, methods):
        """Parse stored method values into either a method set or wildcard marker."""
        if methods is None:
            return set()

        normalized_methods = {
            str(method).strip().upper()
            for method in str(methods).split(",")
            if str(method).strip()
        }

        if not normalized_methods:
            return set()

        if normalized_methods & cls.ANY_METHOD_TOKENS:
            return cls.ALL_METHODS

        return normalized_methods & cls.SUPPORTED_HTTP_METHODS

    def _get_team_memberships(self):
        return TeamMember.objects.filter(user=self.user).select_related("team")

    def _get_team_permissions(self):
        team_memberships = self._get_team_memberships()
        user_teams = team_memberships.values_list("team_id", flat=True)
        permissions = EndpointPermission.objects.filter(team_id__in=user_teams).values(
            "path", "methods"
        )
        return team_memberships, permissions

    def get_allowed_methods_for_path(self, path):
        """Return allowed methods for a path, or None when all methods are allowed."""
        if self.user and self.user.is_authenticated and self.user.is_superuser:
            return self.ALL_METHODS

        if not self.user or not self.user.is_authenticated:
            portal_settings = getattr(settings, "MODERN_DRF_SWAGGER", {})
            if not portal_settings.get("ALLOW_ANONYMOUS", False):
                return set()
            return self.ALL_METHODS

        team_memberships, permissions = self._get_team_permissions()

        if team_memberships.filter(
            role__in=[UserRole.SUPER_ADMIN, UserRole.ADMIN]
        ).exists():
            return self.ALL_METHODS

        allowed_methods = set()
        for perm in permissions:
            if not self.paths_match(perm["path"], path):
                continue

            parsed_methods = self.parse_methods(perm["methods"])
            if parsed_methods is self.ALL_METHODS:
                return self.ALL_METHODS

            allowed_methods.update(parsed_methods)

        return allowed_methods

    def filter_schema_paths(self, paths):
        """Filter schema paths to those visible to the current user."""
        allowed_endpoints = self.get_allowed_endpoints()
        if allowed_endpoints is None:
            return paths

        filtered_paths = {}
        for path, path_item in paths.items():
            allowed_methods = self.get_allowed_methods_for_path(path)
            if allowed_methods is self.ALL_METHODS:
                filtered_paths[path] = path_item
                continue

            if not allowed_methods:
                continue

            filtered_path_item = {}
            for method in [
                "get",
                "post",
                "put",
                "patch",
                "delete",
                "options",
                "head",
            ]:
                if method.upper() in allowed_methods and method in path_item:
                    filtered_path_item[method] = path_item[method]

            if filtered_path_item:
                filtered_paths[path] = filtered_path_item

        return filtered_paths

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
        team_memberships, permissions = self._get_team_permissions()

        # Super Admins and Admins have access to everything
        if team_memberships.filter(
            role__in=[UserRole.SUPER_ADMIN, UserRole.ADMIN]
        ).exists():
            cache.set(cache_key, True, self.CACHE_TIMEOUT)
            return True

        normalized_method = (method or "").strip().upper()
        for perm in permissions:
            if not self.paths_match(perm["path"], path):
                continue

            allowed_methods = self.parse_methods(perm["methods"])
            if (
                allowed_methods is self.ALL_METHODS
                or normalized_method in allowed_methods
            ):
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
        cache_key = self._build_cache_key("allowed_endpoints")
        cached_result = cache.get(cache_key)
        if cached_result is not None:
            return cached_result

        # Get user's team memberships
        team_memberships, permissions = self._get_team_permissions()

        # Super Admins and Admins have access to everything
        if team_memberships.filter(
            role__in=[UserRole.SUPER_ADMIN, UserRole.ADMIN]
        ).exists():
            cache.set(cache_key, None, self.CACHE_TIMEOUT)
            return None  # All endpoints

        allowed_by_path = {}
        for perm in permissions:
            normalized_path = self.normalize_path(perm["path"])
            parsed_methods = self.parse_methods(perm["methods"])

            if normalized_path not in allowed_by_path:
                allowed_by_path[normalized_path] = set()

            if parsed_methods is self.ALL_METHODS:
                allowed_by_path[normalized_path] = self.ALL_METHODS
                continue

            if allowed_by_path[normalized_path] is not self.ALL_METHODS:
                allowed_by_path[normalized_path].update(parsed_methods)

        allowed = []
        for path, methods in sorted(allowed_by_path.items()):
            if methods is self.ALL_METHODS:
                serialized_methods = "*"
            else:
                serialized_methods = ",".join(sorted(methods))
            allowed.append({"path": path, "methods": serialized_methods})

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
        cache_key = self._build_cache_key("user_role")
        cached_result = cache.get(cache_key)
        if cached_result is not None:
            return cached_result

        # Get user's team memberships
        team_memberships = self._get_team_memberships()

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
        cache_key = self._build_cache_key("can_send")
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

        version_key = EndpointPermissionChecker.CACHE_VERSION_KEY.format(
            user_id=user.id
        )
        current_version = cache.get(version_key, 1)
        cache.set(version_key, current_version + 1, None)
