# Modern DRF Swagger

A Django app providing a modern web interface for exploring, testing, and managing DRF APIs with team-based access control and analytics.

## Project Overview

**Status:** Stable - Production Ready  
**Stack:** Django ≥3.2, DRF ≥3.12, drf-spectacular ≥0.26 (auto-configured)  
**Package Name:** `modern-drf-swagger`  
**PyPI:** [modern-drf-swagger](https://pypi.org/project/modern-drf-swagger/)

### What This Project Does

Creates a developer portal for Django REST Framework projects with:

- OpenAPI schema-driven API explorer (similar to Swagger UI but modern)
- Team-based endpoint access control
- Request analytics and history tracking
- API request proxy with latency monitoring
- **Automatic drf-spectacular configuration** (no manual setup required)

## Quick Start

```bash
# Setup (virtual environment already exists)
source .venv/bin/activate
pip install -e .

# Run example project
cd samples
python manage.py migrate
python manage.py runserver
# Visit http://localhost:8000/api/docs/ (portal mounted at api/docs/ in samples)
```

## 🎯 Auto-Configuration Features

**NEW:** As of the latest version, API Portal automatically configures drf-spectacular!

Developers only need to:

1. Install: `pip install modern-drf-swagger` (drf-spectacular auto-installed)
2. Add `'modern_drf_swagger'` to `INSTALLED_APPS` (drf-spectacular auto-added)
3. Configure `MODERN_DRF_SWAGGER` settings (controls everything)

**See:** [docs/AUTO_CONFIGURATION_GUIDE.md](docs/AUTO_CONFIGURATION_GUIDE.md)

## Current Implementation Status

### ✅ Completed (100%)

**Models** ([modern_drf_swagger/models.py](modern_drf_swagger/models.py)):

- `Team`, `TeamMember` (roles: Super Admin, Admin, Developer, Viewer) ✅
- `EndpointPermission` (path + method access control) ✅
- `RequestLog`, `UsageMetric` (analytics) ✅

**Services** ([modern_drf_swagger/services/](modern_drf_swagger/services/)):

- `schema_loader.py`: drf-spectacular integration ✅
- `request_executor.py`: HTTP proxy with header forwarding ✅
- `analytics_service.py`: Request logging and metrics aggregation ✅

**Admin** ([modern_drf_swagger/admin.py](modern_drf_swagger/admin.py)):

- Full CRUD for all models with inline editors ✅

**Configuration** ([modern_drf_swagger/conf.py](modern_drf_swagger/conf.py), [modern_drf_swagger/apps.py](modern_drf_swagger/apps.py)):

- `@hide_from_portal` decorator for DRF ViewSets ✅
- Settings helper functions ✅
- **Auto-configuration system for drf-spectacular** ✅

**Views** ([modern_drf_swagger/views/](modern_drf_swagger/views/)):

- `docs_view.py`: Main API explorer ✅
- `api_proxy_view.py`: Request proxy endpoint ✅
- `analytics_view.py`: Analytics dashboard ✅
- `auth_view.py`: Login/logout ✅

**Templates** ([modern_drf_swagger/templates/](modern_drf_swagger/templates/)):

- `base.html`: Base layout with navigation ✅
- `login.html`: Authentication page ✅
- `docs.html`: API explorer interface ✅
- `analytics.html`: Analytics dashboard ✅
- `history.html`: Request history ✅

**Static Files** ([modern_drf_swagger/static/](modern_drf_swagger/static/)):

- `docs.js`: Endpoint browser and request editor ✅
- `response-viewer.js`: Response display with syntax highlighting ✅
- `analytics.js`: Charts and metrics ✅
- `history.js`: Request history interface ✅
- `styles.css`: Dark theme styling ✅

**URL Routing** ([modern_drf_swagger/urls.py](modern_drf_swagger/urls.py)):

- Complete URL configuration ✅

**Permissions** ([modern_drf_swagger/permissions/](modern_drf_swagger/permissions/)):

- Team-based endpoint access control ✅

**Documentation:**

- [README.md](README.md) - Overview and quick start ✅
- [QUICKSTART.md](QUICKSTART.md) - Comprehensive installation guide ✅
- [docs/AUTO_CONFIGURATION_GUIDE.md](docs/AUTO_CONFIGURATION_GUIDE.md) - Auto-config details ✅
- [CHANGELOG.md](CHANGELOG.md) - Version history ✅

## Architecture & Conventions

### Design Patterns

**Service Layer Architecture:**

```
Views → Services → Models
↓
Templates use Vanilla JS to call API proxy view → RequestExecutor → DRF endpoints
```

**Key Design Decisions:**

1. **Auto-Configuration**: Automatically configures drf-spectacular based on MODERN_DRF_SWAGGER settings
2. **External HTTP Proxy**: Uses `requests` library to make real HTTP calls (not Django test client) for realistic latency/headers
3. **Schema-Driven**: Leverages drf-spectacular's OpenAPI schema instead of custom introspection
4. **Centralized Configuration**: All config via `settings.MODERN_DRF_SWAGGER` dict (controls both portal and drf-spectacular)
5. **Installable App**: Structured as reusable Django package

### File Organization

```
modern_drf_swagger/
├── models.py              # All 5 models (Team, TeamMember, etc.)
├── admin.py               # Admin config for all models
├── conf.py                # Settings helper + @hide_from_portal decorator
├── urls.py                # URL routing (EMPTY - needs implementation)
├── services/              # Business logic layer
│   ├── schema_loader.py   # OpenAPI schema parsing
│   ├── request_executor.py # HTTP proxy to DRF endpoints
│   └── analytics_service.py # Request logging & metrics
├── permissions/           # Access control
│   └── endpoint_permissions.py # (EMPTY - needs implementation)
├── views/                 # Django views
│   ├── docs_view.py       # API explorer main page
│   ├── api_proxy_view.py  # JSON API for proxying requests
│   └── analytics_view.py  # (EMPTY - needs implementation)
├── templates/modern_drf_swagger/  # (EMPTY - needs HTML)
└── static/modern_drf_swagger/     # (EMPTY - needs JS/CSS)
```

### Configuration

Users configure the portal via `settings.MODERN_DRF_SWAGGER` dict:

```python
# In Django settings.py
MODERN_DRF_SWAGGER = {
    # Basic Info (automatically configures drf-spectacular)
    'TITLE': 'My API Portal',
    'DESCRIPTION': 'API Documentation Portal',
    'VERSION': '1.0.0',

    # Features
    'ANALYTICS_ENABLED': True,
    'HISTORY_ENABLED': True,
    'MAX_HISTORY_PER_USER': 1000,
    'ALLOW_ANONYMOUS': False,

    # Schema Settings (passed to drf-spectacular)
    'SCHEMA_PATH_PREFIX': r'/api/',

    # UI Settings
    'ENDPOINTS_COLLAPSIBLE': True,
    'ENDPOINTS_DEFAULT_COLLAPSED': False,

    # Filtering
    'EXCLUDE_PATHS': ['/admin/', '/internal/'],
}
```

**Note:** You do NOT need to configure drf-spectacular separately! API Portal automatically:

- Adds `drf_spectacular` to `INSTALLED_APPS`
- Sets `REST_FRAMEWORK['DEFAULT_SCHEMA_CLASS']`
- Configures `SPECTACULAR_SETTINGS` based on `MODERN_DRF_SWAGGER` settings

Hide endpoints using decorator:

```python
from modern_drf_swagger.conf import hide_from_portal

@hide_from_portal
class InternalAPIViewSet(viewsets.ModelViewSet):
    # This won't appear in the portal
    ...
```

## Known Issues

### Resolved Issues

1. ✅ **Syntax Error in models.py**: Fixed - all models now use `models.Model`
2. ✅ **Import Errors**: Fixed - correct relative imports used
3. ✅ **Example project configuration**: Fixed - `samples/` directory properly configured

### Current Issues

None! Project is stable and production-ready.

## Development Guidelines

### When Adding Features

1. **Models**: Add to [modern_drf_swagger/models.py](modern_drf_swagger/models.py), then register in [admin.py](modern_drf_swagger/admin.py)
2. **Business Logic**: Create functions in `services/`, not in views or models
3. **Views**: Keep thin - call service functions, render templates, or return JSON
4. **Frontend**: Use Vanilla JS (no framework), TailwindCSS for styling
5. **Tests**: Add to `tests/` directory (needs to be created)

### Coding Conventions

- **Imports**: Use relative imports within `modern_drf_swagger` package
- **String Quotes**: Double quotes `"` preferred
- **Verbose Names**: All models need `verbose_name` for i18n
- **Type Hints**: Not currently used, but welcomed
- **Docstrings**: Use for service functions

### Testing Strategy

```bash
# Unit tests for services
pytest tests/test_schema_loader.py
pytest tests/test_analytics_service.py

# Integration tests with samples/
pytest tests/integration/

# Run all tests
pytest
```

## Example Usage

**Installation in a Django project:**

```python
# Install via pip
pip install modern-drf-swagger

# settings.py
INSTALLED_APPS = [
    ...
    'rest_framework',
    # 'drf_spectacular',  ← NOT NEEDED! Auto-added by modern_drf_swagger
    'modern_drf_swagger',  # This is all you need!
]

# All configuration in one place
MODERN_DRF_SWAGGER = {
    'TITLE': 'My Company API Portal',
    'DESCRIPTION': 'API Documentation',
    'VERSION': '1.0.0',
    'ANALYTICS_ENABLED': True,
    'HISTORY_ENABLED': True,
    'SCHEMA_PATH_PREFIX': r'/api/',
}

# urls.py - Works at ANY URL prefix! Choose what fits your project:
urlpatterns = [
    path('api/', include('myapp.urls')),
    path('portal/', include('modern_drf_swagger.urls')),  # Or api/docs/, docs/, swagger/, etc.
]
```

**No need to configure:**

- ❌ `REST_FRAMEWORK['DEFAULT_SCHEMA_CLASS']` (auto-set)
- ❌ `SPECTACULAR_SETTINGS` (auto-configured from MODERN_DRF_SWAGGER)

Visit `/portal/` for the API explorer.

# urls.py

urlpatterns = [
path('api/portal/', include('modern_drf_swagger.urls')),
]

```

Visit `/api/portal/docs` for the API explorer.
```
