"""
Signals for clearing permission cache when team memberships or endpoint permissions change.
"""

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from .models import EndpointPermission, TeamMember
from .permissions.endpoint_permissions import EndpointPermissionChecker


@receiver(post_save, sender=TeamMember)
def clear_cache_on_team_member_save(sender, instance, **kwargs):
    """Clear permission cache when a team member is added or updated"""
    if instance.user:
        EndpointPermissionChecker.clear_cache_for_user(instance.user)


@receiver(post_delete, sender=TeamMember)
def clear_cache_on_team_member_delete(sender, instance, **kwargs):
    """Clear permission cache when a team member is removed"""
    if instance.user:
        EndpointPermissionChecker.clear_cache_for_user(instance.user)


@receiver(post_save, sender=EndpointPermission)
def clear_cache_on_endpoint_permission_save(sender, instance, **kwargs):
    """Clear permission cache for all users in the team when endpoint permission changes"""
    if instance.team:
        # Clear cache for all members of the team
        team_members = TeamMember.objects.filter(team=instance.team).select_related(
            "user"
        )
        for member in team_members:
            if member.user:
                EndpointPermissionChecker.clear_cache_for_user(member.user)


@receiver(post_delete, sender=EndpointPermission)
def clear_cache_on_endpoint_permission_delete(sender, instance, **kwargs):
    """Clear permission cache for all users in the team when endpoint permission is deleted"""
    if instance.team:
        # Clear cache for all members of the team
        team_members = TeamMember.objects.filter(team=instance.team).select_related(
            "user"
        )
        for member in team_members:
            if member.user:
                EndpointPermissionChecker.clear_cache_for_user(member.user)
