const DEFAULTS = {
    API_URL: 'http://localhost:8000',
    SELF_HOSTED: false,
    AUTH_TOKEN: null,
    COOKIE_PREFERENCES: {
        functional: false,
        analytics: false,
        marketing: false
    }
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
