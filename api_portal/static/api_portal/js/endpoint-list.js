/**
 * Endpoint List Component
 * Handles rendering and filtering of API endpoints from OpenAPI schema
 */

class EndpointList {
  constructor(containerId, searchInputId, options = {}) {
    this.container = document.getElementById(containerId);
    this.searchInput = document.getElementById(searchInputId);
    this.endpoints = [];
    this.filteredEndpoints = [];
    this.selectedEndpoint = null;
    this.onSelectCallback = null;
    this.collapsedGroups = new Set();
    this.fullSchema = null; // Store full schema including components

    // Configuration options
    this.options = {
      defaultCollapsed: options.defaultCollapsed || false,
      enableCollapse: options.enableCollapse !== false, // true by default
    };

    this.init();
  }

  init() {
    // Setup search functionality
    this.searchInput.addEventListener("input", (e) => {
      this.filterEndpoints(e.target.value);
      this.render();
    });
  }

  async loadSchema() {
    try {
      const response = await fetch("/portal/schema/", {
        headers: {
          Accept: "application/json",
        },
      });
      const schema = await response.json();
      this.fullSchema = schema; // Store full schema for reference resolution
      this.parseSchema(schema);
      this.render();
    } catch (error) {
      console.error("Failed to load schema:", error);
      this.container.innerHTML = `
                <div class="p-4 bg-red-900 bg-opacity-20 border border-red-500 text-red-400 rounded-lg">
                    <p class="font-semibold">Error loading endpoints</p>
                    <p class="text-sm mt-1">${error.message}</p>
                </div>
            `;
    }
  }

  /**
   * Extract a meaningful tag from the URL path
   * Examples:
   *   /api/tasks/ -> tasks
   *   /api/v1/users/ -> users
   *   /api/v2/projects/{id}/ -> projects
   */
  extractTagFromPath(path) {
    // Remove leading slash
    let pathParts = path.replace(/^\/+/, "").split("/");

    // Remove common prefixes (api, v1, v2, etc.)
    pathParts = pathParts.filter((part) => {
      return (
        part && // not empty
        !part.match(/^api$/i) && // not 'api'
        !part.match(/^v\d+$/i) && // not 'v1', 'v2', etc.
        !part.match(/^\{.*\}$/) // not a path parameter like {id}
      );
    });

    // Get the first meaningful part as the tag
    if (pathParts.length > 0) {
      return pathParts[0];
    }

    return "default";
  }

  /**
   * Check if an operation requires authentication
   * Checks for security requirements in operation or global schema
   */
  checkIfRequiresAuth(operation, schema) {
    // Check operation-level security
    if (operation.security !== undefined) {
      // If security is an empty array, it means no auth required
      if (
        Array.isArray(operation.security) &&
        operation.security.length === 0
      ) {
        return false;
      }
      // If security has items, auth is required
      if (Array.isArray(operation.security) && operation.security.length > 0) {
        return true;
      }
    }

    // Check global security (default for all operations)
    if (schema.security !== undefined) {
      if (Array.isArray(schema.security) && schema.security.length > 0) {
        return true;
      }
    }

    // Default: assume public if not specified
    return false;
  }

  parseSchema(schema) {
    this.endpoints = [];
    const paths = schema.paths || {};

    for (const [path, pathItem] of Object.entries(paths)) {
      // Get all HTTP methods for this path
      const methods = [
        "get",
        "post",
        "put",
        "patch",
        "delete",
        "options",
        "head",
      ];

      for (const method of methods) {
        if (pathItem[method]) {
          const operation = pathItem[method];
          // Extract tag from URL path instead of using operation.tags
          const extractedTag = this.extractTagFromPath(path);

          // Check if endpoint requires authentication
          const requiresAuth = this.checkIfRequiresAuth(operation, schema);

          this.endpoints.push({
            path: path,
            method: method.toUpperCase(),
            summary: operation.summary || "",
            description: operation.description || "",
            tags: [extractedTag], // Use extracted tag from path
            operationId: operation.operationId || "",
            parameters: operation.parameters || [],
            requestBody: operation.requestBody || null,
            responses: operation.responses || {},
            requiresAuth: requiresAuth,
          });
        }
      }
    }

    this.filteredEndpoints = [...this.endpoints];

    // Initialize collapsed state based on options
    if (this.options.defaultCollapsed) {
      const tags = [...new Set(this.endpoints.flatMap((e) => e.tags))];
      tags.forEach((tag) => this.collapsedGroups.add(tag));
    }
  }

  filterEndpoints(searchTerm) {
    const term = searchTerm.toLowerCase();
    this.filteredEndpoints = this.endpoints.filter(
      (endpoint) =>
        endpoint.path.toLowerCase().includes(term) ||
        endpoint.method.toLowerCase().includes(term) ||
        endpoint.summary.toLowerCase().includes(term) ||
        endpoint.tags.some((tag) => tag.toLowerCase().includes(term)),
    );
  }

  /**
   * Capitalize the first letter of a string
   */
  capitalizeTag(tag) {
    if (!tag) return "Default";
    return tag.charAt(0).toUpperCase() + tag.slice(1);
  }

  groupEndpointsByTag() {
    const grouped = {};

    this.filteredEndpoints.forEach((endpoint) => {
      const tag = endpoint.tags[0] || "default";
      if (!grouped[tag]) {
        grouped[tag] = [];
      }
      grouped[tag].push(endpoint);
    });

    return grouped;
  }

  render() {
    const grouped = this.groupEndpointsByTag();

    if (Object.keys(grouped).length === 0) {
      this.container.innerHTML = `
                <div class="p-4 text-center text-gray-400">
                    <p>No endpoints found</p>
                </div>
            `;
      return;
    }

    let html = "";

    for (const [tag, endpoints] of Object.entries(grouped)) {
      const isCollapsed = this.collapsedGroups.has(tag);
      const displayTag = this.capitalizeTag(tag);
      const collapseIcon = isCollapsed
        ? `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
        </svg>`
        : `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>`;

      html += `
                <div class="mb-4 endpoint-group" data-tag="${this.escapeHtml(tag)}">
                    <div class="px-3 py-2 bg-gray-700 rounded-t-lg font-semibold text-sm flex items-center justify-between ${
                      this.options.enableCollapse
                        ? "cursor-pointer hover:bg-gray-600 transition"
                        : ""
                    }" data-group-header="${this.escapeHtml(tag)}">
                        <span>${this.escapeHtml(displayTag)} <span class="text-gray-400 text-xs">(${endpoints.length})</span></span>
                        ${this.options.enableCollapse ? `<span class="collapse-icon transition-transform ${isCollapsed ? "" : "rotate-0"}">${collapseIcon}</span>` : ""}
                    </div>
                    <div class="border border-gray-700 border-t-0 rounded-b-lg endpoint-group-content" 
                         style="${isCollapsed ? "display: none;" : ""}">
            `;

      endpoints.forEach((endpoint, index) => {
        const isSelected =
          this.selectedEndpoint &&
          this.selectedEndpoint.path === endpoint.path &&
          this.selectedEndpoint.method === endpoint.method;

        // Determine lock icon HTML
        const lockIcon = endpoint.requiresAuth
          ? `<svg class="w-3.5 h-3.5 text-yellow-500 dark:text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" title="Authentication required">
               <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"></path>
             </svg>`
          : `<svg class="w-3.5 h-3.5 text-green-500 dark:text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" title="Public endpoint">
               <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z"></path>
             </svg>`;

        html += `
                    <div class="endpoint-item p-3 border-b border-gray-700 last:border-b-0 cursor-pointer hover:bg-gray-700 transition ${isSelected ? "bg-blue-900 bg-opacity-30 border-l-4 border-l-blue-500" : ""}"
                         data-path="${this.escapeHtml(endpoint.path)}"
                         data-method="${endpoint.method}">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="method-badge method-${endpoint.method.toLowerCase()}">
                                ${endpoint.method}
                            </span>
                            <span class="text-sm font-mono text-gray-300 flex-1 truncate">
                                ${this.escapeHtml(endpoint.path)}
                            </span>
                            ${lockIcon}
                        </div>
                        ${endpoint.summary ? `<p class="text-xs text-gray-400 truncate">${this.escapeHtml(endpoint.summary)}</p>` : ""}
                    </div>
                `;
      });

      html += `
                    </div>
                </div>
            `;
    }

    this.container.innerHTML = html;

    // Add click listeners for endpoints
    this.container.querySelectorAll(".endpoint-item").forEach((item) => {
      item.addEventListener("click", () => {
        const path = item.dataset.path;
        const method = item.dataset.method;
        this.selectEndpoint(path, method);
      });
    });

    // Add collapse/expand listeners
    if (this.options.enableCollapse) {
      this.container
        .querySelectorAll("[data-group-header]")
        .forEach((header) => {
          header.addEventListener("click", (e) => {
            // Don't trigger if clicking on an endpoint
            if (!e.target.closest(".endpoint-item")) {
              const tag = header.dataset.groupHeader;
              this.toggleGroup(tag);
            }
          });
        });
    }
  }

  selectEndpoint(path, method, updateHash = true) {
    this.selectedEndpoint = this.endpoints.find(
      (e) => e.path === path && e.method === method,
    );

    this.render();

    // Update URL hash for bookmarking/refreshing
    if (updateHash && this.selectedEndpoint) {
      const hash = `${this.selectedEndpoint.method}:${this.selectedEndpoint.path}`;
      window.location.hash = hash;
    }

    if (this.onSelectCallback && this.selectedEndpoint) {
      // Pass both endpoint and full schema for $ref resolution
      this.onSelectCallback(this.selectedEndpoint, this.fullSchema);
    }
  }

  selectEndpointFromHash() {
    const hash = window.location.hash.slice(1); // Remove '#'
    if (!hash) return false;

    // Parse hash format: "GET:/api/tasks/"
    const colonIndex = hash.indexOf(":");
    if (colonIndex === -1) return false;

    const method = hash.substring(0, colonIndex);
    const path = hash.substring(colonIndex + 1);

    const endpoint = this.endpoints.find(
      (e) => e.path === path && e.method === method,
    );

    if (endpoint) {
      this.selectEndpoint(path, method, false); // Don't update hash again
      return true;
    }

    return false;
  }

  toggleGroup(tag) {
    if (this.collapsedGroups.has(tag)) {
      this.collapsedGroups.delete(tag);
    } else {
      this.collapsedGroups.add(tag);
    }
    this.render();
  }

  collapseAll() {
    const tags = [...new Set(this.filteredEndpoints.flatMap((e) => e.tags))];
    tags.forEach((tag) => this.collapsedGroups.add(tag));
    this.render();
  }

  expandAll() {
    this.collapsedGroups.clear();
    this.render();
  }

  onSelect(callback) {
    this.onSelectCallback = callback;
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}
