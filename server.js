/**
 * Simple proxy server for n8n cookie management
 * Handles authentication and cookie forwarding
 */

const express = require("express");
const axios = require("axios");
const path = require("path");
const { N8N_API_CONFIG } = require("./config");

const app = express();
const PORT = 3000;

// n8n Configuration
const N8N_BASE_URL = "http://localhost:5678";
const N8N_LOGIN_ENDPOINT = `${N8N_BASE_URL}/rest/login`;
const N8N_USER_ENDPOINT = `${N8N_BASE_URL}/rest/me`;

// Middleware
app.use(express.json());
app.use(express.static("."));

// CORS middleware for development
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

/**
 * Serve the main HTML file
 */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/**
 * Proxy login endpoint - handles authentication and cookie forwarding
 */
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: "Email and password are required",
    });
  }

  try {
    console.log("🔐 Proxying login request to n8n...");
    console.log("📧 Email:", email);

    // Step 1: Make login request to n8n
    const loginResponse = await axios.post(
      N8N_LOGIN_ENDPOINT,
      {
        emailOrLdapLoginId: email,
        password: password,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        withCredentials: true,
        timeout: 10000,
      }
    );

    console.log("✅ n8n login successful!");

    // Step 2: Extract cookies from n8n response
    const cookies = loginResponse.headers["set-cookie"] || [];
    console.log("🍪 Cookies received from n8n:", cookies.length);

    // Step 3: Forward cookies to client
    if (cookies.length > 0) {
      cookies.forEach((cookie) => {
        // Parse and modify cookie for our domain
        const [nameValue, ...options] = cookie.split(";");
        const [name, value] = nameValue.split("=");

        // Create cookie options
        const cookieOptions = {
          httpOnly: false, // Allow client-side access for iframe
          secure: false, // Allow HTTP for localhost development
          sameSite: "Lax",
          path: "/",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        };

        // Parse original cookie options
        options.forEach((option) => {
          const [key, val] = option.trim().split("=");
          switch (key.toLowerCase()) {
            case "max-age":
              cookieOptions.maxAge = parseInt(val) * 1000;
              break;
            case "path":
              cookieOptions.path = val || "/";
              break;
          }
        });

        res.cookie(name, value, cookieOptions);
        console.log(`🍪 Set cookie: ${name}`);
      });
    }
    console.log(
      "🔗 Login response:",
      JSON.stringify(loginResponse.data, null, 2)
    );

    // Step 4: Return success response
    res.json({
      success: true,
      message: "Authentication successful",
      data: loginResponse.data,
      cookies: cookies,
      status: loginResponse.status,
      headers: {
        "set-cookie": cookies,
      },
    });
  } catch (error) {
    console.error("❌ Login failed:", error.message);

    let errorMessage = "Authentication failed";
    let statusCode = 500;

    if (error.code === "ECONNREFUSED") {
      errorMessage =
        "Cannot connect to n8n server. Please ensure n8n is running on localhost:5678.";
      statusCode = 503;
    } else if (error.response?.status === 401) {
      errorMessage = "Invalid credentials provided.";
      statusCode = 401;
    } else if (error.response?.status) {
      errorMessage =
        error.response.data?.message ||
        `n8n server error: ${error.response.status}`;
      statusCode = error.response.status;
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: error.response?.data || error.message,
    });
  }
});

/**
 * Proxy session check endpoint
 */
app.get("/api/me", async (req, res) => {
  try {
    // Extract n8n-auth cookie from request
    const authCookie = req.headers.cookie
      ?.split(";")
      .find((c) => c.trim().startsWith("n8n-auth="))
      ?.split("=")[1];

    if (!authCookie) {
      return res.status(401).json({
        success: false,
        error: "No authentication cookie found",
      });
    }

    // Forward request to n8n with cookie
    const response = await axios.get(N8N_USER_ENDPOINT, {
      headers: {
        Cookie: `n8n-auth=${authCookie}`,
        "Content-Type": "application/json",
      },
      timeout: 5000,
    });

    res.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.error("❌ Session check failed:", error.message);
    res.status(401).json({
      success: false,
      error: "Session validation failed",
    });
  }
});

/**
 * Create new n8n user and get invitation link
 */
app.post("/api/signup", async (req, res) => {
  const { email, role = "global:member" } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: "Email is required",
    });
  }

  try {
    console.log("👤 Creating new n8n user...");
    console.log("📧 Email:", email);
    console.log("🔐 Role:", role);

    // Create user via n8n API
    const response = await axios.post(
      N8N_API_CONFIG.USERS_URL,
      [{ email: email, role: role }],
      {
        headers: {
          "Content-Type": "application/json",
          "X-N8N-API-KEY": N8N_API_CONFIG.API_KEY,
        },
        timeout: 10000,
      }
    );

    console.log("✅ User creation successful!");
    console.log("📨 Response data:", response.data);

    // Extract the user data from response
    const userData = response.data;

    // Return the invitation data
    res.json({
      success: true,
      message: "User created successfully",
      data: userData,
      inviteAcceptUrl: userData.user?.inviteAcceptUrl,
    });
  } catch (error) {
    console.error("❌ User creation failed:", error.message);

    let errorMessage = "Failed to create user";
    let statusCode = 500;

    if (error.code === "ECONNREFUSED") {
      errorMessage =
        "Cannot connect to n8n API server. Please check the configuration.";
      statusCode = 503;
    } else if (error.response?.status === 401) {
      errorMessage = "Invalid API key or unauthorized access.";
      statusCode = 401;
    } else if (error.response?.status === 400) {
      errorMessage = error.response.data?.message || "Invalid request data.";
      statusCode = 400;
    } else if (error.response?.status === 409) {
      errorMessage = "User with this email already exists.";
      statusCode = 409;
    } else if (error.response?.status) {
      errorMessage =
        error.response.data?.message ||
        `n8n API error: ${error.response.status}`;
      statusCode = error.response.status;
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: error.response?.data || error.message,
    });
  }
});

/**
 * Health check endpoint
 */
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    server: "n8n-proxy",
    n8nUrl: N8N_BASE_URL,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Start the server
 */
app.listen(PORT, () => {
  console.log("\n🚀 n8n Proxy Server Started");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📍 Server URL: http://localhost:${PORT}`);
  console.log(`🔗 n8n Server: ${N8N_BASE_URL}`);
  console.log(`📁 Serving files from: ${__dirname}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n🔧 Available Endpoints:");
  console.log(`   GET  /                - Main application`);
  console.log(`   POST /api/login       - Proxy n8n login`);
  console.log(`   GET  /api/me          - Check session`);
  console.log(`   POST /api/signup      - Create n8n user`);
  console.log(`   GET  /api/health      - Health check`);
  console.log("\n✅ Ready to proxy n8n requests!\n");
});
