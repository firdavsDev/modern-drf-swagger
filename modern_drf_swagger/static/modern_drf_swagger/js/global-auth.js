/**
 * Global Authentication Manager
 * Handles one-time authentication setup for all API requests
 */

class GlobalAuth {
  constructor() {
    this.authKey = "portal_global_auth";
    this.init();
  }

  init() {
    // Populate auth type selector from available schemes
    this.populateAuthTypes();
    this.setupPasswordToggle();

    // Setup auth type selector
    const authTypeSelect = document.getElementById("auth-type");
    if (authTypeSelect) {
      authTypeSelect.addEventListener("change", () => {
        this.switchAuthType(authTypeSelect.value);
      });
    }

    // Load saved auth on page load
    this.loadAuth();

    // Update UI
    this.updateAuthStatus();

    // Make globally accessible
    window.globalAuth = this;
  }

  setupPasswordToggle() {
    const toggleButton = document.getElementById("basic-password-toggle");
    if (!toggleButton) {
      return;
    }

    toggleButton.addEventListener("click", () => {
      const passwordInput = document.getElementById("basic-password");
      if (!passwordInput) {
        return;
      }

      const shouldShowPassword = passwordInput.type === "password";
      passwordInput.type = shouldShowPassword ? "text" : "password";
      this.updatePasswordToggleUi(shouldShowPassword);
    });

    this.updatePasswordToggleUi(false);
  }

  updatePasswordToggleUi(isVisible) {
    const toggleButton = document.getElementById("basic-password-toggle");
    const showIcon = document.getElementById("basic-password-toggle-icon-show");
    const hideIcon = document.getElementById("basic-password-toggle-icon-hide");

    if (!toggleButton || !showIcon || !hideIcon) {
      return;
    }

    showIcon.classList.toggle("hidden", isVisible);
    hideIcon.classList.toggle("hidden", !isVisible);
    toggleButton.setAttribute(
      "aria-label",
      isVisible ? "Hide password" : "Show password",
    );
    toggleButton.setAttribute(
      "title",
      isVisible ? "Hide password" : "Show password",
    );
    toggleButton.setAttribute("aria-pressed", isVisible ? "true" : "false");
  }

  resetPasswordVisibility() {
    const passwordInput = document.getElementById("basic-password");
    if (passwordInput) {
      passwordInput.type = "password";
    }

    this.updatePasswordToggleUi(false);
  }

  populateAuthTypes() {
    const authTypeSelect = document.getElementById("auth-type");
    if (!authTypeSelect) return;

    // Get available auth schemes from PORTAL_CONFIG
    const authSchemes = window.PORTAL_CONFIG?.authSchemes || [];

    // Clear existing options
    authTypeSelect.innerHTML = "";

    // If no schemes available, show default options
    if (authSchemes.length === 0) {
      authTypeSelect.innerHTML = `
        <option value="bearer">Bearer Token (JWT)</option>
        <option value="basic">Basic Auth</option>
        <option value="apikey">API Key</option>
      `;
      return;
    }

    // Build options from available schemes
    authSchemes.forEach((scheme) => {
      const option = document.createElement("option");
      option.value = scheme.type;

      // Build display name
      let displayName = scheme.name || scheme.type;
      if (scheme.description) {
        displayName = `${scheme.name} (${scheme.description})`;
      }

      option.textContent = displayName;
      authTypeSelect.appendChild(option);
    });

    // Show the first auth type by default
    if (authSchemes.length > 0) {
      this.switchAuthType(authSchemes[0].type);
    }
  }

  switchAuthType(type) {
    const bearerSection = document.getElementById("bearer-auth-section");
    const basicSection = document.getElementById("basic-auth-section");
    const apikeySection = document.getElementById("apikey-auth-section");

    // Hide all sections
    bearerSection.classList.add("hidden");
    basicSection.classList.add("hidden");
    apikeySection.classList.add("hidden");

    // Show selected section
    switch (type) {
      case "bearer":
      case "token":
        this.updateTokenAuthSection(type);
        bearerSection.classList.remove("hidden");
        break;
      case "basic":
        basicSection.classList.remove("hidden");
        break;
      case "apikey":
        this.updateApiKeySection();
        apikeySection.classList.remove("hidden");
        // Set default API key name if empty
        const apikeyHeaderInput = document.getElementById("apikey-header");
        if (apikeyHeaderInput && !apikeyHeaderInput.value) {
          apikeyHeaderInput.value = this.getDefaultApiKeyName();
        }
        break;
    }
  }

  getTokenAuthConfig(type) {
    if (type === "token") {
      return {
        label: "DRF Token",
        placeholder: "Paste your DRF token here",
        helpText: "Will be sent as: Authorization: Token {token}",
        successName: "Token",
      };
    }

    if (type !== "bearer") {
      return null;
    }

    return {
      label: "Token",
      placeholder: "Paste your JWT token here",
      helpText: "Will be sent as: Authorization: Bearer {token}",
      successName: "Bearer",
    };
  }

  updateTokenAuthSection(type) {
    const config = this.getTokenAuthConfig(type);
    const tokenLabel = document.getElementById("bearer-token-label");
    const tokenInput = document.getElementById("bearer-token");
    const tokenHelp = document.getElementById("bearer-token-help");

    if (tokenLabel) {
      tokenLabel.textContent = config.label;
    }
    if (tokenInput) {
      tokenInput.placeholder = config.placeholder;
    }
    if (tokenHelp) {
      tokenHelp.textContent = config.helpText;
    }
  }

  openAuthModal() {
    const modal = document.getElementById("auth-modal");
    if (modal) {
      modal.classList.remove("hidden");
      this.resetPasswordVisibility();

      // Set default API key name if field is empty
      const apikeyHeaderInput = document.getElementById("apikey-header");
      if (apikeyHeaderInput && !apikeyHeaderInput.value) {
        apikeyHeaderInput.value = this.getDefaultApiKeyName();
      }

      this.loadAuthToModal();
    }
  }

  closeAuthModal() {
    const modal = document.getElementById("auth-modal");
    if (modal) {
      modal.classList.add("hidden");
    }

    this.resetPasswordVisibility();
  }

  loadAuthToModal() {
    const authData = this.getAuth();
    if (!authData) return;

    const authTypeSelect = document.getElementById("auth-type");
    if (authTypeSelect) {
      authTypeSelect.value = authData.type;
      this.switchAuthType(authData.type);
    }

    switch (authData.type) {
      case "bearer":
      case "token":
        document.getElementById("bearer-token").value = authData.token || "";
        break;
      case "basic":
        document.getElementById("basic-username").value =
          authData.username || "";
        document.getElementById("basic-password").value =
          authData.password || "";
        break;
      case "apikey":
        this.updateApiKeySection();
        const defaultHeaderName = this.getDefaultApiKeyName();
        document.getElementById("apikey-header").value =
          authData.keyName || authData.headerName || defaultHeaderName;
        document.getElementById("apikey-value").value = authData.apiKey || "";
        break;
    }
  }

  /**
   * Get API key scheme from auth schemes
   */
  getApiKeyScheme() {
    const authSchemes = window.PORTAL_CONFIG?.authSchemes || [];
    return authSchemes.find((scheme) => scheme.type === "apikey") || null;
  }

  /**
   * Get default API key name from auth schemes
   */
  getDefaultApiKeyName() {
    return this.getApiKeyScheme()?.name || "X-API-Key";
  }

  /**
   * Get the API key transport location from auth schemes
   */
  getApiKeyLocation() {
    return this.getApiKeyScheme()?.in || "header";
  }

  updateApiKeySection() {
    const location = this.getApiKeyLocation();
    const keyNameLabel = document.getElementById("apikey-name-label");
    const keyNameInput = document.getElementById("apikey-header");
    const keyHelp = document.getElementById("apikey-help");

    const labelByLocation = {
      header: "Header Name",
      query: "Query Parameter Name",
      cookie: "Cookie Name",
    };

    const helpByLocation = {
      header: "Will be sent as a request header",
      query: "Will be appended as a query parameter",
      cookie: "Will be sent as a request cookie",
    };

    if (keyNameLabel) {
      keyNameLabel.textContent = labelByLocation[location] || "Key Name";
    }
    if (keyNameInput) {
      keyNameInput.placeholder = this.getDefaultApiKeyName();
    }
    if (keyHelp) {
      keyHelp.textContent =
        helpByLocation[location] || "Will be sent with the request";
    }
  }

  saveAuth() {
    const authType = document.getElementById("auth-type").value;
    let authData = { type: authType };

    switch (authType) {
      case "bearer":
      case "token":
        const token = document.getElementById("bearer-token").value.trim();
        if (!token) {
          showToast("Please enter a token", "error");
          return;
        }
        authData.token = token;
        break;

      case "basic":
        const username = document.getElementById("basic-username").value.trim();
        const password = document.getElementById("basic-password").value.trim();
        if (!username || !password) {
          showToast("Please enter username and password", "error");
          return;
        }
        authData.username = username;
        authData.password = password;
        break;

      case "apikey":
        const headerName = document
          .getElementById("apikey-header")
          .value.trim();
        const apiKey = document.getElementById("apikey-value").value.trim();
        if (!headerName || !apiKey) {
          showToast("Please enter header name and API key", "error");
          return;
        }
        authData.keyName = headerName;
        authData.location = this.getApiKeyLocation();
        authData.apiKey = apiKey;
        break;
    }

    // Save to localStorage
    localStorage.setItem(this.authKey, JSON.stringify(authData));

    // Update UI
    this.updateAuthStatus();

    // Close modal
    this.closeAuthModal();

    // Show success message
    const tokenConfig = this.getTokenAuthConfig(authType);
    showToast(
      `${tokenConfig ? tokenConfig.successName : authType.charAt(0).toUpperCase() + authType.slice(1)} authentication configured`,
      "success",
    );
  }

  clearAuth() {
    localStorage.removeItem(this.authKey);

    // Clear all input fields
    document.getElementById("bearer-token").value = "";
    document.getElementById("basic-username").value = "";
    document.getElementById("basic-password").value = "";
    document.getElementById("apikey-header").value =
      this.getDefaultApiKeyName();
    document.getElementById("apikey-value").value = "";

    // Update UI
    this.updateAuthStatus();
    this.resetPasswordVisibility();

    // Close modal
    this.closeAuthModal();

    showToast("Authentication cleared", "info");
  }

  getAuth() {
    const authDataStr = localStorage.getItem(this.authKey);
    if (!authDataStr) return null;

    try {
      return JSON.parse(authDataStr);
    } catch (e) {
      console.error("Failed to parse auth data:", e);
      return null;
    }
  }

  loadAuth() {
    // Just update status, don't need to do anything else
    this.updateAuthStatus();
  }

  updateAuthStatus() {
    const authData = this.getAuth();
    const statusIndicator = document.getElementById("auth-status-indicator");
    const authorizeBtn = document.getElementById("authorize-btn");

    if (authData) {
      // Authenticated
      if (statusIndicator) {
        statusIndicator.classList.remove("bg-gray-400", "dark:bg-gray-600");
        statusIndicator.classList.add("bg-green-500", "dark:bg-green-400");
        statusIndicator.title = `Authenticated (${authData.type})`;
      }
      if (authorizeBtn) {
        authorizeBtn.classList.remove(
          "text-gray-700",
          "dark:text-gray-300",
          "hover:bg-gray-200",
          "dark:hover:bg-gray-700",
        );
        authorizeBtn.classList.add(
          "text-green-700",
          "dark:text-green-300",
          "bg-green-50",
          "dark:bg-green-900/20",
          "hover:bg-green-100",
          "dark:hover:bg-green-900/30",
        );
      }
    } else {
      // Not authenticated
      if (statusIndicator) {
        statusIndicator.classList.remove("bg-green-500", "dark:bg-green-400");
        statusIndicator.classList.add("bg-gray-400", "dark:bg-gray-600");
        statusIndicator.title = "Not authenticated";
      }
      if (authorizeBtn) {
        authorizeBtn.classList.remove(
          "text-green-700",
          "dark:text-green-300",
          "bg-green-50",
          "dark:bg-green-900/20",
          "hover:bg-green-100",
          "dark:hover:bg-green-900/30",
        );
        authorizeBtn.classList.add(
          "text-gray-700",
          "dark:text-gray-300",
          "hover:bg-gray-200",
          "dark:hover:bg-gray-700",
        );
      }
    }
  }

  /**
   * Get authentication values grouped by request location
   * @returns {{headers: Object, params: Object, cookies: Object}}
   */
  getAuthRequestConfig() {
    const authData = this.getAuth();
    if (!authData) {
      return { headers: {}, params: {}, cookies: {} };
    }

    const headers = {};
    const params = {};
    const cookies = {};

    switch (authData.type) {
      case "bearer":
        headers["Authorization"] = `Bearer ${authData.token}`;
        break;

      case "token":
        headers["Authorization"] = `Token ${authData.token}`;
        break;

      case "basic":
        const credentials = btoa(`${authData.username}:${authData.password}`);
        headers["Authorization"] = `Basic ${credentials}`;
        break;

      case "apikey": {
        const keyName =
          authData.keyName ||
          authData.headerName ||
          this.getDefaultApiKeyName();
        const location = authData.location || this.getApiKeyLocation();

        if (location === "query") {
          params[keyName] = authData.apiKey;
        } else if (location === "cookie") {
          cookies[keyName] = authData.apiKey;
        } else {
          headers[keyName] = authData.apiKey;
        }
        break;
      }
    }

    return { headers, params, cookies };
  }

  /**
   * Get authentication headers to be added to requests
   * @returns {Object} Headers object
   */
  getAuthHeaders() {
    return this.getAuthRequestConfig().headers;
  }

  /**
   * Check if user has configured authentication
   * @returns {boolean}
   */
  isAuthenticated() {
    return this.getAuth() !== null;
  }

  /**
   * Get current auth type
   * @returns {string|null} Auth type or null
   */
  getAuthType() {
    const authData = this.getAuth();
    return authData ? authData.type : null;
  }
}

// Initialize on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new GlobalAuth();
  });
} else {
  new GlobalAuth();
}
