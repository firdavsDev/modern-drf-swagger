from unittest.mock import Mock, patch

from django.test import SimpleTestCase

from modern_drf_swagger.services.request_executor import RequestExecutor


class DummyRequest:
    def __init__(self, data=None, cookies=None, meta=None):
        self.data = data or {}
        self.COOKIES = cookies or {}
        self.META = meta or {}

    def build_absolute_uri(self, path="/"):
        return f"http://testserver{path}"


class RequestExecutorTests(SimpleTestCase):
    @patch("modern_drf_swagger.services.request_executor.requests.request")
    def test_execute_merges_custom_cookies_into_outbound_request(self, mock_request):
        response = Mock()
        response.status_code = 200
        response.headers = {"Content-Type": "application/json"}
        response.json.return_value = {"ok": True}
        response.content = b'{"ok": true}'
        mock_request.return_value = response

        executor = RequestExecutor(
            DummyRequest(
                data={"_cookies": {"api_key": "secret-token"}},
                cookies={"sessionid": "portal-session"},
            )
        )

        executor.execute("GET", "/api/tasks/")

        self.assertEqual(
            mock_request.call_args.kwargs["cookies"],
            {
                "sessionid": "portal-session",
                "api_key": "secret-token",
            },
        )

    @patch("modern_drf_swagger.services.request_executor.requests.request")
    def test_execute_parses_stringified_custom_cookies(self, mock_request):
        response = Mock()
        response.status_code = 200
        response.headers = {"Content-Type": "application/json"}
        response.json.return_value = {"ok": True}
        response.content = b'{"ok": true}'
        mock_request.return_value = response

        executor = RequestExecutor(
            DummyRequest(data={"_cookies": '{"api_key": "secret-token"}'})
        )

        executor.execute("GET", "/api/tasks/")

        self.assertEqual(
            mock_request.call_args.kwargs["cookies"],
            {"api_key": "secret-token"},
        )

    @patch("modern_drf_swagger.services.request_executor.requests.request")
    def test_execute_sends_form_urlencoded_payload_as_data(self, mock_request):
        response = Mock()
        response.status_code = 200
        response.headers = {"Content-Type": "application/json"}
        response.json.return_value = {"ok": True}
        response.content = b'{"ok": true}'
        mock_request.return_value = response

        executor = RequestExecutor(
            DummyRequest(
                data={
                    "_content_type": "application/x-www-form-urlencoded",
                    "field": "value",
                }
            )
        )

        executor.execute(
            "POST",
            "/api/tasks/",
            data={"field": "value"},
        )

        self.assertEqual(
            mock_request.call_args.kwargs["headers"]["Content-Type"],
            "application/x-www-form-urlencoded",
        )
        self.assertEqual(
            mock_request.call_args.kwargs["data"],
            {"field": "value"},
        )
        self.assertNotIn("json", mock_request.call_args.kwargs)

    @patch("modern_drf_swagger.services.request_executor.requests.request")
    def test_execute_sends_multipart_fields_without_forwarding_proxy_content_type(
        self, mock_request
    ):
        response = Mock()
        response.status_code = 200
        response.headers = {"Content-Type": "application/json"}
        response.json.return_value = {"ok": True}
        response.content = b'{"ok": true}'
        mock_request.return_value = response

        executor = RequestExecutor(
            DummyRequest(
                data={
                    "_content_type": "multipart/form-data",
                    "description": "spec file",
                }
            )
        )

        executor.execute(
            "POST",
            "/api/tasks/",
            data={"description": "spec file"},
        )

        self.assertNotIn("Content-Type", mock_request.call_args.kwargs["headers"])
        self.assertEqual(
            mock_request.call_args.kwargs["files"],
            [("description", (None, "spec file"))],
        )
        self.assertNotIn("json", mock_request.call_args.kwargs)
