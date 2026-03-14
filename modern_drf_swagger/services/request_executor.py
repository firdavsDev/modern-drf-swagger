import json
import time
from urllib.parse import urljoin

import requests
from rest_framework.request import Request


class RequestExecutor:
    def __init__(self, request: Request):
        self.request = request
        self.headers = self._extract_headers()
        self.base_url = self._get_base_url()

    def _get_base_url(self):
        # We need the full URL of the Django server
        return self.request.build_absolute_uri("/")

    def _extract_headers(self):
        headers = {}
        selected_content_type = self.request.data.get("_content_type")
        if selected_content_type:
            headers["Content-Type"] = selected_content_type

        auth_header = self.request.META.get("HTTP_AUTHORIZATION")
        if auth_header:
            headers["Authorization"] = auth_header

        csrf_token = self.request.META.get("HTTP_X_CSRFTOKEN")
        if csrf_token:
            headers["X-CSRFToken"] = csrf_token
        elif "csrftoken" in self.request.COOKIES:
            headers["X-CSRFToken"] = self.request.COOKIES["csrftoken"]

        custom_headers = self.request.data.get("_headers", {})
        if isinstance(custom_headers, str):
            try:
                custom_headers = json.loads(custom_headers)
            except json.JSONDecodeError:
                custom_headers = {}

        if isinstance(custom_headers, dict):
            headers.update(custom_headers)

        return headers

    def _extract_custom_cookies(self):
        custom_cookies = self.request.data.get("_cookies", {})

        if isinstance(custom_cookies, str):
            try:
                custom_cookies = json.loads(custom_cookies)
            except json.JSONDecodeError:
                custom_cookies = {}

        if not isinstance(custom_cookies, dict):
            return {}

        return custom_cookies

    def _get_header(self, name: str):
        for header_name, header_value in self.headers.items():
            if header_name.lower() == name.lower():
                return header_value

        return None

    def _stringify_form_value(self, value):
        if isinstance(value, (dict, list)):
            return json.dumps(value)

        return str(value)

    def _build_multipart_fields(self, data):
        if data is None:
            return []

        if not isinstance(data, dict):
            return [("payload", (None, self._stringify_form_value(data)))]

        multipart_fields = []
        for key, value in data.items():
            if isinstance(value, list):
                for item in value:
                    multipart_fields.append(
                        (key, (None, self._stringify_form_value(item)))
                    )
            else:
                multipart_fields.append(
                    (key, (None, self._stringify_form_value(value)))
                )

        return multipart_fields

    def execute(self, method: str, path: str, data=None, params=None, files=None):
        url = urljoin(self.base_url, path.lstrip("/"))

        # Attach session cookies if any, to support Session Authentication
        cookies = {**self.request.COOKIES, **self._extract_custom_cookies()}

        start_time = time.time()

        try:
            files_data = None
            if files:
                files_data = {}
                for key, file_obj in files.items():
                    file_obj.seek(0)
                    files_data[key] = (
                        file_obj.name,
                        file_obj.read(),
                        file_obj.content_type,
                    )

            content_type = self._get_header("Content-Type") or ""
            headers_without_content_type = {
                key: value
                for key, value in self.headers.items()
                if key.lower() != "content-type"
            }

            if files_data:
                response = requests.request(
                    method=method,
                    url=url,
                    headers=headers_without_content_type,
                    data=data,
                    files=files_data,
                    params=params,
                    cookies=cookies,
                    timeout=10,
                )
            elif content_type.startswith("multipart/form-data"):
                response = requests.request(
                    method=method,
                    url=url,
                    headers=headers_without_content_type,
                    files=self._build_multipart_fields(data),
                    params=params,
                    cookies=cookies,
                    timeout=10,
                )
            elif content_type.startswith(
                "application/x-www-form-urlencoded"
            ) or isinstance(data, (str, bytes)):
                response = requests.request(
                    method=method,
                    url=url,
                    headers=self.headers,
                    data=data,
                    params=params,
                    cookies=cookies,
                    timeout=10,
                )
            else:
                response = requests.request(
                    method=method,
                    url=url,
                    headers=self.headers,
                    json=data,
                    params=params,
                    cookies=cookies,
                    timeout=10,
                )

            latency = (time.time() - start_time) * 1000

            return {
                "status": response.status_code,
                "headers": dict(response.headers),
                "data": (
                    response.json()
                    if "application/json" in response.headers.get("Content-Type", "")
                    else response.text
                ),
                "latency": round(latency, 2),
                "size": len(response.content),
            }
        except Exception as e:
            latency = (time.time() - start_time) * 1000
            return {
                "status": 500,
                "headers": {},
                "data": {"error": str(e)},
                "latency": round(latency, 2),
                "size": 0,
            }
