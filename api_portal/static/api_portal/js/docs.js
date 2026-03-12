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

    // Load schema and restore selection from hash
    this.endpointList.loadSchema().then(() => {
      // Try to restore endpoint from URL hash after schema loads
      this.endpointList.selectEndpointFromHash();
    });
  }

  handleEndpointSelect(endpoint, fullSchema) {
    // Load endpoint into request editor with full schema for $ref resolution
    this.requestEditor.loadEndpoint(endpoint, fullSchema);

    // Clear previous response
    this.responseViewer.clear();
  }

  async handleSendRequest(payload) {
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
        fetchOptions.body = formData;
        // Don't set Content-Type header - let browser set it with boundary
      } else {
        // Send as JSON
        fetchOptions.headers["Content-Type"] = "application/json";
        fetchOptions.body = JSON.stringify(payload);
      }

      // Send request to API proxy
      const response = await fetch("/portal/api-proxy/", fetchOptions);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Display response
      this.responseViewer.displayResponse(result);

      // Show success toast
      if (result.status >= 200 && result.status < 300) {
        showToast(`Request successful (${result.status})`, "success");
      } else if (result.status >= 400) {
        showToast(`Request failed (${result.status})`, "error");
      }
    } catch (error) {
      console.error("Request failed:", error);
      this.responseViewer.displayError(error);
      showToast("Request failed: " + error.message, "error");
    }
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new DocsController();
});
