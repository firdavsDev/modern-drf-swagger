# Code Generation Feature

Generate client code snippets in 7 programming languages directly from your API documentation portal.

## Supported Languages

- 🐍 **Python** - Using `requests` library
- ⚡ **JavaScript** - Using `fetch` API
- 🔧 **cURL** - Command-line ready
- 🦄 **HTTPie** - Modern CLI HTTP client
- 🐘 **PHP** - Using cURL extension
- ☕ **Java** - Using HttpURLConnection
- 🚀 **Go** - Using net/http package

## How to Use

### 1. Select an Endpoint
Navigate to the API documentation page and click on any endpoint in the sidebar.

### 2. Configure Parameters
- Fill in required **Parameters** (path, query)
- Add custom **Headers** if needed (or use global authentication)
- Add **Body** data for POST/PUT/PATCH requests

### 3. Open Code Tab
Click on the **"Code"** tab in the request editor (next to Responses tab).

### 4. Select Language
Choose your preferred programming language from the language selector buttons:
- Python, JavaScript, cURL, HTTPie, PHP, Java, or Go

### 5. Generate Code
Click the **"Generate Code"** button to create a code snippet based on your configuration.

### 6. Copy & Use
Click the **"Copy"** button to copy the generated code to your clipboard, then paste it into your project!

## Features

### Automatic Authentication
- Global authentication credentials (Bearer token, Basic auth, API key) are automatically included in generated code
- Custom headers from the Headers tab are also included

### Runtime Toggle
- Set `MODERN_DRF_SWAGGER['CODE_GENERATE_ENABLE'] = False` to hide the Code Generation panel in the docs UI
- When disabled, the backend `/generate-code/` endpoint returns `403` instead of generating snippets

### Real-time Configuration
- Code is generated based on your current endpoint configuration
- All parameters, query strings, headers, and body data are included
- Switch languages anytime to see different implementations

### Ready-to-Run
- All generated code includes:
  - Complete import statements
  - Full URL construction with parameters
  - Proper header configuration
  - Request body formatting
  - Response handling

## Example Output

### Python
```python
import requests

url = "http://localhost:8000/api/users/123/"

headers = {
    "Authorization": "Bearer eyJhbGci...",
    "Content-Type": "application/json",
}

response = requests.get(url, headers=headers)

print(f"Status: {response.status_code}")
print(response.json())
```

### JavaScript
```javascript
const url = "http://localhost:8000/api/users/123/";

const options = {
  method: "GET",
  headers: {
    "Authorization": "Bearer eyJhbGci...",
    "Content-Type": "application/json",
  },
};

fetch(url, options)
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

### cURL
```bash
curl -X GET "http://localhost:8000/api/users/123/" \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "Content-Type: application/json"
```

## Use Cases

### 1. API Integration
Quickly integrate APIs into your application by copying working code examples.

### 2. Documentation
Generate language-specific examples for your API documentation automatically.

### 3. Testing
Create test scripts in your preferred language with all parameters pre-filled.

### 4. Learning
See how to make API requests in different languages and learn best practices.

### 5. Debugging
Generate working code to verify your API calls are formatted correctly.

## Tips

- **Set Up Authentication First**: Use the "Authorize" button in the sidebar to configure global authentication before generating code
- **Fill All Parameters**: Complete all required and optional parameters for more accurate code generation
- **Test First**: Send the request using the "Send Request" button to verify it works before generating code
- **Language Switching**: Try different languages to find the one that best fits your project
- **Custom Headers**: Any custom headers you add in the Headers tab will be included in the generated code

## Technical Details

### Backend Service
The code generation is powered by the `CodeGenerator` service class in:
```
modern_drf_swagger/services/code_generator.py
```

### API Endpoint
Code is generated via POST request to:
```
/generate-code/
```

The endpoint is only available to authenticated portal users and respects the `CODE_GENERATE_ENABLE` setting.

### Frontend Component
The UI is implemented in:
```
modern_drf_swagger/static/modern_drf_swagger/js/code-generator.js
```

## Future Enhancements

Planned improvements for code generation:

- 📚 Syntax highlighting using Prism.js or highlight.js
- 📦 Support for additional languages (Ruby, Rust, C#, Swift)
- 💾 Save code snippets to history
- 📤 Export code snippets to files
- 🎨 Customizable code templates
- 📝 Code comments and documentation generation
- 🔧 Framework-specific code (Django, Express, Spring Boot)

---

**Need Help?** If you encounter any issues with code generation, please open an issue on [GitHub](https://github.com/firdavsDev/modern-drf-swagger/issues).
