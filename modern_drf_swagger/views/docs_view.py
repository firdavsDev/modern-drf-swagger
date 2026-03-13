import json

from django.conf import settings
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import JsonResponse
from django.views.generic import TemplateView

from rest_framework.request import Request

try:
    from django.urls import reverse, reverse_lazy
except ImportError:
    from django.core.urlresolvers import reverse, reverse_lazy

from ..conf import get_package_version
from ..permissions.endpoint_permissions import EndpointPermissionChecker
from ..services.schema_loader import PortalSchemaLoader


class DocsView(LoginRequiredMixin, TemplateView):
    """Modern DRF Swagger documentation explorer view"""

    template_name = "modern_drf_swagger/docs.html"
    login_url = reverse_lazy("modern_drf_swagger:login")

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        portal_settings = getattr(settings, "MODERN_DRF_SWAGGER", {})
        portal_name = portal_settings.get("TITLE", "Modern DRF Swagger")
        context["title"] = portal_name
        context["portal_name"] = portal_name
        context["portal_version"] = get_package_version()
        context["user"] = self.request.user

        # Pass endpoint collapse settings to template
        context["endpoints_collapsible"] = portal_settings.get(
            "ENDPOINTS_COLLAPSIBLE", True
        )
        context["endpoints_default_collapsed"] = portal_settings.get(
            "ENDPOINTS_DEFAULT_COLLAPSED", False
        )

        # Get Modern DRF Swagger base URL for JavaScript
        # This allows the portal to work at any URL prefix
        context["portal_base_url"] = reverse("modern_drf_swagger:docs").rstrip("/")

        # Add permission checker for template
        permission_checker = EndpointPermissionChecker(self.request.user)
        context["can_send_request"] = permission_checker.can_send_request()
        context["can_view_analytics"] = permission_checker.can_view_analytics()
        context["can_view_history"] = permission_checker.can_view_history()
        context["user_role"] = permission_checker.get_user_role()

        # Get authentication schemes from OpenAPI schema
        schema_loader = PortalSchemaLoader()
        drf_request = Request(self.request)
        auth_schemes = schema_loader.get_authentication_schemes(drf_request)
        context["auth_schemes"] = json.dumps(auth_schemes)

        return context


class SchemaView(LoginRequiredMixin, TemplateView):
    """OpenAPI schema view with permission filtering"""

    login_url = reverse_lazy("modern_drf_swagger:login")

    def get(self, request, *args, **kwargs):
        # Convert Django request to DRF Request for schema generation
        drf_request = Request(request)

        loader = PortalSchemaLoader()
        schema = loader.get_schema(drf_request)

        # Filter schema based on user permissions
        if request.user and request.user.is_authenticated:
            permission_checker = EndpointPermissionChecker(request.user)
            allowed_endpoints = permission_checker.get_allowed_endpoints()

            # If not None (meaning not superuser/super admin), filter the schema
            if allowed_endpoints is not None:
                filtered_paths = {}
                allowed_paths = {ep["path"] for ep in allowed_endpoints}

                for path, path_item in schema.get("paths", {}).items():
                    if path in allowed_paths:
                        # Further filter by methods
                        allowed_methods_for_path = next(
                            (
                                ep["methods"]
                                for ep in allowed_endpoints
                                if ep["path"] == path
                            ),
                            "*",
                        )

                        if allowed_methods_for_path == "*":
                            filtered_paths[path] = path_item
                        else:
                            # Filter specific methods
                            allowed_methods = [
                                m.strip().upper()
                                for m in allowed_methods_for_path.split(",")
                            ]
                            filtered_path_item = {}
                            for method in [
                                "get",
                                "post",
                                "put",
                                "patch",
                                "delete",
                                "options",
                                "head",
                            ]:
                                if (
                                    method.upper() in allowed_methods
                                    and method in path_item
                                ):
                                    filtered_path_item[method] = path_item[method]

                            if filtered_path_item:
                                filtered_paths[path] = filtered_path_item

                schema["paths"] = filtered_paths

        return JsonResponse(schema)
