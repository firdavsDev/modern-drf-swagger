# 🎯 Auto-Configuration Guide

## Overview

As of the latest version, **Modern DRF Swagger (API Portal)** now automatically configures drf-spectacular and all its dependencies. Developers no longer need to manually install or configure drf-spectacular!

## What Changed?

### Before (Manual Configuration)

Developers had to:
1. ✅ Install drf-spectacular manually: `pip install drf-spectacular`
2. ✅ Add `'drf_spectacular'` to `INSTALLED_APPS`
3. ✅ Configure `REST_FRAMEWORK['DEFAULT_SCHEMA_CLASS']`
4. ✅ Configure `SPECTACULAR_SETTINGS` dictionary
5. ✅ Configure `API_PORTAL` settings
6. ✅ Add URL routes

**5-6 steps of configuration!**

### After (Automatic Configuration)

Developers only need to:
1. ✅ Install API Portal: `pip install modern-drf-swagger`
   - **drf-spectacular is auto-installed as a dependency**
2. ✅ Add `'api_portal'` to `INSTALLED_APPS` (ONE app, not two!)
3. ✅ Configure `API_PORTAL` settings (controls everything)
4. ✅ Add URL routes

**3-4 steps total!** 🎉

---

## How It Works

### Automatic Dependency Installation

When you run:
```bash
pip install modern-drf-swagger
```

The package automatically installs:
- ✅ `django>=3.2`
- ✅ `djangorestframework>=3.12`
- ✅ **`drf-spectacular>=0.26`** ← Automatically installed!
- ✅ `requests>=2.25.0`

### Automatic App Registration

When Django loads `api_portal` in `INSTALLED_APPS`, the [`apps.py`](../api_portal/apps.py) `ready()` method automatically:

1. **Adds drf_spectacular to INSTALLED_APPS** (if not already present)
2. **Sets REST_FRAMEWORK['DEFAULT_SCHEMA_CLASS']** to `'drf_spectacular.openapi.AutoSchema'`
3. **Configures SPECTACULAR_SETTINGS** based on `API_PORTAL` settings

### Centralized Configuration

All configuration is done through the `API_PORTAL` dictionary:

```python
# settings.py
API_PORTAL = {
    # These settings control BOTH the portal AND drf-spectacular
    'TITLE': 'My API Portal',              # → SPECTACULAR_SETTINGS['TITLE']
    'DESCRIPTION': 'API Documentation',    # → SPECTACULAR_SETTINGS['DESCRIPTION']
    'VERSION': '1.0.0',                    # → SPECTACULAR_SETTINGS['VERSION']
    'SCHEMA_PATH_PREFIX': r'/api/',        # → SPECTACULAR_SETTINGS['SCHEMA_PATH_PREFIX']
    
    # Portal-specific settings
    'ANALYTICS_ENABLED': True,
    'HISTORY_ENABLED': True,
    'MAX_HISTORY_PER_USER': 1000,
    'ALLOW_ANONYMOUS': False,
    'ENDPOINTS_COLLAPSIBLE': True,
    'ENDPOINTS_DEFAULT_COLLAPSED': False,
    'EXCLUDE_PATHS': ['/admin/', '/internal/'],
}
```

**No need to configure `SPECTACULAR_SETTINGS` separately!**

---

## Implementation Details

### File: `api_portal/apps.py`

```python
class ApiPortalConfig(AppConfig):
    name = 'api_portal'
    
    def ready(self):
        # Auto-add drf_spectacular to INSTALLED_APPS
        if 'drf_spectacular' not in settings.INSTALLED_APPS:
            settings.INSTALLED_APPS = list(settings.INSTALLED_APPS) + ['drf_spectacular']
        
        # Auto-configure REST_FRAMEWORK
        if not hasattr(settings, 'REST_FRAMEWORK'):
            settings.REST_FRAMEWORK = {}
        
        if 'DEFAULT_SCHEMA_CLASS' not in settings.REST_FRAMEWORK:
            settings.REST_FRAMEWORK['DEFAULT_SCHEMA_CLASS'] = 'drf_spectacular.openapi.AutoSchema'
        
        # Auto-configure SPECTACULAR_SETTINGS from API_PORTAL
        self._configure_spectacular_settings()
```

### File: `api_portal/conf.py`

```python
# Default configuration template
DEFAULT_CONFIG = {
    # Basic Info (passed to drf-spectacular)
    "TITLE": "API Portal",
    "DESCRIPTION": "API Documentation Portal",
    "VERSION": "1.0.0",
    
    # Feature Toggles
    "ANALYTICS_ENABLED": True,
    "HISTORY_ENABLED": True,
    "MAX_HISTORY_PER_USER": 1000,
    "ALLOW_ANONYMOUS": False,
    
    # Schema Settings (passed to drf-spectacular)
    "SCHEMA_PATH_PREFIX": r'/api/',
    
    # UI Settings
    "ENDPOINTS_COLLAPSIBLE": True,
    "ENDPOINTS_DEFAULT_COLLAPSED": False,
    
    # Filtering
    "EXCLUDE_PATHS": ['/admin/', '/internal/'],
}
```

---

## Migration Guide (For Existing Users)

If you're upgrading from an older version:

### Step 1: Update Your Settings

**Before:**
```python
INSTALLED_APPS = [
    'rest_framework',
    'drf_spectacular',  # ← Can remove this
    'api_portal',
]

REST_FRAMEWORK = {
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',  # ← Can remove
}

SPECTACULAR_SETTINGS = {  # ← Can remove entire block
    'TITLE': 'My API',
    'DESCRIPTION': 'My API documentation',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}

API_PORTAL = {
    'TITLE': 'My API Portal',
    'ANALYTICS_ENABLED': True,
}
```

**After:**
```python
INSTALLED_APPS = [
    'rest_framework',
    # 'drf_spectacular',  ← REMOVED! (auto-added by api_portal)
    'api_portal',
]

# REST_FRAMEWORK: No need to set DEFAULT_SCHEMA_CLASS
# SPECTACULAR_SETTINGS: No need to configure separately

API_PORTAL = {
    # All settings consolidated here
    'TITLE': 'My API Portal',
    'DESCRIPTION': 'My API documentation',
    'VERSION': '1.0.0',
    'ANALYTICS_ENABLED': True,
    'SCHEMA_PATH_PREFIX': r'/api/',
}
```

### Step 2: Remove Manual Configuration (Optional)

You can keep your existing `SPECTACULAR_SETTINGS` if you want. API Portal will merge them with its defaults. But it's no longer required!

---

## Advanced Usage

### Override Specific drf-spectacular Settings

If you need advanced drf-spectacular features, you can still configure `SPECTACULAR_SETTINGS`:

```python
API_PORTAL = {
    'TITLE': 'My API Portal',
    # ... other settings
}

# Advanced drf-spectacular options
SPECTACULAR_SETTINGS = {
    'COMPONENT_SPLIT_REQUEST': True,
    'PREPROCESSING_HOOKS': ['myapp.hooks.custom_preprocessing_hook'],
    # API Portal will merge these with its defaults
}
```

### Keep drf_spectacular Explicit (Optional)

If you prefer to keep `drf_spectacular` in `INSTALLED_APPS` for clarity:

```python
INSTALLED_APPS = [
    'rest_framework',
    'drf_spectacular',  # Still works! (but optional)
    'api_portal',
]
```

This won't cause any issues. API Portal detects it and won't duplicate it.

---

## Benefits

1. **✅ Fewer Dependencies to Track**: Developers don't need to know about drf-spectacular
2. **✅ Less Configuration**: One settings dictionary instead of multiple
3. **✅ Consistent Settings**: TITLE, DESCRIPTION, VERSION are shared between portal and schema
4. **✅ Simpler Installation**: Fewer steps to get started
5. **✅ Better Abstraction**: Implementation details (drf-spectacular) are hidden
6. **✅ Easier Upgrades**: When we upgrade drf-spectacular, users get it automatically

---

## Troubleshooting

### Issue: "drf_spectacular not found"

**Cause:** API Portal wasn't properly loaded before Django tried to use the schema.

**Solution:**
```python
# Ensure api_portal is loaded
INSTALLED_APPS = [
    # ...
    'rest_framework',
    'api_portal',  # This auto-adds drf_spectacular
]
```

### Issue: "Duplicate drf_spectacular in INSTALLED_APPS"

**Cause:** You manually added `drf_spectacular` and API Portal also added it.

**Solution:** 
API Portal checks for duplicates before adding. If you see this, try:
1. Remove manual `'drf_spectacular'` from `INSTALLED_APPS`
2. Or keep it (it won't break anything)

### Issue: "SPECTACULAR_SETTINGS not found"

**Cause:** API Portal should create this automatically.

**Solution:**
Check that `api_portal` is in `INSTALLED_APPS` and Django has restarted.

---

## Testing

Test that auto-configuration works:

```python
# In Django shell (python manage.py shell)
from django.conf import settings

# Check drf_spectacular was added
assert 'drf_spectacular' in settings.INSTALLED_APPS

# Check REST_FRAMEWORK was configured
assert settings.REST_FRAMEWORK.get('DEFAULT_SCHEMA_CLASS') == 'drf_spectacular.openapi.AutoSchema'

# Check SPECTACULAR_SETTINGS was created
assert hasattr(settings, 'SPECTACULAR_SETTINGS')
assert settings.SPECTACULAR_SETTINGS['TITLE'] == settings.API_PORTAL.get('TITLE', 'API Portal')
```

---

## Documentation Updates

All documentation has been updated:

- ✅ [README.md](../README.md) - Shows simplified installation
- ✅ [QUICKSTART.md](../QUICKSTART.md) - Comprehensive step-by-step guide
- ✅ [Sample Project](../samples/config/settings.py) - Demonstrates auto-configuration
- ✅ [copilot-instructions.md](../.github/copilot-instructions.md) - Updated for contributors

---

**Questions?** Open an issue on [GitHub](https://github.com/firdavsDev/modern-drf-swagger/issues)!
