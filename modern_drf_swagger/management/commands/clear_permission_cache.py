"""
Management command to clear permission cache for Modern DRF Swagger.
"""

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from modern_drf_swagger.models import TeamMember
from modern_drf_swagger.permissions.endpoint_permissions import (
    EndpointPermissionChecker,
)

User = get_user_model()


class Command(BaseCommand):
    help = "Clear permission cache for Modern DRF Swagger"

    def add_arguments(self, parser):
        parser.add_argument(
            "--user",
            type=str,
            help="Clear cache for a specific user (username)",
        )
        parser.add_argument(
            "--all",
            action="store_true",
            help="Clear cache for all users who are team members",
        )

    def handle(self, *args, **options):
        user_username = options.get("user")
        clear_all = options.get("all")

        if user_username:
            # Clear cache for specific user
            try:
                user = User.objects.get(**{User.USERNAME_FIELD: user_username})
                EndpointPermissionChecker.clear_cache_for_user(user)
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Successfully cleared cache for user: {user_username}"
                    )
                )
            except User.DoesNotExist:
                self.stdout.write(self.style.ERROR(f"User not found: {user_username}"))
        elif clear_all:
            # Clear cache for all team members
            count = 0
            team_members = TeamMember.objects.select_related("user").all()
            for member in team_members:
                if member.user:
                    EndpointPermissionChecker.clear_cache_for_user(member.user)
                    count += 1

            self.stdout.write(
                self.style.SUCCESS(f"Successfully cleared cache for {count} user(s)")
            )
        else:
            self.stdout.write(
                self.style.WARNING("Please specify --user <username> or --all")
            )
