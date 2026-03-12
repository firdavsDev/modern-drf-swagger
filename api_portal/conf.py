from functools import wraps
from django.conf import settings

def get_portal_setting(name, default=None):
    """
    Get a setting from the API_PORTAL settings dictionary.
    """
    portal_settings = getattr(settings, 'API_PORTAL', {})
    return portal_settings.get(name, default)

def hide_from_portal(view_func):
    """
    Decorator to hide a view from the API portal.
    It adds a custom attribute to the view which our schema loader will check.
    """
    @wraps(view_func)
    def _wrapped_view(*args, **kwargs):
        return view_func(*args, **kwargs)
    
    _wrapped_view.hide_from_portal = True
    return _wrapped_view

# Example Usage Settings Default
DEFAULT_CONFIG = {
    "TITLE": "API Portal",
    "ENABLE_ANALYTICS": True,
    "ENABLE_HISTORY": True,
    "MAX_HISTORY_PER_USER": 1000,
    "ALLOW_ANONYMOUS_DOCS": False
}
