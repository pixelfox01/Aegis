// utils/api-client.js
import { getApiUrl, getAuthToken, getSelfHosted } from './storage.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function extractCompanyName(hostname) {
    const parts = hostname.replace(/^www\./, '').split('.');
    if (parts.includes("co")) {
        return parts[parts.length - 3];
    }
    return parts[parts.length - 2];
}

async function request(path) {
    const [baseUrl, token, isSelfHosted] = await Promise.all([
        getApiUrl(),
        getAuthToken(),
        getSelfHosted()
    ]);

    const authHeader = isSelfHosted
        ? { 'X-API-Key': token }
        : { 'Authorization': `Bearer ${token}` };

    const fullUrl = `${baseUrl}${path}`;
    console.log('[Raven] API request →', fullUrl);
    console.log('[Raven] Auth mode:', isSelfHosted ? 'X-API-Key' : 'Bearer token', '| Token set:', token !== null);

    const response = await fetch(fullUrl, {
        headers: {
            'Content-Type': 'application/json',
            ...authHeader
        }
    });

    console.log('[Raven] API response status:', response.status, response.statusText);

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    console.log('[Raven] API response body:', json);
    return json;
}

// ─── Endpoints ───────────────────────────────────────────────────────────────

// Returns the full summary object for a given company and agreement type
// agreementType matches the types identified by detect-policy.js:
// 'terms', 'privacy', 'eula', 'cookies'
export function getPolicySummary(hostname, agreementType) {
    const company = extractCompanyName(hostname);
    return request(`/summary/${company}?agreement_type=${agreementType}`);
}

// Returns all accounts the user has stored in the dashboard
export function getUserAccounts() {
    return request('/accounts');
}

// Returns whether the user has an existing account for a given company
export function getUserAccountForCompany(hostname) {
    const company = extractCompanyName(hostname);
    return request(`/accounts/${company}`);
}