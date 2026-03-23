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
- Switch between JSON, multipart form-data, URL-encoded, and raw request bodies when the schema exposes multiple media types
- Click "Send Request" to execute
- View response with status, latency, and size
- Copy response to clipboard

Permission filtering is schema-aware: if a team only has access to selected methods for a path, the docs view only shows those allowed operations.

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

### Custom Request and Response Examples

If a view does not use `serializer_class`, document the method with `@extend_schema` and `inline_serializer` so the package can still render request and response schemas.

Use `responses={200: OpenApiResponse(...), 500: OpenApiResponse(...)}` plus `OpenApiExample(...)` values for the example payloads shown in the UI.

### Code Generation Toggle

Set `MODERN_DRF_SWAGGER['CODE_GENERATE_ENABLE'] = False` if you want to hide the code generation panel and reject `/generate-code/` requests at the backend.
