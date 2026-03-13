from django.test import SimpleTestCase

from modern_drf_swagger.management.commands.list_permissions import Command


class ListPermissionsCommandTests(SimpleTestCase):
    def test_get_user_identifier_uses_configured_username_field(self):
        class CustomUser:
            USERNAME_FIELD = "email"

            def __init__(self):
                self.email = "member@example.com"

            def __str__(self):
                return "fallback-value"

        identifier = Command()._get_user_identifier(CustomUser())

        self.assertEqual(identifier, "member@example.com")

    def test_get_user_identifier_falls_back_to_str(self):
        class UserWithoutConfiguredField:
            USERNAME_FIELD = "email"

            def __str__(self):
                return "fallback-value"

        identifier = Command()._get_user_identifier(UserWithoutConfiguredField())

        self.assertEqual(identifier, "fallback-value")
