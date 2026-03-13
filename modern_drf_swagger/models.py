from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class Team(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Team")
        verbose_name_plural = _("Teams")
        ordering = ["name"]

    def __str__(self):
        return self.name


class UserRole(models.TextChoices):
    SUPER_ADMIN = "SUPER_ADMIN", _("Super Admin")
    ADMIN = "ADMIN", _("Admin")
    DEVELOPER = "DEVELOPER", _("Developer")
    VIEWER = "VIEWER", _("Viewer")


class TeamMember(models.Model):
    team = models.ForeignKey(Team, related_name="members", on_delete=models.CASCADE)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="modern_drf_swagger_teams",
        on_delete=models.CASCADE,
    )
    role = models.CharField(
        max_length=20, choices=UserRole.choices, default=UserRole.DEVELOPER
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("team", "user")
        verbose_name = _("Team Member")
        verbose_name_plural = _("Team Members")

    def __str__(self):
        return f"{self.user} - {self.team.name} ({self.get_role_display()})"


class EndpointPermission(models.Model):
    team = models.ForeignKey(
        Team, related_name="endpoint_permissions", on_delete=models.CASCADE
    )
    path = models.CharField(
        max_length=255, help_text=_("The endpoint path (e.g. /api/users/)")
    )
    methods = models.CharField(
        max_length=255,
        help_text=_("Comma separated methods (e.g. GET,POST) or * for all"),
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("Endpoint Permission")
        verbose_name_plural = _("Endpoint Permissions")

    def __str__(self):
        return f"{self.team.name} -> {self.methods} {self.path}"


class RequestLog(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="modern_drf_swagger_requests",
    )
    endpoint = models.CharField(max_length=512)
    method = models.CharField(max_length=10)
    request_payload = models.TextField(blank=True, null=True)
    response_status = models.IntegerField()
    response_size = models.IntegerField(
        default=0, help_text=_("Response size in bytes")
    )
    latency = models.FloatField(help_text=_("Latency in milliseconds"))
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("Request Log")
        verbose_name_plural = _("Request Logs")
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["endpoint"]),
            models.Index(fields=["user"]),
            models.Index(fields=["timestamp"]),
        ]

    def __str__(self):
        return (
            f"{self.method} {self.endpoint} [{self.response_status}] - {self.timestamp}"
        )


class UsageMetric(models.Model):
    endpoint = models.CharField(max_length=512)
    date = models.DateField()
    request_count = models.IntegerField(default=0)
    error_count = models.IntegerField(default=0)
    average_latency = models.FloatField(default=0.0)

    class Meta:
        unique_together = ("endpoint", "date")
        verbose_name = _("Usage Metric")
        verbose_name_plural = _("Usage Metrics")
        indexes = [
            models.Index(fields=["date"]),
        ]

    def __str__(self):
        return f"{self.endpoint} on {self.date}"
