from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import Client, TestCase, override_settings

from modern_drf_swagger.admin import EndpointPermissionAdminForm
from modern_drf_swagger.models import EndpointPermission, Team, TeamMember, UserRole
from modern_drf_swagger.permissions.endpoint_permissions import EndpointPermissionChecker


@override_settings(ROOT_URLCONF="config.urls")
class EndpointPermissionCheckerTests(TestCase):
    def setUp(self):
        cache.clear()

    @classmethod
    def setUpTestData(cls):
        user_model = get_user_model()
        cls.password = "1234_qweR"
        cls.user = user_model.objects.create_user(
            username="front",
            password=cls.password,
        )
        cls.team = Team.objects.create(name="testing")
        TeamMember.objects.create(
            team=cls.team,
            user=cls.user,
            role=UserRole.DEVELOPER,
        )

    def test_check_access_allows_any_method_permission_for_developer(self):
        EndpointPermission.objects.create(
            team=self.team,
            path="/api/v1/tasks/",
            methods="*",
        )

        checker = EndpointPermissionChecker(self.user)

        self.assertTrue(checker.can_send_request())
        self.assertTrue(checker.check_access("/api/v1/tasks/", "POST"))
        self.assertTrue(checker.check_access("/api/v1/tasks", "GET"))

    def test_check_access_cache_is_invalidated_when_permissions_change(self):
        checker = EndpointPermissionChecker(self.user)

        self.assertFalse(checker.check_access("/api/v1/tasks/", "POST"))

        EndpointPermission.objects.create(
            team=self.team,
            path="/api/v1/tasks/",
            methods="*",
        )

        refreshed_checker = EndpointPermissionChecker(self.user)

        self.assertTrue(refreshed_checker.check_access("/api/v1/tasks/", "POST"))

    def test_check_access_accepts_any_alias_and_querystring_paths(self):
        EndpointPermission.objects.create(
            team=self.team,
            path=" /api/v1/tasks/ ",
            methods="ANY",
        )

        checker = EndpointPermissionChecker(self.user)

        self.assertTrue(checker.check_access("/api/v1/tasks/?page=2", "POST"))


@override_settings(ROOT_URLCONF="config.urls")
class SchemaViewPermissionFilteringTests(TestCase):
    def setUp(self):
        cache.clear()

    @classmethod
    def setUpTestData(cls):
        user_model = get_user_model()
        cls.password = "1234_qweR"
        cls.user = user_model.objects.create_user(
            username="front_schema",
            password=cls.password,
        )
        cls.team = Team.objects.create(name="schema-team")
        TeamMember.objects.create(
            team=cls.team,
            user=cls.user,
            role=UserRole.DEVELOPER,
        )

    def test_schema_shows_only_permitted_path_and_methods(self):
        EndpointPermission.objects.create(
            team=self.team,
            path="/api/v1/tasks/",
            methods="*",
        )

        client = Client()
        self.assertTrue(client.login(username="front_schema", password=self.password))

        response = client.get("/swagger/docs/schema/")

        self.assertEqual(response.status_code, 200)
        schema = response.json()

        self.assertEqual(set(schema["paths"].keys()), {"/api/v1/tasks/"})
        self.assertEqual(
            set(schema["paths"]["/api/v1/tasks/"].keys()),
            {"get", "post"},
        )


class EndpointPermissionAdminFormTests(TestCase):
    def setUp(self):
        self.team = Team.objects.create(name="admin-form-team")

    def test_form_normalizes_any_method_and_path(self):
        form = EndpointPermissionAdminForm(
            data={
                "team": self.team.id,
                "path": " api/v1/tasks/ ",
                "methods": " any ",
            }
        )

        self.assertTrue(form.is_valid(), form.errors)
        self.assertEqual(form.cleaned_data["path"], "/api/v1/tasks")
        self.assertEqual(form.cleaned_data["methods"], "*")

    def test_form_rejects_invalid_methods(self):
        form = EndpointPermissionAdminForm(
            data={
                "team": self.team.id,
                "path": "/api/v1/tasks/",
                "methods": "FETCH",
            }
        )

        self.assertFalse(form.is_valid())
        self.assertIn("methods", form.errors)
