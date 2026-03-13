from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.mixins import LoginRequiredMixin
from django.db.models import Avg, Count, Q, Sum
from django.http import JsonResponse
from django.utils import timezone
from django.views.generic import TemplateView

try:
    from django.urls import reverse, reverse_lazy
except ImportError:
    from django.core.urlresolvers import reverse, reverse_lazy

from ..conf import get_package_version
from ..models import RequestLog, UsageMetric
from ..permissions.endpoint_permissions import EndpointPermissionChecker

User = get_user_model()


class AnalyticsView(LoginRequiredMixin, TemplateView):
    """
    Analytics dashboard showing API usage metrics.

    Returns JSON data for frontend visualization or renders template.
    """

    template_name = "modern_drf_swagger/analytics.html"
    login_url = reverse_lazy("modern_drf_swagger:login")

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        portal_settings = getattr(settings, "MODERN_DRF_SWAGGER", {})
        portal_name = portal_settings.get("TITLE", "API Portal")
        context["title"] = f"Analytics - {portal_name}"
        context["portal_name"] = portal_name
        context["portal_version"] = get_package_version()
        # Get API portal base URL for JavaScript
        context["portal_base_url"] = reverse("modern_drf_swagger:docs").rstrip("/")

        # Add permission checker for template
        permission_checker = EndpointPermissionChecker(self.request.user)
        context["can_send_request"] = permission_checker.can_send_request()
        context["can_view_analytics"] = permission_checker.can_view_analytics()
        context["can_view_history"] = permission_checker.can_view_history()
        context["user_role"] = permission_checker.get_user_role()

        return context

    def get(self, request, *args, **kwargs):
        # Check if user has permission to view analytics
        permission_checker = EndpointPermissionChecker(request.user)
        if not permission_checker.can_view_analytics():
            return JsonResponse(
                {"error": "Permission denied. Viewers cannot access analytics."},
                status=403,
            )

        # Get date range from query params (default to last 7 days)
        days = int(request.GET.get("days", 7))
        start_date = timezone.now().date() - timedelta(days=days)

        # Check if user can view all analytics or just their own
        can_view_all = permission_checker.can_view_all_analytics()

        # Base filter - if not admin/super_admin, filter by user
        base_request_filter = Q(timestamp__gte=start_date)
        base_metric_filter = Q(date__gte=start_date)

        if not can_view_all:
            # DEVELOPER can only see their own requests
            base_request_filter &= Q(user=request.user)
            # For metrics, we'll need to calculate from RequestLog instead
            # since UsageMetric is aggregated across all users

        # Top endpoints by request count
        if can_view_all:
            top_endpoints = (
                UsageMetric.objects.filter(base_metric_filter)
                .values("endpoint")
                .annotate(
                    total_requests=Sum("request_count"),
                    avg_latency=Avg("average_latency"),
                    total_errors=Sum("error_count"),
                )
                .order_by("-total_requests")[:10]
            )
        else:
            # For developers, calculate from their own requests
            top_endpoints = (
                RequestLog.objects.filter(base_request_filter)
                .values("endpoint")
                .annotate(
                    total_requests=Count("id"),
                    avg_latency=Avg("latency"),
                    total_errors=Count("id", filter=Q(response_status__gte=400)),
                )
                .order_by("-total_requests")[:10]
            )

        # Overall metrics
        total_requests = RequestLog.objects.filter(base_request_filter).count()

        error_count = RequestLog.objects.filter(
            base_request_filter, response_status__gte=400
        ).count()

        avg_latency = (
            RequestLog.objects.filter(base_request_filter).aggregate(Avg("latency"))[
                "latency__avg"
            ]
            or 0
        )

        # Error rate percentage
        error_rate = (error_count / total_requests * 100) if total_requests > 0 else 0

        # Requests by user - only show for admins
        if can_view_all:
            username_field = f"user__{User.USERNAME_FIELD}"
            requests_by_user = (
                RequestLog.objects.filter(base_request_filter, user__isnull=False)
                .values(username_field)
                .annotate(count=Count("id"))
                .order_by("-count")[:10]
            )
        else:
            # Developers see only their own stats, no user breakdown
            requests_by_user = []

        # Daily request counts for chart
        if can_view_all:
            daily_stats = (
                UsageMetric.objects.filter(base_metric_filter)
                .values("date")
                .annotate(
                    total_requests=Sum("request_count"), total_errors=Sum("error_count")
                )
                .order_by("date")
            )
        else:
            # For developers, calculate from their own requests
            daily_stats = (
                RequestLog.objects.filter(base_request_filter)
                .extra(select={"date": "DATE(timestamp)"})
                .values("date")
                .annotate(
                    total_requests=Count("id"),
                    total_errors=Count("id", filter=Q(response_status__gte=400)),
                )
                .order_by("date")
            )

        data = {
            "summary": {
                "total_requests": total_requests,
                "error_count": error_count,
                "error_rate": round(error_rate, 2),
                "avg_latency": round(avg_latency, 2),
            },
            "top_endpoints": list(top_endpoints),
            "requests_by_user": list(requests_by_user),
            "daily_stats": list(daily_stats),
            "date_range_days": days,
        }

        # Return JSON for AJAX requests
        if (
            request.headers.get("Accept") == "application/json"
            or request.GET.get("format") == "json"
        ):
            return JsonResponse(data)

        # Otherwise render template with context
        context = self.get_context_data()
        context["analytics_data"] = data
        return self.render_to_response(context)


class HistoryView(LoginRequiredMixin, TemplateView):
    """
    Request history view showing user's past API requests.

    Supports pagination, filtering, and returns JSON or HTML.
    """

    template_name = "modern_drf_swagger/history.html"
    login_url = reverse_lazy("modern_drf_swagger:login")

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        portal_settings = getattr(settings, "MODERN_DRF_SWAGGER", {})
        portal_name = portal_settings.get("TITLE", "API Portal")
        context["title"] = f"History - {portal_name}"
        context["portal_name"] = portal_name
        context["portal_version"] = get_package_version()
        # Get API portal base URL for JavaScript
        context["portal_base_url"] = reverse("modern_drf_swagger:docs").rstrip("/")

        # Add permission checker for template
        permission_checker = EndpointPermissionChecker(self.request.user)
        context["can_send_request"] = permission_checker.can_send_request()
        context["can_view_analytics"] = permission_checker.can_view_analytics()
        context["can_view_history"] = permission_checker.can_view_history()
        context["user_role"] = permission_checker.get_user_role()

        return context

    def get(self, request, *args, **kwargs):
        # Check if user has permission to view history
        permission_checker = EndpointPermissionChecker(request.user)
        if not permission_checker.can_view_history():
            return JsonResponse(
                {"error": "Permission denied. Viewers cannot access request history."},
                status=403,
            )

        # Get query parameters
        page = int(request.GET.get("page", 1))
        per_page = int(request.GET.get("per_page", 50))
        search = request.GET.get("search", "")

        # Base queryset - filter by user
        queryset = RequestLog.objects.filter(user=request.user)

        # Apply search filter
        if search:
            queryset = queryset.filter(
                Q(endpoint__icontains=search) | Q(method__icontains=search)
            )

        # Order by most recent first
        queryset = queryset.order_by("-timestamp")

        # Count total
        total_count = queryset.count()

        # Pagination
        start = (page - 1) * per_page
        end = start + per_page
        results = queryset[start:end]

        # Serialize results
        history_data = []
        for log in results:
            history_data.append(
                {
                    "id": log.id,
                    "endpoint": log.endpoint,
                    "method": log.method,
                    "request_payload": log.request_payload,
                    "response_status": log.response_status,
                    "response_size": log.response_size,
                    "latency": round(log.latency, 2),
                    "timestamp": log.timestamp.isoformat(),
                }
            )

        data = {
            "results": history_data,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total_count": total_count,
                "total_pages": (total_count + per_page - 1) // per_page,
                "has_next": end < total_count,
                "has_prev": page > 1,
            },
            "search": search,
        }

        # Return JSON for AJAX requests
        if (
            request.headers.get("Accept") == "application/json"
            or request.GET.get("format") == "json"
        ):
            return JsonResponse(data)

        # Otherwise render template with context
        context = self.get_context_data()
        context["history_data"] = data
        return self.render_to_response(context)
