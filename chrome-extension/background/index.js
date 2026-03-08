import { initialiseCookieManager } from './cookie-manager.js';
import './policy-pipeline.js';
import { CONFIG } from '../config.js';

initialiseCookieManager();

// ── Theme-aware toolbar icon ──────────────────────────────────────────────────

function applyIcon(theme) {
    const icon = theme === 'light' ? 'icons/icon-light.png' : 'icons/icon-dark.png';
    chrome.action.setIcon({ path: { '16': icon, '32': icon, '48': icon } });
}

chrome.storage.local.get(['ravenTheme'], ({ ravenTheme }) => applyIcon(ravenTheme));

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.ravenTheme) applyIcon(changes.ravenTheme.newValue);
});

// ── Auth0 Authentication Handler ──────────────────────────────────────────────
// Handles OAuth flow in background so it persists when popup closes

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'START_AUTH0_LOGIN') {
        handleAuth0Login()
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep channel open for async response
    }
    
    if (message.type === 'CHECK_AUTH_STATUS') {
        chrome.storage.sync.get(['AUTH_TOKEN', 'ONBOARDED'], (result) => {
            sendResponse({
                isAuthenticated: !!(result.AUTH_TOKEN && result.ONBOARDED),
                hasToken: !!result.AUTH_TOKEN
            });
        });
        return true;
    }
});

async function handleAuth0Login() {
    console.log('[Raven BG] Starting Auth0 login flow');
    
    const callbackUrl = CONFIG.CALLBACK_URL;
    console.log('[Raven BG] Callback URL:', callbackUrl);
    
    const auth0Params = new URLSearchParams({
        client_id: CONFIG.AUTH0_CLIENT_ID,
        response_type: 'token id_token',
        redirect_uri: callbackUrl,
        scope: 'openid profile email',
        prompt: 'login',
        nonce: Math.random().toString(36).substring(2)
    });
    
    const loginUrl = `https://${CONFIG.AUTH0_DOMAIN}/authorize?${auth0Params.toString()}`;
    console.log('[Raven BG] Auth URL:', loginUrl);
    
    return new Promise((resolve) => {
        chrome.identity.launchWebAuthFlow(
            { url: loginUrl, interactive: true },
            async (redirectUrl) => {
                console.log('[Raven BG] Callback received');
                
                if (chrome.runtime.lastError) {
                    console.error('[Raven BG] Auth error:', chrome.runtime.lastError.message);
                    if (chrome.runtime.lastError.message.includes('canceled') ||
                        chrome.runtime.lastError.message.includes('closed')) {
                        resolve({ success: false, canceled: true });
                        return;
                    }
                    resolve({ success: false, error: chrome.runtime.lastError.message });
                    return;
                }
                
                if (!redirectUrl) {
                    console.error('[Raven BG] No redirect URL');
                    resolve({ success: false, error: 'No redirect URL received' });
                    return;
                }
                
                try {
                    const hashIndex = redirectUrl.indexOf('#');
                    if (hashIndex === -1) {
                        console.error('[Raven BG] No hash fragment');
                        resolve({ success: false, error: 'No token in response' });
                        return;
                    }
                    
                    const hashFragment = redirectUrl.substring(hashIndex + 1);
                    const hashParams = new URLSearchParams(hashFragment);
                    const token = hashParams.get('access_token');
                    const error = hashParams.get('error');
                    
                    if (error) {
                        const errorDesc = hashParams.get('error_description');
                        console.error('[Raven BG] Auth0 error:', error, errorDesc);
                        resolve({ success: false, error: errorDesc || error });
                        return;
                    }
                    
                    if (token) {
                        console.log('[Raven BG] Token received, saving...');
                        await chrome.storage.sync.set({
                            AUTH_TOKEN: token,
                            API_URL: CONFIG.API_URL,
                            SELF_HOSTED: false,
                            ONBOARDED: true
                        });
                        console.log('[Raven BG] Auth complete!');
                        resolve({ success: true });
                    } else {
                        console.error('[Raven BG] No access_token in response');
                        resolve({ success: false, error: 'No access token received' });
                    }
                } catch (err) {
                    console.error('[Raven BG] Parse error:', err);
                    resolve({ success: false, error: err.message });
                }
            }
        );
    });
}
