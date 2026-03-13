from django.conf import settings
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import JsonResponse
from django.views.generic import TemplateView
from rest_framework.request import Request

from ..conf import get_package_version
from ..permissions.endpoint_permissions import EndpointPermissionChecker
from ..services.schema_loader import PortalSchemaLoader


class DocsView(LoginRequiredMixin, TemplateView):
    """API documentation explorer view"""

    template_name = "api_portal/docs.html"
    login_url = "/portal/login/"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        portal_settings = getattr(settings, "API_PORTAL", {})
        portal_name = portal_settings.get("TITLE", "API Portal")
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

        return context


class SchemaView(LoginRequiredMixin, TemplateView):
    """OpenAPI schema view with permission filtering"""

    login_url = "/portal/login/"

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
