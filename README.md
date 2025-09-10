# n8n Frontend Integration

A simple frontend application that authenticates with a local n8n instance and displays workflows in an iframe.

## Features

- 🎯 One-click workflow access
- 🔐 Automatic authentication with n8n
- 🍪 Cookie-based session management
- 📱 Responsive design
- ⚡ Fast and lightweight
- 🔄 Auto-session detection
- 🎨 Modern UI with smooth animations

## Setup Instructions

### Prerequisites

1. **Node.js**: Install Node.js (version 14 or higher)
2. **n8n Server**: Ensure you have n8n running locally on `localhost:5678`
3. **User Account**: Create a user account in your local n8n instance with these credentials:
   - Email: `meow@gmail.com`
   - Password: `Meow@123`
   - First Name: `Meow`
   - Last Name: `Meow`

### Installation & Setup

1. **Clone/Download** this repository to your local machine

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the proxy server**:
   ```bash
   npm start
   # Or for development with auto-reload:
   npm run dev
   ```

4. **Access the application**: 
   - Open your browser and navigate to: `http://localhost:3000`

### File Organization Benefits

With the new separated file structure:
- **Maintainability**: Each file has a single responsibility
- **Readability**: Code is organized and easier to understand
- **Scalability**: Easy to extend functionality in separate modules
- **Debugging**: Easier to locate and fix issues
- **Caching**: Browser can cache CSS and JS files separately

### Usage

1. **Start n8n**: Make sure your n8n server is running on `localhost:5678`
2. **Click "Enter Workflow"**: The application will automatically authenticate and load the workflow
3. **Work with n8n**: The iframe will display the n8n workflow interface
4. **Navigate back**: Use the "Back" button to return to the main screen

## How It Works

### Architecture

The application uses a **proxy server architecture** to handle n8n authentication and cookie management:

```
Browser → Proxy Server (localhost:3000) → n8n Server (localhost:5678)
```

### Authentication Flow

1. When "Enter Workflow" is clicked, the frontend sends a request to the **proxy server** (`/api/login`)
2. The proxy server forwards the login request to **n8n** (`localhost:5678/rest/login`)
3. n8n responds with authentication cookies to the **proxy server**
4. The proxy server **forwards the cookies** to your browser with the correct domain settings
5. The iframe loads the workflow URL with the authenticated session

### Session Management

- Cookies are set with `withCredentials: true` for automatic session handling
- The app checks for existing sessions on page load
- Multiple tabs will share the same authenticated session
- Sessions persist until the n8n cookies expire

### Error Handling

The application handles various error scenarios:
- n8n server not running
- Invalid credentials
- Network connectivity issues
- CORS configuration problems

## API Endpoints

### Proxy Server Endpoints (localhost:3000)

- **Login Proxy**: `POST /api/login` - Handles authentication and cookie forwarding
- **Session Check**: `GET /api/me` - Validates existing sessions
- **Health Check**: `GET /api/health` - Server status

### n8n Endpoints (localhost:5678)

- **Direct Login**: `POST /rest/login` - n8n authentication (used by proxy)
- **User Info**: `GET /rest/me` - User session info (used by proxy)
- **Workflow**: `GET /workflow/new?projectId=W8GjzbC6fEaaQA5a&uiContext=workflow_list`

## Configuration

### Changing Credentials

Edit the `USER_CREDENTIALS` object in `config.js`:

```javascript
const USER_CREDENTIALS = {
    email: "your-email@example.com",
    password: "your-password",
    firstName: "Your First Name",
    lastName: "Your Last Name"
};
```

### Changing Server Configuration

Modify the server settings in `config.js`:

```javascript
const SERVER_CONFIG = {
    BASE_URL: "http://localhost:3000",
    N8N_BASE_URL: "http://your-n8n-server:port",
    WORKFLOW: {
        PROJECT_ID: "your-project-id",
        UI_CONTEXT: "workflow_list"
    }
};
```

### Changing Application Settings

Update timeouts and UI settings in `config.js`:

```javascript
const APP_CONFIG = {
    TIMEOUTS: {
        LOGIN: 15000,        // 15 seconds for login
        SESSION_CHECK: 8000  // 8 seconds for session check
    },
    UI: {
        ERROR_AUTO_HIDE_DELAY: 8000,   // 8 seconds
        IFRAME_LOAD_DELAY: 1000        // 1 second
    }
};
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: 
   - Ensure n8n is configured to allow requests from your domain
   - Try serving the HTML file from a local server instead of opening directly

2. **Authentication Fails**:
   - Verify the user exists in your n8n instance
   - Check that the credentials are correct
   - Ensure n8n server is running and accessible

3. **Iframe Won't Load**:
   - Check browser console for errors
   - Verify the workflow URL is correct
   - Ensure cookies are being set properly

4. **Network Errors**:
   - Confirm n8n server is running on localhost:5678
   - Check firewall settings
   - Verify network connectivity

### Browser Console

Open browser developer tools (F12) to see detailed error messages and network requests.

## Security Notes

- This implementation uses hardcoded credentials for development purposes
- In production, implement proper authentication flows
- Consider using environment variables for configuration
- Ensure HTTPS in production environments

## File Structure

```
frontend-cookie-test/
├── index.html          # Main HTML structure
├── styles.css          # CSS styles and animations
├── config.js           # Configuration and constants
├── app.js              # Main application logic
├── server.js           # Proxy server for cookie handling
├── package.json        # Node.js dependencies and scripts
└── README.md           # This documentation
```

### File Descriptions

- **`index.html`** - Clean HTML structure with semantic markup
- **`styles.css`** - Modern CSS with responsive design, animations, and accessibility features
- **`config.js`** - Configuration file containing API endpoints, URLs, and credentials
- **`app.js`** - Main application logic with authentication, state management, and UI control
- **`server.js`** - Express.js proxy server that handles n8n authentication and cookie forwarding
- **`package.json`** - Node.js project configuration with dependencies and scripts

## Dependencies

### Frontend
- **Axios**: Loaded via CDN for HTTP requests
- **Modern Browser**: Supports ES6+ features

### Backend (Proxy Server)
- **Express.js**: Web framework for Node.js
- **Axios**: HTTP client for making requests to n8n
- **Node.js**: Runtime environment (version 14+)

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support  
- Safari: ✅ Full support
- IE11: ❌ Not supported (uses modern JavaScript)
