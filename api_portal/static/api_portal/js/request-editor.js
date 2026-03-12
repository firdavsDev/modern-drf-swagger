/**
 * Request Editor Component
 * Handles building and sending API requests
 */

class RequestEditor {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.currentEndpoint = null;
    this.onSendCallback = null;
    this.lastCurlCommand = null;
    // Make globally accessible for copy button
    window.requestEditor = this;
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
    const params = endpoint.parameters || [];
    const hasParams = params.length > 0;

    let html = `
            <div class="space-y-4">
                <!-- Endpoint Info -->
                <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <div class="flex items-center gap-3 mb-2">
                        <span class="method-badge method-${endpoint.method.toLowerCase()}">
                            ${endpoint.method}
                        </span>
                        <span class="font-mono text-lg text-gray-900 dark:text-gray-100">${this.escapeHtml(endpoint.path)}</span>
                    </div>
                    ${endpoint.summary ? `<p class="text-gray-700 dark:text-gray-300 text-sm">${this.escapeHtml(endpoint.summary)}</p>` : ""}
                    ${endpoint.description ? `<p class="text-xs text-gray-500 dark:text-gray-400 mt-2">${this.escapeHtml(endpoint.description)}</p>` : ""}
                </div>
                
                <!-- Tabbed Interface -->
                <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <!-- Tab Headers -->
                    <div class="flex border-b border-gray-200 dark:border-gray-700">
                        ${
                          hasParams
                            ? `
                        <button class="request-tab active px-6 py-3 text-sm font-medium transition-colors border-b-2 border-blue-600 text-blue-600 dark:text-blue-400" data-tab="params">
                            <span class="flex items-center gap-2">
                                Parameters
                                <span class="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full">${params.length}</span>
                            </span>
                        </button>
                        `
                            : ""
                        }
                        <button class="request-tab ${!hasParams ? "active border-b-2 border-blue-600 text-blue-600 dark:text-blue-400" : "border-b-2 border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"} px-6 py-3 text-sm font-medium transition-colors" data-tab="headers">
                            Headers
                        </button>
                        ${
                          hasBody
                            ? `
                        <button class="request-tab border-b-2 border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 px-6 py-3 text-sm font-medium transition-colors" data-tab="body">
                            Body
                        </button>
                        `
                            : ""
                        }
                    </div>
                    
                    <!-- Tab Content -->
                    <div class="p-4">
                        ${
                          hasParams
                            ? `
                        <div class="tab-content ${hasParams ? "active" : ""}" data-tab-content="params">
                            ${this.renderParametersModern(endpoint)}
                        </div>
                        `
                            : ""
                        }
                        
                        <div class="tab-content ${!hasParams ? "active" : ""}" data-tab-content="headers">
                            <div class="space-y-2">
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Custom Headers
                                    <span class="text-gray-500 dark:text-gray-400 font-normal">(Optional)</span>
                                </label>
                                <textarea id="request-headers" 
                                          class="dark-input w-full px-3 py-2 rounded-lg font-mono text-sm h-32"
                                          placeholder='{\n  "Authorization": "Bearer YOUR_TOKEN",\n  "Custom-Header": "value"\n}'></textarea>
                                <p class="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                                    </svg>
                                    JSON format required
                                </p>
                            </div>
                        </div>
                        
                        ${
                          hasBody
                            ? `
                        <div class="tab-content" data-tab-content="body">
                            ${this.renderRequestBodyModern(endpoint)}
                        </div>
                        `
                            : ""
                        }
                    </div>
                </div>
                
                <!-- cURL Command -->
                <div id="curl-command-section" class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hidden">
                    <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                        <h3 class="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <svg class="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            cURL Command
                        </h3>
                        <button 
                            onclick="window.requestEditor.copyCurlCommand()" 
                            class="px-3 py-1.5 bg-purple-600 dark:bg-purple-500 hover:bg-purple-700 dark:hover:bg-purple-600 text-white rounded text-sm transition flex items-center gap-2 shadow-sm"
                        >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                            </svg>
                            Copy
                        </button>
                    </div>
                    <div class="p-4">
                        <div class="code-block max-h-48 overflow-x-auto">
                            <pre id="curl-command-text" class="whitespace-pre-wrap font-mono text-sm text-gray-900 dark:text-gray-100"></pre>
                        </div>
                    </div>
                </div>

                <!-- Send Button -->
                <button id="send-request-btn" 
                        class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                    </svg>
                    Send Request
                </button>
            </div>
        `;

    this.container.innerHTML = html;

    // Setup tab switching
    this.setupTabs();

    // Setup real-time JSON validation
    this.setupJsonValidation();

    // Add event listener for send button
    document
      .getElementById("send-request-btn")
      .addEventListener("click", () => {
        this.sendRequest();
      });
  }

  setupJsonValidation() {
    const bodyTextarea = document.getElementById("request-body");
    const validationMessage = document.getElementById(
      "json-validation-message",
    );
    const validationFeedback = document.getElementById(
      "json-validation-feedback",
    );

    if (!bodyTextarea || !validationMessage) return;

    let validationTimeout = null;

    bodyTextarea.addEventListener("input", () => {
      // Clear previous timeout
      clearTimeout(validationTimeout);

      // Debounce validation (wait 300ms after user stops typing)
      validationTimeout = setTimeout(() => {
        const value = bodyTextarea.value.trim();

        // Empty is valid
        if (!value) {
          this.setJsonValidationState(
            bodyTextarea,
            validationMessage,
            validationFeedback,
            "neutral",
          );
          return;
        }

        // Try to parse JSON
        try {
          JSON.parse(value);
          this.setJsonValidationState(
            bodyTextarea,
            validationMessage,
            validationFeedback,
            "valid",
          );
        } catch (error) {
          this.setJsonValidationState(
            bodyTextarea,
            validationMessage,
            validationFeedback,
            "invalid",
            error.message,
          );
        }
      }, 300);
    });

    // Initial validation
    const initialValue = bodyTextarea.value.trim();
    if (initialValue) {
      try {
        JSON.parse(initialValue);
        this.setJsonValidationState(
          bodyTextarea,
          validationMessage,
          validationFeedback,
          "valid",
        );
      } catch (error) {
        this.setJsonValidationState(
          bodyTextarea,
          validationMessage,
          validationFeedback,
          "invalid",
          error.message,
        );
      }
    }
  }

  setJsonValidationState(
    textarea,
    messageEl,
    feedbackEl,
    state,
    errorMsg = "",
  ) {
    // Remove all state classes
    textarea.classList.remove("json-valid", "json-invalid", "json-neutral");

    if (state === "valid") {
      textarea.classList.add("json-valid");
      messageEl.innerHTML = `
        <svg class="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
        </svg>
        <span class="text-green-600 dark:text-green-400 font-medium">Valid JSON</span>
      `;
      if (feedbackEl) {
        feedbackEl.innerHTML = `
          <div class="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded-full flex items-center gap-1">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
          </div>
        `;
        feedbackEl.classList.remove("hidden");
      }
    } else if (state === "invalid") {
      textarea.classList.add("json-invalid");
      messageEl.innerHTML = `
        <svg class="w-4 h-4 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
        </svg>
        <span class="text-red-600 dark:text-red-400 font-medium">Invalid JSON: ${this.escapeHtml(errorMsg)}</span>
      `;
      if (feedbackEl) {
        feedbackEl.innerHTML = `
          <div class="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-1 rounded-full flex items-center gap-1">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
            </svg>
          </div>
        `;
        feedbackEl.classList.remove("hidden");
      }
    } else {
      textarea.classList.add("json-neutral");
      messageEl.innerHTML = `
        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
        </svg>
        <span class="text-gray-500 dark:text-gray-400">Valid JSON format required</span>
      `;
      if (feedbackEl) {
        feedbackEl.classList.add("hidden");
      }
    }
  }

  setupTabs() {
    const tabs = document.querySelectorAll(".request-tab");
    const contents = document.querySelectorAll(".tab-content");

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const targetTab = tab.dataset.tab;

        // Remove active class from all tabs and contents
        tabs.forEach((t) => {
          t.classList.remove(
            "active",
            "border-blue-600",
            "text-blue-600",
            "dark:text-blue-400",
          );
          t.classList.add(
            "border-transparent",
            "text-gray-600",
            "dark:text-gray-400",
            "hover:text-gray-900",
            "dark:hover:text-gray-200",
          );
        });
        contents.forEach((c) => c.classList.remove("active"));

        // Add active class to clicked tab and corresponding content
        tab.classList.add(
          "active",
          "border-blue-600",
          "text-blue-600",
          "dark:text-blue-400",
        );
        tab.classList.remove(
          "border-transparent",
          "text-gray-600",
          "dark:text-gray-400",
          "hover:text-gray-900",
          "dark:hover:text-gray-200",
        );

        const targetContent = document.querySelector(
          `[data-tab-content="${targetTab}"]`,
        );
        if (targetContent) {
          targetContent.classList.add("active");
        }
      });
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

  renderParametersModern(endpoint) {
    const params = endpoint.parameters || [];

    if (params.length === 0) {
      return `
        <div class="text-center py-8 text-gray-500 dark:text-gray-400">
          <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p class="text-sm">No parameters required</p>
        </div>
      `;
    }

    // Group parameters by type (path, query)
    const pathParams = params.filter((p) => p.in === "path");
    const queryParams = params.filter((p) => p.in === "query");

    let html = '<div class="space-y-4">';

    // Path Parameters
    if (pathParams.length > 0) {
      html += `
        <div>
          <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
            </svg>
            Path Parameters
          </h4>
          <div class="space-y-3">
      `;

      pathParams.forEach((param) => {
        const required = param.required
          ? '<span class="text-red-500 dark:text-red-400">*</span>'
          : "";
        const description = param.description || "";
        const type = param.schema?.type || "string";

        html += `
          <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
            <label class="block mb-3">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-semibold text-gray-900 dark:text-white">
                  ${this.escapeHtml(param.name)} ${required}
                </span>
                <span class="text-xs text-gray-600 dark:text-gray-300 font-mono bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">${type}</span>
              </div>
              ${description ? `<p class="text-xs text-gray-600 dark:text-gray-300 mb-2">${this.escapeHtml(description)}</p>` : ""}
            </label>
            <input type="text" 
                   class="param-input w-full px-4 py-2.5 rounded-lg text-sm font-medium"
                   data-param-name="${this.escapeHtml(param.name)}"
                   data-param-in="${param.in}"
                   placeholder="Enter ${type} value">
          </div>
        `;
      });

      html += "</div></div>";
    }

    // Query Parameters
    if (queryParams.length > 0) {
      html += `
        <div>
          <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <svg class="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            Query Parameters
          </h4>
          <div class="grid grid-cols-1 gap-3">
      `;

      queryParams.forEach((param) => {
        const required = param.required
          ? '<span class="text-red-500 dark:text-red-400">*</span>'
          : "";
        const description = param.description || "";
        const type = param.schema?.type || "string";

        html += `
          <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-gray-300 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500 transition-colors">
            <label class="block mb-3">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-semibold text-gray-900 dark:text-white">
                  ${this.escapeHtml(param.name)} ${required}
                </span>
                <span class="text-xs text-gray-600 dark:text-gray-300 font-mono bg-green-100 dark:bg-green-900 px-2 py-1 rounded">${type}</span>
              </div>
              ${description ? `<p class="text-xs text-gray-600 dark:text-gray-300 mb-2">${this.escapeHtml(description)}</p>` : ""}
            </label>
            <input type="text" 
                   class="param-input w-full px-4 py-2.5 rounded-lg text-sm font-medium"
                   data-param-name="${this.escapeHtml(param.name)}"
                   data-param-in="${param.in}"
                   placeholder="Enter ${type} value">
          </div>
        `;
      });

      html += "</div></div>";
    }

    html += "</div>";
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

  renderRequestBodyModern(endpoint) {
    if (!endpoint.requestBody) {
      return `
        <div class="text-center py-8 text-gray-500 dark:text-gray-400">
          <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <p class="text-sm">No request body required</p>
        </div>
      `;
    }

    // Try to generate example JSON from schema
    const content = endpoint.requestBody.content;
    const jsonContent = content?.["application/json"];
    const formDataContent = content?.["multipart/form-data"];
    let exampleJson = "{\n  \n}";
    let schemaDescription = "";
    let hasFileFields = false;
    let schema = null;

    // Check for file fields in schema
    if (formDataContent?.schema) {
      schema = formDataContent.schema;
      hasFileFields = this.hasFileFieldsInSchema(schema);
    } else if (jsonContent?.schema) {
      schema = jsonContent.schema;
      hasFileFields = this.hasFileFieldsInSchema(schema);
    }

    if (schema) {
      schemaDescription = schema.description || "";
      if (!hasFileFields) {
        exampleJson = this.generateExampleFromSchema(schema);
      }
    }

    // Render form-data UI if schema has file fields
    if (hasFileFields && schema) {
      return this.renderFormDataBody(schema, schemaDescription);
    }

    // Render JSON UI
    return `
      <div class="space-y-3">
        ${
          schemaDescription
            ? `
        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p class="text-sm text-blue-800 dark:text-blue-300">${this.escapeHtml(schemaDescription)}</p>
        </div>
        `
            : ""
        }
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Request Body
            <span class="text-gray-500 dark:text-gray-400 font-normal ml-2 text-xs">(JSON)</span>
          </label>
          <div class="relative">
            <textarea id="request-body" 
                      class="dark-input w-full px-4 py-3 rounded-lg font-mono text-sm leading-relaxed transition-all"
                      rows="12"
                      spellcheck="false">${exampleJson}</textarea>
            <div id="json-validation-feedback" class="hidden absolute top-2 right-2"></div>
          </div>
          <div id="json-validation-message" class="mt-2 text-xs flex items-center gap-1 transition-all">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-gray-500 dark:text-gray-400">Valid JSON format required</span>
          </div>
        </div>
      </div>
    `;
  }

  hasFileFieldsInSchema(schema) {
    if (!schema || !schema.properties) return false;

    for (const [key, prop] of Object.entries(schema.properties)) {
      if (
        prop.type === "string" &&
        (prop.format === "binary" || prop.format === "byte")
      ) {
        return true;
      }
    }
    return false;
  }

  renderFormDataBody(schema, schemaDescription) {
    let html = `
      <div class="space-y-3">
        ${
          schemaDescription
            ? `
        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p class="text-sm text-blue-800 dark:text-blue-300">${this.escapeHtml(schemaDescription)}</p>
        </div>
        `
            : ""
        }
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Request Body
            <span class="text-gray-500 dark:text-gray-400 font-normal ml-2 text-xs">(Form Data)</span>
          </label>
          <div id="form-data-fields" class="space-y-3">
    `;

    if (schema.properties) {
      for (const [fieldName, fieldProp] of Object.entries(schema.properties)) {
        const required = schema.required?.includes(fieldName)
          ? '<span class="text-red-500 dark:text-red-400">*</span>'
          : "";
        const description = fieldProp.description || "";
        const isFile =
          fieldProp.format === "binary" || fieldProp.format === "byte";

        html += `
          <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-gray-300 dark:border-gray-600">
            <label class="block mb-2">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-semibold text-gray-900 dark:text-white">
                  ${this.escapeHtml(fieldName)} ${required}
                </span>
                <span class="text-xs text-gray-600 dark:text-gray-300 font-mono bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded">
                  ${isFile ? "file" : fieldProp.type || "string"}
                </span>
              </div>
              ${description ? `<p class="text-xs text-gray-600 dark:text-gray-300 mb-2">${this.escapeHtml(description)}</p>` : ""}
            </label>
            ${
              isFile
                ? `
              <input type="file" 
                     class="form-data-input w-full px-3 py-2 rounded-lg text-sm border-2 border-gray-300 dark:border-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300"
                     data-field-name="${this.escapeHtml(fieldName)}"
                     data-field-type="file">
            `
                : `
              <input type="text" 
                     class="form-data-input param-input w-full px-4 py-2.5 rounded-lg text-sm font-medium"
                     data-field-name="${this.escapeHtml(fieldName)}"
                     data-field-type="${fieldProp.type || "string"}"
                     placeholder="Enter ${fieldProp.type || "string"} value">
            `
            }
          </div>
        `;
      }
    }

    html += `
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
            </svg>
            Support for file uploads (multipart/form-data)
          </p>
        </div>
      </div>
    `;

    return html;
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

      // Get request body (JSON or form-data)
      let data = null;
      const bodyTextarea = document.getElementById("request-body");
      const formDataFields = document.querySelectorAll(".form-data-input");

      // Check if using form-data (for file uploads)
      if (formDataFields.length > 0) {
        const formData = new FormData();
        let hasFiles = false;

        formDataFields.forEach((input) => {
          const fieldName = input.dataset.fieldName;
          const fieldType = input.dataset.fieldType;

          if (fieldType === "file" && input.files && input.files.length > 0) {
            formData.append(fieldName, input.files[0]);
            hasFiles = true;
          } else if (input.value) {
            formData.append(fieldName, input.value);
          }
        });

        // If we have files, use FormData, otherwise convert to JSON
        if (hasFiles) {
          data = formData;
        } else {
          // Convert form data to JSON object
          const jsonObj = {};
          formDataFields.forEach((input) => {
            if (input.value) {
              jsonObj[input.dataset.fieldName] = input.value;
            }
          });
          data = jsonObj;
        }
      } else if (bodyTextarea && bodyTextarea.value.trim()) {
        // JSON body
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

      // Generate and display cURL command
      this.generateCurlCommand(payload);

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

  generateCurlCommand(payload) {
    const baseUrl = window.location.origin;
    let url = baseUrl + payload.path;

    // Add query parameters
    if (payload.params && Object.keys(payload.params).length > 0) {
      const queryString = new URLSearchParams(payload.params).toString();
      url += "?" + queryString;
    }

    let curlParts = [`curl -X ${payload.method}`];
    curlParts.push(`'${url}'`);

    // Add headers
    const headers = payload._headers || {};
    Object.entries(headers).forEach(([key, value]) => {
      curlParts.push(`  -H '${key}: ${value}'`);
    });

    // Add content-type header if we have data
    if (payload.data && !(payload.data instanceof FormData)) {
      curlParts.push(`  -H 'Content-Type: application/json'`);
    }

    // Add data
    if (payload.data) {
      if (payload.data instanceof FormData) {
        // For FormData, show form fields
        const formFields = [];
        for (let [key, value] of payload.data.entries()) {
          if (value instanceof File) {
            formFields.push(`  -F '${key}=@${value.name}'`);
          } else {
            formFields.push(`  -F '${key}=${value}'`);
          }
        }
        curlParts = curlParts.concat(formFields);
      } else {
        // For JSON data
        const jsonData = JSON.stringify(payload.data);
        // Use double quotes for curl data and escape internal double quotes
        const escapedData = jsonData
          .replace(/\\/g, "\\\\")
          .replace(/"/g, '\\"');
        curlParts.push(`  -d "${escapedData}"`);
      }
    }

    this.lastCurlCommand = curlParts.join(" \\\n");

    // Display curl command
    const curlSection = document.getElementById("curl-command-section");
    const curlText = document.getElementById("curl-command-text");

    if (curlSection && curlText) {
      curlText.textContent = this.lastCurlCommand;
      curlSection.classList.remove("hidden");
    }
  }

  copyCurlCommand() {
    if (!this.lastCurlCommand) return;

    navigator.clipboard
      .writeText(this.lastCurlCommand)
      .then(() => {
        showToast("cURL command copied to clipboard", "success");
      })
      .catch((err) => {
        showToast("Failed to copy cURL command", "error");
        console.error("Copy failed:", err);
      });
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}
