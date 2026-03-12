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
# Visit http://localhost:8000/portal/
```

## 🎯 Auto-Configuration Features

**NEW:** As of the latest version, API Portal automatically configures drf-spectacular!

Developers only need to:

1. Install: `pip install modern-drf-swagger` (drf-spectacular auto-installed)
2. Add `'api_portal'` to `INSTALLED_APPS` (drf-spectacular auto-added)
3. Configure `API_PORTAL` settings (controls everything)

**See:** [docs/AUTO_CONFIGURATION_GUIDE.md](docs/AUTO_CONFIGURATION_GUIDE.md)

## Current Implementation Status

### ✅ Completed (100%)

**Models** ([api_portal/models.py](api_portal/models.py)):

- `Team`, `TeamMember` (roles: Super Admin, Admin, Developer, Viewer) ✅
- `EndpointPermission` (path + method access control) ✅
- `RequestLog`, `UsageMetric` (analytics) ✅

**Services** ([api_portal/services/](api_portal/services/)):

- `schema_loader.py`: drf-spectacular integration ✅
- `request_executor.py`: HTTP proxy with header forwarding ✅
- `analytics_service.py`: Request logging and metrics aggregation ✅

**Admin** ([api_portal/admin.py](api_portal/admin.py)):

- Full CRUD for all models with inline editors ✅

**Configuration** ([api_portal/conf.py](api_portal/conf.py), [api_portal/apps.py](api_portal/apps.py)):

- `@hide_from_portal` decorator for DRF ViewSets ✅
- Settings helper functions ✅
- **Auto-configuration system for drf-spectacular** ✅

**Views** ([api_portal/views/](api_portal/views/)):

- `docs_view.py`: Main API explorer ✅
- `api_proxy_view.py`: Request proxy endpoint ✅
- `analytics_view.py`: Analytics dashboard ✅
- `auth_view.py`: Login/logout ✅

**Templates** ([api_portal/templates/](api_portal/templates/)):

- `base.html`: Base layout with navigation ✅
- `login.html`: Authentication page ✅
- `docs.html`: API explorer interface ✅
- `analytics.html`: Analytics dashboard ✅
- `history.html`: Request history ✅

**Static Files** ([api_portal/static/](api_portal/static/)):

- `docs.js`: Endpoint browser and request editor ✅
- `response-viewer.js`: Response display with syntax highlighting ✅
- `analytics.js`: Charts and metrics ✅
- `history.js`: Request history interface ✅
- `styles.css`: Dark theme styling ✅

**URL Routing** ([api_portal/urls.py](api_portal/urls.py)):

- Complete URL configuration ✅

**Permissions** ([api_portal/permissions/](api_portal/permissions/)):

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

1. **Auto-Configuration**: Automatically configures drf-spectacular based on API_PORTAL settings
2. **External HTTP Proxy**: Uses `requests` library to make real HTTP calls (not Django test client) for realistic latency/headers
3. **Schema-Driven**: Leverages drf-spectacular's OpenAPI schema instead of custom introspection
4. **Centralized Configuration**: All config via `settings.API_PORTAL` dict (controls both portal and drf-spectacular)
5. **Installable App**: Structured as reusable Django package

### File Organization

```
api_portal/
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
├── templates/api_portal/  # (EMPTY - needs HTML)
└── static/api_portal/     # (EMPTY - needs JS/CSS)
```

### Configuration

Users configure the portal via `settings.API_PORTAL` dict:

```python
# In Django settings.py
API_PORTAL = {
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
- Configures `SPECTACULAR_SETTINGS` based on `API_PORTAL` settings

Hide endpoints using decorator:

```python
from api_portal.conf import hide_from_portal

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

1. **Models**: Add to [api_portal/models.py](api_portal/models.py), then register in [admin.py](api_portal/admin.py)
2. **Business Logic**: Create functions in `services/`, not in views or models
3. **Views**: Keep thin - call service functions, render templates, or return JSON
4. **Frontend**: Use Vanilla JS (no framework), TailwindCSS for styling
5. **Tests**: Add to `tests/` directory (needs to be created)

### Coding Conventions

- **Imports**: Use relative imports within `api_portal` package
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
    # 'drf_spectacular',  ← NOT NEEDED! Auto-added by api_portal
    'api_portal',  # This is all you need!
]

# All configuration in one place
API_PORTAL = {
    'TITLE': 'My Company API Portal',
    'DESCRIPTION': 'API Documentation',
    'VERSION': '1.0.0',
    'ANALYTICS_ENABLED': True,
    'HISTORY_ENABLED': True,
    'SCHEMA_PATH_PREFIX': r'/api/',
}

# urls.py
urlpatterns = [
    path('api/', include('myapp.urls')),
    path('portal/', include('api_portal.urls')),
]
```

**No need to configure:**

- ❌ `REST_FRAMEWORK['DEFAULT_SCHEMA_CLASS']` (auto-set)
- ❌ `SPECTACULAR_SETTINGS` (auto-configured from API_PORTAL)

Visit `/portal/` for the API explorer.

# urls.py

urlpatterns = [
path('api/portal/', include('api_portal.urls')),
]

```

Visit `/api/portal/docs` for the API explorer.
```
