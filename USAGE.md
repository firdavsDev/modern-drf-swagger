# Usage

### Team Management (Admin Panel)

1. **Create Teams**: Go to Admin → Teams → Add Team
2. **Add Members**: In team detail, add users with roles:
   - **Super Admin**: Access to all endpoints
   - **Admin**: Manage team permissions
   - **Developer**: Test endpoints
   - **Viewer**: Read-only access
3. **Grant Permissions**: Add Endpoint Permissions:
   - Path: `/api/users/`
   - Methods: `GET,POST` or `*` for all

### API Explorer

The main interface (`/api/docs/`) provides:

- **Endpoint List** (left panel): Browse all available endpoints grouped by tags
- **Request Editor** (center): Configure parameters, body, headers
- **Response Viewer** (right): View responses with syntax highlighting

**Features:**
- Click any endpoint to load request form
- Fill in parameters and body (JSON)
- Click "Send Request" to execute
- View response with status, latency, and size
- Copy response to clipboard

### Analytics Dashboard

Access at `/api/docs/analytics/`:

- Total requests and error counts
- Error rate percentage
- Average latency
- Top 10 endpoints by usage
- Requests by user
- Daily request timeline chart

**Date Range**: Select 7, 30, or 90 days

### Request History

Access at `/api/docs/history/`:

- View all your past API requests
- Search by endpoint path
- Click "View" to see full request/response details
- Pagination support (50 per page)
