/**
 * Docs Page Controller
 * Orchestrates endpoint list, request editor, and response viewer
 */

// Helper function to get CSRF token from cookie
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

class DocsController {
  constructor() {
    // Get configuration from global variable (set by Django template)
    const config = window.PORTAL_CONFIG || {};

    this.endpointList = new EndpointList("endpoint-list", "endpoint-search", {
      enableCollapse: config.endpointsCollapsible !== false,
      defaultCollapsed: config.endpointsDefaultCollapsed === true,
    });
    this.requestEditor = new RequestEditor("request-editor");
    this.responseViewer = new ResponseViewer("response-viewer");

    // Make responseViewer globally accessible for copy buttons
    window.responseViewer = this.responseViewer;

    // Request state management for rate limiting
    this.isRequestInProgress = false;
    this.lastRequestTime = 0;
    this.minRequestInterval = 500; // Minimum 500ms between requests

    this.init();
  }

  init() {
    // Setup communication between components
    this.endpointList.onSelect((endpoint, fullSchema) => {
      this.handleEndpointSelect(endpoint, fullSchema);
    });

    this.requestEditor.onSend(async (payload) => {
      await this.handleSendRequest(payload);
    });

    // Setup collapse/expand all buttons (if enabled)
    const collapseAllBtn = document.getElementById("collapse-all-btn");
    const expandAllBtn = document.getElementById("expand-all-btn");

    if (collapseAllBtn) {
      collapseAllBtn.addEventListener("click", () => {
        this.endpointList.collapseAll();
      });
    }

    if (expandAllBtn) {
      expandAllBtn.addEventListener("click", () => {
        this.endpointList.expandAll();
      });
    }

    // Handle browser back/forward with hash changes
    window.addEventListener("hashchange", () => {
      this.endpointList.selectEndpointFromHash();
    });

    // Setup keyboard shortcuts
    this.setupKeyboardShortcuts();

    // Load schema and restore selection from hash
    this.endpointList.loadSchema().then(() => {
      // Try to restore endpoint from URL hash after schema loads
      this.endpointList.selectEndpointFromHash();
    });
  }

  setupKeyboardShortcuts() {
    // Keyboard shortcuts handler
    document.addEventListener("keydown", (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Cmd/Ctrl + K: Focus search input
      if (modifier && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const searchInput = document.getElementById("endpoint-search");
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
          showToast("Search endpoints", "info");
        }
        return;
      }

      // Cmd/Ctrl + Enter: Send request with rate limiting
      if (modifier && e.key === "Enter") {
        e.preventDefault();

        // Check permissions
        if (window.PORTAL_CONFIG?.canSendRequest === false) {
          showToast(
            "You need DEVELOPER role or higher to send requests",
            "error",
          );
          return;
        }

        // Check if request is already in progress
        if (this.isRequestInProgress) {
          showToast(
            "Please wait for the current request to complete",
            "warning",
          );
          return;
        }

        // Check rate limiting (minimum interval between requests)
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.minRequestInterval) {
          const waitTime = Math.ceil(
            (this.minRequestInterval - timeSinceLastRequest) / 1000,
          );
          showToast(
            `Please wait ${waitTime}s before sending another request`,
            "warning",
          );
          return;
        }

        // All checks passed, trigger send
        const sendButton = document.getElementById("send-request-btn");
        if (sendButton && !sendButton.disabled) {
          sendButton.click();
        }
        return;
      }
    });
  }

  handleEndpointSelect(endpoint, fullSchema) {
    // Load endpoint into request editor with full schema for $ref resolution
    this.requestEditor.loadEndpoint(endpoint, fullSchema);

    // Clear previous response
    this.responseViewer.clear();
  }

  async handleSendRequest(payload) {
    // Set request in progress
    this.isRequestInProgress = true;
    this.lastRequestTime = Date.now();

    try {
      // Get CSRF token from cookie
      const csrftoken = getCookie("csrftoken");

      let fetchOptions = {
        method: "POST",
        headers: {
          "X-CSRFToken": csrftoken,
        },
      };

      // Check if payload contains FormData (for file uploads)
      if (payload.data instanceof FormData) {
        // Send as multipart/form-data
        const formData = payload.data;
        formData.append("method", payload.method);
        formData.append("path", payload.path);
        if (payload.params) {
          formData.append("params", JSON.stringify(payload.params));
        }
        if (payload._headers) {
          formData.append("_headers", JSON.stringify(payload._headers));
        }
        if (payload._cookies) {
          formData.append("_cookies", JSON.stringify(payload._cookies));
        }
        fetchOptions.body = formData;
        // Don't set Content-Type header - let browser set it with boundary
      } else {
        // Send as JSON
        fetchOptions.headers["Content-Type"] = "application/json";
        fetchOptions.body = JSON.stringify(payload);
      }

      // Send request to API proxy
      const response = await fetch(
        `${window.PORTAL_BASE_URL}/api-proxy/`,
        fetchOptions,
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Display response with request context for ChatGPT integration
      this.responseViewer.displayResponse(result, payload);

      // Show success toast
      if (result.status >= 200 && result.status < 300) {
        showToast(`Request successful (${result.status})`, "success");
      } else if (result.status >= 400) {
        showToast(`Request failed (${result.status})`, "error");
      }
    } catch (error) {
      console.error("Request failed:", error);
      this.responseViewer.displayError(error, payload);
      showToast("Request failed: " + error.message, "error");
    } finally {
      // Reset request state
      this.isRequestInProgress = false;
    }
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new DocsController();
});
