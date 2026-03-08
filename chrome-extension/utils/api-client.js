// utils/api-client.js
import { getApiUrl, getAuthToken } from './storage.js';

async function request(path, options = {}) {
    const [baseUrl, token] = await Promise.all([getApiUrl(), getAuthToken()]);

    if (!baseUrl || !token) {
        throw new Error('Extension is not connected to a dashboard. Please complete onboarding.');
    }

    const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        }
    });

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

// Called by cookie-manager.js on startup
export function getCookiePreferences() {
    return request('/preferences/cookies');
}

// Called by policy-pipeline.js when a policy prompt is detected
export function getPolicyPreferences() {
    return request('/preferences/policies');
}

// Called by policy-pipeline.js to summarise extracted policy text
export function summarizePolicy(policyText) {
    return request('/policies/summarize', {
        method: 'POST',
        body: JSON.stringify({ text: policyText })
    });
}

// Called by policy-pipeline.js after user accepts or rejects
export function logPolicyDecision(siteUrl, decision, policyText) {
    return request('/policies/log', {
        method: 'POST',
        body: JSON.stringify({ siteUrl, decision, policyText })
    });
}

// Called by onboarding.js to verify the connection works
export function validateConnection() {
    return request('/auth/validate');
}
