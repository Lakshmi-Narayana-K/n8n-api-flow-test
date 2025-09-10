/**
 * Configuration file for n8n integration
 * Contains all API endpoints, URLs, and user credentials
 */

// Server Configuration
const SERVER_CONFIG = {
  BASE_URL: "http://localhost:3000",
  N8N_BASE_URL: "http://localhost:5678",
  ENDPOINTS: {
    LOGIN: "/api/login",
    SESSION_CHECK: "/api/me",
    HEALTH: "/api/health",
  },
  WORKFLOW: {
    PROJECT_ID: "W8GjzbC6fEaaQA5a",
    UI_CONTEXT: "workflow_list",
    WORFLOW_ID: "kRSA2yxtFlaRgz9P",
  },
};

// Derived URLs
const N8N_BASE_URL = SERVER_CONFIG.N8N_BASE_URL;
const PROXY_LOGIN_ENDPOINT = `${SERVER_CONFIG.BASE_URL}${SERVER_CONFIG.ENDPOINTS.LOGIN}`;
const PROXY_SESSION_ENDPOINT = `${SERVER_CONFIG.BASE_URL}${SERVER_CONFIG.ENDPOINTS.SESSION_CHECK}`;
const WORKFLOW_URL = `${N8N_BASE_URL}/workflow/new?projectId=${SERVER_CONFIG.WORKFLOW.PROJECT_ID}&uiContext=${SERVER_CONFIG.WORKFLOW.UI_CONTEXT}`;
// const WORKFLOW_URL = `${N8N_BASE_URL}/workflow/${SERVER_CONFIG.WORKFLOW.WORFLOW_ID}`;

// User Credentials (Hardcoded for development)
const USER_CREDENTIALS = {
  email: "meow@gmail.com",
  password: "Meow@123",
  firstName: "Meow",
  lastName: "Meow",
};

// Application Settings
const APP_CONFIG = {
  TIMEOUTS: {
    LOGIN: 10000, // 10 seconds for login
    SESSION_CHECK: 5000, // 5 seconds for session check
  },
  UI: {
    ERROR_AUTO_HIDE_DELAY: 10000, // 10 seconds
    IFRAME_LOAD_DELAY: 500, // 0.5 seconds
  },
};

// API Request Configuration
const DEFAULT_AXIOS_CONFIG = {
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
};

// Export for potential future module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    SERVER_CONFIG,
    N8N_BASE_URL,
    PROXY_LOGIN_ENDPOINT,
    PROXY_SESSION_ENDPOINT,
    WORKFLOW_URL,
    USER_CREDENTIALS,
    APP_CONFIG,
    DEFAULT_AXIOS_CONFIG,
  };
}
