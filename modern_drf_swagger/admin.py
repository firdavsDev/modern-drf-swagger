from django.contrib import admin
from django.contrib.auth import get_user_model

from .models import EndpointPermission, RequestLog, Team, TeamMember, UsageMetric
from .permissions.endpoint_permissions import EndpointPermissionChecker

User = get_user_model()


def clear_permission_cache(modeladmin, request, queryset):
    """Admin action to clear permission cache for selected team members"""
    count = 0
    for member in queryset:
        if member.user:
            EndpointPermissionChecker.clear_cache_for_user(member.user)
            count += 1

    modeladmin.message_user(
        request, f"Successfully cleared permission cache for {count} user(s)."
    )


clear_permission_cache.short_description = "Clear permission cache for selected members"


class TeamMemberInline(admin.TabularInline):
    model = TeamMember
    extra = 1


class EndpointPermissionInline(admin.TabularInline):
    model = EndpointPermission
    extra = 1


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ("name", "created_at")
    search_fields = ("name",)
    inlines = [TeamMemberInline, EndpointPermissionInline]


@admin.register(RequestLog)
class RequestLogAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "method",
        "endpoint",
        "response_status",
        "latency",
        "timestamp",
    )
    list_filter = ("method", "response_status", "timestamp")
    date_hierarchy = "timestamp"

    def get_search_fields(self, request):
        # Use dynamic USERNAME_FIELD for search
        username_field = f"user__{User.USERNAME_FIELD}"
        return ("endpoint", username_field, "request_payload")

    readonly_fields = (
        "user",
        "endpoint",
        "method",
        "request_payload",
        "response_status",
        "response_size",
        "latency",
        "timestamp",
    )


@admin.register(UsageMetric)
class UsageMetricAdmin(admin.ModelAdmin):
    list_display = (
        "endpoint",
        "date",
        "request_count",
        "error_count",
        "average_latency",
    )
    list_filter = ("date",)
    search_fields = ("endpoint",)
    readonly_fields = (
        "endpoint",
        "date",
        "request_count",
        "error_count",
        "average_latency",
    )
    date_hierarchy = "date"


@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ("user", "team", "role", "created_at")
    list_filter = ("role", "team")
    search_fields = ("user__username", "user__email", "team__name")
    actions = [clear_permission_cache]
    date_hierarchy = "created_at"

    def save_model(self, request, obj, form, change):
        """Clear cache when saving a team member"""
        super().save_model(request, obj, form, change)
        if obj.user:
            EndpointPermissionChecker.clear_cache_for_user(obj.user)

    def delete_model(self, request, obj):
        """Clear cache when deleting a team member"""
        user = obj.user
        super().delete_model(request, obj)
        if user:
            EndpointPermissionChecker.clear_cache_for_user(user)


@admin.register(EndpointPermission)
class EndpointPermissionAdmin(admin.ModelAdmin):
    list_display = ("team", "path", "methods", "created_at")
    list_filter = ("team",)
    search_fields = ("path", "methods", "team__name")
    date_hierarchy = "created_at"

    def save_model(self, request, obj, form, change):
        """Clear cache for all team members when saving endpoint permission"""
        super().save_model(request, obj, form, change)
        if obj.team:
            team_members = TeamMember.objects.filter(team=obj.team).select_related(
                "user"
            )
            for member in team_members:
                if member.user:
                    EndpointPermissionChecker.clear_cache_for_user(member.user)

    def delete_model(self, request, obj):
        """Clear cache for all team members when deleting endpoint permission"""
        team = obj.team
        super().delete_model(request, obj)
        if team:
            team_members = TeamMember.objects.filter(team=team).select_related("user")
            for member in team_members:
                if member.user:
                    EndpointPermissionChecker.clear_cache_for_user(member.user)
