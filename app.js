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
  sessionStatus: null,
  statusIndicator: null,
  statusText: null,
  testingTools: null,
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
  elements.sessionStatus = document.getElementById("sessionStatus");
  elements.statusIndicator = document.getElementById("statusIndicator");
  elements.statusText = document.getElementById("statusText");
  elements.testingTools = document.getElementById("testingTools");
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
    updateSessionStatus("checking", "Checking session...");

    const response = await axios.get(PROXY_SESSION_ENDPOINT, {
      ...DEFAULT_AXIOS_CONFIG,
      timeout: APP_CONFIG.TIMEOUTS.SESSION_CHECK,
    });

    if (response.status === 200 && response.data.success) {
      console.log("Existing session found, showing testing tools");
      isAuthenticated = true;
      updateSessionStatus("authenticated", "Session active - Testing tools available");
      showTestingTools();
      // Commented out iframe to show testing tools
      // showWorkflowIframe();
    } else {
      updateSessionStatus("unauthenticated", "No active session");
    }
  } catch (error) {
    console.log("No existing session found, showing welcome screen");
    updateSessionStatus("unauthenticated", "No active session");
    showTestingTools();
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
      setLoadingState(true, "Authentication successful! Testing tools available...");

      // Small delay to ensure cookies are properly set
      await sleep(APP_CONFIG.UI.IFRAME_LOAD_DELAY);

      isAuthenticated = true;
      // Commented out iframe to show testing tools
      // showWorkflowIframe();
      updateSessionStatus("authenticated", "Session active - Testing tools available");
      showTestingTools();
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

/**
 * Update session status display
 */
function updateSessionStatus(status, message) {
  if (
    !elements.sessionStatus ||
    !elements.statusIndicator ||
    !elements.statusText
  )
    return;

  // Remove existing status classes
  elements.sessionStatus.classList.remove("authenticated", "unauthenticated");

  switch (status) {
    case "authenticated":
      elements.sessionStatus.classList.add("authenticated");
      elements.statusIndicator.textContent = "✅";
      break;
    case "unauthenticated":
      elements.sessionStatus.classList.add("unauthenticated");
      elements.statusIndicator.textContent = "⚠️";
      break;
    case "checking":
    default:
      elements.statusIndicator.textContent = "🔍";
      break;
  }

  elements.statusText.textContent = message;
}

/**
 * Show testing tools
 */
function showTestingTools() {
  if (elements.testingTools) {
    elements.testingTools.style.display = "block";
    console.log("🧪 Testing tools are now visible - you can test the Personal Project API!");
  }
}

/**
 * Hide testing tools
 */
function hideTestingTools() {
  if (elements.testingTools) {
    elements.testingTools.style.display = "none";
  }
}

/**
 * Testing function: Open new tab with same application
 */
function openNewTab() {
  const currentUrl = window.location.href;
  window.open(currentUrl, "_blank");
  console.log("🆕 Opened new tab for session persistence testing");
}

/**
 * Testing function: Open n8n directly in new tab
 */
function openDirectN8n() {
  window.open(N8N_BASE_URL, "_blank");
  console.log("🔗 Opened n8n directly for session testing");
}

/**
 * Testing function: Check current cookies
 */
function checkCookies() {
  const cookies = document.cookie.split(";").reduce((acc, cookie) => {
    const [name, value] = cookie.trim().split("=");
    acc[name] = value;
    return acc;
  }, {});

  console.log("🍪 Current cookies:", cookies);

  const cookieInfo =
    Object.keys(cookies).length > 0
      ? `Found ${Object.keys(cookies).length} cookies:\n${JSON.stringify(
          cookies,
          null,
          2
        )}`
      : "No cookies found";

  alert(`🍪 Cookie Information:\n\n${cookieInfo}`);
}

/**
 * Testing function: Get personal project details
 */
async function getPersonalProjectDetails() {
  try {
    console.log("🔍 Fetching personal project details...");
    
    const response = await axios.get(PROXY_PERSONAL_PROJECT_ENDPOINT, {
      ...DEFAULT_AXIOS_CONFIG,
      timeout: APP_CONFIG.TIMEOUTS.LOGIN,
    });
    

    if (response.data && response.data.success) {
      console.log("✅ Personal project details retrieved successfully!");
      console.log("📊 Project Data:", JSON.stringify(response.data.data, null, 2));
      
      // Display project details in an alert for easy viewing
      const projectData = response.data.data;
      const projectInfo = `
🏗️ Personal Project Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 ID: ${projectData.id}
📝 Name: ${projectData.name}
🏷️ Type: ${projectData.type}
📅 Created: ${new Date(projectData.createdAt).toLocaleString()}
🔄 Updated: ${new Date(projectData.updatedAt).toLocaleString()}
📄 Description: ${projectData.description || 'No description'}
🎯 Scopes: ${projectData.scopes ? projectData.scopes.join(', ') : 'No scopes'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `;
      
      alert(projectInfo);
    } else {
      throw new Error(response.data?.error || "Failed to fetch project details");
    }
  } catch (error) {
    console.error("❌ Failed to fetch personal project details:", error);
    
    let errorMessage = "Failed to fetch personal project details. ";
    
    if (error.response?.status === 401) {
      errorMessage += "Please ensure you are logged in.";
    } else if (error.response?.status === 403) {
      errorMessage += "Insufficient permissions.";
    } else if (error.response?.status === 404) {
      errorMessage += "Personal project not found.";
    } else {
      errorMessage += error.message || "Unknown error occurred.";
    }
    
    alert(`❌ Error: ${errorMessage}`);
  }
}

/**
 * Testing function: Clear session and cookies
 */
async function clearSession() {
  if (
    confirm(
      "Are you sure you want to clear the session? This will log you out."
    )
  ) {
    // Clear all cookies
    document.cookie.split(";").forEach(function (c) {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    // Reset application state
    isAuthenticated = false;
    updateSessionStatus("unauthenticated", "Session cleared");

    // Go back to welcome screen if in iframe view
    if (
      elements.iframeContainer &&
      elements.iframeContainer.style.display === "flex"
    ) {
      goBack();
    }

    console.log("🧹 Session cleared");
    alert("Session cleared! You can now test fresh authentication.");
  }
}

/**
 * Enhanced go back function with session status update
 */
function goBackEnhanced() {
  goBack();

  // Update session status after going back
  setTimeout(() => {
    checkExistingSession();
  }, 500);
}

// Global functions (for HTML onclick handlers)
window.enterWorkflow = enterWorkflow;
window.goBack = goBackEnhanced;
window.openNewTab = openNewTab;
window.openDirectN8n = openDirectN8n;
window.checkCookies = checkCookies;
window.getPersonalProjectDetails = getPersonalProjectDetails;
window.clearSession = clearSession;
