# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- **Flexible Configuration**: Extensive settings via `API_PORTAL` dictionary
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
