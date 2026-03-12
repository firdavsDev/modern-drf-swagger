#!/usr/bin/env python
"""Test that API_PORTAL title setting is used across all views"""
import os

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "sample_project.settings")
django.setup()

import re

from django.contrib.auth import get_user_model
from django.test import Client


def test_portal_titles():
    client = Client()
    User = get_user_model()
    user = User.objects.get(username="admin")
    client.force_login(user)

    print("✅ TESTING API_PORTAL TITLE CONFIGURATION")
    print("=" * 70)

    # Get expected title from settings
    from django.conf import settings

    expected_title = settings.API_PORTAL.get("TITLE", "API Portal")
    print(f'Expected title from settings: "{expected_title}"')
    print()

    pages = [
        ("/portal/", "API Docs", expected_title),
        ("/portal/analytics/", "Analytics", f"Analytics - {expected_title}"),
        ("/portal/history/", "History", f"History - {expected_title}"),
        ("/portal/login/", "Login", f"Login - {expected_title}"),
    ]

    for url, page_name, expected_browser_title in pages:
        response = client.get(url)
        content = response.content.decode("utf-8")

        # Extract titles
        title_match = re.search(r"<title[^>]*>\s*(.*?)\s*</title>", content, re.DOTALL)
        sidebar_match = re.search(
            r"<h1[^>]*text-blue-400[^>]*>\s*(.*?)\s*</h1>", content
        )

        print(f"{page_name} ({url}):")

        if title_match:
            browser_title = title_match.group(1).strip()
            status = "✅" if browser_title == expected_browser_title else "❌"
            print(f'  {status} Browser title: "{browser_title}"')
        else:
            print(f"  ❌ Browser title: NOT FOUND")

        if sidebar_match:
            sidebar_title = sidebar_match.group(1).strip()
            status = "✅" if sidebar_title == expected_title else "❌"
            print(f'  {status} Sidebar title: "{sidebar_title}"')
        elif url != "/portal/login/":  # Login page doesn't have sidebar
            print(f"  ❌ Sidebar title: NOT FOUND")

        print()

    print("=" * 70)
    print('✅ All pages should now reflect the API_PORTAL["TITLE"] setting!')
    print()
    print("To change the title:")
    print("  1. Edit sample_project/settings.py")
    print('  2. Change API_PORTAL["TITLE"] value')
    print("  3. Restart the Django server")
    print("  4. Refresh your browser")


if __name__ == "__main__":
    test_portal_titles()
