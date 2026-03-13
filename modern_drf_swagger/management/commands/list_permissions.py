"""
Management command to list all endpoint permissions for Modern DRF Swagger.
"""

from django.core.management.base import BaseCommand
from django.db.models import Count

from modern_drf_swagger.models import EndpointPermission, Team, TeamMember


class Command(BaseCommand):
    help = "List all endpoint permissions for Modern DRF Swagger"

    def _get_user_identifier(self, user):
        username_field = getattr(user, "USERNAME_FIELD", "username")
        return getattr(user, username_field, str(user))

    def add_arguments(self, parser):
        parser.add_argument(
            "--team",
            type=str,
            help="Filter by team name",
        )

    def handle(self, *args, **options):
        team_name = options.get("team")

        # Get queryset
        queryset = EndpointPermission.objects.select_related("team").all()

        if team_name:
            queryset = queryset.filter(team__name__icontains=team_name)

        # Group by team
        teams = (
            Team.objects.filter(endpoint_permissions__in=queryset)
            .distinct()
            .annotate(perm_count=Count("endpoint_permissions"))
        )

        if not teams:
            self.stdout.write(self.style.WARNING("No endpoint permissions found."))
            return

        for team in teams:
            self.stdout.write(
                self.style.SUCCESS(
                    f"\n📁 Team: {team.name} ({team.perm_count} permissions)"
                )
            )

            # List members
            members = TeamMember.objects.filter(team=team).select_related("user")
            if members:
                self.stdout.write("   👥 Members:")
                for member in members:
                    self.stdout.write(
                        f"      - {self._get_user_identifier(member.user)} ({member.get_role_display()})"
                    )

            # List permissions
            perms = queryset.filter(team=team).order_by("path")
            self.stdout.write("   🔐 Permissions:")
            for perm in perms:
                self.stdout.write(f"      ID {perm.id}: {perm.methods:8s} {perm.path}")

        self.stdout.write(
            self.style.SUCCESS(f"\n✓ Total: {queryset.count()} endpoint permissions")
        )
