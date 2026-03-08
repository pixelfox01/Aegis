const DEFAULTS = {
    API_URL: 'http://localhost:8000',
    SELF_HOSTED: false,
    AUTH_TOKEN: null,
    ONBOARDED: false,
    COOKIE_PREFERENCES: {
        functional: false,
        analytics: false,
        marketing: false
    },
    USER_PREFERENCES: null
};

export function getApiUrl() {
    return new Promise((resolve) => {
        chrome.storage.sync.get('API_URL', (result) => {
            resolve(result.API_URL || DEFAULTS.API_URL);
        });
    });
}

export function setApiUrl(url) {
    return new Promise((resolve) => {
        chrome.storage.sync.set({ API_URL: url }, resolve);
    });
}

export function getSelfHosted() {
    return new Promise((resolve) => {
        chrome.storage.sync.get('SELF_HOSTED', (result) => {
            resolve(result.SELF_HOSTED ?? DEFAULTS.SELF_HOSTED);
        });
    });
}

export function setSelfHosted(value) {
    return new Promise((resolve) => {
        chrome.storage.sync.set({ SELF_HOSTED: value }, resolve);
    });
}

export function getAuthToken() {
    return new Promise((resolve) => {
        chrome.storage.sync.get('AUTH_TOKEN', (result) => {
            resolve(result.AUTH_TOKEN || DEFAULTS.AUTH_TOKEN);
        });
    });
}

export function setAuthToken(token) {
    return new Promise((resolve) => {
        chrome.storage.sync.set({ AUTH_TOKEN: token }, resolve);
    });
}

export function getCookiePreferences() {
    return new Promise((resolve) => {
        chrome.storage.sync.get('COOKIE_PREFERENCES', (result) => {
            resolve(result.COOKIE_PREFERENCES || DEFAULTS.COOKIE_PREFERENCES);
        });
    });
}

export function setCookiePreferences(preferences) {
    return new Promise((resolve) => {
        chrome.storage.sync.set({ COOKIE_PREFERENCES: preferences }, resolve);
    });
}

// ── Onboarding ───────────────────────────────────────────────────────────────

export function getOnboarded() {
    return new Promise((resolve) => {
        chrome.storage.sync.get('ONBOARDED', (result) => {
            resolve(result.ONBOARDED ?? DEFAULTS.ONBOARDED);
        });
    });
}

export function setOnboarded(value) {
    return new Promise((resolve) => {
        chrome.storage.sync.set({ ONBOARDED: value }, resolve);
    });
}

// ── User Preferences (local cache) ────────────────────────────────────────────
// Preferences are fetched from the API but cached locally so the content
// script / overlay can access them without hitting the network every time.

export function getCachedPreferences() {
    return new Promise((resolve) => {
        chrome.storage.local.get('USER_PREFERENCES', (result) => {
            resolve(result.USER_PREFERENCES || DEFAULTS.USER_PREFERENCES);
        });
    });
}

export function setCachedPreferences(preferences) {
    return new Promise((resolve) => {
        chrome.storage.local.set({ USER_PREFERENCES: preferences }, resolve);
    });
}

// ── Accepted Sites Guard ─────────────────────────────────────────────────────
// Tracks which hostnames have already been sent to the API as accepted,
// preventing duplicate PUT calls within the same browser session.
// Uses local storage so it persists across service worker restarts.

export function getAcceptedSites() {
    return new Promise((resolve) => {
        chrome.storage.local.get('ACCEPTED_SITES', (result) => {
            resolve(result.ACCEPTED_SITES || []);
        });
    });
}

export function addAcceptedSite(hostname) {
    return new Promise((resolve) => {
        chrome.storage.local.get('ACCEPTED_SITES', (result) => {
            const sites = result.ACCEPTED_SITES || [];
            if (!sites.includes(hostname)) {
                sites.push(hostname);
            }
            chrome.storage.local.set({ ACCEPTED_SITES: sites }, resolve);
        });
    });
}
