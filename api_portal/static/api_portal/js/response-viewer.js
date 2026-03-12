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
                <!-- Status and Metrics -->
                <div class="flex gap-4">
                    <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 flex-1">
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Status</p>
                        <p class="text-2xl font-bold">
                            <span class="status-badge ${statusClass}">${response.status}</span>
                        </p>
                    </div>
                    <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 flex-1">
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Latency</p>
                        <p class="text-2xl font-bold ${latencyClass}">
                            ${response.latency} ms
                        </p>
                    </div>
                    <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 flex-1">
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Size</p>
                        <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            ${this.formatBytes(response.size)}
                        </p>
                    </div>
                </div>
                
                <!-- Response Headers -->
                ${this.renderHeaders(response.headers)}
                
                <!-- Response Body -->
                <div>
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="font-semibold text-gray-900 dark:text-gray-100">Response Body</h3>
                        <button 
                            onclick="window.responseViewer.copyBody()" 
                            class="px-3 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded text-sm transition text-gray-700 dark:text-gray-300"
                        >
                            Copy
                        </button>
                    </div>
                    <div class="code-block">
                        ${this.renderResponseBody(response.data)}
                    </div>
                </div>
            </div>
        `;

    this.container.innerHTML = html;

    // Show copy button
    if (this.copyButton) {
      this.copyButton.classList.remove("hidden");
    }
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

    const bodyText = typeof this.currentResponse.data === "string" 
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
