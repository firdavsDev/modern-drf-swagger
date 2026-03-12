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
          this.endpoints.push({
            path: path,
            method: method.toUpperCase(),
            summary: operation.summary || "",
            description: operation.description || "",
            tags: operation.tags || ["default"],
            operationId: operation.operationId || "",
            parameters: operation.parameters || [],
            requestBody: operation.requestBody || null,
            responses: operation.responses || {},
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
                        <span>${this.escapeHtml(tag)} <span class="text-gray-400 text-xs">(${endpoints.length})</span></span>
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
      this.onSelectCallback(this.selectedEndpoint);
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
