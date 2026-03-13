from functools import wraps

from django.conf import settings


def get_portal_setting(name, default=None):
    """
    Get a setting from the MODERN_DRF_SWAGGER settings dictionary.
    """
    portal_settings = getattr(settings, "MODERN_DRF_SWAGGER", {})
    return portal_settings.get(name, default)


def get_package_version():
    """
    Get the installed package version of modern-drf-swagger.

    Returns:
        str: Version string (e.g., "4") or "dev" if not installed as package
    """
    try:
        # Try to get version from installed package metadata
        from importlib.metadata import version

        return version("modern-drf-swagger")
    except Exception:
        # Fallback: try reading pyproject.toml in development mode
        try:
            import re
            from pathlib import Path

            # Look for pyproject.toml in parent directory
            pyproject_path = Path(__file__).parent.parent / "pyproject.toml"
            if pyproject_path.exists():
                with open(pyproject_path, "r", encoding="utf-8") as f:
                    content = f.read()
                    # Simple regex to extract version
                    match = re.search(r'version\s*=\s*["\']([^"\']+)["\']', content)
                    if match:
                        return match.group(1)
        except Exception:
            pass

        return "dev"


def hide_from_portal(view_func):
    """
    Decorator to hide a view from the Modern DRF Swagger portal.
    It adds a custom attribute to the view which our schema loader will check.
    """

    @wraps(view_func)
    def _wrapped_view(*args, **kwargs):
        return view_func(*args, **kwargs)

    _wrapped_view.hide_from_portal = True
    return _wrapped_view


# Default Configuration
# All settings can be overridden via settings.MODERN_DRF_SWAGGER dictionary
DEFAULT_CONFIG = {
    # Portal Settings
    "TITLE": "Modern DRF Swagger",
    "DESCRIPTION": "API Documentation Portal",
    "VERSION": "1.0.0",
    # Feature Toggles
    "ANALYTICS_ENABLED": True,
    "HISTORY_ENABLED": True,
    "MAX_HISTORY_PER_USER": 1000,
    "ALLOW_ANONYMOUS": False,
    # Schema Settings (controls drf-spectacular internally)
    "SCHEMA_PATH_PREFIX": r"/api/",
    # UI Settings
    "ENDPOINTS_COLLAPSIBLE": True,
    "ENDPOINTS_DEFAULT_COLLAPSED": False,
    # Filtering
    "EXCLUDE_PATHS": ["/admin/", "/internal/"],
}

"""
Example configuration in your Django settings.py:

MODERN_DRF_SWAGGER = {
    # Basic Info (also controls drf-spectacular)
    'TITLE': 'API Documentation',
    'DESCRIPTION': 'Complete API documentation for My Company',
    'VERSION': '2.0.0',
    
    # Features
    'ANALYTICS_ENABLED': True,
    'HISTORY_ENABLED': True,
    'MAX_HISTORY_PER_USER': 500,
    'ALLOW_ANONYMOUS': False,
    
    # Schema Generation
    'SCHEMA_PATH_PREFIX': r'/api/v1/',  # Filter endpoints by path prefix
    
    # UI Options
    'ENDPOINTS_COLLAPSIBLE': True,
    'ENDPOINTS_DEFAULT_COLLAPSED': False,
    
    # Filtering
    'EXCLUDE_PATHS': ['/admin/', '/internal/', '/health/'],
}

NOTE: You do NOT need to configure drf-spectacular separately!
Modern DRF Swagger automatically configures it based on the settings above.
"""
