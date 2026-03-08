// Extension configuration
// Update these values to match your Auth0 tenant and backend instance

export const CONFIG = {
  // Backend API URL
  // Development: http://localhost:8000
  // Production: https://your-domain.com
  API_URL: 'http://localhost:8000',
  
  // Auth0 Configuration
  // Get these from your Auth0 dashboard
  AUTH0_DOMAIN: 'aegis.ca.auth0.com',
  AUTH0_CLIENT_ID: '9VXDr7zSUEIStj0XxlvO8bpzestrvTAd',
  
  // Extension callback URL (automatically generated)
  CALLBACK_URL: `https://${chrome.runtime.id}.chromiumapp.org/`
};
