from django.test import SimpleTestCase, override_settings

from modern_drf_swagger.services.schema_loader import PortalSchemaLoader


class PortalSchemaLoaderAuthDetectionTests(SimpleTestCase):
    @override_settings(
        REST_FRAMEWORK={
            "DEFAULT_AUTHENTICATION_CLASSES": [
                "rest_framework.authentication.TokenAuthentication",
                "rest_framework.authentication.BasicAuthentication",
            ]
        }
    )
    def test_auto_detects_drf_token_auth_with_token_prefix_scheme(self):
        schemes = PortalSchemaLoader()._auto_detect_auth_from_drf_settings()

        schemes_by_type = {scheme["type"]: scheme for scheme in schemes}

        self.assertIn("token", schemes_by_type)
        self.assertEqual(schemes_by_type["token"]["name"], "DRF Token")
        self.assertIn("Token prefix", schemes_by_type["token"]["description"])
        self.assertIn("basic", schemes_by_type)

    @override_settings(
        REST_FRAMEWORK={"DEFAULT_AUTHENTICATION_CLASSES": []},
        MODERN_DRF_SWAGGER={"DEFAULT_AUTH_METHODS": ["token"]},
    )
    def test_manual_default_auth_methods_support_token_scheme(self):
        schemes = PortalSchemaLoader()._auto_detect_auth_from_drf_settings()

        self.assertEqual(
            schemes,
            [
                {
                    "type": "token",
                    "name": "DRF Token",
                    "description": "Authorization header using the Token prefix",
                }
            ],
        )
