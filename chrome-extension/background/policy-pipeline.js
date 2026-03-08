import { getPolicySummary } from '../utils/api-client.js';

// ── In-memory cache ───────────────────────────────────────────────────────────
// Keyed by hostname. Cleared on service worker restart (expected MV3 behaviour).

const summaryCache = new Map(); // `${hostname}:${policyType}` → { data, timestamp }
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCached(hostname, policyType) {
    const key = `${hostname}:${policyType}`;
    const entry = summaryCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
        summaryCache.delete(key);
        return null;
    }
    return entry.data;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function deriveScore(answers) {
    if (!answers?.length) return 0;
    const points = { low: 100, medium: 50, high: 0 };
    const total = answers.reduce((sum, a) => sum + (points[a.concern_level] ?? 50), 0);
    return Math.round(total / answers.length);
}

async function getCachedOrFetch(hostname, policyType) {
    const key = `${hostname}:${policyType}`;
    const cached = getCached(hostname, policyType);
    if (cached) {
        console.log('[Raven] Cache hit for', hostname, policyType);
        return cached;
    }

    console.log('[Raven] Fetching summary for hostname:', hostname, '| policyType:', policyType);
    const raw = await getPolicySummary(hostname, policyType);
    console.log('[Raven] Raw API response:', raw);

    const data = {
        site: hostname,
        policyType,
        score: deriveScore(raw.answers),
        questions: raw.questions,
        answers: raw.answers,
    };
    console.log('[Raven] Processed data sent to UI:', data);
    summaryCache.set(key, { data, timestamp: Date.now() });
    return data;
}

// ── Message handler ───────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'POLICY_DETECTED') {
        const { site, policies } = message.payload;
        const tabId = sender.tab?.id;
        if (!tabId) return;

        console.log('[Raven] POLICY_DETECTED — site:', site, '| policies:', policies, '| tabId:', tabId);
        getCachedOrFetch(site, policies[0])
            .then((data) => {
                chrome.tabs.sendMessage(tabId, { type: 'SHOW_POLICY_POPUP', payload: data }, () => {
                    // Suppress "no receiver" errors if the tab navigated away
                    void chrome.runtime.lastError;
                });
            })
            .catch(() => {
                chrome.tabs.sendMessage(tabId, {
                    type: 'SHOW_POLICY_POPUP',
                    payload: { site, error: true }
                }, () => { void chrome.runtime.lastError; });
            });
    }

    if (message.type === 'GET_POLICY_DATA') {
        const { hostname, agreementType = 'pp' } = message.payload;

        console.log('[Raven] GET_POLICY_DATA — hostname:', hostname, '| agreementType:', agreementType);
        getCachedOrFetch(hostname, agreementType)
            .then((data) => sendResponse(data))
            .catch(() => sendResponse({ error: true }));

        return true; // keep message channel open for async sendResponse
    }
});
