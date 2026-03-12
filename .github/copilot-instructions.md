# Modern DRF Swagger

A Django app providing a modern web interface for exploring, testing, and managing DRF APIs with team-based access control and analytics.

## Project Overview

**Status:** Early Development (~60% backend, 0% frontend)  
**Stack:** Django ≥3.2, DRF ≥3.12, drf-spectacular ≥0.26  
**Package Name:** `django-api-portal`

### What This Project Does

Creates a developer portal for Django REST Framework projects with:

- OpenAPI schema-driven API explorer (similar to Swagger UI but modern)
- Team-based endpoint access control
- Request analytics and history tracking
- API request proxy with latency monitoring

## Quick Start

```bash
# Setup (virtual environment already exists)
source .venv/bin/activate
pip install -e .

# Run example project
cd sample_project
python manage.py migrate
python manage.py runserver
# Visit http://localhost:8000/admin (when configured)
```

## Current Implementation Status

### ✅ Completed (~60%)

**Models** ([api_portal/models.py](api_portal/models.py)):

- `Team`, `TeamMember` (roles: Super Admin, Admin, Developer, Viewer)
- `EndpointPermission` (path + method access control)
- `RequestLog`, `UsageMetric` (analytics)
- ⚠️ **CRITICAL BUG**: All models use `models.fields.Model` instead of `models.Model`

**Services** ([api_portal/services/](api_portal/services/)):

- `schema_loader.py`: drf-spectacular integration ✅
- `request_executor.py`: HTTP proxy with header forwarding ✅
- `analytics_service.py`: Request logging and metrics aggregation ✅ (has import bug)

**Admin** ([api_portal/admin.py](api_portal/admin.py)):

- Full CRUD for all models with inline editors ✅

**Configuration** ([api_portal/conf.py](api_portal/conf.py)):

- `@hide_from_portal` decorator for DRF ViewSets ✅
- Settings helper functions ✅

### ❌ Missing (~40%)

**Frontend (0%):**

- All HTML templates
- All JavaScript (Vanilla JS)
- All CSS (TailwindCSS)

**Backend Gaps:**

- [api_portal/urls.py](api_portal/urls.py) - Empty, no URL routing
- [endpoint_permissions.py](api_portal/permissions/endpoint_permissions.py) - Empty, no permission checks
- [analytics_view.py](api_portal/views/analytics_view.py) - Empty stub
- History view - Not created
- Login view - Not created

**Infrastructure:**

- No tests (no pytest setup, no test files)
- Example project not configured (missing DRF/spectacular/api_portal in INSTALLED_APPS)
- README.md is empty

## Architecture & Conventions

### Design Patterns

**Service Layer Architecture:**

```
Views → Services → Models
↓
Templates use Vanilla JS to call API proxy view → RequestExecutor → DRF endpoints
```

**Key Design Decisions:**

1. **External HTTP Proxy**: Uses `requests` library to make real HTTP calls (not Django test client) for realistic latency/headers
2. **Schema-Driven**: Leverages drf-spectacular's OpenAPI schema instead of custom introspection
3. **Settings Dictionary**: All config via `settings.API_PORTAL` dict, not individual settings
4. **Installable App**: Structured as reusable Django package

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
    'TITLE': 'My API Portal',
    'ANALYTICS_ENABLED': True,
    'HISTORY_LIMIT': 100,
    'ALLOW_ANONYMOUS': False,
    'EXCLUDE_PATHS': ['/admin/', '/internal/'],
}
```

Hide endpoints using decorator:

```python
from api_portal.conf import hide_from_portal

@hide_from_portal
class InternalAPIViewSet(viewsets.ModelViewSet):
    # This won't appear in the portal
    ...
```

## Known Issues

### Critical Bugs (Must Fix Before Testing)

1. **Syntax Error in models.py** (5 occurrences):

   ```python
   # Wrong:
   class Team(models.fields.Model):

   # Correct:
   class Team(models.Model):
   ```

2. **Import Errors**:
   - `analytics_service.py:2`: `from .models` → `from ..models`
   - `docs_view.py:4`: `from .services` → `from ..services`

3. **Example project not wired**: [sample_project/config/settings.py](sample_project/config/settings.py)
   - Missing DRF in INSTALLED_APPS
   - Missing drf-spectacular setup
   - Missing api_portal app

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

### Testing Strategy (When Implemented)

```bash
# Unit tests for services
pytest tests/test_schema_loader.py
pytest tests/test_analytics_service.py

# Integration tests with sample_project
pytest tests/integration/

# Run all tests
pytest
```

## Next Steps (Priority Order)

1. **Fix critical bugs** (model base classes, import paths)
2. **Configure example project** (add apps to INSTALLED_APPS, create test endpoints)
3. **Implement URL routing** (api_portal/urls.py)
4. **Build frontend UI** (HTML templates, Vanilla JS, TailwindCSS)
5. **Implement permissions engine** (endpoint_permissions.py)
6. **Add test infrastructure** (pytest-django setup)
7. **Populate README.md**

## Example Usage (When Complete)

**Installation in a Django project:**

```python
# settings.py
INSTALLED_APPS = [
    ...
    'rest_framework',
    'drf_spectacular',
    'api_portal',
]

API_PORTAL = {
    'TITLE': 'My Company API Portal',
    'ANALYTICS_ENABLED': True,
}

# urls.py
urlpatterns = [
    path('api/portal/', include('api_portal.urls')),
]
```

Visit `/api/portal/docs` for the API explorer.
