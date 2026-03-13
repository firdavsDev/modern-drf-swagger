/**
 * Response Viewer Component
 * Handles displaying API responses with syntax highlighting
 */

class ResponseViewer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.copyButton = document.getElementById("copy-response");
    this.currentResponse = null;
    this.currentRequest = null; // Store request context for ChatGPT

    if (this.copyButton) {
      this.copyButton.addEventListener("click", () => this.copyResponse());
    }
  }

  displayResponse(response, requestContext = null) {
    this.currentResponse = response;
    this.currentRequest = requestContext; // Store request for ChatGPT

    const statusClass = this.getStatusClass(response.status);
    const latencyClass = this.getLatencyClass(response.latency);

    let html = `
            <div class="space-y-4">
                <!-- Status and Metrics - Enhanced (Responsive) -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div class="bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-600 shadow-sm">
                        <div class="flex items-center gap-2 mb-2">
                            <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <p class="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Status</p>
                        </div>
                        <p class="text-2xl sm:text-3xl font-bold">
                            <span class="status-badge ${statusClass}">${response.status}</span>
                        </p>
                    </div>
                    <div class="bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-600 shadow-sm">
                        <div class="flex items-center gap-2 mb-2">
                            <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <p class="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Latency</p>
                        </div>
                        <p class="text-2xl sm:text-3xl font-bold ${latencyClass}">
                            ${response.latency}<span class="text-sm sm:text-base ml-1">ms</span>
                        </p>
                    </div>
                    <div class="bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-600 shadow-sm">
                        <div class="flex items-center gap-2 mb-2">
                            <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"></path>
                            </svg>
                            <p class="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Size</p>
                        </div>
                        <p class="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
                            ${this.formatBytes(response.size)}
                        </p>
                    </div>
                </div>
                
                <!-- Response Body - Prominent -->
                <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                        <h3 class="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            Response Body
                        </h3>
                        <div class="flex flex-wrap gap-2">
                            ${
                              response.status >= 400
                                ? `
                            <button 
                                onclick="window.responseViewer.solveWithChatGPT()" 
                                class="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105"
                                title="Get help from ChatGPT"
                            >
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M22.282 9.821a5.985 5.985 0 00-.516-4.91 6.046 6.046 0 00-6.51-2.9A6.065 6.065 0 004.981 4.18a5.985 5.985 0 00-3.998 2.9 6.046 6.046 0 00.743 7.097 5.98 5.98 0 00.51 4.911 6.051 6.051 0 006.515 2.9A5.985 5.985 0 0013.26 24a6.056 6.056 0 005.772-4.206 5.99 5.99 0 003.997-2.9 6.056 6.056 0 00-.747-7.073zM13.26 22.43a4.476 4.476 0 01-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 00.392-.681v-6.737l2.02 1.168a.071.071 0 01.038.052v5.583a4.504 4.504 0 01-4.494 4.494zM3.6 18.304a4.47 4.47 0 01-.535-3.014l.142.085 4.783 2.759a.771.771 0 00.78 0l5.843-3.369v2.332a.08.08 0 01-.033.062L9.74 19.95a4.5 4.5 0 01-6.14-1.646zM2.34 7.896a4.485 4.485 0 012.366-1.973V11.6a.766.766 0 00.388.676l5.815 3.355-2.02 1.168a.076.076 0 01-.071 0l-4.83-2.786A4.504 4.504 0 012.34 7.896zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 01.071 0l4.83 2.791a4.494 4.494 0 01-.676 8.105v-5.678a.79.79 0 00-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 00-.785 0L9.409 9.23V6.897a.066.066 0 01.028-.061l4.83-2.787a4.5 4.5 0 016.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 01-.038-.057V6.075a4.5 4.5 0 017.375-3.453l-.142.08L8.704 5.46a.795.795 0 00-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
                                </svg>
                                Ask ChatGPT
                            </button>
                            `
                                : ""
                            }
                            <button 
                                onclick="window.responseViewer.copyBody()" 
                                class="px-3 py-1.5 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg text-sm transition flex items-center gap-2 shadow-sm"
                                title="Copy response body"
                            >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                </svg>
                            </button>
                            <button 
                                onclick="window.responseViewer.downloadJson()" 
                                class="px-3 py-1.5 bg-green-600 dark:bg-green-500 hover:bg-green-700 dark:hover:bg-green-600 text-white rounded-lg text-sm transition flex items-center gap-2 shadow-sm"
                                title="Download as JSON file"
                            >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="p-4">
                        <div class="code-block max-h-96">
                            ${this.renderResponseBody(response.data)}
                        </div>
                    </div>
                </div>
                
                <!-- Response Headers - Collapsible -->
                ${this.renderHeadersCollapsible(response.headers)}
            </div>
        `;

    this.container.innerHTML = html;

    // Show copy button
    if (this.copyButton) {
      this.copyButton.classList.remove("hidden");
    }

    // Setup collapsible headers
    this.setupCollapsible();
  }

  setupCollapsible() {
    const toggle = document.getElementById("headers-toggle");
    const content = document.getElementById("headers-content");
    const icon = document.getElementById("headers-icon");

    if (toggle && content && icon) {
      toggle.addEventListener("click", () => {
        const isOpen = content.classList.contains("active");

        if (isOpen) {
          content.classList.remove("active");
          icon.style.transform = "rotate(0deg)";
        } else {
          content.classList.add("active");
          icon.style.transform = "rotate(180deg)";
        }
      });
    }
  }

  renderHeadersCollapsible(headers) {
    if (!headers || Object.keys(headers).length === 0) {
      return "";
    }

    return `
            <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <button id="headers-toggle" class="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <h3 class="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <svg class="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                        </svg>
                        Response Headers
                        <span class="text-xs text-gray-500 dark:text-gray-400 font-normal ml-2 bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full">${Object.keys(headers).length}</span>
                    </h3>
                    <div class="flex items-center gap-2">
                        <button 
                            onclick="event.stopPropagation(); window.responseViewer.copyHeaders();" 
                            class="px-3 py-1.5 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded text-sm transition text-gray-700 dark:text-gray-300 flex items-center gap-2"
                        >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                            </svg>
                            Copy
                        </button>
                        <svg id="headers-icon" class="w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </div>
                </button>
                <div id="headers-content" class="headers-collapsible-content">
                    <div class="p-4 code-block text-sm space-y-1 max-h-64 overflow-y-auto">
                        ${Object.entries(headers)
                          .map(
                            ([key, value]) => `
                            <div class="flex py-1">
                                <span class="json-key w-1/3 flex-shrink-0">${this.escapeHtml(key)}</span><span class="json-punctuation">:</span>
                                <span class="json-string ml-2 break-all">${this.escapeHtml(String(value))}</span>
                            </div>
                        `,
                          )
                          .join("")}
                    </div>
                </div>
            </div>
        `;
  }

  renderHeaders(headers) {
    if (!headers || Object.keys(headers).length === 0) {
      return "";
    }

    return `
            <div>
                <div class="flex items-center justify-between mb-2">
                    <h3 class="font-semibold text-gray-900 dark:text-gray-100">Headers</h3>
                    <button 
                        onclick="window.responseViewer.copyHeaders()" 
                        class="px-3 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded text-sm transition text-gray-700 dark:text-gray-300"
                    >
                        Copy
                    </button>
                </div>
                <div class="code-block text-sm space-y-1">
                    ${Object.entries(headers)
                      .map(
                        ([key, value]) => `
                        <div>
                            <span class="json-key">${this.escapeHtml(key)}</span><span class="json-punctuation">:</span>
                            <span class="json-string">${this.escapeHtml(String(value))}</span>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            </div>
        `;
  }

  renderResponseBody(data) {
    if (!data) {
      return '<span class="text-gray-600 dark:text-gray-400">No response body</span>';
    }

    if (typeof data === "string") {
      return `<pre class="whitespace-pre-wrap">${this.escapeHtml(data)}</pre>`;
    }

    // JSON syntax highlighting
    return this.syntaxHighlightJson(data);
  }

  syntaxHighlightJson(obj) {
    const json = JSON.stringify(obj, null, 2);

    // Simple syntax highlighting
    const highlighted = json
      .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?)/g, (match) => {
        let cls = "json-string";
        if (/:$/.test(match)) {
          cls = "json-key";
          // Don't nest spans - return them as siblings
          return `<span class="${cls}">${match.slice(0, -1)}</span><span class="json-punctuation">:</span>`;
        }
        return `<span class="${cls}">${match}</span>`;
      })
      .replace(/\b(true|false)\b/g, '<span class="json-boolean">$1</span>')
      .replace(/\b(null)\b/g, '<span class="json-null">$1</span>')
      .replace(/\b(-?\d+\.?\d*)\b/g, '<span class="json-number">$1</span>');

    return `<pre class="whitespace-pre-wrap font-mono text-sm leading-relaxed">${highlighted}</pre>`;
  }

  getStatusClass(status) {
    if (status >= 200 && status < 300) return "status-2xx";
    if (status >= 300 && status < 400) return "status-3xx";
    if (status >= 400 && status < 500) return "status-4xx";
    return "status-5xx";
  }

  getLatencyClass(latency) {
    if (latency < 200) return "latency-fast";
    if (latency < 1000) return "latency-medium";
    return "latency-slow";
  }

  formatBytes(bytes) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  copyResponse() {
    if (!this.currentResponse) return;

    const json = JSON.stringify(this.currentResponse.data, null, 2);

    navigator.clipboard
      .writeText(json)
      .then(() => {
        showToast("Response copied to clipboard", "success");
      })
      .catch((err) => {
        showToast("Failed to copy response", "error");
        console.error("Copy failed:", err);
      });
  }

  copyHeaders() {
    if (!this.currentResponse || !this.currentResponse.headers) return;

    const headersText = Object.entries(this.currentResponse.headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");

    navigator.clipboard
      .writeText(headersText)
      .then(() => {
        showToast("Headers copied to clipboard", "success");
      })
      .catch((err) => {
        showToast("Failed to copy headers", "error");
        console.error("Copy failed:", err);
      });
  }

  copyBody() {
    if (!this.currentResponse || !this.currentResponse.data) return;

    const bodyText =
      typeof this.currentResponse.data === "string"
        ? this.currentResponse.data
        : JSON.stringify(this.currentResponse.data, null, 2);

    navigator.clipboard
      .writeText(bodyText)
      .then(() => {
        showToast("Response body copied to clipboard", "success");
      })
      .catch((err) => {
        showToast("Failed to copy response body", "error");
        console.error("Copy failed:", err);
      });
  }

  downloadJson() {
    if (!this.currentResponse || !this.currentResponse.data) return;

    const bodyText =
      typeof this.currentResponse.data === "string"
        ? this.currentResponse.data
        : JSON.stringify(this.currentResponse.data, null, 2);

    // Create blob and download
    const blob = new Blob([bodyText], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    a.download = `response_${timestamp}.json`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast("Response downloaded as JSON", "success");
  }

  displayError(error, requestContext = null) {
    this.currentRequest = requestContext; // Store request for ChatGPT
    this.container.innerHTML = `
            <div class="bg-red-100 dark:bg-red-900 dark:bg-opacity-20 border-2 border-red-500 text-red-700 dark:text-red-400 rounded-lg p-6">
                <div class="flex items-start justify-between mb-4">
                    <h3 class="font-semibold text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Request Failed
                    </h3>
                </div>
                <p class="mb-5 text-base leading-relaxed">${this.escapeHtml(error.message || String(error))}</p>
                <button 
                    onclick="window.responseViewer.solveWithChatGPT()" 
                    class="w-full px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg text-base font-semibold transition flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                    title="Get help from ChatGPT"
                >
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M22.282 9.821a5.985 5.985 0 00-.516-4.91 6.046 6.046 0 00-6.51-2.9A6.065 6.065 0 004.981 4.18a5.985 5.985 0 00-3.998 2.9 6.046 6.046 0 00.743 7.097 5.98 5.98 0 00.51 4.911 6.051 6.051 0 006.515 2.9A5.985 5.985 0 0013.26 24a6.056 6.056 0 005.772-4.206 5.99 5.99 0 003.997-2.9 6.056 6.056 0 00-.747-7.073zM13.26 22.43a4.476 4.476 0 01-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 00.392-.681v-6.737l2.02 1.168a.071.071 0 01.038.052v5.583a4.504 4.504 0 01-4.494 4.494zM3.6 18.304a4.47 4.47 0 01-.535-3.014l.142.085 4.783 2.759a.771.771 0 00.78 0l5.843-3.369v2.332a.08.08 0 01-.033.062L9.74 19.95a4.5 4.5 0 01-6.14-1.646zM2.34 7.896a4.485 4.485 0 012.366-1.973V11.6a.766.766 0 00.388.676l5.815 3.355-2.02 1.168a.076.076 0 01-.071 0l-4.83-2.786A4.504 4.504 0 012.34 7.896zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 01.071 0l4.83 2.791a4.494 4.494 0 01-.676 8.105v-5.678a.79.79 0 00-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 00-.785 0L9.409 9.23V6.897a.066.066 0 01.028-.061l4.83-2.787a4.5 4.5 0 016.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 01-.038-.057V6.075a4.5 4.5 0 017.375-3.453l-.142.08L8.704 5.46a.795.795 0 00-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
                    </svg>
                    Ask ChatGPT
                </button>
            </div>
        `;

    // Hide copy button
    if (this.copyButton) {
      this.copyButton.classList.add("hidden");
    }
  }

  clear() {
    this.currentResponse = null;
    this.container.innerHTML = `
            <div class="text-center text-gray-500 dark:text-gray-400 py-12">
                <svg class="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <p>Send a request to see the response</p>
            </div>
        `;

    if (this.copyButton) {
      this.copyButton.classList.add("hidden");
    }
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  solveWithChatGPT() {
    if (!this.currentResponse && !this.currentRequest) {
      showToast("No error information available", "error");
      return;
    }

    // Build the context for ChatGPT
    let prompt =
      "I'm getting an API error and need help solving it. Here are the details:\n\n";

    // Add request information if available
    if (this.currentRequest) {
      prompt += "**Request Details:**\n";
      prompt += `- Method: ${this.currentRequest.method || "Unknown"}\n`;
      prompt += `- Endpoint: ${this.currentRequest.path || "Unknown"}\n`;

      if (
        this.currentRequest.params &&
        Object.keys(this.currentRequest.params).length > 0
      ) {
        prompt += `- Query Parameters: \`\`\`json\n${JSON.stringify(this.currentRequest.params, null, 2)}\n\`\`\`\n`;
      }

      if (
        this.currentRequest.data &&
        !this.currentRequest.data.toString().includes("[object FormData]")
      ) {
        const bodyData =
          typeof this.currentRequest.data === "string"
            ? this.currentRequest.data
            : JSON.stringify(this.currentRequest.data, null, 2);
        prompt += `- Request Body: \`\`\`json\n${bodyData}\n\`\`\`\n`;
      }

      if (
        this.currentRequest.headers &&
        Object.keys(this.currentRequest.headers).length > 0
      ) {
        prompt += `- Headers: \`\`\`json\n${JSON.stringify(this.currentRequest.headers, null, 2)}\n\`\`\`\n`;
      }
      prompt += "\n";
    }

    // Add response information if available
    if (this.currentResponse) {
      prompt += "**Response Details:**\n";
      prompt += `- Status Code: ${this.currentResponse.status}\n`;

      if (this.currentResponse.data) {
        const responseData =
          typeof this.currentResponse.data === "string"
            ? this.currentResponse.data
            : JSON.stringify(this.currentResponse.data, null, 2);
        prompt += `- Response Body: \`\`\`json\n${responseData}\n\`\`\`\n`;
      }

      if (this.currentResponse.latency) {
        prompt += `- Latency: ${this.currentResponse.latency}ms\n`;
      }
    }

    // Add the question
    prompt += "\n**Questions:**\n";
    prompt += "1. What does this error mean?\n";
    prompt += "2. What are the most likely causes?\n";
    prompt += "3. How can I fix this issue?\n";
    prompt +=
      "4. Are there any best practices I should follow to prevent this in the future?\n";

    // Encode the prompt for URL
    const encodedPrompt = encodeURIComponent(prompt);

    // Open ChatGPT with the pre-filled prompt
    const chatGPTUrl = `https://chat.openai.com/?q=${encodedPrompt}`;
    window.open(chatGPTUrl, "_blank");

    showToast("Opening ChatGPT with error details...", "success");
  }
}
