/**
 * Code Generator Component
 * Generates client code snippets in multiple languages
 */

class CodeGenerator {
  constructor() {
    this.languages = [
      { value: "python", label: "Python", icon: "🐍" },
      { value: "javascript", label: "JavaScript", icon: "⚡" },
      { value: "curl", label: "cURL", icon: "🔧" },
      { value: "httpie", label: "HTTPie", icon: "🦄" },
      { value: "php", label: "PHP", icon: "🐘" },
      { value: "java", label: "Java", icon: "☕" },
      { value: "go", label: "Go", icon: "🚀" },
    ];
    this.currentLanguage = "python";
    this.currentCode = "";
  }

  /**
   * Generate code for the current request configuration
   */
  async generateCode(method, url, headers, queryParams, body) {
    try {
      const response = await fetch(`${window.PORTAL_BASE_URL}/generate-code/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify({
          method: method,
          url: url,
          headers: headers || {},
          query_params: queryParams || {},
          body: body,
          language: this.currentLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.currentCode = data.code;
      return data.code;
    } catch (error) {
      console.error("Error generating code:", error);
      return `// Error generating code: ${error.message}`;
    }
  }

  /**
   * Render the code generator UI
   */
  renderUI(endpoint, getRequestConfig) {
    const html = `
      <div class="space-y-4">
        <!-- Language Selector -->
        <div class="flex items-center justify-between">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Select Language
          </label>
          <div class="flex flex-wrap gap-2">
            ${this.languages
              .map(
                (lang) => `
              <button 
                class="language-btn px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  lang.value === this.currentLanguage
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                }"
                data-language="${lang.value}"
                onclick="window.codeGenerator.selectLanguage('${lang.value}', this)">
                <span class="flex items-center gap-1.5">
                  <span>${lang.icon}</span>
                  <span>${lang.label}</span>
                </span>
              </button>
            `,
              )
              .join("")}
          </div>
        </div>

        <!-- Code Output -->
        <div class="relative bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
          <!-- Header -->
          <div class="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"></path>
              </svg>
              <span class="text-sm font-medium text-gray-300" id="current-language-label">Python</span>
            </div>
            <button 
              onclick="window.codeGenerator.copyCode()"
              class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition flex items-center gap-1.5 shadow-sm">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
              Copy
            </button>
          </div>

          <!-- Code Display -->
          <div class="p-4 max-h-96 overflow-auto custom-scrollbar">
            <pre id="code-output" class="text-sm text-gray-100 font-mono whitespace-pre-wrap"><code>// Select an endpoint and click "Generate Code"</code></pre>
          </div>
        </div>

        <!-- Generate Button -->
        <button 
          id="generate-code-btn"
          onclick="window.codeGenerator.handleGenerate()"
          class="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
          </svg>
          Generate Code
        </button>

        <!-- Info Box -->
        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div class="flex gap-3">
            <svg class="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
            </svg>
            <div class="text-sm text-blue-800 dark:text-blue-300">
              <p class="font-semibold mb-1">Code Generation Tips:</p>
              <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Fill in parameters, headers, and body before generating</li>
                <li>Global authentication is automatically included</li>
                <li>Switch languages anytime to see different implementations</li>
                <li>Copy and paste directly into your project</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;

    return html;
  }

  /**
   * Select a language and regenerate code
   */
  async selectLanguage(language, buttonElement) {
    this.currentLanguage = language;

    // Update button states
    document.querySelectorAll(".language-btn").forEach((btn) => {
      btn.classList.remove("bg-blue-600", "text-white", "shadow-lg");
      btn.classList.add(
        "bg-gray-200",
        "dark:bg-gray-700",
        "text-gray-700",
        "dark:text-gray-300",
        "hover:bg-gray-300",
        "dark:hover:bg-gray-600",
      );
    });

    buttonElement.classList.add("bg-blue-600", "text-white", "shadow-lg");
    buttonElement.classList.remove(
      "bg-gray-200",
      "dark:bg-gray-700",
      "text-gray-700",
      "dark:text-gray-300",
      "hover:bg-gray-300",
      "dark:hover:bg-gray-600",
    );

    // Update language label
    const langInfo = this.languages.find((l) => l.value === language);
    document.getElementById("current-language-label").textContent =
      langInfo.label;

    // If we already have code, regenerate for new language
    if (this.currentCode) {
      await this.handleGenerate();
    }
  }

  /**
   * Handle the generate button click
   */
  async handleGenerate() {
    const requestEditor = window.requestEditor;
    if (!requestEditor || !requestEditor.currentEndpoint) {
      showToast("Please select an endpoint first", "error");
      return;
    }

    const endpoint = requestEditor.currentEndpoint;

    // Build full URL
    const baseUrl = window.location.origin;
    let fullPath = endpoint.path;

    // Replace path parameters with values
    const pathParams = (endpoint.parameters || []).filter(
      (p) => p.in === "path",
    );
    pathParams.forEach((param) => {
      const input = document.getElementById(`param-${param.name}`);
      if (input && input.value) {
        fullPath = fullPath.replace(`{${param.name}}`, input.value);
      }
    });

    const fullUrl = baseUrl + fullPath;

    // Get query parameters
    const queryParams = {};
    const queryParamEls = document.querySelectorAll(
      '[data-param-type="query"]',
    );
    queryParamEls.forEach((el) => {
      const name = el.dataset.paramName;
      if (el.value) {
        queryParams[name] = el.value;
      }
    });

    // Get headers
    let headers = {};
    const headersTextarea = document.getElementById("request-headers");
    if (headersTextarea && headersTextarea.value.trim()) {
      try {
        headers = JSON.parse(headersTextarea.value);
      } catch (e) {
        // Ignore invalid JSON
      }
    }

    // Add global auth headers
    const globalHeaders = window.globalAuth?.getAuthHeaders() || {};
    headers = { ...headers, ...globalHeaders };

    // Get body for POST/PUT/PATCH
    let body = null;
    if (["POST", "PUT", "PATCH"].includes(endpoint.method)) {
      const bodyTextarea = document.getElementById("request-body");
      if (bodyTextarea && bodyTextarea.value.trim()) {
        try {
          body = JSON.parse(bodyTextarea.value);
        } catch (e) {
          showToast("Invalid JSON in request body", "error");
          return;
        }
      }
    }

    // Show loading
    const codeOutput = document.getElementById("code-output");
    codeOutput.innerHTML = `<code class="text-gray-400">// Generating ${this.currentLanguage} code...</code>`;

    // Generate code
    const code = await this.generateCode(
      endpoint.method,
      fullUrl,
      headers,
      queryParams,
      body,
    );

    // Display code with syntax highlighting
    codeOutput.textContent = code;

    // Apply syntax highlighting based on language
    this.applySyntaxHighlighting(codeOutput, this.currentLanguage);

    showToast(
      `${this.currentLanguage} code generated successfully!`,
      "success",
    );
  }

  /**
   * Apply basic syntax highlighting
   */
  applySyntaxHighlighting(element, language) {
    // For now, just use the raw text
    // In future, could integrate a syntax highlighting library like Prism.js or highlight.js
    element.classList.add(`language-${language}`);
  }

  /**
   * Copy the generated code to clipboard
   */
  async copyCode() {
    const codeOutput = document.getElementById("code-output");
    const code = codeOutput.textContent;

    if (!code || code.includes("Select an endpoint")) {
      showToast("No code to copy", "error");
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      showToast("Code copied to clipboard!", "success");
    } catch (err) {
      console.error("Failed to copy:", err);
      showToast("Failed to copy code", "error");
    }
  }
}

// Initialize global code generator
window.codeGenerator = new CodeGenerator();
