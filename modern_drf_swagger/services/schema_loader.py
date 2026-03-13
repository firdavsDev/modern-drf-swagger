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
        portal_settings = getattr(settings, "MODERN_DRF_SWAGGER", {})
        excluded_paths = portal_settings.get("EXCLUDE_PATHS", ["/admin/", "/internal/"])
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
            # but we explicitly check our EXCLUDE_PATHS and custom decorators if needed.
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

    def get_authentication_schemes(self, request=None):
        """
        Extract authentication schemes from OpenAPI schema components.
        Returns a list of supported authentication types.
        """
        schema = self.get_schema(request)
        schemes = []

        # Check security schemes in components
        components = schema.get("components", {})
        security_schemes = components.get("securitySchemes", {})

        for scheme_name, scheme_info in security_schemes.items():
            scheme_type = scheme_info.get("type", "")
            scheme_scheme = scheme_info.get("scheme", "")

            if scheme_type == "http":
                if scheme_scheme == "bearer":
                    schemes.append(
                        {
                            "type": "bearer",
                            "name": scheme_info.get("bearerFormat", "JWT"),
                            "description": scheme_info.get(
                                "description", "Bearer token authentication"
                            ),
                        }
                    )
                elif scheme_scheme == "basic":
                    schemes.append(
                        {
                            "type": "basic",
                            "name": "Basic Auth",
                            "description": scheme_info.get(
                                "description", "HTTP Basic authentication"
                            ),
                        }
                    )
            elif scheme_type == "apiKey":
                schemes.append(
                    {
                        "type": "apikey",
                        "name": scheme_info.get("name", "X-API-Key"),
                        "in": scheme_info.get("in", "header"),
                        "description": scheme_info.get(
                            "description", "API key authentication"
                        ),
                    }
                )

        # If no schemes found in OpenAPI schema, auto-detect from DRF settings
        if not schemes:
            schemes = self._auto_detect_auth_from_drf_settings()

        return schemes

    def _auto_detect_auth_from_drf_settings(self):
        """
        Automatically detect authentication methods from REST_FRAMEWORK settings.
        Falls back to DEFAULT_AUTH_METHODS if explicitly configured.
        """
        schemes = []

        # First, try to auto-detect from REST_FRAMEWORK['DEFAULT_AUTHENTICATION_CLASSES']
        rest_framework_settings = getattr(settings, "REST_FRAMEWORK", {})
        auth_classes = rest_framework_settings.get("DEFAULT_AUTHENTICATION_CLASSES", [])

        # Map DRF authentication classes to portal auth types
        auth_class_mapping = {
            "rest_framework.authentication.BasicAuthentication": "basic",
            "rest_framework.authentication.TokenAuthentication": "token",
            "rest_framework_simplejwt.authentication.JWTAuthentication": "bearer",
            "rest_framework.authentication.SessionAuthentication": None,  # Skip - handled by cookies
        }

        detected_types = set()
        for auth_class in auth_classes:
            if isinstance(auth_class, str):
                auth_type = auth_class_mapping.get(auth_class)
                if auth_type:
                    detected_types.add(auth_type)
            else:
                # Handle class objects (not strings)
                class_path = f"{auth_class.__module__}.{auth_class.__name__}"
                auth_type = auth_class_mapping.get(class_path)
                if auth_type:
                    detected_types.add(auth_type)

        # If auto-detection found auth methods, use them
        if detected_types:
            if "basic" in detected_types:
                schemes.append(
                    {
                        "type": "basic",
                        "name": "Basic Auth",
                        "description": "HTTP Basic authentication (username:password)",
                    }
                )
            if "token" in detected_types:
                schemes.append(
                    {
                        "type": "token",
                        "name": "DRF Token",
                        "description": "Authorization header using the Token prefix",
                    }
                )
            if "bearer" in detected_types:
                schemes.append(
                    {
                        "type": "bearer",
                        "name": "JWT/Token",
                        "description": "Bearer token authentication",
                    }
                )
        else:
            # Fall back to manual DEFAULT_AUTH_METHODS configuration
            portal_settings = getattr(settings, "MODERN_DRF_SWAGGER", {})
            default_auth = portal_settings.get(
                "DEFAULT_AUTH_METHODS", ["bearer", "basic", "apikey"]
            )

            if "token" in default_auth:
                schemes.append(
                    {
                        "type": "token",
                        "name": "DRF Token",
                        "description": "Authorization header using the Token prefix",
                    }
                )
            if "bearer" in default_auth:
                schemes.append(
                    {
                        "type": "bearer",
                        "name": "JWT",
                        "description": "Bearer token authentication",
                    }
                )
            if "basic" in default_auth:
                schemes.append(
                    {
                        "type": "basic",
                        "name": "Basic Auth",
                        "description": "HTTP Basic authentication",
                    }
                )
            if "apikey" in default_auth:
                schemes.append(
                    {
                        "type": "apikey",
                        "name": "X-API-Key",
                        "in": "header",
                        "description": "API key authentication",
                    }
                )

        return schemes
