#!/usr/bin/env python

"""
Setup script to create test data for the API Portal
"""
import os

import django

# Setup Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model

from modern_drf_swagger.models import EndpointPermission, Team, TeamMember

User = get_user_model()
from api.models import Task


def setup_test_data():
    """Create test data for the portal"""
    print("Setting up test data...")

    # Get or create admin user
    admin_user, created = User.objects.get_or_create(
        username="admin",
        defaults={
            "email": "admin@example.com",
            "is_staff": True,
            "is_superuser": True,
        },
    )
    if created:
        admin_user.set_password("admin123")
        admin_user.save()
        print(f"✓ Created admin user (password: admin123)")
    else:
        print(f"✓ Admin user already exists")

    # Create a team
    team, created = Team.objects.get_or_create(
        name="Development Team",
        defaults={"description": "Main development team with full access"},
    )
    if created:
        print(f"✓ Created team: {team.name}")
    else:
        print(f"✓ Team already exists: {team.name}")

    # Add admin as team member
    team_member, created = TeamMember.objects.get_or_create(
        team=team, user=admin_user, defaults={"role": "SUPER_ADMIN"}
    )
    if created:
        print(f"✓ Added {admin_user.username} to {team.name} as SUPER_ADMIN")
    else:
        print(f"✓ Team member already exists")

    # Create endpoint permissions for common API paths
    endpoints = [
        {"path": "/api/tasks/", "methods": "*"},
        {"path": "/api/tasks/{id}/", "methods": "*"},
        {"path": "/api/tasks/my_tasks/", "methods": "GET"},
        {"path": "/api/tasks/todo/", "methods": "GET"},
        {"path": "/api/tasks/{id}/complete/", "methods": "POST"},
        {"path": "/api/users/", "methods": "GET"},
        {"path": "/api/users/{id}/", "methods": "GET"},
        {"path": "/api/users/me/", "methods": "GET"},
    ]

    created_count = 0
    for endpoint_data in endpoints:
        endpoint, created = EndpointPermission.objects.get_or_create(
            team=team,
            path=endpoint_data["path"],
            defaults={"methods": endpoint_data["methods"]},
        )
        if created:
            created_count += 1

    if created_count > 0:
        print(f"✓ Created {created_count} endpoint permissions")
    else:
        print(f"✓ Endpoint permissions already exist")

    # Create some sample tasks
    sample_tasks = [
        {
            "title": "Setup development environment",
            "description": "Install Python, Django, and dependencies",
            "status": "done",
        },
        {
            "title": "Implement user authentication",
            "description": "Add login/logout functionality",
            "status": "in_progress",
        },
        {
            "title": "Write API documentation",
            "description": "Document all API endpoints",
            "status": "todo",
        },
        {
            "title": "Add unit tests",
            "description": "Write comprehensive test suite",
            "status": "todo",
        },
        {
            "title": "Deploy to production",
            "description": "Setup CI/CD pipeline",
            "status": "todo",
        },
    ]

    created_tasks = 0
    for task_data in sample_tasks:
        task, created = Task.objects.get_or_create(
            title=task_data["title"],
            defaults={
                "description": task_data["description"],
                "status": task_data["status"],
                "created_by": admin_user,
            },
        )
        if created:
            created_tasks += 1

    if created_tasks > 0:
        print(f"✓ Created {created_tasks} sample tasks")
    else:
        print(f"✓ Sample tasks already exist")

    print("\n" + "=" * 60)
    print("✅ Test data setup complete!")
    print("=" * 60)
    print("\nYou can now:")
    print("1. Visit http://localhost:8000/portal/")
    print("2. Login with:")
    print("   Username: admin")
    print("   Password: admin123")
    print("   API Token: (leave blank for now)")
    print("\n3. Or visit Django Admin:")
    print("   http://localhost:8000/admin/")
    print("   Username: admin")
    print("   Password: admin123")
    print("=" * 60)


if __name__ == "__main__":
    setup_test_data()
