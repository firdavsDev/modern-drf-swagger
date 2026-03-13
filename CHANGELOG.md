# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.5] - 2026-03-13

### ✨ New Features

- **Code Generation**: Generate client code snippets in 7 programming languages
  - 🐍 **Python** - Using `requests` library
  - ⚡ **JavaScript** - Using `fetch` API  
  - 🔧 **cURL** - Command-line ready
  - 🦄 **HTTPie** - Modern CLI HTTP client
  - 🐘 **PHP** - Using cURL extension
  - ☕ **Java** - Using HttpURLConnection
  - 🚀 **Go** - Using net/http package
  - New "Code" tab in request editor for easy access
  - One-click language switching with instant regeneration
  - Copy-paste ready snippets with all parameters, headers, and authentication included
  - Global authentication credentials automatically included in generated code
  - Real-time code generation based on current endpoint configuration
  - Perfect for API integration documentation and developer onboarding

- **Keyboard Shortcuts**: Boost productivity with keyboard shortcuts
  - ⌨️ **Cmd/Ctrl + Enter** - Send the current request
  - 🔍 **Cmd/Ctrl + K** - Focus on endpoint search input
  - Cross-platform support (Cmd on macOS, Ctrl on Windows/Linux)
  - Visual feedback with toast notifications

### 🔧 Improvements

- Added `/generate-code/` API endpoint for code snippet generation
- New `CodeGenerator` service class in backend for extensible code generation
- Enhanced request editor UI with additional tab for code snippets
- Language-specific syntax highlighting preparation (ready for future enhancement)
- Keyboard shortcut system for improved developer experience
- **Request rate limiting**: Added 500ms cooldown between requests to prevent spam
- **Request state management**: Tracks active requests to prevent duplicate submissions
- Better user feedback with specific warning messages for rate limiting

### 🐛 Bug Fixes

- **Fixed rapid request spam**: Users can no longer send multiple simultaneous requests by spamming the send button or Cmd/Ctrl+Enter
- **Rate limiting protection**: Minimum 500ms interval between requests with clear user feedback
- **Request state tracking**: Prevents duplicate requests when one is already in progress
- **Better error messages**: Clear warnings when trying to send requests too quickly or without proper permissions
- **DRF Token auth prefix fix**: `rest_framework.authentication.TokenAuthentication` is now handled separately from bearer JWT auth
  - Added dedicated `token` auth type in schema auto-detection and default auth methods
  - Sends `Authorization: Token <token>` instead of incorrectly forcing `Bearer`
- **API Key transport fix**: API keys now follow OpenAPI `in` location (`header`, `query`, `cookie`) instead of always being injected into headers
  - Global auth now builds auth config by transport location
  - Request builder forwards query-based keys as query params and cookie-based keys as cookies
  - Multipart upload flow now preserves `_headers` and `_cookies` auth metadata
- **Custom user model compatibility (management command)**: Fixed `list_permissions` crash on projects without a `username` field
  - Command now reads the configured identifier via `USERNAME_FIELD` dynamically
- **Send button loading spinner visibility**: Fixed invisible loader icon while request state shows `Sending...`
  - Spinner now has explicit circular border styling and contrast for reliable visibility

### 💡 Use Cases

- **Developers**: Copy-paste working code examples directly into projects
- **Documentation**: Auto-generate code examples for API documentation
- **Testing**: Quick script generation for testing endpoints
- **Integration**: Speed up API integration with pre-configured client code
- **Power Users**: Navigate and test endpoints faster with keyboard shortcuts

## [1.0.4] - 2026-06-15

### ✨ New Features

- **Global Authentication System**: One-time authentication setup for all API requests (like Swagger UI)
  - Click "Authorize" button in sidebar to configure authentication once
  - Supports multiple authentication types:
    - Bearer Token (JWT) - Most common for REST APIs
    - Basic Auth - Username and password
    - API Key - Custom header-based authentication
  - Credentials stored securely in browser's localStorage
  - Automatically applied to all requests (no need to set headers for each request)
  - Visual indicator shows authentication status (green dot = authenticated)
  - Clear/update authentication anytime via the Authorize modal
  - Custom headers in Headers tab still override global auth if needed
- **Dynamic Authentication Configuration**: Authentication types are now dynamically configured
  - Automatically detects authentication schemes from OpenAPI schema (drf-spectacular)
  - Only shows authentication types that are actually available in your API
  - Falls back to `MODERN_DRF_SWAGGER['DEFAULT_AUTH_METHODS']` setting if schema doesn't define securitySchemes
  - API Key header names automatically populated from OpenAPI schema metadata
  - Provides enterprise-level flexibility for different authentication setups

### 🔧 Improvements

- **Responsive Response Metadata**: Status, Latency, and Size cards now adapt to screen sizes
  - Mobile (< 640px): Single column layout
  - Tablet (≥ 640px): Two columns side-by-side
  - Desktop (≥ 1024px): Three columns
  - Font sizes and padding scale appropriately
- **Better Headers Tab UX**: Updated placeholder and help text to guide users toward global auth
- **Copy Buttons**: Example Value and Schema sections in Responses tab have copy buttons
- **Improved Copy Button Implementation**: Using data attributes instead of inline onclick for better reliability

### 🐛 Bug Fixes

- **JavaScript Syntax Error**: Fixed Django template boolean rendering issues
  - Changed from `{{ var|lower }}` to `{% if var %}true{% else %}false{% endif %}`
  - Prevents "Uncaught SyntaxError: Unexpected end of input" errors
  - Properly renders JavaScript booleans in PORTAL_CONFIG
- **Copy Button Escaping Issues**: Replaced inline onclick handlers with event delegation
  - Copy buttons now use data attributes to store content
  - Eliminates complex template literal escaping issues
  - Fixes "Uncaught SyntaxError" errors in copy buttons with large JSON
- **Copy Button Truncation**: Fixed incomplete copying of JSON content
  - Replaced HTML entity escaping with Base64 encoding for data attributes
  - Uses `btoa(encodeURIComponent())` to encode and `decodeURIComponent(atob())` to decode
  - Ensures full JSON content is preserved regardless of special characters or length
  - Previously copy button would only copy first few characters (e.g., `[\n  {\n    `)
- **Tailwind CDN Note**: The Tailwind CDN warning in console is expected behavior
  - This tool is designed for API documentation/testing (like Swagger UI)
  - Not intended as a production application itself
  - The CDN approach is appropriate for developer tools
  - Users deploying production apps should use their own build tools

### 📝 Changed Files

**Backend:**
- None (all frontend changes)

**Frontend:**
- `modern_drf_swagger/templates/modern_drf_swagger/base.html` - Added Authorize button, authentication modal, improved Tailwind config
- `modern_drf_swagger/templates/modern_drf_swagger/docs.html` - Fixed JavaScript boolean rendering
- `modern_drf_swagger/static/modern_drf_swagger/js/global-auth.js` - New file handling global authentication
- `modern_drf_swagger/static/modern_drf_swagger/js/request-editor.js` - Auto-inject global auth headers, fixed copy buttons with event delegation
- `modern_drf_swagger/static/modern_drf_swagger/js/response-viewer.js` - Responsive response metadata cards

## [1.0.2] - 2026-03-13

### ⚠️ BREAKING CHANGES

**1. Package Import Name Changed: `api_portal` → `modern_drf_swagger`**

To align with the PyPI package name (`modern-drf-swagger`), the import name has been changed from `api_portal` to `modern_drf_swagger`. This makes the package more intuitive and follows Python naming conventions.

**2. Settings Dictionary Name Changed: `API_PORTAL` → `MODERN_DRF_SWAGGER`**

The configuration dictionary has been renamed to match the package name for consistency.

#### Migration Guide

**1. Update INSTALLED_APPS in settings.py:**
```python
INSTALLED_APPS = [
    # ...
    # OLD: 'api_portal',
    'modern_drf_swagger',  # NEW
]
```

**2. Update URL includes in urls.py:**
```python
# OLD: path('portal/', include('api_portal.urls')),
path('portal/', include('modern_drf_swagger.urls')),  # NEW
```

**3. Update imports (if using decorators):**
```python
# OLD: from api_portal.conf import hide_from_portal
from modern_drf_swagger.conf import hide_from_portal  # NEW
```

**4. Update settings dictionary name:**
```python
# OLD: API_PORTAL = {...}
MODERN_DRF_SWAGGER = {  # NEW
    'TITLE': 'My API Portal',
    'DESCRIPTION': 'API Documentation',
    'VERSION': '1.0.0',
    # ... other settings ...
}
```

**5. Run migrations:**
```bash
python manage.py migrate
```

> **Note:** Django will automatically handle the database table renaming. Existing data is preserved.

#### What Changed

- **Package directory**: `api_portal/` → `modern_drf_swagger/`
- **Import paths**: All imports now use `modern_drf_swagger` instead of `api_portal`
- **Settings dictionary**: `API_PORTAL` → `MODERN_DRF_SWAGGER`
- **Template paths**: `api_portal/base.html` → `modern_drf_swagger/base.html`
- **Static files**: `api_portal/css/` → `modern_drf_swagger/css/`
- **URL namespace**: `api_portal:docs` → `modern_drf_swagger:docs`
- **Cache key prefixes**: `api_portal:perm:...` → `modern_drf_swagger:perm:...`
- **Related names**: `api_portal_teams` → `modern_drf_swagger_teams`, `api_portal_requests` → `modern_drf_swagger_requests`

#### Why These Changes?

- **Consistency**: Package name, import name, and settings name all align (`modern-drf-swagger` ↔ `modern_drf_swagger` ↔ `MODERN_DRF_SWAGGER`)
- **Clarity**: Users no longer confused about different names for installation, imports, and configuration
- **Standards**: Follows Python conventions for naming (hyphens in package names, underscores in module names)

## [1.0.2] - 2026-03-13

### ✨ New Features

- **Flexible URL Mounting**: API Portal can now be mounted at **any URL prefix**, not just `/portal/`
  - Mount at `api/docs/`, `docs/`, `swagger/`, or any path you prefer
  - Automatic detection of mount point - no configuration needed
  - Works like popular tools (Swagger UI, ReDoc) with complete URL flexibility
  - See [FLEXIBLE_URL_IMPLEMENTATION.md](FLEXIBLE_URL_IMPLEMENTATION.md) for technical details

### 🔧 Improvements

- **Dynamic URL Resolution**: All views now use Django's `reverse()` for URL generation
- **JavaScript Integration**: Base template exposes `window.PORTAL_BASE_URL` for AJAX requests
- **Documentation**: Updated README, QUICKSTART, and copilot instructions with flexible URL examples
- **Testing**: Added `test_flexible_urls.py` to verify URL flexibility across different mount points

### 📝 Changed Files

**Backend:**
- `modern_drf_swagger/views/analytics_view.py` - Dynamic login URLs and portal base URL
- `modern_drf_swagger/views/docs_view.py` - Dynamic login URLs and portal base URL

**Frontend:**
- `modern_drf_swagger/templates/modern_drf_swagger/base.html` - Exposes portal base URL to JavaScript
- `modern_drf_swagger/static/modern_drf_swagger/js/analytics.js` - Uses dynamic URL
- `modern_drf_swagger/static/modern_drf_swagger/js/endpoint-list.js` - Uses dynamic URL
- `modern_drf_swagger/static/modern_drf_swagger/js/docs.js` - Uses dynamic URL
- `modern_drf_swagger/static/modern_drf_swagger/js/history.js` - Uses dynamic URL

**Documentation:**
- `README.md` - Added flexible URL examples
- `QUICKSTART.md` - Added flexible URL examples
- `.github/copilot-instructions.md` - Updated URL comments

## [1.0.2] - 2026-03-13

### 🐛 Bug Fixes

- **Custom User Model Compatibility**: Fixed compatibility issues with Django projects using custom User models
  - Analytics view now uses `User.USERNAME_FIELD` dynamically instead of hardcoded `username`
  - Admin search fields now adapt to custom User model fields
  - Login form label and placeholder now display the correct username field name
  - Error messages now show the correct field name (e.g., "Invalid email or password" instead of "Invalid username or password")
- **Build Warnings**: Fixed setuptools deprecation warnings
  - Updated license format to use SPDX expression (`license = "MIT"`)
  - Removed deprecated license classifier
  - Fixed package discovery warnings for static/template directories
- **GitHub Actions**: Updated actions to support Node.js 24
  - Updated `actions/checkout@v4` to `v4.2.2`
  - Updated `actions/setup-python@v5` to `v5.4.0`
  - Updated `softprops/action-gh-release@v1` to `v2`
- **PyPI Package Page**: Fixed broken links and images on PyPI
  - Screenshots now use absolute GitHub URLs
  - Documentation links now redirect to GitHub properly

## [1.0.0] - 2026-03-12

### 🎉 Initial Release

The first stable release of Modern DRF Swagger - A modern API developer portal for Django REST Framework projects.

### ✨ Features

#### Core Functionality
- **Modern API Explorer**: Clean, dark-themed interface for exploring and testing DRF APIs
- **OpenAPI Integration**: Automatically discovers endpoints via drf-spectacular
- **Real HTTP Proxy**: Execute actual HTTP requests with accurate latency measurement
- **Syntax Highlighting**: Beautiful JSON responses with color-coded syntax
- **Request Editor**: Intuitive interface for configuring parameters, headers, and body

#### Team Management
- **Role-Based Access Control**: Super Admin, Admin, Developer, and Viewer roles
- **Team System**: Organize users into teams with specific permissions
- **Granular Permissions**: Control access to specific endpoints by path and HTTP method
- **Member Management**: Easy addition/removal of team members

#### Analytics & Monitoring
- **Request Analytics**: Track API usage, latency, and error rates
- **Usage Metrics**: View total requests, error counts, and average response times
- **Visual Charts**: Daily request timeline with Chart.js integration
- **Top Endpoints**: Identify most frequently used API endpoints
- **User Statistics**: Track requests by user and team

#### Request History
- **Personal History**: View all your past API requests
- **Search & Filter**: Quickly find requests by endpoint path
- **Auto-Cleanup**: Automatically delete old logs based on configurable limit
- **Request Details**: Full request/response inspection with replay capability
- **Pagination**: Handle large history datasets efficiently

#### UI/UX Features
- **Dark/Light Theme**: Toggle between dark and light modes with localStorage persistence
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Collapsible Groups**: Organize endpoints by tags with expand/collapse controls
- **URL Hash Routing**: Bookmarkable endpoints preserved on refresh
- **Password Show/Hide**: Eye icon for password field visibility toggle
- **Loading States**: Clear feedback during API requests
- **Error Handling**: User-friendly error messages

#### Developer Experience
- **Easy Installation**: Simple pip install and configuration
- **Django Admin Integration**: Full CRUD for teams, members, and permissions
- **Decorator Support**: `@hide_from_portal` to exclude specific endpoints
- **Flexible Configuration**: Extensive settings via `MODERN_DRF_SWAGGER` dictionary
- **Schema-Driven**: No manual endpoint registration required
- **Service Layer**: Clean separation of concerns with service classes

### 📦 Package Details
- **Python Support**: 3.8, 3.9, 3.10, 3.11, 3.12
- **Django Support**: 3.2, 4.0, 4.1, 4.2, 5.0
- **DRF Support**: 3.12+
- **drf-spectacular**: 0.26+

### 🔧 Configuration Options
- `TITLE`: Portal title displayed in UI
- `ANALYTICS_ENABLED`: Enable/disable request logging
- `HISTORY_LIMIT`: Max history items per user (auto-deletes oldest)
- `ALLOW_ANONYMOUS`: Allow unauthenticated access
- `EXCLUDE_PATHS`: Paths to hide from portal
- `ENDPOINTS_COLLAPSIBLE`: Enable endpoint group collapse/expand
- `ENDPOINTS_DEFAULT_COLLAPSED`: Start with endpoint groups collapsed

### 📚 Documentation
- Comprehensive README with installation guide
- QUICKSTART guide for 5-minute setup
- Configuration reference
- Troubleshooting section
- Sample project with examples

### 🏗️ Architecture
- Service layer pattern (Views → Services → Models)
- External HTTP proxy using requests library
- Permission caching for performance
- Automatic request log cleanup
- RESTful API proxy endpoint

### 🛠️ Technical Stack
- Django REST Framework
- drf-spectacular OpenAPI integration
- TailwindCSS for styling
- Vanilla JavaScript (no framework dependencies)
- Chart.js for analytics visualization
- SQLite/PostgreSQL/MySQL database support

### 🔐 Security Features
- Session-based authentication
- CSRF protection
- Permission-based endpoint access
- Optional anonymous access control
- Secure password handling with show/hide toggle

### 🎨 UI Components
- Login page with theme switcher
- API explorer with endpoint list
- Request editor with parameter inputs
- Response viewer with syntax highlighting
- Analytics dashboard with charts
- Request history table with search

### 📝 Models
- `Team`: Team organization
- `TeamMember`: User-team association with roles
- `EndpointPermission`: Path-based access control
- `RequestLog`: API request history
- `UsageMetric`: Aggregated usage statistics

### 🚀 Known Limitations
- No WebSocket support (HTTP only)
- No GraphQL support (REST only)
- Basic authentication methods (no OAuth2/SAML yet)
- English language only (no i18n yet)

---

## [Unreleased]

### Planned Features
- WebSocket support
- GraphQL explorer
- API key authentication
- Request mocking
- Export analytics as CSV/PDF
- Custom theme builder
- OAuth2/SAML integration
- Multi-language support (i18n)
- Request diffing
- API versioning support
- Comprehensive test suite
- OpenAPI spec editor
- Environment variables management
- Request collections/folders

---

**Author**: [DavronbekDev](https://davronbek.dev) (davronbekboltyev777@gmail.com)  
**Repository**: https://github.com/firdavsDev/modern-drf-swagger  
**License**: MIT
