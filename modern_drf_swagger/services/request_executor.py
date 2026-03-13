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
        # Forward relevant headers from portal UI
        content_type = self.request.META.get("CONTENT_TYPE")
        if content_type:
            headers["Content-Type"] = content_type

        # Extract Authentication Headers
        auth_header = self.request.META.get("HTTP_AUTHORIZATION")
        if auth_header:
            headers["Authorization"] = auth_header

        # Extract and forward CSRF token (for session authentication)
        csrf_token = self.request.META.get("HTTP_X_CSRFTOKEN")
        if csrf_token:
            headers["X-CSRFToken"] = csrf_token
        elif "csrftoken" in self.request.COOKIES:
            headers["X-CSRFToken"] = self.request.COOKIES["csrftoken"]

        # Custom headers sent via the Proxy
        custom_headers = self.request.data.get("_headers", {})
        if isinstance(custom_headers, dict):
            headers.update(custom_headers)

        return headers

    def execute(self, method: str, path: str, data=None, params=None, files=None):
        url = urljoin(self.base_url, path.lstrip("/"))

        # Attach session cookies if any, to support Session Authentication
        cookies = self.request.COOKIES

        start_time = time.time()

        try:
            # Execute the request internally or via HTTP
            # Since DRF endpoints expect WSGI requests, HTTP requests via `requests` to self
            # is one way. A cleaner way is using DRF's test client or Django's internal test client
            # but `requests` closely resembles a true client.

            # Prepare files for upload if present
            files_data = None
            if files:
                files_data = {}
                for key, file_obj in files.items():
                    # Reset file pointer to beginning
                    file_obj.seek(0)
                    files_data[key] = (
                        file_obj.name,
                        file_obj.read(),
                        file_obj.content_type,
                    )

            # Choose between JSON and multipart form data
            if files_data:
                # For file uploads, use data (not json) and files parameters
                response = requests.request(
                    method=method,
                    url=url,
                    headers={
                        k: v
                        for k, v in self.headers.items()
                        if k.lower() != "content-type"
                    },  # Let requests set Content-Type
                    data=data,
                    files=files_data,
                    params=params,
                    cookies=cookies,
                    timeout=10,
                )
            else:
                # Regular JSON request
                response = requests.request(
                    method=method,
                    url=url,
                    headers=self.headers,
                    json=data,
                    params=params,
                    cookies=cookies,
                    timeout=10,
                )

            latency = (time.time() - start_time) * 1000  # ms

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
