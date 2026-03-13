/**
 * Request Editor Component
 * Handles building and sending API requests
 */

class RequestEditor {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.currentEndpoint = null;
    this.fullSchema = null;
    this.onSendCallback = null;
    // Make globally accessible for copy button
    window.requestEditor = this;
  }

  loadEndpoint(endpoint, fullSchema = null) {
    this.currentEndpoint = endpoint;
    this.fullSchema = fullSchema;
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

    // Determine lock icon HTML
    const lockIcon = endpoint.requiresAuth
      ? `<svg class="w-4 h-4 text-yellow-500 dark:text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" title="Authentication required">
           <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"></path>
         </svg>`
      : `<svg class="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" title="Public endpoint">
           <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z"></path>
         </svg>`;

    const authBadge = endpoint.requiresAuth
      ? `<span class="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-full text-xs font-medium">
           ${lockIcon}
           <span>Authentication Required</span>
         </span>`
      : `<span class="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full text-xs font-medium">
           ${lockIcon}
           <span>Public Access</span>
         </span>`;

    let html = `
            <div class="space-y-4">
                <!-- Endpoint Info -->
                <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <div class="flex items-center gap-3 mb-2 flex-wrap">
                        <span class="method-badge method-${endpoint.method.toLowerCase()} flex-shrink-0">
                            ${endpoint.method}
                        </span>
                        <span class="font-mono text-lg text-gray-900 dark:text-gray-100 flex-1 min-w-0 break-all">${this.escapeHtml(endpoint.path)}</span>
                        <div class="flex-shrink-0">${authBadge}</div>
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
                        <button class="request-tab border-b-2 border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 px-6 py-3 text-sm font-medium transition-colors" data-tab="responses">
                            <span class="flex items-center gap-2">
                                Responses
                                <span class="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs px-2 py-0.5 rounded-full">${Object.keys(endpoint.responses || {}).length}</span>
                            </span>
                        </button>
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
                                          placeholder='{\n  "Custom-Header": "value"\n}'></textarea>
                                <p class="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                                    </svg>
                                    Click "Authorize" in sidebar to set up global authentication (one-time setup)
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
                        
                        <div class="tab-content" data-tab-content="responses">
                            ${this.renderResponseSchemas(endpoint)}
                        </div>
                    </div>
                </div>
                
                <!-- Send Button -->
                <button id="send-request-btn" 
                        class="w-full ${window.PORTAL_CONFIG?.canSendRequest === false ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"} text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                        ${window.PORTAL_CONFIG?.canSendRequest === false ? "disabled" : ""}>
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                    </svg>
                    ${window.PORTAL_CONFIG?.canSendRequest === false ? "View Only - No Send Permission" : "Send Request"}
                </button>
                ${window.PORTAL_CONFIG?.canSendRequest === false ? '<p class="text-sm text-yellow-600 dark:text-yellow-400 mt-2 text-center">⚠️ You need DEVELOPER role or higher to send requests</p>' : ""}
                
                <!-- Code Generation Section -->
                <div id="code-generation-section" class="mt-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                        <h3 class="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <svg class="w-5 h-5 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                            </svg>
                            Code Generation
                        </h3>
                    </div>
                    <div class="p-4">
                        ${window.codeGenerator ? window.codeGenerator.renderUI(endpoint, () => this.getRequestConfig()) : '<p class="text-gray-500">Code generator not available</p>'}
                    </div>
                </div>
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

    // Add event listener for smart defaults button (if it exists)
    const smartDefaultsBtn = document.getElementById(
      "populate-smart-defaults-btn",
    );
    if (smartDefaultsBtn) {
      smartDefaultsBtn.addEventListener("click", () => {
        this.populateSmartDefaults();
      });
    }
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
          <div class="flex items-center justify-between mb-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Request Body
              <span class="text-gray-500 dark:text-gray-400 font-normal ml-2 text-xs">(JSON)</span>
            </label>
            ${
              schema
                ? `
            <button id="populate-smart-defaults-btn" 
                    class="text-xs px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-1.5 font-medium shadow-sm hover:shadow"
                    title="Populate with smart default values based on schema">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
              Smart Defaults
            </button>
            `
                : ""
            }
          </div>
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

  resolveSchemaRef(schema) {
    if (!schema) return null;

    // If it's a $ref, resolve it
    if (schema.$ref && this.fullSchema) {
      // Parse the $ref path (e.g., "#/components/schemas/TaskList")
      const refPath = schema.$ref.replace("#/", "").split("/");
      let resolved = this.fullSchema;

      for (const part of refPath) {
        resolved = resolved[part];
        if (!resolved) {
          console.warn("Could not resolve $ref:", schema.$ref);
          return schema;
        }
      }

      return resolved;
    }

    return schema;
  }

  renderResponseSchemas(endpoint) {
    const responses = endpoint.responses || {};

    if (Object.keys(responses).length === 0) {
      return `
        <div class="text-center py-8 text-gray-500 dark:text-gray-400">
          <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <p class="text-sm">No response schemas defined</p>
        </div>
      `;
    }

    let html = '<div class="space-y-4">';

    // Sort response codes (2xx, 4xx, 5xx)
    const sortedCodes = Object.keys(responses).sort((a, b) => {
      const numA = parseInt(a) || 999;
      const numB = parseInt(b) || 999;
      return numA - numB;
    });

    sortedCodes.forEach((code) => {
      const response = responses[code];
      const description = response.description || "";
      const statusClass = this.getStatusClassForCode(code);

      // Get media type content (usually application/json)
      const content = response.content || {};
      const mediaTypes = Object.keys(content);
      const hasContent = mediaTypes.length > 0;

      html += `
        <div class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-600 overflow-hidden">
          <!-- Response Code Header -->
          <div class="bg-gray-50 dark:bg-gray-700/50 p-4 border-b border-gray-200 dark:border-gray-600">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-3">
                <span class="status-badge ${statusClass} text-lg font-bold px-4 py-1.5">${code}</span>
                <div>
                  <p class="text-sm font-semibold text-gray-900 dark:text-white">${description}</p>
                  ${hasContent ? `<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Media Type: ${mediaTypes.join(", ")}</p>` : ""}
                </div>
              </div>
            </div>
          </div>
      `;

      // Render content for each media type
      if (hasContent) {
        mediaTypes.forEach((mediaType) => {
          const mediaContent = content[mediaType];
          let schema = mediaContent.schema;

          if (schema) {
            // Resolve $ref if present
            schema = this.resolveSchemaRef(schema);

            // Generate unique ID for this response
            const responseId = `response_${code}_${mediaType.replace(/[^a-z0-9]/gi, "_")}`;

            // Generate example from schema
            const exampleJson =
              this.generateExampleFromSchemaForResponse(schema);
            const schemaJson = this.generateSchemaDisplay(schema);

            html += `
              <div class="p-4">
                <!-- Tab Headers for Example/Schema -->
                <div class="flex gap-2 mb-3 border-b border-gray-200 dark:border-gray-600">
                  <button class="response-schema-tab active px-4 py-2 text-sm font-medium transition-colors border-b-2 border-blue-600 text-blue-600 dark:text-blue-400" 
                          data-response-id="${responseId}" 
                          data-tab-type="example">
                    Example Value
                  </button>
                  <button class="response-schema-tab px-4 py-2 text-sm font-medium transition-colors border-b-2 border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200" 
                          data-response-id="${responseId}" 
                          data-tab-type="schema">
                    Schema
                  </button>
                </div>

                <!-- Example Value Tab -->
                <div class="response-schema-content active" data-response-id="${responseId}" data-content-type="example">
                  <div class="relative">
                    <div class="code-block max-h-96 overflow-auto p-3 rounded-lg">
                      <pre class="text-xs font-mono text-gray-900 dark:text-gray-100">${this.syntaxHighlightJson(exampleJson)}</pre>
                    </div>
                    <button 
                      class="copy-json-btn absolute top-2 right-2 px-3 py-1.5 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded text-xs transition flex items-center gap-1.5 shadow-sm"
                      data-copy-content="${btoa(encodeURIComponent(exampleJson))}"
                      data-success-message="Example copied"
                    >
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                      </svg>
                      Copy
                    </button>
                  </div>
                </div>

                <!-- Schema Tab -->
                <div class="response-schema-content" data-response-id="${responseId}" data-content-type="schema">
                  <div class="relative">
                    <div class="code-block max-h-96 overflow-auto p-3 rounded-lg">
                      <pre class="text-xs font-mono text-gray-900 dark:text-gray-100">${this.syntaxHighlightJson(schemaJson)}</pre>
                    </div>
                    <button 
                      class="copy-json-btn absolute top-2 right-2 px-3 py-1.5 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded text-xs transition flex items-center gap-1.5 shadow-sm"
                      data-copy-content="${btoa(encodeURIComponent(schemaJson))}"
                      data-success-message="Schema copied"
                    >
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                      </svg>
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            `;
          }
        });
      } else {
        html += `
          <div class="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
            No content defined for this response
          </div>
        `;
      }

      html += "</div>";
    });

    html += "</div>";

    // Add event listener setup after render
    setTimeout(() => {
      this.setupResponseSchemaTabs();
      this.setupCopyButtons();
    }, 0);

    return html;
  }

  setupResponseSchemaTabs() {
    const tabs = document.querySelectorAll(".response-schema-tab");

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const responseId = tab.dataset.responseId;
        const tabType = tab.dataset.tabType;

        // Get all tabs and contents for this response
        const relatedTabs = document.querySelectorAll(
          `[data-response-id="${responseId}"]`,
        );

        // Remove active class from all related tabs
        relatedTabs.forEach((t) => {
          if (t.classList.contains("response-schema-tab")) {
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
            );
          } else if (t.classList.contains("response-schema-content")) {
            t.classList.remove("active");
          }
        });

        // Add active class to clicked tab
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
        );

        // Show corresponding content
        const content = document.querySelector(
          `.response-schema-content[data-response-id="${responseId}"][data-content-type="${tabType}"]`,
        );
        if (content) {
          content.classList.add("active");
        }
      });
    });
  }

  getStatusClassForCode(code) {
    const numCode = parseInt(code);
    if (numCode >= 200 && numCode < 300) return "status-success";
    if (numCode >= 300 && numCode < 400) return "status-redirect";
    if (numCode >= 400 && numCode < 500) return "status-client-error";
    if (numCode >= 500) return "status-server-error";
    return "status-default";
  }

  generateExampleFromSchemaForResponse(schema) {
    // Resolve any $ref first
    schema = this.resolveSchemaRef(schema);

    if (!schema) {
      return JSON.stringify(null, null, 2);
    }

    // If there's an example, use it
    if (schema.example) {
      return JSON.stringify(schema.example, null, 2);
    }

    // Handle array types
    if (schema.type === "array" && schema.items) {
      const resolvedItems = this.resolveSchemaRef(schema.items);
      const itemExample = this.generateExampleObjectFromSchema(resolvedItems);
      return JSON.stringify([itemExample], null, 2);
    }

    // Handle object types
    if (schema.type === "object" || schema.properties) {
      const example = this.generateExampleObjectFromSchema(schema);
      return JSON.stringify(example, null, 2);
    }

    // Handle primitive types
    return JSON.stringify(this.getExampleForType(schema), null, 2);
  }

  generateExampleObjectFromSchema(schema) {
    // Resolve any $ref first
    schema = this.resolveSchemaRef(schema);

    if (!schema) return null;

    if (schema.example) return schema.example;

    if (schema.properties) {
      const example = {};
      for (const [key, prop] of Object.entries(schema.properties)) {
        example[key] = this.getExampleForProperty(prop);
      }
      return example;
    }

    return this.getExampleForType(schema);
  }

  getExampleForProperty(prop) {
    // Resolve any $ref first
    prop = this.resolveSchemaRef(prop);

    if (!prop) return null;

    if (prop.example !== undefined) return prop.example;

    if (prop.type === "array" && prop.items) {
      const resolvedItems = this.resolveSchemaRef(prop.items);
      return [this.getExampleForProperty(resolvedItems)];
    }

    if (prop.type === "object" && prop.properties) {
      return this.generateExampleObjectFromSchema(prop);
    }

    return this.getExampleForType(prop);
  }

  getExampleForType(schema) {
    const type = schema.type;
    const format = schema.format;

    if (type === "string") {
      if (format === "email") return "user@example.com";
      if (format === "date") return new Date().toISOString().split("T")[0];
      if (format === "date-time") return new Date().toISOString();
      if (format === "uuid") return "3fa85f64-5717-4562-b3fc-2c963f66afa6";
      if (format === "uri" || format === "url") return "http://example.com";
      if (format === "password") return "password123";
      if (schema.enum && schema.enum.length > 0) return schema.enum[0];
      if (schema.maxLength && schema.maxLength < 50) {
        return "string".padEnd(Math.min(schema.maxLength, 10), "X");
      }
      return "string";
    }

    if (type === "integer") {
      if (schema.minimum !== undefined) return schema.minimum;
      if (schema.enum && schema.enum.length > 0) return schema.enum[0];
      return 0;
    }

    if (type === "number") {
      if (schema.minimum !== undefined) return schema.minimum;
      if (schema.enum && schema.enum.length > 0) return schema.enum[0];
      return 0.0;
    }

    if (type === "boolean") {
      if (schema.default !== undefined) return schema.default;
      return true;
    }

    if (type === "array") {
      if (schema.items) {
        const resolvedItems = this.resolveSchemaRef(schema.items);
        return [this.getExampleForProperty(resolvedItems)];
      }
      return [];
    }

    if (type === "object") {
      if (schema.properties) {
        return this.generateExampleObjectFromSchema(schema);
      }
      return {};
    }

    return null;
  }

  generateSchemaDisplay(schema) {
    // Resolve any $ref first
    schema = this.resolveSchemaRef(schema);

    if (!schema) {
      return JSON.stringify({ error: "Schema not found" }, null, 2);
    }

    // Create a simplified schema view
    const schemaDisplay = {
      type: schema.type || "object",
    };

    if (schema.description) {
      schemaDisplay.description = schema.description;
    }

    if (schema.properties) {
      schemaDisplay.properties = {};
      for (const [key, prop] of Object.entries(schema.properties)) {
        const resolvedProp = this.resolveSchemaRef(prop);
        schemaDisplay.properties[key] =
          this.getPropertySchemaInfo(resolvedProp);
      }
    }

    if (schema.required && schema.required.length > 0) {
      schemaDisplay.required = schema.required;
    }

    if (schema.items) {
      const resolvedItems = this.resolveSchemaRef(schema.items);
      schemaDisplay.items = this.getPropertySchemaInfo(resolvedItems);
    }

    return JSON.stringify(schemaDisplay, null, 2);
  }

  getPropertySchemaInfo(prop) {
    if (!prop) return { type: "unknown" };

    const info = {
      type: prop.type || "unknown",
    };

    if (prop.format) info.format = prop.format;
    if (prop.description) info.description = prop.description;
    if (prop.enum) info.enum = prop.enum;
    if (prop.default !== undefined) info.default = prop.default;
    if (prop.nullable) info.nullable = prop.nullable;
    if (prop.readOnly) info.readOnly = prop.readOnly;
    if (prop.writeOnly) info.writeOnly = prop.writeOnly;
    if (prop.minLength !== undefined) info.minLength = prop.minLength;
    if (prop.maxLength !== undefined) info.maxLength = prop.maxLength;
    if (prop.minimum !== undefined) info.minimum = prop.minimum;
    if (prop.maximum !== undefined) info.maximum = prop.maximum;

    if (prop.items) {
      const resolvedItems = this.resolveSchemaRef(prop.items);
      info.items = this.getPropertySchemaInfo(resolvedItems);
    }

    if (prop.properties) {
      info.properties = {};
      for (const [key, nestedProp] of Object.entries(prop.properties)) {
        const resolved = this.resolveSchemaRef(nestedProp);
        info.properties[key] = this.getPropertySchemaInfo(resolved);
      }
    }

    return info;
  }

  syntaxHighlightJson(jsonString) {
    // Simple syntax highlighting for JSON
    return jsonString
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/(".*?")/g, '<span class="json-string">$1</span>')
      .replace(/\b(\d+)\b/g, '<span class="json-number">$1</span>')
      .replace(/\b(true|false)\b/g, '<span class="json-boolean">$1</span>')
      .replace(/\b(null)\b/g, '<span class="json-null">$1</span>')
      .replace(/([{}\[\],:])/g, '<span class="json-punctuation">$1</span>');
  }

  setupCopyButtons() {
    const copyButtons = document.querySelectorAll(".copy-json-btn");
    copyButtons.forEach((button) => {
      button.addEventListener("click", () => {
        // Decode Base64 content
        const encodedContent = button.dataset.copyContent;
        const content = decodeURIComponent(atob(encodedContent));
        const successMessage =
          button.dataset.successMessage || "Copied to clipboard";
        this.copyToClipboard(content, successMessage);
      });
    });
  }

  copyToClipboard(text, successMessage = "Copied to clipboard") {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        showToast(successMessage, "success");
      })
      .catch((err) => {
        showToast("Failed to copy", "error");
        console.error("Copy failed:", err);
      });
  }

  normalizeSchema(schema, depth = 0) {
    if (!schema || depth > 5) {
      return schema;
    }

    let resolved = this.resolveSchemaRef(schema) || schema;

    if (resolved.allOf && resolved.allOf.length > 0) {
      const merged = { ...resolved, properties: {}, required: [] };
      for (const part of resolved.allOf) {
        const normalizedPart = this.normalizeSchema(part, depth + 1);
        if (!normalizedPart) {
          continue;
        }
        if (normalizedPart.properties) {
          merged.properties = {
            ...merged.properties,
            ...normalizedPart.properties,
          };
        }
        if (Array.isArray(normalizedPart.required)) {
          merged.required = [...merged.required, ...normalizedPart.required];
        }
      }
      merged.required = [...new Set(merged.required)];
      delete merged.allOf;
      resolved = merged;
    }

    if (resolved.oneOf && resolved.oneOf.length > 0) {
      resolved = this.normalizeSchema(resolved.oneOf[0], depth + 1) || resolved;
    }

    if (resolved.anyOf && resolved.anyOf.length > 0) {
      resolved = this.normalizeSchema(resolved.anyOf[0], depth + 1) || resolved;
    }

    return resolved;
  }

  generateExampleFromSchema(schema, depth = 0) {
    schema = this.normalizeSchema(schema, depth);
    if (!schema) {
      return "{\n  \n}";
    }

    // Prevent infinite recursion
    if (depth > 5) {
      return null;
    }

    // Use existing example if available
    if (schema.example !== undefined) {
      return JSON.stringify(schema.example, null, 2);
    }

    // Use default value if available
    if (schema.default !== undefined) {
      return JSON.stringify(schema.default, null, 2);
    }

    // Handle different schema types
    if (schema.type === "object" || schema.properties) {
      return JSON.stringify(
        this.generateSmartObjectExample(schema, depth),
        null,
        2,
      );
    }

    if (schema.type === "array") {
      return JSON.stringify(
        this.generateSmartArrayExample(schema, depth),
        null,
        2,
      );
    }

    // For primitive types at top level, wrap in an object
    if (schema.type) {
      return JSON.stringify(
        this.generateSmartValue("value", schema, depth),
        null,
        2,
      );
    }

    return "{\n  \n}";
  }

  generateSmartObjectExample(schema, depth = 0) {
    schema = this.normalizeSchema(schema, depth);
    const example = {};

    if (!schema.properties) {
      return example;
    }

    // Prioritize required fields
    const requiredFields = schema.required || [];

    for (const [key, prop] of Object.entries(schema.properties)) {
      // Always include required fields, optionally include others (50% chance)
      const shouldInclude = requiredFields.includes(key) || Math.random() > 0.5;

      if (shouldInclude) {
        example[key] = this.generateSmartValue(key, prop, depth + 1);
      }
    }

    return example;
  }

  generateSmartArrayExample(schema, depth = 0) {
    schema = this.normalizeSchema(schema, depth);

    // Check if there's an items schema
    if (!schema.items) {
      return [];
    }

    // Generate 1-2 example items
    const numItems = schema.minItems || 1;
    const items = [];

    for (let i = 0; i < numItems; i++) {
      const item = this.generateSmartValue(
        `item_${i}`,
        schema.items,
        depth + 1,
      );
      items.push(item);
    }

    return items;
  }

  generateSmartValue(fieldName, schema, depth = 0) {
    schema = this.normalizeSchema(schema, depth);
    if (!schema) {
      return null;
    }

    // Check for example first
    if (schema.example !== undefined) {
      return schema.example;
    }

    // Check for default value
    if (schema.default !== undefined) {
      return schema.default;
    }

    // Handle enums
    if (schema.enum && schema.enum.length > 0) {
      return schema.enum[0];
    }

    // Handle different types
    if (schema.type === "object" || schema.properties) {
      return this.generateSmartObjectExample(schema, depth);
    }

    if (schema.type === "array") {
      return this.generateSmartArrayExample(schema, depth);
    }

    if (schema.type === "string") {
      return this.generateSmartString(fieldName, schema);
    }

    if (schema.type === "integer") {
      return this.generateSmartInteger(fieldName, schema);
    }

    if (schema.type === "number") {
      return this.generateSmartNumber(fieldName, schema);
    }

    if (schema.type === "boolean") {
      return this.generateSmartBoolean(fieldName, schema);
    }

    // Default fallback
    return null;
  }

  generateSmartString(fieldName, schema) {
    const lowerKey = fieldName.toLowerCase();

    // Check for format hints
    if (schema.format) {
      switch (schema.format) {
        case "email":
          return "user@example.com";
        case "uri":
        case "url":
          return "https://example.com";
        case "date":
          return new Date().toISOString().split("T")[0];
        case "date-time":
          return new Date().toISOString();
        case "time":
          return "12:00:00";
        case "uuid":
          return "123e4567-e89b-12d3-a456-426614174000";
        case "ipv4":
          return "192.168.1.1";
        case "ipv6":
          return "2001:0db8:85a3:0000:0000:8a2e:0370:7334";
        case "hostname":
          return "example.com";
        case "password":
          return "********";
        default:
          break;
      }
    }

    // Smart defaults based on field name patterns
    if (lowerKey.includes("email") || lowerKey.includes("e-mail")) {
      return "user@example.com";
    }
    if (
      lowerKey.includes("phone") ||
      lowerKey.includes("mobile") ||
      lowerKey.includes("tel")
    ) {
      return "+1234567890";
    }
    if (
      lowerKey.includes("url") ||
      lowerKey.includes("link") ||
      lowerKey.includes("website")
    ) {
      return "https://example.com";
    }
    if (lowerKey.includes("address") || lowerKey.includes("street")) {
      return "123 Main St";
    }
    if (lowerKey.includes("city")) {
      return "New York";
    }
    if (lowerKey.includes("state") || lowerKey.includes("province")) {
      return "NY";
    }
    if (lowerKey.includes("country")) {
      return "USA";
    }
    if (lowerKey.includes("zip") || lowerKey.includes("postal")) {
      return "10001";
    }
    if (lowerKey.includes("name")) {
      if (lowerKey.includes("first")) return "John";
      if (lowerKey.includes("last")) return "Doe";
      if (lowerKey.includes("user")) return "johndoe";
      if (lowerKey.includes("company")) return "Acme Corp";
      return "John Doe";
    }
    if (lowerKey.includes("title")) {
      return "Example Title";
    }
    if (lowerKey.includes("description") || lowerKey.includes("bio")) {
      return "This is an example description";
    }
    if (lowerKey.includes("username") || lowerKey === "user") {
      return "johndoe";
    }
    if (lowerKey.includes("password") || lowerKey.includes("pwd")) {
      return "********";
    }
    if (lowerKey.includes("token") || lowerKey.includes("key")) {
      return "abc123def456";
    }
    if (lowerKey.includes("color") || lowerKey.includes("colour")) {
      return "#3B82F6";
    }
    if (lowerKey.includes("code")) {
      return "ABC123";
    }
    if (lowerKey.includes("status")) {
      return "active";
    }
    if (lowerKey.includes("type") || lowerKey.includes("category")) {
      return "general";
    }
    if (lowerKey.includes("tag")) {
      return "example";
    }
    if (lowerKey.includes("slug")) {
      return "example-slug";
    }
    if (
      lowerKey.includes("content") ||
      lowerKey.includes("text") ||
      lowerKey.includes("message")
    ) {
      return "Example content";
    }

    // Check for length constraints
    if (schema.maxLength) {
      if (schema.maxLength <= 10) {
        return "short";
      }
      if (schema.maxLength <= 50) {
        return "Example text";
      }
    }

    // Check for pattern (basic UUID detection)
    if (schema.pattern && schema.pattern.includes("[0-9a-f]")) {
      return "123e4567-e89b-12d3-a456-426614174000";
    }

    // Generic default
    return `example_${fieldName}`;
  }

  generateSmartInteger(fieldName, schema) {
    const lowerKey = fieldName.toLowerCase();

    // Check for constraints
    if (schema.minimum !== undefined) {
      return schema.minimum;
    }
    if (schema.exclusiveMinimum !== undefined) {
      return schema.exclusiveMinimum + 1;
    }

    // Smart defaults based on field name
    if (lowerKey.includes("age")) {
      return 25;
    }
    if (lowerKey.includes("year")) {
      return new Date().getFullYear();
    }
    if (lowerKey.includes("month")) {
      return new Date().getMonth() + 1;
    }
    if (lowerKey.includes("day")) {
      return new Date().getDate();
    }
    if (
      lowerKey.includes("count") ||
      lowerKey.includes("quantity") ||
      lowerKey.includes("qty")
    ) {
      return 1;
    }
    if (
      lowerKey.includes("price") ||
      lowerKey.includes("amount") ||
      lowerKey.includes("cost")
    ) {
      return 100;
    }
    if (lowerKey.includes("page")) {
      return 1;
    }
    if (lowerKey.includes("limit") || lowerKey.includes("size")) {
      return 10;
    }
    if (lowerKey.includes("offset") || lowerKey.includes("skip")) {
      return 0;
    }
    if (lowerKey.includes("percent") || lowerKey.includes("percentage")) {
      return 50;
    }
    if (lowerKey.includes("score") || lowerKey.includes("rating")) {
      return 5;
    }
    if (lowerKey.includes("priority")) {
      return 1;
    }
    if (lowerKey === "id" || lowerKey.endsWith("_id")) {
      return 1;
    }

    // Default
    return 0;
  }

  generateSmartNumber(fieldName, schema) {
    const lowerKey = fieldName.toLowerCase();

    // Check for constraints
    if (schema.minimum !== undefined) {
      return schema.minimum;
    }
    if (schema.exclusiveMinimum !== undefined) {
      return schema.exclusiveMinimum + 0.1;
    }

    // Smart defaults based on field name
    if (
      lowerKey.includes("price") ||
      lowerKey.includes("amount") ||
      lowerKey.includes("cost")
    ) {
      return 99.99;
    }
    if (
      lowerKey.includes("rate") ||
      lowerKey.includes("percentage") ||
      lowerKey.includes("percent")
    ) {
      return 0.5;
    }
    if (lowerKey.includes("latitude") || lowerKey === "lat") {
      return 40.7128;
    }
    if (
      lowerKey.includes("longitude") ||
      lowerKey === "lng" ||
      lowerKey === "lon"
    ) {
      return -74.006;
    }
    if (lowerKey.includes("temperature") || lowerKey.includes("temp")) {
      return 20.5;
    }
    if (lowerKey.includes("weight")) {
      return 75.5;
    }
    if (lowerKey.includes("height")) {
      return 175.0;
    }
    if (lowerKey.includes("distance")) {
      return 10.5;
    }
    if (lowerKey.includes("score") || lowerKey.includes("rating")) {
      return 4.5;
    }

    // Default
    return 0.0;
  }

  generateSmartBoolean(fieldName, schema) {
    const lowerKey = fieldName.toLowerCase();

    // Smart defaults based on field name
    if (lowerKey.includes("active") || lowerKey.includes("enabled")) {
      return true;
    }
    if (lowerKey.includes("deleted") || lowerKey.includes("disabled")) {
      return false;
    }
    if (lowerKey.includes("public") || lowerKey.includes("published")) {
      return true;
    }
    if (lowerKey.includes("verified") || lowerKey.includes("confirmed")) {
      return false;
    }
    if (lowerKey.includes("required") || lowerKey.includes("mandatory")) {
      return false;
    }

    // Default
    return false;
  }

  async sendRequest() {
    if (!this.currentEndpoint) return;

    // Check if user has permission to send requests
    if (window.PORTAL_CONFIG?.canSendRequest === false) {
      alert(
        "You do not have permission to send requests. Please contact your administrator to upgrade your role to DEVELOPER or higher.",
      );
      return;
    }

    const button = document.getElementById("send-request-btn");
    button.disabled = true;
    button.innerHTML = `
          <span class="spinner w-5 h-5 border-2" aria-hidden="true"></span>
          <span>Sending...</span>
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

      let authRequestConfig = { headers: {}, params: {}, cookies: {} };

      // Merge with global authentication configuration
      if (window.globalAuth) {
        authRequestConfig = window.globalAuth.getAuthRequestConfig();
        const globalAuthHeaders = authRequestConfig.headers;
        // Global auth headers take precedence if not overridden in custom headers
        customHeaders = { ...globalAuthHeaders, ...customHeaders };
        Object.assign(params, authRequestConfig.params);
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
        _cookies: authRequestConfig.cookies,
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

  populateSmartDefaults() {
    if (!this.currentEndpoint || !this.currentEndpoint.requestBody) {
      return;
    }

    const bodyTextarea = document.getElementById("request-body");
    if (!bodyTextarea) {
      return;
    }

    // Get the schema
    const content = this.currentEndpoint.requestBody.content;
    const jsonMediaType = Object.keys(content || {}).find(
      (mediaType) =>
        mediaType === "application/json" || mediaType.endsWith("+json"),
    );
    const jsonContent = jsonMediaType ? content[jsonMediaType] : null;

    if (!jsonContent?.schema) {
      showToast("No schema available for smart defaults", "warning");
      return;
    }

    try {
      // Generate new smart defaults
      const smartJson = this.generateExampleFromSchema(jsonContent.schema);

      if (!smartJson || smartJson === "{\n  \n}") {
        showToast(
          "Could not derive smart defaults from this schema",
          "warning",
        );
        return;
      }

      // Populate the textarea
      bodyTextarea.value = smartJson;

      // Trigger validation
      bodyTextarea.dispatchEvent(new Event("input"));

      // Show success message
      showToast("Smart defaults populated successfully", "success");

      // Visually highlight the textarea briefly
      bodyTextarea.classList.add(
        "ring-2",
        "ring-purple-500",
        "dark:ring-purple-400",
      );
      setTimeout(() => {
        bodyTextarea.classList.remove(
          "ring-2",
          "ring-purple-500",
          "dark:ring-purple-400",
        );
      }, 1000);
    } catch (error) {
      console.error("Failed to populate smart defaults:", error);
      showToast("Failed to populate smart defaults", "error");
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
