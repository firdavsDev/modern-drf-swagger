# API_PORTAL Title Configuration Fix

## Issue
The `API_PORTAL["TITLE"]` setting in `settings.py` was not being used consistently across all portal pages. Only the DocsView was reading from this setting.

## Root Cause
The following views were missing `get_context_data()` methods to pass the title from `API_PORTAL` settings to their templates:
- `AnalyticsView` 
- `HistoryView`
- `PortalLoginView`

Additionally, the sidebar in `base.html` had a hardcoded "API Portal" title.

## Solution

### 1. Updated All Views
Added `get_context_data()` methods to pass both `title` (for browser tab) and `portal_name` (for sidebar) to all views:

**DocsView** [api_portal/views/docs_view.py](api_portal/views/docs_view.py):
```python
def get_context_data(self, **kwargs):
    context = super().get_context_data(**kwargs)
    portal_settings = getattr(settings, "API_PORTAL", {})
    portal_name = portal_settings.get("TITLE", "API Portal")
    context["title"] = portal_name
    context["portal_name"] = portal_name
    context["user"] = self.request.user
    return context
```

**AnalyticsView** [api_portal/views/analytics_view.py](api_portal/views/analytics_view.py):
```python
def get_context_data(self, **kwargs):
    context = super().get_context_data(**kwargs)
    portal_settings = getattr(settings, "API_PORTAL", {})
    portal_name = portal_settings.get("TITLE", "API Portal")
    context["title"] = f"Analytics - {portal_name}"
    context["portal_name"] = portal_name
    return context
```

**HistoryView** [api_portal/views/analytics_view.py](api_portal/views/analytics_view.py):
```python
def get_context_data(self, **kwargs):
    context = super().get_context_data(**kwargs)
    portal_settings = getattr(settings, "API_PORTAL", {})
    portal_name = portal_settings.get("TITLE", "API Portal")
    context["title"] = f"History - {portal_name}"
    context["portal_name"] = portal_name
    return context
```

**PortalLoginView** [api_portal/views/auth_view.py](api_portal/views/auth_view.py):
```python
def get_context_data(self, **kwargs):
    context = super().get_context_data(**kwargs)
    from django.conf import settings
    portal_settings = getattr(settings, "API_PORTAL", {})
    portal_name = portal_settings.get("TITLE", "API Portal")
    context["title"] = f"Login - {portal_name}"
    context["portal_name"] = portal_name
    return context
```

### 2. Updated Base Template
Modified the sidebar header in [api_portal/templates/api_portal/base.html](api_portal/templates/api_portal/base.html):

**Before:**
```html
<h1 class="text-2xl font-bold text-blue-400">API Portal</h1>
```

**After:**
```html
<h1 class="text-2xl font-bold text-blue-400">{{ portal_name|default:"API Portal" }}</h1>
```

## How to Use

### Configuration
Edit your Django settings file (e.g., `sample_project/sample_project/settings.py`):

```python
API_PORTAL = {
    "TITLE": "My Custom API Portal",  # Change this!
    "ANALYTICS_ENABLED": True,
    "HISTORY_LIMIT": 100,
    "ALLOW_ANONYMOUS": False,
    "EXCLUDE_PATHS": ["/admin/", "/internal/"],
}
```

### Apply Changes
1. Edit the `TITLE` value in `API_PORTAL` dictionary
2. **Restart the Django development server** (settings are loaded at startup)
3. Refresh your browser

### What Gets Updated
When you change `API_PORTAL["TITLE"]`:

- **Browser tabs**: All portal pages will show your custom title
  - Docs page: `{TITLE}`
  - Analytics: `Analytics - {TITLE}`
  - History: `History - {TITLE}`  
  - Login: `Login - {TITLE}`

- **Sidebar header**: The blue "API Portal" text will show your custom title

## Testing

Run the development server and visit:
- http://localhost:8000/portal/ (should show your title)
- http://localhost:8000/portal/analytics/ (should show "Analytics - Your Title")
- http://localhost:8000/portal/history/ (should show "History - Your Title")

Check both:
1. **Browser tab** (page title)
2. **Sidebar header** (top-left blue text)

Both should reflect your `API_PORTAL["TITLE"]` setting.

## Files Modified

1. [api_portal/views/docs_view.py](api_portal/views/docs_view.py) - Added portal_name to context
2. [api_portal/views/analytics_view.py](api_portal/views/analytics_view.py) - Added get_context_data() to AnalyticsView and HistoryView  
3. [api_portal/views/auth_view.py](api_portal/views/auth_view.py) - Updated get_context_data() to use API_PORTAL title
4. [api_portal/templates/api_portal/base.html](api_portal/templates/api_portal/base.html) - Made sidebar title dynamic

## Notes

- The title setting is read from Django settings at server startup
- Changes require a server restart to take effect
- Default fallback is "API Portal" if `API_PORTAL["TITLE"]` is not set
- The setting is accessed via `getattr(settings, "API_PORTAL", {}).get("TITLE", "API Portal")`
