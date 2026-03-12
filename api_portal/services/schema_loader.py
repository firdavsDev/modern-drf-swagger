import logging

from django.conf import settings
from drf_spectacular.generators import SchemaGenerator
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

logger = logging.getLogger(__name__)


class PortalSchemaLoader:
    def __init__(self):
        self.generator = SchemaGenerator()
        self.factory = APIRequestFactory()

    def _should_exclude_path(self, path):
        """
        Check if the path is explicitly excluded in settings.
        """
        portal_settings = getattr(settings, "API_PORTAL", {})
        excluded_paths = portal_settings.get(
            "API_PORTAL_EXCLUDE", ["/admin/", "/internal/"]
        )
        for excluded in excluded_paths:
            if path.startswith(excluded):
                return True
        return False

    def get_schema(self, request=None):
        """
        Generates and returns the OpenAPI schema dictionary, filtering out excluded paths.
        """
        if request is None:
            # Create a proper DRF request with required attributes
            django_request = self.factory.get("/")
            request = Request(django_request)
            # Add required DRF request attributes that spectacular expects
            request.user = None
            request.auth = None

        try:
            schema = self.generator.get_schema(request=request, public=True)
            if not schema:
                return {}

            # Filter paths based on settings and `@hide_from_portal` decorator
            # Note: spectacular usually handles its own @extend_schema(exclude=True),
            # but we explicitly check our API_PORTAL_EXCLUDE and custom decorators if needed.
            paths = schema.get("paths", {})
            filtered_paths = {}
            for path, path_items in paths.items():
                if self._should_exclude_path(path):
                    continue
                filtered_paths[path] = path_items

            schema["paths"] = filtered_paths

            return schema

        except Exception as e:
            logger.error(f"Failed to generate OpenAPI schema: {e}")
            return {}
