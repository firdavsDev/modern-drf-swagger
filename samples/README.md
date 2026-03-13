# Modern DRF Swagger - Sample Project

A demonstration Django project showcasing the **Modern DRF Swagger** API documentation portal with a complete Task Management API.

## 📋 Overview

This sample project provides a fully functional Django REST Framework application with:

- **Task Management API** - CRUD operations for managing tasks
- **User Management API** - User endpoints for testing
- **Modern API Portal** - Interactive API documentation and testing interface
- **Team-based Access Control** - Demonstration of endpoint permissions
- **Request Analytics** - API usage tracking and metrics
- **Request History** - Historical record of API calls

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- pip
- Virtual environment (recommended)

### Installation

1. **Navigate to the samples directory:**
   ```bash
   cd samples
   ```

2. **Install dependencies:**
   
   **Option A:** Install from requirements.txt (recommended for quick start):
   ```bash
   pip install -r requirements.txt
   pip install -e ..  # Install modern-drf-swagger in development mode
   ```
   
   **Option B:** Install parent package only (if already done):
   ```bash
   pip install -e ..
   ```

3. **Run database migrations:**
   ```bash
   python manage.py migrate
   ```

4. **Create test data** (optional but recommended):
   ```bash
   python setup_test_data.py
   ```
   
   This creates:
   - Admin user: `admin` / `admin123`
   - Development team with full access
   - Sample tasks for testing
   - Endpoint permissions configuration

5. **Create a superuser** (if not using test data):
   ```bash
   python manage.py createsuperuser
   ```

6. **Start the development server:**
   ```bash
   python manage.py runserver
   ```

## 🌐 Access Points

Once the server is running, access:

| URL | Description |
|-----|-------------|
| http://localhost:8000/swagger/docs/ | **API Portal** - Interactive API documentation |
| http://localhost:8000/swagger/docs/analytics/ | **Analytics Dashboard** - API usage metrics |
| http://localhost:8000/swagger/docs/history/ | **Request History** - View past API requests |
| http://localhost:8000/admin/ | **Django Admin** - Database management |
| http://localhost:8000/api/v1/ | **API Base URL** - Direct API access |

## 🔐 Authentication

### Default Credentials

**Admin User** (created by setup_test_data.py):
- Username: `admin`
- Password: `admin123`

**Or create your own:**
```bash
python manage.py createsuperuser
```

### API Authentication Methods

The API supports multiple authentication methods:

1. **Session Authentication** - Automatic when logged into portal
2. **Basic Authentication** - Username/password in headers
3. **Token Authentication** - Bearer token in Authorization header

**Example API call with Basic Auth:**
```bash
curl -X GET http://localhost:8000/api/v1/tasks/ \
  -H "Authorization: Basic YWRtaW46YWRtaW4xMjM="
```

## 📡 API Endpoints

### Task Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/tasks/` | List all tasks |
| POST | `/api/v1/tasks/` | Create a new task |
| GET | `/api/v1/tasks/{id}/` | Retrieve a specific task |
| PUT | `/api/v1/tasks/{id}/` | Update a task |
| PATCH | `/api/v1/tasks/{id}/` | Partial update |
| DELETE | `/api/v1/tasks/{id}/` | Delete a task |
| GET | `/api/v1/tasks/my_tasks/` | Get current user's tasks |
| GET | `/api/v1/tasks/todo/` | Get all TODO tasks |
| POST | `/api/v1/tasks/{id}/complete/` | Mark task as complete |

### User Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users/` | List all users |
| POST | `/api/v1/users/` | Create a new user |
| GET | `/api/v1/users/{id}/` | Retrieve a user |
| PUT | `/api/v1/users/{id}/` | Update a user |
| DELETE | `/api/v1/users/{id}/` | Delete a user |

### Features

- **Filtering**: Search tasks by title and description
- **Ordering**: Sort by created_at, due_date, or status
- **Pagination**: Automatically paginated responses
- **Permissions**: Read-only for anonymous, full access for authenticated

## 🏗️ Project Structure

```
samples/
├── manage.py              # Django management script
├── setup_test_data.py     # Test data creation script
├── db.sqlite3             # SQLite database (created after migrate)
├── config/                # Project configuration
│   ├── settings.py        # Django settings
│   ├── urls.py            # URL routing
│   └── wsgi.py            # WSGI configuration
└── api/                   # Sample API application
    ├── models.py          # Task model
    ├── serializers.py     # DRF serializers
    ├── views.py           # API viewsets
    ├── urls.py            # API routing
    └── admin.py           # Admin configuration
```

## ⚙️ Configuration

Portal settings are configured in `config/settings.py`:

```python
MODERN_DRF_SWAGGER = {
    "TITLE": "API Swagger",
    "DESCRIPTION": "Complete API documentation for My Company",
      "VERSION": "1.0.7",
    "ANALYTICS_ENABLED": True,
    "HISTORY_ENABLED": True,
    "MAX_HISTORY_PER_USER": 100,
    "ALLOW_ANONYMOUS": False,
    "SCHEMA_PATH_PREFIX": r"/api/v1/",
    "ENDPOINTS_COLLAPSIBLE": True,
    "ENDPOINTS_DEFAULT_COLLAPSED": False,
    "EXCLUDE_PATHS": ["/admin/", "/internal/", "/health/"],
}
```

### Configuration Options

- **TITLE**: Portal title displayed in the interface
- **DESCRIPTION**: Portal description/subtitle
- **VERSION**: API version displayed in docs
- **ANALYTICS_ENABLED**: Track API usage metrics
- **HISTORY_ENABLED**: Save request history
- **MAX_HISTORY_PER_USER**: Limit stored requests per user
- **ALLOW_ANONYMOUS**: Allow unauthenticated portal access
- **SCHEMA_PATH_PREFIX**: Filter endpoints by path prefix
- **EXCLUDE_PATHS**: Hide specific paths from documentation

## 🧪 Testing the Portal

### 1. Explore the API

1. Navigate to http://localhost:8000/swagger/docs/
2. Browse available endpoints in the left sidebar
3. Click on an endpoint to see details

### 2. Make API Requests

1. Select an endpoint (e.g., `GET /api/v1/tasks/`)
2. Click "Try it out"
3. Fill in any required parameters
4. Click "Execute"
5. View the response (status, headers, body)

### 3. View Analytics

1. Navigate to http://localhost:8000/swagger/docs/analytics/
2. See metrics:
   - Total requests
   - Success/error rates
   - Most used endpoints
   - Response time trends
   - Requests by endpoint charts

### 4. Check Request History

1. Navigate to http://localhost:8000/swagger/docs/history/
2. View all your past API requests
3. Filter by endpoint, method, or status code
4. Click on a request to see full details

## 🔧 Development Tips

### Adding New Endpoints

1. **Define model** in `api/models.py`
2. **Create serializer** in `api/serializers.py`
3. **Create viewset** in `api/views.py`
4. **Register route** in `api/urls.py`
5. **Run migrations** if model changed
6. **Refresh portal** - new endpoint appears automatically!

### Hiding Endpoints from Portal

Use the `@hide_from_portal` decorator:

```python
from modern_drf_swagger.conf import hide_from_portal

@hide_from_portal
class InternalAPIViewSet(viewsets.ModelViewSet):
    # This won't appear in the portal
    pass
```

### Custom Management Commands

```bash
# Clear permission cache
python manage.py clear_permission_cache

# List all permissions
python manage.py list_permissions
```

## 📊 Database Management

### Django Admin

Access at http://localhost:8000/admin/ to manage:
- Users and permissions
- Tasks and task data
- Teams and team members
- Endpoint permissions
- Request logs and metrics

### Resetting the Database

```bash
# Delete database
rm db.sqlite3

# Recreate and populate
python manage.py migrate
python setup_test_data.py
```

## 🐛 Troubleshooting

### Portal Not Loading

**Check:**
- Server is running on port 8000
- You're logged in (if ALLOW_ANONYMOUS is False)
- URL is correct: `/swagger/docs/` (note the trailing slash)

### No Endpoints Showing

**Check:**
- `SCHEMA_PATH_PREFIX` matches your API URLs
- Endpoints are not decorated with `@hide_from_portal`
- Run migrations: `python manage.py migrate`

### Permission Denied

**Check:**
- You're logged in
- User has appropriate team membership
- Endpoint permissions are configured correctly

### Analytics Not Working

**Check:**
- `ANALYTICS_ENABLED = True` in settings
- Database migrations are run
- RequestLog model is accessible

## 📝 Example API Requests

### Using curl

**Create a task:**
```bash
curl -X POST http://localhost:8000/api/v1/tasks/ \
  -H "Content-Type: application/json" \
  -u admin:admin123 \
  -d '{
    "title": "Test Task",
    "description": "Created via API",
    "status": "todo",
    "due_date": "2026-12-31"
  }'
```

**Get all tasks:**
```bash
curl -X GET http://localhost:8000/api/v1/tasks/ \
  -u admin:admin123
```

**Complete a task:**
```bash
curl -X POST http://localhost:8000/api/v1/tasks/1/complete/ \
  -u admin:admin123
```

### Using Python requests

```python
import requests

# Authenticate
auth = ('admin', 'admin123')

# Create task
response = requests.post(
    'http://localhost:8000/api/v1/tasks/',
    auth=auth,
    json={
        'title': 'Python API Task',
        'description': 'Created via Python',
        'status': 'todo'
    }
)
print(response.json())

# Get tasks
response = requests.get(
    'http://localhost:8000/api/v1/tasks/',
    auth=auth
)
print(response.json())
```

## 🎯 Next Steps

1. **Explore the Portal** - Try all features hands-on
2. **Read Parent README** - Learn about package installation
3. **Check QUICKSTART.md** - Integration guide for your projects
4. **View Source Code** - See implementation details
5. **Customize Settings** - Adapt to your needs

## 📚 Additional Resources

- [Main Project README](../README.md)
- [Quick Start Guide](../QUICKSTART.md)
- [Auto-Configuration Guide](../docs/AUTO_CONFIGURATION_GUIDE.md)
- [Django REST Framework Docs](https://www.django-rest-framework.org/)

## 💡 Support

Found an issue? Have a suggestion?
- [Report Issues](https://github.com/firdavsDev/modern-drf-swagger/issues)
- [Star on GitHub](https://github.com/firdavsDev/modern-drf-swagger)

---

**Happy API Testing! 🚀**
