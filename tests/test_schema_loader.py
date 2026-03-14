from django.test import SimpleTestCase, override_settings
from django.urls import path

from drf_spectacular.utils import OpenApiExample, OpenApiResponse, extend_schema, inline_serializer
from rest_framework.response import Response
from rest_framework.serializers import CharField, IntegerField
from rest_framework.views import APIView

from modern_drf_swagger.services.schema_loader import PortalSchemaLoader


class InlineSchemaExampleView(APIView):
    @extend_schema(
        request=inline_serializer(
            name="InlineSchemaExampleRequest",
            fields={
                "query": CharField(),
            },
        ),
        responses={
            200: OpenApiResponse(
                response=inline_serializer(
                    name="InlineSchemaExampleSuccess",
                    fields={
                        "status_code": IntegerField(),
                        "status": CharField(),
                        "message": CharField(),
                    },
                ),
                examples=[
                    OpenApiExample(
                        "Success",
                        value={
                            "status_code": 200,
                            "status": "success",
                            "message": "Documented without serializer_class",
                        },
                        response_only=True,
                    )
                ],
            ),
            500: OpenApiResponse(
                response=inline_serializer(
                    name="InlineSchemaExampleError",
                    fields={
                        "status_code": IntegerField(),
                        "status": CharField(),
                        "message": CharField(),
                    },
                ),
                examples=[
                    OpenApiExample(
                        "ServerError",
                        value={
                            "status_code": 500,
                            "status": "error",
                            "message": "Xatolik",
                        },
                        response_only=True,
                    )
                ],
            ),
        },
    )
    def post(self, request):
        return Response(
            {
                "status_code": 200,
                "status": "success",
                "message": "Documented without serializer_class",
            }
        )


urlpatterns = [
    path("api/schema-examples/", InlineSchemaExampleView.as_view()),
]


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


class PortalSchemaLoaderInlineExamplesTests(SimpleTestCase):
    @override_settings(
        ROOT_URLCONF=__name__,
        MODERN_DRF_SWAGGER={"EXCLUDE_PATHS": [], "SCHEMA_PATH_PREFIX": r"/api/"},
    )
    def test_schema_keeps_inline_examples_for_views_without_serializer_class(self):
        schema = PortalSchemaLoader().get_schema()

        operation = schema["paths"]["/api/schema-examples/"]["post"]

        success_examples = operation["responses"]["200"]["content"]["application/json"][
            "examples"
        ]
        error_examples = operation["responses"]["500"]["content"]["application/json"][
            "examples"
        ]

        self.assertEqual(
            success_examples["Success"]["value"]["message"],
            "Documented without serializer_class",
        )
        self.assertEqual(error_examples["ServerError"]["value"]["status"], "error")
        self.assertIn("requestBody", operation)
