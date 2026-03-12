/**
 * Request Editor Component
 * Handles building and sending API requests
 */

class RequestEditor {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.currentEndpoint = null;
    this.onSendCallback = null;
  }

  loadEndpoint(endpoint) {
    this.currentEndpoint = endpoint;
    this.render();
  }

  render() {
    if (!this.currentEndpoint) {
      this.container.innerHTML = `
                <div class="text-center text-gray-400 py-12">
                    <svg class="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <p>Select an endpoint to start testing</p>
                </div>
            `;
      return;
    }

    const endpoint = this.currentEndpoint;
    const hasBody = ["POST", "PUT", "PATCH"].includes(endpoint.method);

    let html = `
            <div class="space-y-4">
                <!-- Endpoint Info -->
                <div class="bg-gray-700 rounded-lg p-4">
                    <div class="flex items-center gap-3 mb-2">
                        <span class="method-badge method-${endpoint.method.toLowerCase()}">
                            ${endpoint.method}
                        </span>
                        <span class="font-mono text-lg">${this.escapeHtml(endpoint.path)}</span>
                    </div>
                    ${endpoint.summary ? `<p class="text-gray-300">${this.escapeHtml(endpoint.summary)}</p>` : ""}
                    ${endpoint.description ? `<p class="text-sm text-gray-400 mt-2">${this.escapeHtml(endpoint.description)}</p>` : ""}
                </div>
                
                <!-- URL Parameters -->
                ${this.renderParameters(endpoint)}
                
                <!-- Request Body -->
                ${hasBody ? this.renderRequestBody(endpoint) : ""}
                
                <!-- Headers -->
                <div>
                    <h3 class="font-semibold mb-2">Headers (Optional)</h3>
                    <textarea id="request-headers" 
                              class="dark-input w-full px-3 py-2 rounded-lg font-mono text-sm"
                              rows="3"
                              placeholder='{"Authorization": "Bearer YOUR_TOKEN"}'></textarea>
                    <p class="text-xs text-gray-500 mt-1">JSON format</p>
                </div>
                
                <!-- Send Button -->
                <button id="send-request-btn" 
                        class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                    </svg>
                    Send Request
                </button>
            </div>
        `;

    this.container.innerHTML = html;

    // Add event listener for send button
    document
      .getElementById("send-request-btn")
      .addEventListener("click", () => {
        this.sendRequest();
      });
  }

  renderParameters(endpoint) {
    const params = endpoint.parameters || [];

    if (params.length === 0) {
      return "";
    }

    let html = `
            <div>
                <h3 class="font-semibold mb-2">Parameters</h3>
                <div class="space-y-2">
        `;

    params.forEach((param) => {
      const required = param.required
        ? '<span class="text-red-400">*</span>'
        : "";
      const description = param.description || "";

      html += `
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-1">
                        ${this.escapeHtml(param.name)} ${required}
                        ${description ? `<span class="text-gray-500 font-normal">- ${this.escapeHtml(description)}</span>` : ""}
                    </label>
                    <input type="text" 
                           class="dark-input w-full px-3 py-2 rounded-lg text-sm"
                           data-param-name="${this.escapeHtml(param.name)}"
                           data-param-in="${param.in}"
                           placeholder="${param.schema?.type || "string"}">
                </div>
            `;
    });

    html += `
                </div>
            </div>
        `;

    return html;
  }

  renderRequestBody(endpoint) {
    if (!endpoint.requestBody) {
      return "";
    }

    // Try to generate example JSON from schema
    const content = endpoint.requestBody.content;
    const jsonContent = content?.["application/json"];
    let exampleJson = "{\n  \n}";

    if (jsonContent?.schema) {
      exampleJson = this.generateExampleFromSchema(jsonContent.schema);
    }

    return `
            <div>
                <h3 class="font-semibold mb-2">Request Body</h3>
                <textarea id="request-body" 
                          class="dark-input w-full px-3 py-2 rounded-lg font-mono text-sm"
                          rows="8">${exampleJson}</textarea>
                <p class="text-xs text-gray-500 mt-1">JSON format</p>
            </div>
        `;
  }

  generateExampleFromSchema(schema) {
    // Simple schema to example generator
    if (schema.example) {
      return JSON.stringify(schema.example, null, 2);
    }

    if (schema.properties) {
      const example = {};
      for (const [key, prop] of Object.entries(schema.properties)) {
        if (prop.type === "string") {
          example[key] = prop.example || `example_${key}`;
        } else if (prop.type === "integer" || prop.type === "number") {
          example[key] = prop.example || 0;
        } else if (prop.type === "boolean") {
          example[key] = prop.example || false;
        } else if (prop.type === "array") {
          example[key] = [];
        } else {
          example[key] = null;
        }
      }
      return JSON.stringify(example, null, 2);
    }

    return "{\n  \n}";
  }

  async sendRequest() {
    if (!this.currentEndpoint) return;

    const button = document.getElementById("send-request-btn");
    button.disabled = true;
    button.innerHTML = `
            <div class="spinner w-5 h-5 border-2"></div>
            Sending...
        `;

    try {
      // Collect parameters
      const params = {};
      document.querySelectorAll('[data-param-in="query"]').forEach((input) => {
        if (input.value) {
          params[input.dataset.paramName] = input.value;
        }
      });

      // Get request body
      let data = null;
      const bodyTextarea = document.getElementById("request-body");
      if (bodyTextarea && bodyTextarea.value.trim()) {
        try {
          data = JSON.parse(bodyTextarea.value);
        } catch (e) {
          showToast("Invalid JSON in request body", "error");
          throw new Error("Invalid JSON");
        }
      }

      // Get custom headers
      const headersTextarea = document.getElementById("request-headers");
      let customHeaders = {};
      if (headersTextarea && headersTextarea.value.trim()) {
        try {
          customHeaders = JSON.parse(headersTextarea.value);
        } catch (e) {
          showToast("Invalid JSON in headers", "error");
          throw new Error("Invalid JSON");
        }
      }

      // Build path with path parameters
      let path = this.currentEndpoint.path;
      document.querySelectorAll('[data-param-in="path"]').forEach((input) => {
        if (input.value) {
          path = path.replace(`{${input.dataset.paramName}}`, input.value);
        }
      });

      // Send to proxy
      const payload = {
        method: this.currentEndpoint.method,
        path: path,
        data: data,
        params: params,
        _headers: customHeaders,
      };

      if (this.onSendCallback) {
        await this.onSendCallback(payload);
      }
    } catch (error) {
      console.error("Request failed:", error);
      if (error.message !== "Invalid JSON") {
        showToast("Request failed: " + error.message, "error");
      }
    } finally {
      button.disabled = false;
      button.innerHTML = `
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
                Send Request
            `;
    }
  }

  onSend(callback) {
    this.onSendCallback = callback;
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}
