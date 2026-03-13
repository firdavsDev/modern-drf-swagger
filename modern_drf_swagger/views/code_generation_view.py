"""
Code generation view for generating client code snippets.
"""

import json

from django.http import JsonResponse
from django.views.decorators.http import require_http_methods

from ..services.code_generator import CodeGenerator


@require_http_methods(["POST"])
def generate_code_view(request):
    """
    Generate code snippet for a given endpoint configuration.

    POST /api/generate-code/
    Body: {
        "method": "GET",
        "url": "http://localhost:8000/api/users/",
        "headers": {"Authorization": "Bearer token"},
        "query_params": {"page": 1},
        "body": {"name": "John"},
        "language": "python"
    }
    """
    # Check authentication
    if not request.user.is_authenticated:
        return JsonResponse(
            {"error": "Authentication required. Please log in to use code generation."},
            status=401,
        )

    try:
        data = json.loads(request.body)

        method = data.get("method", "GET")
        url = data.get("url", "")
        headers = data.get("headers", {})
        query_params = data.get("query_params", {})
        body = data.get("body")
        language = data.get("language", "python")

        if not url:
            return JsonResponse({"error": "URL is required"}, status=400)

        # Generate code snippet
        code = CodeGenerator.generate_snippet(
            method=method,
            url=url,
            headers=headers,
            query_params=query_params,
            body=body,
            language=language,
        )

        return JsonResponse({"code": code, "language": language})

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
