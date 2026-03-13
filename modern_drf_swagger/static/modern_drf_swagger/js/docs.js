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

    // Layout state
    this.layoutStorageKey = "modern-drf-swagger:layout-mode";
    this.endpointWidthStorageKey = "modern-drf-swagger:endpoint-width";
    this.requestWidthStorageKey = "modern-drf-swagger:request-width";
    this.requestHeightStorageKey = "modern-drf-swagger:request-height";

    this.workspace = document.getElementById("docs-workspace");
    this.mainStack = document.getElementById("docs-main-stack");
    this.endpointPanel = document.getElementById("endpoints-panel");
    this.requestPanel = document.getElementById("request-panel");
    this.responsePanel = document.getElementById("response-panel");

    this.layoutModeSelect = document.getElementById("layout-mode-select");
    this.layoutResetBtn = document.getElementById("layout-reset-btn");
    this.layoutModeHint = document.getElementById("layout-mode-hint");

    this.resizeEndpointsHandle = document.getElementById("resize-endpoints");
    this.resizeMainHandle = document.getElementById("resize-main");

    this.activeResize = null;
    this.resizeCleanup = null;

    this.init();
  }

  init() {
    this.initLayoutSystem();

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

    window.addEventListener("resize", () => {
      this.handleViewportChange();
    });

    // Setup keyboard shortcuts
    this.setupKeyboardShortcuts();

    // Load schema and restore selection from hash
    this.endpointList.loadSchema().then(() => {
      // Try to restore endpoint from URL hash after schema loads
      this.endpointList.selectEndpointFromHash();
    });
  }

  initLayoutSystem() {
    if (!this.workspace || !this.layoutModeSelect || !this.layoutResetBtn) {
      return;
    }

    const initialMode =
      localStorage.getItem(this.layoutStorageKey) ||
      this.layoutModeSelect.value;

    const endpointWidth = localStorage.getItem(this.endpointWidthStorageKey);
    const requestWidth = localStorage.getItem(this.requestWidthStorageKey);
    const requestHeight = localStorage.getItem(this.requestHeightStorageKey);

    if (endpointWidth) {
      this.workspace.style.setProperty("--endpoint-width", endpointWidth);
    }

    if (requestWidth) {
      this.workspace.style.setProperty("--request-width", requestWidth);
    }

    if (requestHeight) {
      this.workspace.style.setProperty("--request-height", requestHeight);
    }

    this.applyLayoutMode(initialMode, { persist: false });

    this.layoutModeSelect.addEventListener("change", (event) => {
      this.applyLayoutMode(event.target.value, { persist: true });
    });

    this.layoutResetBtn.addEventListener("click", () => {
      this.resetPanelSizes();
      showToast("Panel sizes reset", "info");
    });

    this.setupResizers();
  }

  applyLayoutMode(mode, { persist = true } = {}) {
    if (!this.workspace || !this.layoutModeSelect) {
      return;
    }

    const normalizedMode = mode === "stacked" ? "stacked" : "split";
    const mobileView = this.isMobileView();
    const effectiveMode = mobileView ? "stacked" : normalizedMode;

    this.workspace.classList.remove("layout-split", "layout-stacked");
    this.workspace.classList.add(`layout-${effectiveMode}`);

    this.layoutModeSelect.value = normalizedMode;
    this.layoutModeSelect.disabled = mobileView;

    if (this.layoutModeHint) {
      this.layoutModeHint.textContent = mobileView
        ? "Mobile layout uses stacked mode automatically."
        : "Drag separators to resize panels.";
    }

    if (this.resizeMainHandle) {
      const orientation =
        effectiveMode === "stacked" ? "horizontal" : "vertical";
      this.resizeMainHandle.setAttribute("aria-orientation", orientation);
    }

    if (persist && !mobileView) {
      localStorage.setItem(this.layoutStorageKey, normalizedMode);
    }

    this.currentLayoutMode = effectiveMode;
  }

  setupResizers() {
    if (this.resizeEndpointsHandle) {
      this.resizeEndpointsHandle.addEventListener("pointerdown", (event) => {
        this.beginResize("endpoints", event);
      });
    }

    if (this.resizeMainHandle) {
      this.resizeMainHandle.addEventListener("pointerdown", (event) => {
        const mode = this.currentLayoutMode === "stacked" ? "stacked" : "split";
        this.beginResize(mode, event);
      });
    }
  }

  beginResize(type, event) {
    if (!this.workspace || this.isMobileView()) {
      return;
    }

    event.preventDefault();

    const activeHandle =
      type === "endpoints" ? this.resizeEndpointsHandle : this.resizeMainHandle;

    if (activeHandle) {
      activeHandle.classList.add("resizing");
    }

    this.activeResize = { type, handle: activeHandle };

    const onPointerMove = (moveEvent) => {
      this.handleResizeMove(moveEvent);
    };

    const onPointerUp = () => {
      if (this.activeResize && this.activeResize.handle) {
        this.activeResize.handle.classList.remove("resizing");
      }

      this.activeResize = null;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";

      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      this.resizeCleanup = null;
    };

    this.resizeCleanup = onPointerUp;
    document.body.style.userSelect = "none";
    document.body.style.cursor =
      type === "stacked" ? "row-resize" : "col-resize";

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  handleResizeMove(event) {
    if (!this.activeResize || !this.workspace || !this.mainStack) {
      return;
    }

    const workspaceRect = this.workspace.getBoundingClientRect();
    const mainRect = this.mainStack.getBoundingClientRect();

    if (this.activeResize.type === "endpoints") {
      const min = 260;
      const max = Math.max(360, workspaceRect.width - 520);
      const nextWidth = this.clamp(
        event.clientX - workspaceRect.left,
        min,
        max,
      );
      const nextValue = `${Math.round(nextWidth)}px`;

      this.workspace.style.setProperty("--endpoint-width", nextValue);
      localStorage.setItem(this.endpointWidthStorageKey, nextValue);
      return;
    }

    if (this.activeResize.type === "split") {
      const relativeX = event.clientX - mainRect.left;
      const min = 320;
      const max = Math.max(min + 20, mainRect.width - 260);
      const nextWidth = this.clamp(relativeX, min, max);
      const nextValue = `${Math.round(nextWidth)}px`;

      this.workspace.style.setProperty("--request-width", nextValue);
      localStorage.setItem(this.requestWidthStorageKey, nextValue);
      return;
    }

    if (this.activeResize.type === "stacked") {
      const relativeY = event.clientY - mainRect.top;
      const min = 220;
      const max = Math.max(min + 20, mainRect.height - 200);
      const nextHeight = this.clamp(relativeY, min, max);
      const nextValue = `${Math.round(nextHeight)}px`;

      this.workspace.style.setProperty("--request-height", nextValue);
      localStorage.setItem(this.requestHeightStorageKey, nextValue);
    }
  }

  handleViewportChange() {
    const savedMode = localStorage.getItem(this.layoutStorageKey) || "split";
    this.applyLayoutMode(savedMode, { persist: false });
  }

  resetPanelSizes() {
    if (!this.workspace) {
      return;
    }

    const defaultEndpoint = "340px";
    const defaultRequestWidth = "1fr";
    const defaultRequestHeight = "52%";

    this.workspace.style.setProperty("--endpoint-width", defaultEndpoint);
    this.workspace.style.setProperty("--request-width", defaultRequestWidth);
    this.workspace.style.setProperty("--request-height", defaultRequestHeight);

    localStorage.setItem(this.endpointWidthStorageKey, defaultEndpoint);
    localStorage.setItem(this.requestWidthStorageKey, defaultRequestWidth);
    localStorage.setItem(this.requestHeightStorageKey, defaultRequestHeight);
  }

  isMobileView() {
    return window.matchMedia("(max-width: 1023px)").matches;
  }

  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
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
