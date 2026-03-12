# 🚀 Quick Start Guide - Modern DRF Swagger

Get up and running with Modern DRF Swagger in **5 minutes**!

## 📋 Prerequisites

- Python 3.8 or higher
- Django 3.2 or higher  
- Django REST Framework 3.12 or higher
- An existing Django project with DRF

**Important:** You do NOT need to manually install drf-spectacular - it's automatically installed as a dependency!

---

## 📦 Installation Methods

Choose one of the two installation methods below:

### Method 1: Install from PyPI (Recommended)

Best for production use and stable releases.

```bash
pip install modern-drf-swagger
```

This command automatically installs:
- ✅ `django>=3.2`
- ✅ `djangorestframework>=3.12`
- ✅ `drf-spectacular>=0.26` (automatically!)
- ✅ `requests>=2.25.0`

### Method 2: Install from Source (Development)

Best for contributing or testing the latest features.

```bash
# Clone the repository
git clone https://github.com/firdavsDev/modern-drf-swagger.git
cd modern-drf-swagger

# Install in editable mode
pip install -e .
```

---

## ⚙️ Configuration

### Step 1: Add to INSTALLED_APPS

**Only add `api_portal`** - no need to add `drf_spectacular`!

```python
# settings.py
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party (required)
    'rest_framework',
    
    # Modern DRF Swagger (this is all you need!)
    'api_portal',
    
    # Your apps
    'myapp',
]
```

**That's it!** API Portal automatically:
- ✅ Adds `drf_spectacular` to `INSTALLED_APPS`
- ✅ Configures `REST_FRAMEWORK['DEFAULT_SCHEMA_CLASS']`
- ✅ Sets up `SPECTACULAR_SETTINGS` based on `API_PORTAL` config

### Step 2: Configure API Portal (Optional but Recommended)

**All configuration is centralized in one dictionary:**

```python
# settings.py
API_PORTAL = {
    # Basic Info (automatically configures drf-spectacular)
    'TITLE': 'My Company API Portal',
    'DESCRIPTION': 'Complete API documentation for My Company',
    'VERSION': '1.0.0',
    
    # Feature Toggles
    'ANALYTICS_ENABLED': True,       # Track API usage
    'HISTORY_ENABLED': True,         # Save request history
    'MAX_HISTORY_PER_USER': 1000,   # Auto-cleanup old logs
    'ALLOW_ANONYMOUS': False,        # Require authentication
    
    # Schema Settings (controls drf-spectacular)
    'SCHEMA_PATH_PREFIX': r'/api/',  # Only show endpoints starting with /api/
    
    # UI Settings
    'ENDPOINTS_COLLAPSIBLE': True,         # Allow collapsing endpoint groups
    'ENDPOINTS_DEFAULT_COLLAPSED': False,  # Start with groups expanded
    
    # Filtering
    'EXCLUDE_PATHS': ['/admin/', '/internal/', '/health/'],  # Hide these paths
}
```

**💡 Advanced Users:** If you need more control over drf-spectacular, you can still set `SPECTACULAR_SETTINGS` manually. API Portal will merge your settings with its defaults.

### Step 3: Add URL Routes

Update your main `urls.py`:

```python
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Your API endpoints
    path('api/', include('myapp.urls')),
    
    # API Portal (add this line)
    path('portal/', include('api_portal.urls')),
]
```

### Step 4: Run Migrations

Create the database tables for teams, permissions, and analytics:

```bash
python manage.py migrate
```

You should see output like:
```
Running migrations:
  Applying api_portal.0001_initial... OK
```

### Step 5: Create Superuser (if needed)

```bash
python manage.py createsuperuser
```

Follow the prompts to create your admin account.

### Step 6: Collect Static Files (Production Only)

If you're deploying to production:

```bash
python manage.py collectstatic
```

For development, Django serves static files automatically with `DEBUG = True`.

---

## 🎯 Setup Teams & Permissions

### Step 7: Start the Server

```bash
python manage.py runserver
```

Your server should now be running at `http://localhost:8000`

### Step 8: Access Django Admin

Open your browser and go to:

```
http://localhost:8000/admin
```

Login with your superuser credentials.

### Step 9: Create a Team

1. In the left sidebar, go to **API Portal** → **Teams**
2. Click **Add Team** (top right)
3. Enter team details:
   - **Name**: `Frontend Team` (or any name)
4. Click **Save**

### Step 10: Add Team Members

1. Open the team you just created
2. Scroll down to the **Team Members** section
3. Click **Add another Team Member**
4. Select a user and assign a role:
   - **Super Admin**: Full access to all endpoints (bypasses permissions)
   - **Admin**: Can manage team and endpoint permissions
   - **Developer**: Can test and use endpoints
   - **Viewer**: Read-only access to documentation
5. Click **Save**

**Pro Tip:** Super Admin users can access ANY endpoint regardless of permissions!

### Step 11: Grant Endpoint Permissions (Optional)

By default, teams have NO access to endpoints. Grant specific permissions:

1. Go to **API Portal** → **Endpoint Permissions**
2. Click **Add Endpoint Permission**
3. Configure access:
   - **Team**: Select the team
   - **Path**: Enter endpoint path (e.g., `/api/users/`)
   - **Allowed Methods**: 
     - `GET,POST,PUT,DELETE` (comma-separated specific methods)
     - `*` (all methods)
4. Click **Save**

**Examples:**
- Path: `/api/users/`, Methods: `GET` → Team can only view users
- Path: `/api/tasks/`, Methods: `GET,POST,PUT,DELETE` → Full CRUD access
- Path: `/api/`, Methods: `*` → Access to all endpoints under `/api/`

**Note:** 
- Super Admin users bypass ALL permission checks
- Permissions are checked by path prefix match

---

## 🎨 Access the API Portal

### Step 12: Login to the Portal

Open your browser and visit:

```
http://localhost:8000/api/docs/
```

Login with your credentials (the user must be in a team).

---

## 🎉 You're All Set!

You should now see three main sections:

### 📋 API Explorer (`/api/docs/`)

**Browse and test your API endpoints:**

- **Left Panel**: Browse all endpoints grouped by tags
  - Click to expand/collapse groups
  - Search for specific endpoints
- **Center Panel**: Request editor
  - Fill in path parameters, query params, headers
  - Add request body (JSON)
  - Click "Send Request" button
- **Right Panel**: Response viewer
  - View status code, latency, response size
  - JSON syntax highlighting
  - Copy response to clipboard

**Features:**
- 🔖 Bookmarkable URLs (e.g., `#GET:/api/users/`)
- ⚡ Real HTTP requests with accurate latency
- 🎨 Dark theme with syntax highlighting
- 🔍 Search and filter endpoints

### 📊 Analytics Dashboard (`/api/docs/analytics/`)

**Track API usage and performance:**

- Total request count and error rate
- Average response latency
- Top 10 most-used endpoints
- Requests by user
- Daily request timeline chart
- Date range filters (7, 30, 90 days)

### 📝 Request History (`/api/docs/history/`)

**View your past API requests:**

- Complete request/response history
- Search by endpoint path
- Filter by date
- View detailed request/response data
- Pagination support (50 per page)
- Auto-cleanup when limit exceeded

---

## 🔧 Optional: Hide Endpoints from Portal

### Option 1: Using the Decorator

```python
from api_portal.conf import hide_from_portal
from rest_framework import viewsets

@hide_from_portal
class InternalAPIViewSet(viewsets.ModelViewSet):
    """This endpoint won't appear in the portal."""
    queryset = InternalModel.objects.all()
    serializer_class = InternalSerializer
```

### Option 2: Using Exclude Paths

```python
# settings.py
API_PORTAL = {
    'EXCLUDE_PATHS': [
        '/admin/',
        '/internal/',
        '/health/',
        '/debug/',
    ],
}
```

### Option 3: Using drf-spectacular

```python
from drf_spectacular.utils import extend_schema
from rest_framework import viewsets

class MyViewSet(viewsets.ModelViewSet):
    @extend_schema(exclude=True)
    def list(self, request):
        # This specific action is hidden
        pass
```

---

## 🐛 Troubleshooting

### Issue: "No endpoints found"

**Solution:**
1. Verify `rest_framework` is in `INSTALLED_APPS`
2. Check that your API ViewSets are properly registered
3. Ensure `SCHEMA_PATH_PREFIX` matches your URL structure
4. Try visiting `/api/schema/` to see if the schema generates

### Issue: "Permission denied" when accessing portal

**Solution:**
1. Ensure the user is added to a team
2. Grant endpoint permissions to the team
3. Or assign the user a "Super Admin" role for full access

### Issue: "drf-spectacular not configured"

**Solution:**
This shouldn't happen with api_portal, but if it does:
```python
# Manually set REST_FRAMEWORK
REST_FRAMEWORK = {
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}
```

### Issue: Static files not loading

**Solution:**
```bash
# Development
python manage.py collectstatic --noinput

# Check DEBUG setting
DEBUG = True  # Required for development
```

---

## 📚 Next Steps

- **[View Configuration Reference](README.md#configuration-reference)** - All available settings
- **[Read Changelog](CHANGELOG.md)** - Latest updates and features
- **[Report Issues](https://github.com/firdavsDev/modern-drf-swagger/issues)** - Found a bug?
- **[Star on GitHub](https://github.com/firdavsDev/modern-drf-swagger)** - Support the project! ⭐

---

## 💡 Pro Tips

1. **Use Super Admin role** during development to access all endpoints without configuring permissions.

2. **Path prefix matching**: Permissions like `/api/` will match ALL endpoints starting with `/api/`.

3. **Request history auto-cleanup**: Set `MAX_HISTORY_PER_USER` to a reasonable number (100-1000) to prevent database bloat.

4. **Bookmarkable endpoints**: Share direct links like `http://localhost:8000/portal/#GET:/api/users/` with your team.

5. **Analytics for debugging**: Use the analytics dashboard to identify slow endpoints and high error rates.

---

**Need help?** Open an issue on [GitHub](https://github.com/firdavsDev/modern-drf-swagger/issues) or email [davronbekboltyev777@gmail.com](mailto:davronbekboltyev777@gmail.com)

**Created by [DavronbekDev](https://davronbek.dev)** • Licensed under MIT
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
