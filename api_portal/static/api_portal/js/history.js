/**
 * History Page Controller
 * Handles displaying and filtering request history
 */

class HistoryController {
  constructor() {
    this.searchInput = document.getElementById("history-search");
    this.pageSizeSelect = document.getElementById("page-size");
    this.tableBody = document.getElementById("history-table-body");
    this.prevButton = document.getElementById("prev-page");
    this.nextButton = document.getElementById("next-page");
    this.paginationInfo = document.getElementById("pagination-info");
    this.modal = document.getElementById("detail-modal");
    this.modalContent = document.getElementById("modal-content");
    this.closeModalBtn = document.getElementById("close-modal");

    this.currentPage = 1;
    this.pageSize = 50;
    this.searchTerm = "";
    this.searchTimeout = null;

    this.init();
  }

  init() {
    // Setup page size selector
    this.pageSizeSelect.addEventListener("change", (e) => {
      this.pageSize = parseInt(e.target.value);
      this.currentPage = 1;
      this.loadHistory();
    });

    // Setup search
    this.searchInput.addEventListener("input", (e) => {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.searchTerm = e.target.value;
        this.currentPage = 1;
        this.loadHistory();
      }, 500);
    });

    // Setup pagination
    this.prevButton.addEventListener("click", () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.loadHistory();
      }
    });

    this.nextButton.addEventListener("click", () => {
      this.currentPage++;
      this.loadHistory();
    });

    // Setup modal
    this.closeModalBtn.addEventListener("click", () => this.closeModal());
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.closeModal();
      }
    });

    // Initial load
    this.loadHistory();
  }

  async loadHistory() {
    const params = new URLSearchParams({
      page: this.currentPage,
      per_page: this.pageSize,
      format: "json",
    });

    if (this.searchTerm) {
      params.append("search", this.searchTerm);
    }

    try {
      const response = await fetch(`/portal/history/?${params}`, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      this.renderHistory(data);
    } catch (error) {
      console.error("Failed to load history:", error);
      this.tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-4 py-8">
                        <div class="bg-red-900 bg-opacity-20 border border-red-500 text-red-400 rounded-lg p-4 text-center">
                            <p class="font-semibold">Failed to load history</p>
                            <p class="text-sm mt-1">${error.message}</p>
                        </div>
                    </td>
                </tr>
            `;
    }
  }

  renderHistory(data) {
    const results = data.results || [];
    const pagination = data.pagination || {};

    if (results.length === 0) {
      this.tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-4 py-12 text-center text-gray-400">
                        No request history found
                    </td>
                </tr>
            `;
      this.updatePagination(pagination);
      return;
    }

    let html = "";

    results.forEach((request) => {
      const timestamp = new Date(request.timestamp);
      const statusClass = this.getStatusClass(request.response_status);
      const latencyClass = this.getLatencyClass(request.latency);

      html += `
                <tr class="border-b border-gray-700 hover:bg-gray-700 transition cursor-pointer"
                    data-request-id="${request.id}">
                    <td class="px-4 py-3 text-sm text-gray-300">
                        ${this.formatTimestamp(timestamp)}
                    </td>
                    <td class="px-4 py-3">
                        <span class="method-badge method-${request.method.toLowerCase()}">
                            ${request.method}
                        </span>
                    </td>
                    <td class="px-4 py-3 text-sm font-mono">
                        ${this.escapeHtml(request.endpoint)}
                    </td>
                    <td class="px-4 py-3">
                        <span class="status-badge ${statusClass}">
                            ${request.response_status}
                        </span>
                    </td>
                    <td class="px-4 py-3 text-sm font-semibold ${latencyClass}">
                        ${request.latency} ms
                    </td>
                    <td class="px-4 py-3">
                        <button class="view-details-btn px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition"
                                data-request='${JSON.stringify(request)}'>
                            View
                        </button>
                    </td>
                </tr>
            `;
    });

    this.tableBody.innerHTML = html;

    // Add click listeners for view buttons
    this.tableBody.querySelectorAll(".view-details-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const request = JSON.parse(btn.dataset.request);
        this.showDetails(request);
      });
    });

    this.updatePagination(pagination);
  }

  updatePagination(pagination) {
    // Update info text
    const start =
      ((pagination.page || 1) - 1) * (pagination.per_page || 50) + 1;
    const end = Math.min(
      start + (pagination.per_page || 50) - 1,
      pagination.total_count || 0,
    );
    this.paginationInfo.textContent = `Showing ${start}-${end} of ${pagination.total_count || 0} requests`;

    // Update button states
    this.prevButton.disabled = !pagination.has_prev;
    this.nextButton.disabled = !pagination.has_next;
  }

  showDetails(request) {
    const statusClass = this.getStatusClass(request.response_status);
    const latencyClass = this.getLatencyClass(request.latency);

    let requestBody = "None";
    if (request.request_payload) {
      try {
        const parsed = JSON.parse(request.request_payload);
        requestBody = `<pre class="whitespace-pre-wrap">${JSON.stringify(parsed, null, 2)}</pre>`;
      } catch (e) {
        requestBody = `<pre class="whitespace-pre-wrap">${this.escapeHtml(request.request_payload)}</pre>`;
      }
    }

    this.modalContent.innerHTML = `
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p class="text-sm text-gray-400 mb-1">Method</p>
                        <span class="method-badge method-${request.method.toLowerCase()}">
                            ${request.method}
                        </span>
                    </div>
                    <div>
                        <p class="text-sm text-gray-400 mb-1">Status</p>
                        <span class="status-badge ${statusClass}">
                            ${request.response_status}
                        </span>
                    </div>
                    <div>
                        <p class="text-sm text-gray-400 mb-1">Latency</p>
                        <p class="font-semibold ${latencyClass}">${request.latency} ms</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-400 mb-1">Size</p>
                        <p class="font-semibold text-blue-400">${this.formatBytes(request.response_size)}</p>
                    </div>
                </div>
                
                <div>
                    <p class="text-sm text-gray-400 mb-1">Endpoint</p>
                    <p class="font-mono text-sm bg-gray-700 rounded p-2">${this.escapeHtml(request.endpoint)}</p>
                </div>
                
                <div>
                    <p class="text-sm text-gray-400 mb-1">Timestamp</p>
                    <p>${new Date(request.timestamp).toLocaleString()}</p>
                </div>
                
                <div>
                    <p class="text-sm text-gray-400 mb-2">Request Body</p>
                    <div class="code-block">
                        ${requestBody}
                    </div>
                </div>
            </div>
        `;

    this.modal.classList.remove("hidden");
  }

  closeModal() {
    this.modal.classList.add("hidden");
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

  formatTimestamp(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  }

  formatBytes(bytes) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new HistoryController();
});
