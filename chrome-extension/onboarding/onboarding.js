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
  
  // ── Check if auth completed while popup was closed ───────────────────────
  // This handles the case where user completes OAuth but popup closed during flow
  
  chrome.storage.sync.get(['AUTH_TOKEN', 'ONBOARDED'], (result) => {
    if (result.AUTH_TOKEN && result.ONBOARDED) {
      console.log('[Raven] Already authenticated, showing success');
      showStep(stepSuccess);
      setTimeout(() => {
        window.location.replace('../interface/interface.html');
      }, 800);
    }
  });
  
  // ── Connect via Auth0 (Direct OAuth flow) ─────────────────────────────────
  // Opens Auth0 login directly using chrome.identity.launchWebAuthFlow
  // After authentication, Auth0 redirects to the extension's callback URL
  // with access_token in the URL hash
  
  btnConnect.addEventListener('click', async () => {
    console.log('[Raven] Connect button clicked - delegating to background');
    
    // Show loading state
    btnConnect.classList.add('is-loading');
    btnConnect.disabled = true;
    
    // Send message to background service worker to handle auth
    // Background persists even when popup closes during OAuth flow
    chrome.runtime.sendMessage({ type: 'START_AUTH0_LOGIN' }, async (response) => {
      console.log('[Raven] Auth response from background:', response);
      
      // Reset button state
      btnConnect.classList.remove('is-loading');
      btnConnect.disabled = false;
      
      if (chrome.runtime.lastError) {
        console.error('[Raven] Message error:', chrome.runtime.lastError);
        showStep(stepToken);
        return;
      }
      
      if (response?.success) {
        console.log('[Raven] Auth successful!');
        showStep(stepSuccess);
        setTimeout(() => window.close(), 1600);
      } else if (response?.canceled) {
        console.log('[Raven] Auth canceled by user');
        // Stay on welcome screen
      } else {
        console.error('[Raven] Auth failed:', response?.error);
        showStep(stepToken);
      }
    });
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
