"""
Code generation service for creating client code snippets from OpenAPI operations.
Supports: Python, JavaScript, cURL, HTTPie, PHP, Java, Go
"""

import json
from typing import Any, Dict, Optional


class CodeGenerator:
    """Generate client code snippets for API endpoints in various languages."""

    @staticmethod
    def generate_snippet(
        method: str,
        url: str,
        headers: Optional[Dict[str, str]] = None,
        query_params: Optional[Dict[str, Any]] = None,
        body: Optional[Dict[str, Any]] = None,
        language: str = "python",
    ) -> str:
        """
        Generate code snippet for the specified language.

        Args:
            method: HTTP method (GET, POST, etc.)
            url: Full endpoint URL
            headers: Request headers
            query_params: Query parameters
            body: Request body (for POST/PUT/PATCH)
            language: Target language (python, javascript, curl, httpie, php, java, go)

        Returns:
            Code snippet as string
        """
        headers = headers or {}
        query_params = query_params or {}

        generators = {
            "python": CodeGenerator._generate_python,
            "javascript": CodeGenerator._generate_javascript,
            "curl": CodeGenerator._generate_curl,
            "httpie": CodeGenerator._generate_httpie,
            "php": CodeGenerator._generate_php,
            "java": CodeGenerator._generate_java,
            "go": CodeGenerator._generate_go,
        }

        generator = generators.get(language.lower())
        if not generator:
            return f"# Unsupported language: {language}"

        return generator(method, url, headers, query_params, body)

    @staticmethod
    def _generate_python(
        method: str,
        url: str,
        headers: Dict[str, str],
        query_params: Dict[str, Any],
        body: Optional[Dict[str, Any]],
    ) -> str:
        """Generate Python code using requests library."""
        lines = [
            "import requests",
            "",
        ]

        # URL
        if query_params:
            lines.append(f'url = "{url}"')
        else:
            lines.append(f'url = "{url}"')

        # Query params
        if query_params:
            lines.append("")
            lines.append("params = {")
            for key, value in query_params.items():
                lines.append(f'    "{key}": {json.dumps(value)},')
            lines.append("}")

        # Headers
        if headers:
            lines.append("")
            lines.append("headers = {")
            for key, value in headers.items():
                lines.append(f'    "{key}": "{value}",')
            lines.append("}")

        # Body
        if body:
            lines.append("")
            lines.append(f"payload = {json.dumps(body, indent=4)}")

        # Request
        lines.append("")
        request_args = ["url"]
        if query_params:
            request_args.append("params=params")
        if headers:
            request_args.append("headers=headers")
        if body:
            request_args.append("json=payload")

        lines.append(f'response = requests.{method.lower()}({", ".join(request_args)})')
        lines.append("")
        lines.append('print(f"Status: {response.status_code}")')
        lines.append("print(response.json())")

        return "\n".join(lines)

    @staticmethod
    def _generate_javascript(
        method: str,
        url: str,
        headers: Dict[str, str],
        query_params: Dict[str, Any],
        body: Optional[Dict[str, Any]],
    ) -> str:
        """Generate JavaScript code using fetch API."""
        # Build URL with query params
        full_url = url
        if query_params:
            query_str = "&".join([f"{k}={v}" for k, v in query_params.items()])
            full_url = f"{url}?{query_str}"

        lines = [
            f'const url = "{full_url}";',
            "",
            "const options = {",
            f'  method: "{method.upper()}",',
        ]

        # Headers
        if headers or body:
            lines.append("  headers: {")
            for key, value in headers.items():
                lines.append(f'    "{key}": "{value}",')
            if body and "Content-Type" not in headers:
                lines.append('    "Content-Type": "application/json",')
            lines.append("  },")

        # Body
        if body:
            body_json = json.dumps(body, indent=4)
            indented_body = "\n".join(["  " + line for line in body_json.split("\n")])
            lines.append(f"  body: JSON.stringify({indented_body}),")

        lines.append("};")
        lines.append("")
        lines.append("fetch(url, options)")
        lines.append("  .then(response => response.json())")
        lines.append("  .then(data => console.log(data))")
        lines.append("  .catch(error => console.error('Error:', error));")

        return "\n".join(lines)

    @staticmethod
    def _generate_curl(
        method: str,
        url: str,
        headers: Dict[str, str],
        query_params: Dict[str, Any],
        body: Optional[Dict[str, Any]],
    ) -> str:
        """Generate cURL command."""
        # Build URL with query params
        full_url = url
        if query_params:
            query_str = "&".join([f"{k}={v}" for k, v in query_params.items()])
            full_url = f"{url}?{query_str}"

        parts = [f'curl -X {method.upper()} "{full_url}"']

        # Headers
        for key, value in headers.items():
            parts.append(f'  -H "{key}: {value}"')

        # Body
        if body:
            if "Content-Type" not in headers:
                parts.append('  -H "Content-Type: application/json"')
            body_json = json.dumps(body)
            parts.append(f"  -d '{body_json}'")

        return " \\\n".join(parts)

    @staticmethod
    def _generate_httpie(
        method: str,
        url: str,
        headers: Dict[str, str],
        query_params: Dict[str, Any],
        body: Optional[Dict[str, Any]],
    ) -> str:
        """Generate HTTPie command."""
        # Build URL with query params
        full_url = url
        if query_params:
            query_parts = [f"{k}=={v}" for k, v in query_params.items()]
            full_url = f"{url} {' '.join(query_parts)}"

        parts = [f"http {method.upper()} {full_url}"]

        # Headers
        for key, value in headers.items():
            parts.append(f'  "{key}:{value}"')

        # Body (HTTPie uses key=value syntax for JSON)
        if body:
            for key, value in body.items():
                if isinstance(value, str):
                    parts.append(f'  {key}="{value}"')
                else:
                    parts.append(f"  {key}:={json.dumps(value)}")

        return " \\\n".join(parts)

    @staticmethod
    def _generate_php(
        method: str,
        url: str,
        headers: Dict[str, str],
        query_params: Dict[str, Any],
        body: Optional[Dict[str, Any]],
    ) -> str:
        """Generate PHP code using cURL."""
        # Build URL with query params
        full_url = url
        if query_params:
            query_str = http_build_query_str = "&".join(
                [f"{k}={v}" for k, v in query_params.items()]
            )
            full_url = f"{url}?{query_str}"

        lines = [
            "<?php",
            "",
            f'$url = "{full_url}";',
            "",
            "$ch = curl_init($url);",
            "",
        ]

        # Method
        if method.upper() != "GET":
            lines.append(
                f'curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "{method.upper()}");'
            )

        # Headers
        if headers or body:
            lines.append("curl_setopt($ch, CURLOPT_HTTPHEADER, [")
            for key, value in headers.items():
                lines.append(f'    "{key}: {value}",')
            if body and "Content-Type" not in headers:
                lines.append('    "Content-Type: application/json",')
            lines.append("]);")

        # Body
        if body:
            lines.append("")
            body_json = json.dumps(body, indent=4)
            lines.append(f"$payload = '{body_json}';")
            lines.append("curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);")

        lines.extend(
            [
                "",
                "curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);",
                "",
                "$response = curl_exec($ch);",
                "$statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);",
                "",
                "curl_close($ch);",
                "",
                'echo "Status: $statusCode\\n";',
                "echo $response;",
                "?>",
            ]
        )

        return "\n".join(lines)

    @staticmethod
    def _generate_java(
        method: str,
        url: str,
        headers: Dict[str, str],
        query_params: Dict[str, Any],
        body: Optional[Dict[str, Any]],
    ) -> str:
        """Generate Java code using HttpURLConnection."""
        # Build URL with query params
        full_url = url
        if query_params:
            query_str = "&".join([f"{k}={v}" for k, v in query_params.items()])
            full_url = f"{url}?{query_str}"

        lines = [
            "import java.net.HttpURLConnection;",
            "import java.net.URL;",
            "import java.io.*;",
            "",
            "public class ApiClient {",
            "    public static void main(String[] args) {",
            "        try {",
            f'            URL url = new URL("{full_url}");',
            "            HttpURLConnection conn = (HttpURLConnection) url.openConnection();",
            f'            conn.setRequestMethod("{method.upper()}");',
            "",
        ]

        # Headers
        for key, value in headers.items():
            lines.append(f'            conn.setRequestProperty("{key}", "{value}");')

        # Body
        if body:
            if "Content-Type" not in headers:
                lines.append(
                    '            conn.setRequestProperty("Content-Type", "application/json");'
                )
            lines.append("            conn.setDoOutput(true);")
            lines.append("")
            body_json = json.dumps(body)
            lines.append(f'            String payload = "{body_json}";')
            lines.append("            try (OutputStream os = conn.getOutputStream()) {")
            lines.append('                byte[] input = payload.getBytes("utf-8");')
            lines.append("                os.write(input, 0, input.length);")
            lines.append("            }")

        lines.extend(
            [
                "",
                "            int statusCode = conn.getResponseCode();",
                "            BufferedReader br = new BufferedReader(",
                '                new InputStreamReader(conn.getInputStream(), "utf-8"));',
                "            StringBuilder response = new StringBuilder();",
                "            String responseLine;",
                "            while ((responseLine = br.readLine()) != null) {",
                "                response.append(responseLine.trim());",
                "            }",
                "",
                '            System.out.println("Status: " + statusCode);',
                "            System.out.println(response.toString());",
                "        } catch (Exception e) {",
                "            e.printStackTrace();",
                "        }",
                "    }",
                "}",
            ]
        )

        return "\n".join(lines)

    @staticmethod
    def _generate_go(
        method: str,
        url: str,
        headers: Dict[str, str],
        query_params: Dict[str, Any],
        body: Optional[Dict[str, Any]],
    ) -> str:
        """Generate Go code using net/http."""
        # Build URL with query params
        full_url = url
        if query_params:
            query_str = "&".join([f"{k}={v}" for k, v in query_params.items()])
            full_url = f"{url}?{query_str}"

        lines = [
            "package main",
            "",
            "import (",
            '    "bytes"',
            '    "encoding/json"',
            '    "fmt"',
            '    "io"',
            '    "net/http"',
            ")",
            "",
            "func main() {",
            f'    url := "{full_url}"',
            "",
        ]

        # Body
        if body:
            body_json = json.dumps(body, indent=4)
            indented_body = "\n".join(["    " + line for line in body_json.split("\n")])
            lines.append(f"    payload := []byte(`{indented_body}`)")
            lines.append(
                f'    req, err := http.NewRequest("{method.upper()}", url, bytes.NewBuffer(payload))'
            )
        else:
            lines.append(
                f'    req, err := http.NewRequest("{method.upper()}", url, nil)'
            )

        lines.extend(
            [
                "    if err != nil {",
                "        panic(err)",
                "    }",
                "",
            ]
        )

        # Headers
        for key, value in headers.items():
            lines.append(f'    req.Header.Set("{key}", "{value}")')

        if body and "Content-Type" not in headers:
            lines.append('    req.Header.Set("Content-Type", "application/json")')

        lines.extend(
            [
                "",
                "    client := &http.Client{}",
                "    resp, err := client.Do(req)",
                "    if err != nil {",
                "        panic(err)",
                "    }",
                "    defer resp.Body.Close()",
                "",
                '    fmt.Println("Status:", resp.Status)',
                "    bodyBytes, _ := io.ReadAll(resp.Body)",
                "    fmt.Println(string(bodyBytes))",
                "}",
            ]
        )

        return "\n".join(lines)
