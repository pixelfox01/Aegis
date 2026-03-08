import {
    getAuthToken, setAuthToken,
    getApiUrl, setApiUrl,
    getSelfHosted, setSelfHosted
  } from '../utils/storage.js';
  import { CONFIG } from '../config.js';
  
  // ── Constants ──────────────────────────────────────────────────────────────
  
  const AUTH_CALLBACK_URL = CONFIG.CALLBACK_URL;
  const API_URL = CONFIG.API_URL;
  
  // ── Theme (mirrored from interface.js) ─────────────────────────────────────
  
  const body = document.body;
  const themeToggle = document.getElementById('themeToggle');
  let dark = true;
  
  chrome.storage.local.get(['ravenTheme'], (result) => {
    dark = result.ravenTheme !== 'light';
    applyTheme();
  });
  
  function applyTheme() {
    body.className = dark ? 'theme-dark' : 'theme-light';
  }
  
  themeToggle.addEventListener('click', () => {
    dark = !dark;
    applyTheme();
    chrome.storage.local.set({ ravenTheme: dark ? 'dark' : 'light' });
  });
  
  // ── DOM refs ───────────────────────────────────────────────────────────────
  
  const stepWelcome = document.getElementById('stepWelcome');
  const stepToken   = document.getElementById('stepToken');
  const stepSuccess = document.getElementById('stepSuccess');
  
  const btnConnect     = document.getElementById('btnConnect');
  const btnManualEntry = document.getElementById('btnManualEntry');
  const btnBack        = document.getElementById('btnBackToWelcome');
  const btnSaveToken   = document.getElementById('btnSaveToken');
  
  const tokenInput     = document.getElementById('tokenInput');
  const tokenReveal    = document.getElementById('tokenReveal');
  const tokenError     = document.getElementById('tokenError');
  
  const selfHostedToggle = document.getElementById('selfHostedToggle');
  const apiUrlWrap       = document.getElementById('apiUrlWrap');
  const apiUrlInput      = document.getElementById('apiUrlInput');
  
  // ── Step navigation ────────────────────────────────────────────────────────
  
  function showStep(step) {
    [stepWelcome, stepToken, stepSuccess].forEach(s => s.classList.add('onboard-hidden'));
    step.classList.remove('onboard-hidden');
    // Re-trigger the fade-in animation
    step.style.animation = 'none';
    // Force reflow
    void step.offsetHeight;
    step.style.animation = '';
  }
  
  // ── Connect via Auth0 (Direct OAuth flow) ─────────────────────────────────
  // Opens Auth0 login directly using chrome.identity.launchWebAuthFlow
  // After authentication, Auth0 redirects to the extension's callback URL
  // with access_token in the URL hash
  
  btnConnect.addEventListener('click', async () => {
    console.log('[Raven] Connect button clicked');
    console.log('[Raven] Extension ID:', chrome.runtime.id);
    console.log('[Raven] Callback URL:', AUTH_CALLBACK_URL);
    console.log('[Raven] chrome.identity available?', !!chrome.identity);
    console.log('[Raven] chrome.identity.launchWebAuthFlow available?', !!chrome.identity?.launchWebAuthFlow);
    
    if (!chrome.identity?.launchWebAuthFlow) {
      console.error('[Raven] chrome.identity.launchWebAuthFlow not available - falling back to manual entry');
      showStep(stepToken);
      return;
    }
  
    // Construct Auth0 authorize URL with implicit flow
    const auth0Params = new URLSearchParams({
      client_id: CONFIG.AUTH0_CLIENT_ID,
      response_type: 'token id_token',
      redirect_uri: AUTH_CALLBACK_URL,
      scope: 'openid profile email',
      prompt: 'login',
      nonce: Math.random().toString(36).substring(2)
    });
    
    const loginUrl = `https://${CONFIG.AUTH0_DOMAIN}/authorize?${auth0Params.toString()}`;
    console.log('[Raven] Opening Auth0 login:', loginUrl);
    
    // Show loading state on button
    btnConnect.classList.add('is-loading');
    btnConnect.disabled = true;
  
    try {
      chrome.identity.launchWebAuthFlow(
        { url: loginUrl, interactive: true },
        async (redirectUrl) => {
          console.log('[Raven] Auth flow callback received');
          console.log('[Raven] Redirect URL:', redirectUrl);
          
          // Reset button state
          btnConnect.classList.remove('is-loading');
          btnConnect.disabled = false;
          
          if (chrome.runtime.lastError) {
            console.error('[Raven] Auth flow error:', chrome.runtime.lastError.message);
            // User closed the window or flow failed
            if (chrome.runtime.lastError.message.includes('canceled') || 
                chrome.runtime.lastError.message.includes('closed')) {
              console.log('[Raven] User canceled auth flow');
              return; // Stay on welcome screen
            }
            showStep(stepToken);
            return;
          }
          
          if (!redirectUrl) {
            console.error('[Raven] No redirect URL received');
            showStep(stepToken);
            return;
          }
    
          try {
            console.log('[Raven] Parsing redirect URL...');
            
            // Auth0 returns token in URL hash (#access_token=...)
            const hashIndex = redirectUrl.indexOf('#');
            if (hashIndex === -1) {
              console.error('[Raven] No hash fragment in redirect URL');
              console.log('[Raven] Full URL:', redirectUrl);
              // Check for error in query params
              const urlObj = new URL(redirectUrl);
              const error = urlObj.searchParams.get('error');
              const errorDesc = urlObj.searchParams.get('error_description');
              if (error) {
                console.error('[Raven] Auth0 error:', error, errorDesc);
              }
              showStep(stepToken);
              return;
            }
            
            const hashFragment = redirectUrl.substring(hashIndex + 1);
            console.log('[Raven] Hash fragment:', hashFragment.substring(0, 50) + '...');
            
            const hashParams = new URLSearchParams(hashFragment);
            const token = hashParams.get('access_token');
            const idToken = hashParams.get('id_token');
            const error = hashParams.get('error');
            const errorDesc = hashParams.get('error_description');
            
            if (error) {
              console.error('[Raven] Auth0 returned error:', error, errorDesc);
              showStep(stepToken);
              return;
            }
            
            console.log('[Raven] access_token present:', !!token);
            console.log('[Raven] id_token present:', !!idToken);
            
            if (token) {
              console.log('[Raven] Token received, saving...');
              await setApiUrl(API_URL);
              await setSelfHosted(false);
              await saveAndFinish(token);
            } else {
              console.error('[Raven] No access_token in redirect URL');
              console.log('[Raven] Available params:', Array.from(hashParams.keys()));
              showStep(stepToken);
            }
          } catch (error) {
            console.error('[Raven] Error parsing auth response:', error);
            showStep(stepToken);
          }
        }
      );
    } catch (error) {
      console.error('[Raven] Error launching auth flow:', error);
      btnConnect.classList.remove('is-loading');
      btnConnect.disabled = false;
      showStep(stepToken);
    }
  });
  
  // ── Manual token entry ─────────────────────────────────────────────────────
  
  btnManualEntry.addEventListener('click', () => showStep(stepToken));
  btnBack.addEventListener('click', () => showStep(stepWelcome));
  
  // Token field validation
  tokenInput.addEventListener('input', () => {
    btnSaveToken.disabled = tokenInput.value.trim().length === 0;
    tokenError.classList.add('onboard-hidden');
  });
  
  // Show/hide token
  let tokenVisible = false;
  tokenReveal.addEventListener('click', () => {
    tokenVisible = !tokenVisible;
    tokenInput.type = tokenVisible ? 'text' : 'password';
  });
  
  // Self-hosted toggle
  let selfHosted = false;
  selfHostedToggle.addEventListener('click', () => {
    selfHosted = !selfHosted;
    selfHostedToggle.setAttribute('aria-checked', selfHosted);
    if (selfHosted) {
      apiUrlWrap.classList.remove('onboard-hidden');
    } else {
      apiUrlWrap.classList.add('onboard-hidden');
    }
  });
  
  // Save token
  btnSaveToken.addEventListener('click', async () => {
    const token = tokenInput.value.trim();
    if (!token) return;
  
    btnSaveToken.classList.add('is-loading');
    tokenError.classList.add('onboard-hidden');
  
    try {
      // Save settings
      await setAuthToken(token);
      if (selfHosted) {
        await setSelfHosted(true);
        const customUrl = apiUrlInput.value.trim();
        if (customUrl) await setApiUrl(customUrl);
      } else {
        await setSelfHosted(false);
      }
  
      // Verify the token works by hitting a lightweight endpoint
      const isValid = await verifyToken();
      if (!isValid) {
        tokenError.classList.remove('onboard-hidden');
        btnSaveToken.classList.remove('is-loading');
        return;
      }
  
      await saveAndFinish(token);
    } catch {
      tokenError.classList.remove('onboard-hidden');
      btnSaveToken.classList.remove('is-loading');
    }
  });
  
  // ── Token verification ─────────────────────────────────────────────────────
  // Tries a lightweight API call to confirm the token is valid.
  // Returns true if the API responds with 2xx, false otherwise.
  
  async function verifyToken() {
    try {
      const [baseUrl, token, isSelfHosted] = await Promise.all([
        getApiUrl(), getAuthToken(), getSelfHosted()
      ]);
  
      const authHeader = isSelfHosted
        ? { 'X-API-Key': token }
        : { 'Authorization': `Bearer ${token}` };
  
      // Use a lightweight endpoint to verify token
      const response = await fetch(`${baseUrl}/api/users/me`, {
        headers: { 'Content-Type': 'application/json', ...authHeader }
      });
  
      return response.ok;
    } catch {
      return false;
    }
  }
  
  // ── Save & finish ──────────────────────────────────────────────────────────
  
  async function saveAndFinish(token) {
    await setAuthToken(token);
    await markOnboardingComplete();
    showStep(stepSuccess);
  
    // After a brief pause, close the popup — the next time it opens
    // it will load interface.html instead.
    setTimeout(() => window.close(), 1600);
  }
  
  // ── Onboarding state ───────────────────────────────────────────────────────
  
  export function markOnboardingComplete() {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ ONBOARDED: true }, resolve);
    });
  }
  
  // ── Logo link ──────────────────────────────────────────────────────────────
  
  document.getElementById('ravenLogo').addEventListener('click', () => {
    chrome.tabs.create({ url: API_URL });
  });
