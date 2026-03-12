# 🚀 Quick Start Guide - Modern DRF Swagger

Get up and running with Modern DRF Swagger in **5 minutes**!

## 📋 Prerequisites

- Python 3.8 or higher
- Django 3.2 or higher
- Django REST Framework 3.12 or higher
- An existing Django project with DRF

## 📦 Installation

### Step 1: Install the Package

```bash
pip install modern-drf-swagger
```

### Step 2: Add to INSTALLED_APPS

Add the required apps to your `settings.py`:

```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party (required)
    'rest_framework',
    'drf_spectacular',
    
    # Modern DRF Swagger
    'api_portal',
    
    # Your apps
    'myapp',
]
```

## ⚙️ Configuration

### Step 3: Configure REST Framework & drf-spectacular

Add these settings to your `settings.py`:

```python
# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.BasicAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# drf-spectacular Configuration
SPECTACULAR_SETTINGS = {
    'TITLE': 'My API',
    'DESCRIPTION': 'My awesome API documentation',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'SCHEMA_PATH_PREFIX': r'/api/',
}

# API Portal Configuration
API_PORTAL = {
    'TITLE': 'My Company API Portal',
    'ANALYTICS_ENABLED': True,
    'HISTORY_LIMIT': 100,
    'ALLOW_ANONYMOUS': False,
    'EXCLUDE_PATHS': ['/admin/', '/internal/'],
    'ENDPOINTS_COLLAPSIBLE': True,
    'ENDPOINTS_DEFAULT_COLLAPSED': False,
}
```

### Step 4: Add URL Routes

Update your main `urls.py`:

```python
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Your API endpoints
    path('api/', include('myapp.urls')),
    
    # API Portal (add this)
    path('portal/', include('api_portal.urls')),
]
```

### Step 5: Run Migrations

```bash
python manage.py migrate
```

### Step 6: Create Superuser (if you haven't already)

```bash
python manage.py createsuperuser
```

### Step 7: Collect Static Files (Production)

```bash
python manage.py collectstatic
```

## 🎯 Setup Teams & Permissions

### Step 8: Start the Server

```bash
python manage.py runserver
```

### Step 9: Access Django Admin

Visit: `http://localhost:8000/admin`

Login with your superuser credentials.

### Step 10: Create a Team

1. Go to **Teams** → **Add Team**
2. Enter team name (e.g., "Frontend Team")
3. Save

### Step 11: Add Team Members

1. Open the team you just created
2. Scroll to **Team Members** section
3. Click **Add another Team Member**
4. Select user and role:
   - **Super Admin**: Access to all endpoints
   - **Admin**: Manage team permissions
   - **Developer**: Test and use endpoints
   - **Viewer**: Read-only access
5. Save

### Step 12: Grant Endpoint Permissions (Optional)

If you want to restrict access to specific endpoints:

1. Go to **Endpoint Permissions** → **Add Endpoint Permission**
2. Select the team
3. Enter the endpoint path (e.g., `/api/users/`)
4. Choose allowed methods:
   - `GET,POST,PUT,DELETE` (specific methods)
   - `*` (all methods)
5. Save

**Note**: Super Admin users bypass all permission checks.

## 🎨 Access the Portal

### Step 13: Login to the Portal

Visit: `http://localhost:8000/portal/`

Login with your credentials.

## 🎉 You're All Set!

You should now see:

- **API Explorer** (`/portal/`): Browse and test your API endpoints
- **Analytics Dashboard** (`/portal/analytics/`): View API usage statistics
- **Request History** (`/portal/history/`): See your past API requests

## 📸 Features Overview

### API Explorer
- Browse all API endpoints
- Send requests with parameters, headers, and body
- View responses with syntax highlighting
- Measure request latency

### Analytics Dashboard
- Total requests and error rates
- Average response latency
- Top endpoints by usage
- Daily request charts

### Request History
- View all your past requests
- Search and filter by endpoint
- Replay previous requests

## 🔒 Security Tips

### Production Settings

```python
# Disable anonymous access
API_PORTAL = {
    'ALLOW_ANONYMOUS': False,
}

# Use secure authentication
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# Enable HTTPS
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
```

## 🛠️ Common Configuration Options

### Hide Specific Endpoints

Use the decorator in your views:

```python
from api_portal.conf import hide_from_portal
from rest_framework import viewsets

@hide_from_portal
class InternalAPIViewSet(viewsets.ModelViewSet):
    """This endpoint won't appear in the portal"""
    queryset = InternalModel.objects.all()
    serializer_class = InternalSerializer
```

### Adjust History Limit

```python
API_PORTAL = {
    'HISTORY_LIMIT': 50,  # Keep last 50 requests per user
}
```

### Disable Analytics

```python
API_PORTAL = {
    'ANALYTICS_ENABLED': False,  # No request logging
}
```

## 🐛 Troubleshooting

### No endpoints showing?

**Check:**
1. `drf_spectacular` is in `INSTALLED_APPS`
2. `DEFAULT_SCHEMA_CLASS` is set to `drf_spectacular.openapi.AutoSchema`
3. Your API views are using DRF ViewSets or APIViews

### Permission denied errors?

**Check:**
1. User is a member of at least one team
2. Team has endpoint permissions configured (or user is Super Admin)
3. You're logged in

### Analytics not working?

**Check:**
1. `ANALYTICS_ENABLED` is `True`
2. Requests are made through the portal (not directly to API)

## 📚 Next Steps

- Read the [Full Documentation](https://github.com/firdavsDev/modern-drf-swagger#readme)
- Check out [Configuration Options](https://github.com/firdavsDev/modern-drf-swagger#configuration-reference)
- Explore the [sample_project](https://github.com/firdavsDev/modern-drf-swagger/tree/main/sample_project) for examples

## 💡 Need Help?

- [GitHub Issues](https://github.com/firdavsDev/modern-drf-swagger/issues)
- [GitHub Discussions](https://github.com/firdavsDev/modern-drf-swagger/discussions)

---

**Created by [DavronbekDev](https://davronbek.dev) • [GitHub](https://github.com/firdavsDev)**
