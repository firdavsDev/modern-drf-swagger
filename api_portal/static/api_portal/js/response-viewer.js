/**
 * Response Viewer Component
 * Handles displaying API responses with syntax highlighting
 */

class ResponseViewer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.copyButton = document.getElementById("copy-response");
    this.currentResponse = null;

    if (this.copyButton) {
      this.copyButton.addEventListener("click", () => this.copyResponse());
    }
  }

  displayResponse(response) {
    this.currentResponse = response;

    const statusClass = this.getStatusClass(response.status);
    const latencyClass = this.getLatencyClass(response.latency);

    let html = `
            <div class="space-y-4">
                <!-- Status and Metrics - Enhanced -->
                <div class="grid grid-cols-3 gap-4">
                    <div class="bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 shadow-sm">
                        <div class="flex items-center gap-2 mb-2">
                            <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <p class="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Status</p>
                        </div>
                        <p class="text-3xl font-bold">
                            <span class="status-badge ${statusClass}">${response.status}</span>
                        </p>
                    </div>
                    <div class="bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 shadow-sm">
                        <div class="flex items-center gap-2 mb-2">
                            <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <p class="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Latency</p>
                        </div>
                        <p class="text-3xl font-bold ${latencyClass}">
                            ${response.latency}<span class="text-base ml-1">ms</span>
                        </p>
                    </div>
                    <div class="bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 shadow-sm">
                        <div class="flex items-center gap-2 mb-2">
                            <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"></path>
                            </svg>
                            <p class="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Size</p>
                        </div>
                        <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">
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
                        <button 
                            onclick="window.responseViewer.copyBody()" 
                            class="px-3 py-1.5 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded text-sm transition flex items-center gap-2 shadow-sm"
                        >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                            </svg>
                            Copy
                        </button>
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

  displayError(error) {
    this.container.innerHTML = `
            <div class="bg-red-100 dark:bg-red-900 dark:bg-opacity-20 border border-red-500 text-red-700 dark:text-red-400 rounded-lg p-4">
                <h3 class="font-semibold mb-2 text-gray-900 dark:text-gray-100">Error</h3>
                <p>${this.escapeHtml(error.message || String(error))}</p>
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
}
