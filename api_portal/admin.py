from django.contrib import admin
from .models import Team, TeamMember, EndpointPermission, RequestLog, UsageMetric

class TeamMemberInline(admin.TabularInline):
    model = TeamMember
    extra = 1

class EndpointPermissionInline(admin.TabularInline):
    model = EndpointPermission
    extra = 1

@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name',)
    inlines = [TeamMemberInline, EndpointPermissionInline]

@admin.register(RequestLog)
class RequestLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'method', 'endpoint', 'response_status', 'latency', 'timestamp')
    list_filter = ('method', 'response_status', 'timestamp')
    search_fields = ('endpoint', 'user__username', 'request_payload')
    readonly_fields = ('user', 'endpoint', 'method', 'request_payload', 'response_status', 'response_size', 'latency', 'timestamp')

@admin.register(UsageMetric)
class UsageMetricAdmin(admin.ModelAdmin):
    list_display = ('endpoint', 'date', 'request_count', 'error_count', 'average_latency')
    list_filter = ('date',)
    search_fields = ('endpoint',)
    readonly_fields = ('endpoint', 'date', 'request_count', 'error_count', 'average_latency')
