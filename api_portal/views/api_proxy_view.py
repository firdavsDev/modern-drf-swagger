from django.conf import settings
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from ..permissions.endpoint_permissions import EndpointPermissionChecker
from ..services.analytics_service import AnalyticsService
from ..services.request_executor import RequestExecutor


@method_decorator(csrf_exempt, name="dispatch")
@extend_schema(exclude=True)
class APIProxyView(APIView):
    """
    API proxy view - executes API requests and logs analytics.

    Checks permissions before proxying requests.
    """

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
        """
        payload = request.data
        method = payload.get("method", "GET")
        path = payload.get("path", "/")
        data = payload.get("data", None)
        params = payload.get("params", None)

        # Check permissions
        permission_checker = EndpointPermissionChecker(request.user)
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
        result = executor.execute(method, path, data, params)

        # Log analytics
        portal_settings = getattr(settings, "API_PORTAL", {})
        if portal_settings.get("ANALYTICS_ENABLED", True):
            AnalyticsService.log_request(
                user=request.user,
                endpoint=path,
                method=method,
                payload=data,
                status=result["status"],
                size=result.get("size", 0),
                latency=result.get("latency", 0.0),
            )

        return JsonResponse(
            result, status=200
        )  # Proxy always returns 200 with result payload
