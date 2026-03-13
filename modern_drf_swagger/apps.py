from django.apps import AppConfig
from django.conf import settings


class ApiPortalConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "modern_drf_swagger"
    verbose_name = "API Portal"

    def ready(self):
        """
        Auto-configure drf-spectacular when API Portal is loaded.
        This eliminates the need for manual configuration in settings.py.
        """
        # Import signals to register them
        from . import signals  # noqa: F401

        # Ensure drf_spectacular is in INSTALLED_APPS
        if "drf_spectacular" not in settings.INSTALLED_APPS:
            settings.INSTALLED_APPS = list(settings.INSTALLED_APPS) + [
                "drf_spectacular"
            ]

        # Auto-configure REST_FRAMEWORK settings for spectacular
        if not hasattr(settings, "REST_FRAMEWORK"):
            settings.REST_FRAMEWORK = {}

        # Set default schema class if not already configured
        if "DEFAULT_SCHEMA_CLASS" not in settings.REST_FRAMEWORK:
            settings.REST_FRAMEWORK["DEFAULT_SCHEMA_CLASS"] = (
                "drf_spectacular.openapi.AutoSchema"
            )

        # Auto-configure SPECTACULAR_SETTINGS from MODERN_DRF_SWAGGER settings
        self._configure_spectacular_settings()

    def _configure_spectacular_settings(self):
        """
        Configure drf-spectacular settings based on MODERN_DRF_SWAGGER settings.
        Users can control spectacular through MODERN_DRF_SWAGGER configuration.
        """
        from .conf import get_portal_setting

        # Get user's MODERN_DRF_SWAGGER settings
        modern_drf_swagger_settings = getattr(settings, "MODERN_DRF_SWAGGER", {})

        # Build spectacular settings from MODERN_DRF_SWAGGER config
        spectacular_defaults = {
            "TITLE": get_portal_setting("TITLE", "API Portal"),
            "DESCRIPTION": get_portal_setting(
                "DESCRIPTION", "API Documentation Portal"
            ),
            "VERSION": get_portal_setting("VERSION", "1.0.0"),
            "SERVE_INCLUDE_SCHEMA": False,
            "SCHEMA_PATH_PREFIX": get_portal_setting("SCHEMA_PATH_PREFIX", r"/api/"),
            "COMPONENT_SPLIT_REQUEST": True,
            "SORT_OPERATIONS": False,
        }

        # Merge with existing SPECTACULAR_SETTINGS if any
        if not hasattr(settings, "SPECTACULAR_SETTINGS"):
            settings.SPECTACULAR_SETTINGS = {}

        # Only set values that aren't already configured
        for key, value in spectacular_defaults.items():
            if key not in settings.SPECTACULAR_SETTINGS:
                settings.SPECTACULAR_SETTINGS[key] = value
