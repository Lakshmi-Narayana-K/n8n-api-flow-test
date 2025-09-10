/**
 * Main Application Logic for n8n Frontend Integration
 * Handles authentication, UI state management, and iframe control
 */

// Application State
let isAuthenticated = false;

// DOM Elements (cached for performance)
const elements = {
  enterBtn: null,
  loadingSpinner: null,
  statusMessage: null,
  errorMessage: null,
  welcomeScreen: null,
  iframeContainer: null,
  workflowIframe: null,
  backBtn: null,
};

/**
 * Initialize the application
 */
function initializeApp() {
  // Cache DOM elements
  cacheElements();

  // Set up event listeners
  setupEventListeners();

  // Check for existing session
  checkExistingSession();

  console.log("n8n Frontend Integration initialized");
}

/**
 * Cache DOM elements for performance
 */
function cacheElements() {
  elements.enterBtn = document.getElementById("enterBtn");
  elements.loadingSpinner = document.getElementById("loadingSpinner");
  elements.statusMessage = document.getElementById("statusMessage");
  elements.errorMessage = document.getElementById("errorMessage");
  elements.welcomeScreen = document.getElementById("welcomeScreen");
  elements.iframeContainer = document.getElementById("iframeContainer");
  elements.workflowIframe = document.getElementById("workflowIframe");
  elements.backBtn = document.getElementById("backBtn");
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Handle iframe load events
  if (elements.workflowIframe) {
    elements.workflowIframe.onload = handleIframeLoad;
    elements.workflowIframe.onerror = handleIframeError;
  }

  // Handle iframe communication
  window.addEventListener("message", handleIframeMessage);

  // Handle page unload (optional)
  window.addEventListener("beforeunload", handlePageUnload);

  // Handle back button
  if (elements.backBtn) {
    elements.backBtn.addEventListener("click", goBack);
  }
}

/**
 * Check if user already has a valid session
 */
async function checkExistingSession() {
  try {
    const response = await axios.get(PROXY_SESSION_ENDPOINT, {
      ...DEFAULT_AXIOS_CONFIG,
      timeout: APP_CONFIG.TIMEOUTS.SESSION_CHECK,
    });

    if (response.status === 200 && response.data.success) {
      console.log("Existing session found, showing workflow iframe");
      isAuthenticated = true;
      showWorkflowIframe();
    }
  } catch (error) {
    console.log("No existing session found, showing welcome screen");
    // This is expected behavior, user needs to login
  }
}

/**
 * Main function to handle workflow entry
 */
async function enterWorkflow() {
  try {
    // Hide any existing error messages
    hideError();

    // Show loading state
    setLoadingState(true, "Authenticating with n8n...");

    // Authenticate with n8n
    const authSuccess = await authenticateWithN8n();

    if (authSuccess) {
      setLoadingState(true, "Authentication successful! Loading workflow...");

      // Small delay to ensure cookies are properly set
      await sleep(APP_CONFIG.UI.IFRAME_LOAD_DELAY);

      isAuthenticated = true;
      showWorkflowIframe();
    }
  } catch (error) {
    console.error("Workflow entry failed:", error);
    handleAuthenticationError(error);
  } finally {
    setLoadingState(false);
  }
}

/**
 * Authenticate with n8n server
 */
async function authenticateWithN8n() {
  try {
    const response = await axios.post(
      PROXY_LOGIN_ENDPOINT,
      {
        email: USER_CREDENTIALS.email,
        password: USER_CREDENTIALS.password,
      },
      {
        ...DEFAULT_AXIOS_CONFIG,
        timeout: APP_CONFIG.TIMEOUTS.LOGIN,
      }
    );

    if (response.data && response.data.success) {
      console.log("Authentication successful:", response.data.message);
      console.log("Cookies received:", response.data.cookies?.length || 0);
      return true;
    } else {
      throw new Error(response.data?.error || "Authentication failed");
    }
  } catch (error) {
    console.error("Authentication error:", error);
    throw error;
  }
}

/**
 * Show the workflow iframe
 */
function showWorkflowIframe() {
  // Hide welcome screen
  if (elements.welcomeScreen) {
    elements.welcomeScreen.style.display = "none";
  }

  // Show iframe container
  if (elements.iframeContainer) {
    elements.iframeContainer.style.display = "flex";
  }

  // Show back button
  if (elements.backBtn) {
    elements.backBtn.style.display = "block";
  }

  // Load workflow in iframe
  if (elements.workflowIframe) {
    elements.workflowIframe.src = WORKFLOW_URL;
  }

  console.log("Workflow iframe displayed");
}

/**
 * Go back to welcome screen
 */
function goBack() {
  // Show welcome screen
  if (elements.welcomeScreen) {
    elements.welcomeScreen.style.display = "flex";
  }

  // Hide iframe container
  if (elements.iframeContainer) {
    elements.iframeContainer.style.display = "none";
  }

  // Hide back button
  if (elements.backBtn) {
    elements.backBtn.style.display = "none";
  }

  // Clear iframe source
  if (elements.workflowIframe) {
    elements.workflowIframe.src = "";
  }

  // Reset UI state
  resetUIState();

  console.log("Returned to welcome screen");
}

/**
 * Set loading state for the UI
 */
function setLoadingState(isLoading, message = "") {
  if (!elements.enterBtn || !elements.loadingSpinner || !elements.statusMessage)
    return;

  elements.enterBtn.disabled = isLoading;
  elements.loadingSpinner.style.display = isLoading ? "block" : "none";
  elements.statusMessage.textContent = message;
}

/**
 * Reset UI to initial state
 */
function resetUIState() {
  setLoadingState(false);
  hideError();
}

/**
 * Show error message
 */
function showError(message) {
  if (!elements.errorMessage) return;

  elements.errorMessage.textContent = message;
  elements.errorMessage.style.display = "block";

  // Auto-hide error after configured delay
  setTimeout(() => {
    hideError();
  }, APP_CONFIG.UI.ERROR_AUTO_HIDE_DELAY);

  console.error("Error displayed:", message);
}

/**
 * Hide error message
 */
function hideError() {
  if (elements.errorMessage) {
    elements.errorMessage.style.display = "none";
  }
}

/**
 * Handle authentication errors with specific messages
 */
function handleAuthenticationError(error) {
  let errorMessage = "Failed to authenticate with n8n. ";

  if (error.code === "ECONNREFUSED") {
    errorMessage += "Please ensure n8n server is running on localhost:5678.";
  } else if (error.response?.status === 401) {
    errorMessage += "Invalid credentials.";
  } else if (error.response?.status === 0 || error.code === "ERR_NETWORK") {
    errorMessage +=
      "Network error. Please check your connection and CORS settings.";
  } else if (error.code === "ECONNABORTED") {
    errorMessage += "Request timeout. Please try again.";
  } else {
    errorMessage += error.message || "Unknown error occurred.";
  }

  showError(errorMessage);
}

/**
 * Handle iframe load success
 */
function handleIframeLoad() {
  console.log("Workflow iframe loaded successfully");
  setLoadingState(false);
}

/**
 * Handle iframe load error
 */
function handleIframeError() {
  console.error("Failed to load workflow iframe");
  showError("Failed to load workflow. Please try again.");
  goBack();
}

/**
 * Handle messages from iframe
 */
function handleIframeMessage(event) {
  // Only accept messages from n8n server
  if (event.origin !== N8N_BASE_URL) {
    return;
  }

  console.log("Received message from n8n iframe:", event.data);

  // Handle specific message types if needed
  // Example: if (event.data.type === 'workflow_saved') { ... }
}

/**
 * Handle page unload
 */
function handlePageUnload(event) {
  if (isAuthenticated) {
    // Optional: Add confirmation if user tries to leave
    // event.preventDefault();
    // event.returnValue = '';
  }
}

/**
 * Utility function for delays
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Initialize app when DOM is loaded
 */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}

// Global functions (for HTML onclick handlers)
window.enterWorkflow = enterWorkflow;
window.goBack = goBack;
