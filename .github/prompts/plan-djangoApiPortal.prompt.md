# Plan: Production-Ready Django API Developer Portal

Build a complete, installable Django package providing a modern API explorer with team collaboration, analytics, and testing capabilities for DRF projects. **The backend is ~60% complete with working models/services but has critical bugs**. Frontend is 0% complete. This plan focuses on fixing bugs, completing backend gaps, building the entire frontend with Vanilla JS + TailwindCSS, and preparing for pip distribution.

---

## Current State

**✅ Complete (~60%)**
- Models: Team, TeamMember, EndpointPermission, RequestLog, UsageMetric
- Services: schema_loader, request_executor, analytics_service (production-ready architecture)
- Admin: full CRUD with inlines, filters, search
- Config: settings helper and @hide_from_portal decorator

**🔴 Critical Bugs**
- All 5 models use `models.fields.Model` instead of `models.Model`
- Import paths in services/views incorrectly use `.` instead of `..`

**❌ Missing (~40%)**
- URL routing (urls.py empty)
- Frontend (0% - no HTML/JS/CSS)
- Permissions engine (endpoint_permissions.py empty)
- Analytics view, History view
- Example project configuration
- Tests

---

## Implementation Phases

### PHASE 1: Fix Critical Bugs & Foundation *(~2 hours)*

**Goal:** Make existing code functional and configure example project for testing

**Steps:**

1. **Fix model syntax errors** — Change `models.fields.Model` → `models.Model` in 5 classes (Team, TeamMember, EndpointPermission, RequestLog, UsageMetric)

2. **Fix import paths** — Update relative imports in:
   - services/analytics_service.py: `.models` → `..models` (2 occurrences)
   - views/docs_view.py: `.services` → `..services`
   - views/api_proxy_view.py: `.services` → `..services` (2 occurrences)

3. **Configure example project** — Add to sample_project/config/settings.py:
   - INSTALLED_APPS: 'rest_framework', 'drf_spectacular', 'modern_drf_swagger'
   - REST_FRAMEWORK config with authentication classes
   - SPECTACULAR_SETTINGS config
   - MODERN_DRF_SWAGGER settings dictionary

4. **Add sample API endpoints** — Create sample_project/api/ with sample ViewSets (tasks, users) for portal testing

5. **Wire example URLs** — Add modern_drf_swagger routes to example project urls.py

**Verification:**
- Run `python manage.py check` in example project (no errors)
- Run migrations successfully
- Import all modern_drf_swagger modules without ImportError

**Dependencies:** None (foundational)

---

### PHASE 2: Backend Completion *(~6 hours, parallel with Phase 3 after step 5)*

**Goal:** Complete missing backend functionality (URL routing, permissions, views)

**Steps:**

6. **Implement URL routing** (modern_drf_swagger/urls.py) — Define routes:
   - `/` → DocsView (main API explorer)
   - `/schema/` → SchemaView (JSON OpenAPI schema)
   - `/api-proxy/` → APIProxyView (execute requests)
   - `/analytics/` → AnalyticsView (usage dashboard)
   - `/history/` → HistoryView (new, user request history)
   - `/login/` → LoginView (new, authentication)
   - Reference pattern: Standard Django path() with name= for reversing

7. **Build permissions engine** (permissions/endpoint_permissions.py) — Create:
   - `EndpointPermissionChecker` class with methods:
     - `check_access(user, path, method)` → bool
     - `get_allowed_endpoints(user)` → list
   - Use EndpointPermission model with team membership joins
   - Cache permission checks using Django cache framework
   - Reference: Django permissions patterns, guard clause style

8. **Implement AnalyticsView** — Create API endpoint returning:
   - Top 10 most used endpoints (from UsageMetric)
   - Average latency per endpoint
   - Error rate percentages
   - Request counts grouped by user
   - Date range filters (last 7/30 days)
   - Return JSON for frontend consumption
   - Reference: analytics_service.py aggregation methods

9. **Implement HistoryView** — Create view returning:
   - User's RequestLog entries (filtered by request.user)
   - Paginated (50 per page)
   - Include: endpoint, method, status_code, latency, created_at, request_body, response_body
   - Support search/filter by endpoint path
   - Reference: RequestLog model fields

10. **Implement LoginView** — Create:
    - Simple form-based login using Django's authenticate()
    - Support for setting JWT token in session
    - Token/API key input field stored in session for proxy headers
    - Redirect to /docs after success
    - Reference: Django auth views patterns

11. **Integrate permissions into views** — Add permission checks:
    - DocsView: Filter schema endpoints by user permissions
    - APIProxyView: Check permission before proxying request
    - Use EndpointPermissionChecker from step 7
    - Return 403 for unauthorized endpoints

**Verification:**
- Navigate to all URL patterns without 404
- Permission checks block unauthorized endpoints
- Analytics returns valid JSON with metrics
- History shows user's past requests

**Dependencies:** Phase 1 complete (needs working models)

---

### PHASE 3: Frontend Foundation *(~4 hours, parallel with Phase 2 steps 6-11)*

**Goal:** Build base UI structure, navigation, and styling infrastructure

**Steps:**

12. **Setup TailwindCSS** — Create static/modern_drf_swagger/css/:
    - Include Tailwind CDN in base template (for simplicity, avoid build step)
    - Define custom CSS for syntax highlighting, dark theme
    - Create utils classes for status badges, latency indicators
    - Reference: Tailwind dark mode utilities

13. **Create base templates** (templates/modern_drf_swagger/) — Build:
    - `base.html`: Master template with sidebar navigation, dark theme, TailwindCSS includes
    - Navigation items: Docs, Analytics, History, Logout
    - Sidebar toggle for mobile
    - Reference pattern: Standard Django template inheritance

14. **Build login page** (login.html) — Create:
    - Form with username/password fields
    - Token/API key input section
    - Styled with TailwindCSS cards
    - Display error messages
    - Reference: Tailwind form components

**Verification:**
- Load /login with proper styling
- Navigate between pages using sidebar
- Dark theme applies consistently

**Dependencies:** Phase 2 step 10 (LoginView exists)

---

### PHASE 4: API Explorer UI (Main Feature) *(~12 hours, depends on Phases 2-3)*

**Goal:** Build the core API documentation and testing interface

**Steps:**

15. **Create docs.html template** — Implement structure:
    - Left sidebar: Endpoint list with search, grouped by tags
    - Main area: Selected endpoint details panel
    - Collapsible sections for request/response
    - Use DocsView context (schema data from drf-spectacular)
    - Reference: OpenAPI schema structure from schema_loader.py

16. **Build endpoint list component (JS)** — Create static/modern_drf_swagger/js/endpoint-list.js:
    - Render endpoints from schema JSON
    - Group by tags with collapse/expand
    - Search/filter by path or method
    - Highlight selected endpoint
    - Click handler to load endpoint details
    - Reference: Parse schema structure from SchemaView JSON

17. **Build request editor (JS)** — Create static/modern_drf_swagger/js/request-editor.js:
    - Dynamic form generation from OpenAPI parameters
    - Text area for JSON body (with validation)
    - Method selector (GET/POST/PUT/DELETE)
    - Headers editor (key-value pairs)
    - Global auth headers from session
    - "Send Request" button → calls APIProxyView
    - Reference: request_executor.py expected input format

18. **Build response viewer (JS)** — Create static/modern_drf_swagger/js/response-viewer.js:
    - Syntax-highlighted JSON display (use lightweight library or custom)
    - Status code badge (color-coded: green 2xx, red 4xx/5xx)
    - Latency display (from APIProxyView response)
    - Copy response button
    - Error message display
    - Reference: RequestLog model fields for structure

19. **Wire API explorer interactions** — Create static/modern_drf_swagger/js/docs.js:
    - Orchestrate components: list → editor → viewer
    - AJAX calls to /api-proxy/ using fetch()
    - Loading states during request execution
    - Error handling for network failures
    - Update history after successful request
    - Reference: api_proxy_view.py response format

**Verification:**
- Load docs page showing all endpoints
- Search filters endpoint list correctly
- Send test request and receive response
- Response displays with syntax highlighting
- Latency shows accurately

**Dependencies:** Phase 2 complete, Phase 3 complete

---

### PHASE 5: Analytics & History Dashboards *(~8 hours, parallel with Phase 6 after Phase 4)*

**Goal:** Build data visualization and request history interfaces

**Steps:**

20. **Create analytics.html template** — Build layout:
    - Grid layout with metric cards (total requests, avg latency, error rate)
    - Top endpoints table (sorted by usage)
    - Date range selector (last 7/30 days)
    - Simple bar chart for request distribution
    - Reference: AnalyticsView JSON structure

21. **Build analytics dashboard (JS)** — Create static/modern_drf_swagger/js/analytics.js:
    - Fetch data from /analytics/ endpoint
    - Render metric cards with formatting
    - Generate bar chart using Chart.js CDN or vanilla SVG
    - Update on date range change
    - Reference: UsageMetric model aggregations

22. **Create history.html template** — Build interface:
    - Table with columns: timestamp, method, endpoint, status, latency
    - Expandable rows showing request/response bodies
    - Search/filter input
    - Pagination controls
    - "Replay Request" button per row
    - Reference: RequestLog model structure

23. **Build history interactions (JS)** — Create static/modern_drf_swagger/js/history.js:
    - Fetch from /history/ endpoint with pagination
    - Expand/collapse row details
    - Search filter triggers new fetch
    - Replay button populates docs page request editor
    - Reference: HistoryView pagination format

**Verification:**
- Analytics page shows live metrics from test requests
- Charts render correctly
- History page lists past requests
- Filter/search works
- Replay request navigates to docs with prefilled data

**Dependencies:** Phase 4 complete (needs working docs page for replay)

---

### PHASE 6: Team Management & Permissions UI *(~3 hours, parallel with Phase 5)*

**Goal:** Add admin interfaces for managing teams and endpoint access

**Steps:**

24. **Enhance Django admin** (admin.py) — Add custom actions:
    - Bulk assign endpoints to team
    - Export permission matrix as CSV
    - AdminActions for common team operations
    - Reference: Existing admin inline patterns

25. **Create permission matrix view (optional)** — If time permits:
    - Visual grid showing teams × endpoints
    - Checkboxes for quick permission assignment
    - Could be separate template or enhanced admin
    - Reference: EndpointPermission model many-to-many pattern

**Verification:**
- Create teams via admin
- Assign users to teams with roles
- Grant endpoint permissions
- Verify docs page filters endpoints based on permissions

**Dependencies:** Phase 2 step 11 (permissions integrated), Phase 4 complete

---

### PHASE 7: Testing Infrastructure *(~8 hours, can start unit tests after Phase 2)*

**Goal:** Add comprehensive test coverage

**Steps:**

26. **Setup pytest** — Create:
    - tests/ directory with __init__.py
    - pytest.ini configuration
    - conftest.py with fixtures (Django test database, sample users, teams)
    - Install pytest-django dependency
    - Reference: Django testing best practices

27. **Write model tests** — Create tests/test_models.py:
    - Test Team/TeamMember relationships
    - Test EndpointPermission filtering
    - Test RequestLog creation and indexing
    - Test UsageMetric aggregation
    - Cover edge cases (duplicate permissions, orphaned logs)

28. **Write service tests** — Create tests/test_services.py:
    - Test schema_loader.py with mock drf-spectacular
    - Test request_executor.py with mock HTTP responses
    - Test analytics_service.py metric calculations
    - Test permission checker logic
    - Use fixtures for deterministic data

29. **Write view tests** — Create tests/test_views.py:
    - Test DocsView renders template
    - Test APIProxyView executes and logs requests
    - Test AnalyticsView returns correct JSON
    - Test permission enforcement in views
    - Use Django test client

30. **Write integration tests** — Create tests/test_integration.py:
    - Full workflow: login → browse docs → send request → check history
    - Test permission blocking unauthorized endpoints
    - Test analytics updates after requests
    - Use example project as test harness

**Verification:**
- Run `pytest tests/` - all pass
- Coverage report shows >80% coverage
- Integration tests pass end-to-end

**Dependencies:** Phases 1-6 complete (can start unit tests earlier in parallel, integration tests need full stack)

---

### PHASE 8: Documentation & Packaging *(~4 hours, depends on Phases 1-7)*

**Goal:** Prepare for pip distribution and write user documentation

**Steps:**

31. **Write README.md** — Include:
    - Project description and features
    - Installation instructions (pip install, settings.py, urls.py)
    - Configuration reference (MODERN_DRF_SWAGGER settings)
    - Quick start example
    - Screenshots/GIFs of UI
    - Contributing guidelines
    - Reference: pyproject.toml metadata

32. **Update pyproject.toml** — Ensure:
    - All dependencies listed (requests, djangorestframework, drf-spectacular)
    - Correct package metadata (author, URL, classifiers)
    - Include_package_data = true for static/templates
    - Entry points if needed

33. **Create MANIFEST.in** — Include:
    - Static files (css, js)
    - Templates (html)
    - Example project files (optional)

34. **Add CHANGELOG.md** — Document:
    - v0.1.0 initial release features
    - Future roadmap items

35. **Create docs/ folder (optional)** — If time permits:
    - Advanced configuration guide
    - API reference for services
    - Deployment best practices
    - Custom authentication setup

**Verification:**
- Build package: `python -m build`
- Install in clean virtualenv: `pip install dist/django-api-portal-0.1.0.tar.gz`
- Test in fresh Django project (not example)
- Verify static files served correctly

**Dependencies:** Phases 1-7 complete

---

### PHASE 9: Polish & Optimization *(~6 hours, depends on Phase 8)*

**Goal:** Production hardening and performance optimization

**Steps:**

36. **Add request rate limiting** — Implement:
    - Throttling in APIProxyView (prevent abuse)
    - Use DRF throttle classes or Django Ratelimit
    - Per-user and per-IP limits
    - Reference: DRF throttling docs

37. **Optimize database queries** — Add:
    - select_related/prefetch_related in views (team permissions)
    - Database indexes review (especially RequestLog queries)
    - Add query count tests
    - Reference: Django ORM optimization patterns

38. **Add caching** — Implement:
    - Cache schema in SchemaView (rarely changes)
    - Cache permission checks in EndpointPermissionChecker
    - Cache analytics aggregations (5-minute TTL)
    - Use Django cache framework (Redis/Memcached support)

39. **Security hardening** — Review:
    - CSP headers for XSS protection
    - CSRF token in all AJAX requests
    - Sanitize request_body before storage (truncate large payloads)
    - Audit exclude_paths filtering (prevent bypass)
    - Reference: Django security checklist

40. **UI polish** — Improve:
    - Loading spinners for async operations
    - Toast notifications for errors/success
    - Keyboard shortcuts (e.g., Ctrl+Enter to send request)
    - Mobile responsive layout checks
    - Accessibility (ARIA labels, keyboard navigation)

**Verification:**
- Run `python manage.py check --deploy` (no warnings)
- Load test: 100 concurrent requests to proxy
- Security scan with Django security check tools
- Test on mobile browsers

**Dependencies:** Phases 1-8 complete

---

## Relevant Files & Patterns

**Core Models** (need bug fixes):
- modern_drf_swagger/models.py — All 5 models with relationships, use as schema reference

**Services** (reuse patterns):
- modern_drf_swagger/services/schema_loader.py — OpenAPI parsing, filtering logic
- modern_drf_swagger/services/request_executor.py — HTTP proxy pattern, header forwarding
- modern_drf_swagger/services/analytics_service.py — Logging and aggregation methods

**Configuration**:
- modern_drf_swagger/conf.py — Settings helper function, @hide_from_portal decorator usage

**Admin** (extend from):
- modern_drf_swagger/admin.py — Inline patterns, custom filters, search_fields

**Example Project**:
- sample_project/ — Use for all local testing before publishing

**Package Structure**:
- pyproject.toml — Dependencies and metadata

---

## Verification Checklist

**Functional:**
- [ ] Install package in clean Django project
- [ ] Load docs page showing API endpoints
- [ ] Send test request and receive response
- [ ] Analytics show request metrics
- [ ] History displays past requests
- [ ] Permissions block unauthorized endpoints
- [ ] Login with token/API key works

**Quality:**
- [ ] All tests pass (`pytest tests/`)
- [ ] No migrations pending
- [ ] No import errors
- [ ] Security check passes
- [ ] Code passes linting (ruff/flake8)

**Documentation:**
- [ ] README has installation guide
- [ ] Configuration options documented
- [ ] Example project runs successfully

**Performance:**
- [ ] Analytics page loads <500ms
- [ ] Request proxy adds <50ms overhead
- [ ] Schema loading cached

---

## Technology Decisions & Rationale

**Technology Decisions:**
- **Vanilla JS over frameworks**: Keeps package lightweight, ~100KB vs ~500KB+ for React
- **TailwindCSS CDN**: Avoids build step, simplifies installation (tradeoff: larger initial page load)
- **External HTTP proxy**: Uses `requests` lib for realistic latency vs Django test client (architectural choice from existing code)
- **Schema-driven from drf-spectacular**: Avoids custom introspection, leverages OpenAPI standard

**Scope Boundaries:**
- **Included**: Team-based permissions, analytics, request testing, history
- **Excluded**: Custom schema generation (relies on drf-spectacular), WebSocket testing, GraphQL support, load testing features

**Implementation Assumptions:**
- Django ≥3.2 (LTS support)
- DRF ≥3.12 (stable API)
- drf-spectacular ≥0.26 (OpenAPI 3.0)
- Users have basic Django knowledge
- Production deployment uses Redis/Memcached for caching (optional but recommended)

---

## Further Considerations

### 1. Chart Library Choice (Phase 5 Analytics)

**Options:**
- **Option A: Chart.js CDN** (~50KB, rich features, most popular) ✅ **Recommended**
- Option B: Vanilla SVG (~0KB, more control, more code)
- Option C: Plotly CDN (~100KB, interactive, professional)

**Rationale:** Chart.js provides the best balance of size and functionality.

### 2. Authentication Strategy

**Current Approach:** Session + token input field (simple, covers 90% of cases) ✅ **Ship in v0.1.0**

**Future Consideration:** Add OAuth2/SAML for SSO integration in v0.2.0 based on user demand.

### 3. Request Body Size Limits

**Recommendation:** 
- Truncate request_body/response_body to 10KB in database
- Add `MODERN_DRF_SWAGGER['MAX_LOG_SIZE']` setting (default 10240 bytes)
- Store full version in optional S3/file backend for enterprise users

### 4. Deployment Guide

**Recommendation:** Yes, add docker-compose.yml in sample_project/ showing:
- Portal application
- Redis for caching
- PostgreSQL database
- Demonstrates production-ready setup

---

## Effort Estimation

**Total Estimated Effort:** ~53 hours (7-8 working days for senior engineer)

**Critical Path:** Phase 1 → Phase 2 → Phase 4 → Phase 8

**Parallelization Opportunities:**
- Phases 2 & 3 can run in parallel after Phase 1 step 5
- Phases 5 & 6 can run in parallel after Phase 4
- Phase 7 unit tests can start after Phase 2, integration tests need full stack

**Milestone Delivery:**
- End of Phase 1: Working foundation, no errors
- End of Phase 4: Functional API explorer with testing capability
- End of Phase 7: Production-ready with tests
- End of Phase 9: Optimized and polished

---

## Success Criteria

The project is considered complete when:

1. **Installable**: Package installs via pip in any Django 3.2+ project
2. **Functional**: All 7 functional verification items pass
3. **Tested**: >80% code coverage with passing tests
4. **Documented**: README enables new users to install and configure
5. **Secure**: Passes Django security checks
6. **Performant**: Meets performance targets (analytics <500ms, proxy <50ms overhead)
7. **Maintainable**: Code follows SOLID principles, properly documented

The deliverable is a production-grade Django package ready for open-source distribution and real-world usage.
