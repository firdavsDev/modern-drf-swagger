import json

from django.conf import settings
from django.http import JsonResponse

from drf_spectacular.utils import extend_schema
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from ..permissions.endpoint_permissions import EndpointPermissionChecker
from ..services.analytics_service import AnalyticsService
from ..services.request_executor import RequestExecutor


@extend_schema(exclude=True)
class APIProxyView(APIView):
    """
    API proxy view - executes API requests and logs analytics.

    Checks permissions before proxying requests.
    """

    # Always use Django session auth for portal actions to avoid triggering
    # browser native Basic auth prompts when project defaults use BasicAuthentication.
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        """
        Expects a JSON payload like:
        {
            "method": "GET",
            "path": "/api/users/",
            "data": {},
            "params": {}
        }

        OR multipart form data with files
        """

        def _parse_json_field(value, default):
            if value in (None, ""):
                return default
            if isinstance(value, str):
                try:
                    return json.loads(value)
                except json.JSONDecodeError:
                    return default
            return value

        content_type = request.content_type or ""
        is_multipart_proxy_request = content_type.startswith("multipart/form-data")

        if is_multipart_proxy_request:
            method = request.POST.get("method", "POST")
            path = request.POST.get("path", "/")
            params = _parse_json_field(request.POST.get("params", {}), {})

            form_data = {}
            for key in request.POST:
                if key not in [
                    "method",
                    "path",
                    "params",
                    "_headers",
                    "_cookies",
                    "_content_type",
                ]:
                    form_data[key] = request.POST[key]

            files = {}
            for key in request.FILES:
                files[key] = request.FILES[key]
        else:
            # Handle JSON payload
            payload = request.data
            method = payload.get("method", "GET")
            path = payload.get("path", "/")
            form_data = payload.get("data", None)
            params = payload.get("params", None)
            files = None

        # Check permissions
        permission_checker = EndpointPermissionChecker(request.user)

        # First check if user can send requests (not VIEWER role)
        if not permission_checker.can_send_request():
            return JsonResponse(
                {
                    "status": 403,
                    "headers": {},
                    "data": {
                        "error": "Permission denied. Viewers cannot send API requests. You need DEVELOPER role or higher."
                    },
                    "latency": 0,
                    "size": 0,
                },
                status=200,
            )  # Proxy returns 200 but with 403 in the data

        # Then check if user has access to this specific endpoint
        if not permission_checker.check_access(path, method):
            return JsonResponse(
                {
                    "status": 403,
                    "headers": {},
                    "data": {
                        "error": "Permission denied. You do not have access to this endpoint."
                    },
                    "latency": 0,
                    "size": 0,
                },
                status=200,
            )  # Proxy returns 200 but with 403 in the data

        # Execute the request
        executor = RequestExecutor(request)
        result = executor.execute(method, path, form_data, params, files=files)

        # Log analytics
        portal_settings = getattr(settings, "MODERN_DRF_SWAGGER", {})
        if portal_settings.get("ANALYTICS_ENABLED", True):
            AnalyticsService.log_request(
                user=request.user,
                endpoint=path,
                method=method,
                payload=form_data,
                status=result["status"],
                size=result.get("size", 0),
                latency=result.get("latency", 0.0),
            )

        return JsonResponse(
            result, status=200
        )  # Proxy always returns 200 with result payload
