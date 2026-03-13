# Modern DRF Swagger 🚀

A modern, team-based API developer portal for Django REST Framework projects with built-in analytics and granular access control.

[![PyPI version](https://badge.fury.io/py/modern-drf-swagger.svg)](https://pypi.org/project/modern-drf-swagger/)
![Status](https://img.shields.io/badge/status-stable-green)
![Python](https://img.shields.io/badge/python-3.8%2B-blue)
![Django](https://img.shields.io/badge/django-3.2%2B-green)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

---

## 📸 Screenshots

<div align="center">

### Login Page
<img src="https://raw.githubusercontent.com/firdavsDev/modern-drf-swagger/main/images/login.png" alt="Login Page" width="800" />

*Secure login with dark/light theme support and password visibility toggle*

### API Explorer
<img src="https://raw.githubusercontent.com/firdavsDev/modern-drf-swagger/main/images/api.png" alt="API Explorer" width="800" />

*Modern interface for browsing, testing, and exploring your API endpoints*

### Analytics Dashboard
<img src="https://raw.githubusercontent.com/firdavsDev/modern-drf-swagger/main/images/analy.png" alt="Analytics Dashboard" width="800" />

*Track API usage, latency, and error rates with beautiful charts*

</div>

---

## Features

- 🎨 **Modern API Explorer**: Clean, dark-themed interface for exploring and testing DRF APIs
- 👥 **Team Management**: Role-based access control (Super Admin, Admin, Developer, Viewer)
- 🔒 **Endpoint Permissions**: Granular control over which teams can access specific endpoints
- 📊 **Analytics Dashboard**: Track API usage, latency, and error rates with charts
- 📝 **Request History**: Personal history with search, filtering, and request replay (auto-cleanup of old logs)
- ⚡ **Real Request Proxy**: Execute actual HTTP requests with accurate latency measurement
- 💻 **Code Generation**: Generate client code in 7 languages (Python, JavaScript, cURL, HTTPie, PHP, Java, Go)
- ⌨️ **Keyboard Shortcuts**: Boost productivity with Cmd/Ctrl+Enter to send requests and Cmd/Ctrl+K to search
- 🎨 **Syntax Highlighting**: JSON responses with color-coded syntax
- 🔍 **Search & Filter**: Quickly find endpoints and past requests
- 🔖 **Bookmarkable Endpoints**: URL hash routing preserves selected endpoint on refresh
- 📦 **Collapsible Groups**: Organize endpoints by tags with collapse/expand controls

## 🚀 Quick Start

**Want detailed step-by-step instructions?** Check out the [**📖 QUICKSTART.md**](https://github.com/firdavsDev/modern-drf-swagger/blob/main/QUICKSTART.md) guide!

### 1. Install the Package

**Via PyPI (Recommended):**
```bash
pip install modern-drf-swagger
```

**Or via Git (Development):**
```bash
git clone https://github.com/firdavsDev/modern-drf-swagger.git
cd modern-drf-swagger
pip install -e .
```

### 2. Add to INSTALLED_APPS

**That's it!** You only need to add `modern_drf_swagger`:

```python
# settings.py
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party
    'rest_framework',
    
    # API Portal (auto-configures everything)
    'modern_drf_swagger',
    
    # Your apps
    'myapp',
]
```

### 3. Configure API Portal (Optional)

**All configuration is done through one dictionary** - API Portal handles drf-spectacular internally:

```python
# settings.py
MODERN_DRF_SWAGGER = {
    # Basic Info (automatically configures drf-spectacular)
    'TITLE': 'My Company API Portal',
    'DESCRIPTION': 'Complete API documentation',
    'VERSION': '1.0.7',
    
    # Features
    'ANALYTICS_ENABLED': True,
    'HISTORY_LIMIT': 100,
    'ALLOW_ANONYMOUS': False,
    
    # Schema Settings
    'SCHEMA_PATH_PREFIX': r'/api/',  # Only show endpoints starting with /api/
    
    # Authentication (auto-detected from REST_FRAMEWORK['DEFAULT_AUTHENTICATION_CLASSES'])
    # 'DEFAULT_AUTH_METHODS': ['bearer', 'basic'],  # Optional override - only set if auto-detection fails
    
    # UI Settings
    'ENDPOINTS_COLLAPSIBLE': True,
    'ENDPOINTS_DEFAULT_COLLAPSED': False,
    
    # Filtering
    'EXCLUDE_PATHS': ['/admin/', '/internal/'],
}
```

**Note:** You don't need to configure `REST_FRAMEWORK['DEFAULT_SCHEMA_CLASS']` or `SPECTACULAR_SETTINGS` - API Portal does this automatically!

**Authentication is also auto-detected!** The portal automatically detects authentication methods from your `REST_FRAMEWORK['DEFAULT_AUTHENTICATION_CLASSES']` setting. No need to configure `DEFAULT_AUTH_METHODS` unless you want to override the auto-detection.

### 4. Add URL Routes

**Good news!** Unlike some API documentation tools, Modern DRF Swagger works at **any URL prefix** you choose:

```python
# urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('myapp.urls')),  # Your API
    
    # Choose ANY URL prefix that works for your project:
    path('api/docs/', include('modern_drf_swagger.urls')),  # Nested under API (shown in docs)
    # OR
    # path('portal/', include('modern_drf_swagger.urls')),        # Default/simple path
    # path('docs/', include('modern_drf_swagger.urls')),          # Short and sweet
    # path('swagger/', include('modern_drf_swagger.urls')),       # Swagger-style
    # path('api-explorer/', include('modern_drf_swagger.urls')),  # Descriptive
]
```

The portal automatically detects its mount point and adjusts all internal links!

### 5. Run Migrations

```bash
python manage.py migrate
```

### 6. Create Superuser and Setup Teams

```bash
python manage.py createsuperuser
python manage.py runserver
```

Visit `http://localhost:8000/admin` to:
1. Create teams
2. Add team members with roles
3. Grant endpoint permissions to teams

### 7. Access the Portal

Visit `http://localhost:8000/api/docs/` and login with your credentials.

---

## 📚 Full Documentation

- **[📖 Complete Quickstart Guide](https://github.com/firdavsDev/modern-drf-swagger/blob/main/QUICKSTART.md)** - Detailed step-by-step installation and setup
- **[📋 Changelog](https://github.com/firdavsDev/modern-drf-swagger/blob/main/CHANGELOG.md)** - Version history and updates
- **[📜 License](https://github.com/firdavsDev/modern-drf-swagger/blob/main/LICENSE)** - MIT License

---


## 🚀 Roadmap

- [ ] WebSocket/GraphQL support
- [ ] API key authentication
- [ ] Request mocking
- [ ] Export analytics as CSV
- [ ] Custom themes
- [ ] OAuth2/SAML integration
- [ ] Comprehensive test suite
- [ ] Multi language support (i18n)
- [ ] OpenAPI spec editor
- [ ] Theme switcher (light/dark/auto)
- [ ] Request diffing
- [ ] API versioning support
- [ ] Chat with AI for solving API issues (via OpenAI share button)
- [ ] Mobile-friendly responsive design
- [ ] Team/User permissions for analytics access
- [x] Generate client code from OpenAPI schema (✅ v1.0.5)
- [x] Keyboard shortcuts - Cmd/Ctrl+K for search (✅ v1.0.5)
- [ ] Resizable panels
- [ ] Different layout modes (split, stacked)
- [x] Send request - Cmd/Ctrl+Enter (✅ v1.0.5)
- [x] Smart defaults based on schema (✅ v1.0.6)

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [.github/copilot-instructions.md](https://github.com/firdavsDev/modern-drf-swagger/blob/main/.github/copilot-instructions.md) for development guidelines and architecture details.

## 📄 License

MIT License - see [LICENSE](https://github.com/firdavsDev/modern-drf-swagger/blob/main/LICENSE) file for details.

---

<div align="center">

**⭐ Star this repo if you find it useful! ⭐**

[![GitHub stars](https://img.shields.io/github/stars/firdavsDev/modern-drf-swagger?style=social)](https://github.com/firdavsDev/modern-drf-swagger/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/firdavsDev/modern-drf-swagger?style=social)](https://github.com/firdavsDev/modern-drf-swagger/network/members)

Made with ❤️ by [DavronbekDev](https://davronbek.dev)

</div>