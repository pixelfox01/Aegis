// background/cookie-manager.js
import { getCookiePreferences } from '../utils/storage.js';

const ESSENTIAL_NAME_PATTERNS = [
  'session', 'sess', 'auth', 'token', 'csrf', 'xsrf', 'cart', 'basket'
];

const CATEGORY_PATTERNS = {
  analytics: ['_ga', '_gid', '_gat', 'amplitude', 'mixpanel', 'heap'],
  marketing: ['_fbp', '_fbc', 'fr', 'ide', 'dsid', '_gcl', 'tt_webid', 'ads']
};

// ─── Cookie Classification ───────────────────────────────────────────────────

function isEssentialByName(cookieName) {
  const name = cookieName.toLowerCase();
  return ESSENTIAL_NAME_PATTERNS.some(pattern => name.includes(pattern));
}

function getCookieCategory(cookieName) {
  const name = cookieName.toLowerCase();
  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    if (patterns.some(pattern => name.includes(pattern))) {
      return category;
    }
  }
  return 'unknown';
}

function isCookieEssential(cookie) {
  const isFirstParty = !cookie.domain.startsWith('.');
  const isHttpOnly = cookie.httpOnly;
  const isSameSiteSafe = cookie.sameSite === 'strict' || cookie.sameSite === 'lax';
  const hasEssentialName = isEssentialByName(cookie.name);

  if (!isFirstParty) return false;
  if (hasEssentialName) return true;
  return isHttpOnly && isSameSiteSafe;
}

// ─── Declarative Net Request Rules ───────────────────────────────────────────

async function updateRules(preferences) {
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const existingIds = existingRules.map(rule => rule.id);

  const newRules = buildRules(preferences);

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existingIds,
    addRules: newRules
  });
}

function buildRules(preferences) {
  const rules = [];
  let id = 1;

  // Always block third-party cookies
  rules.push({
    id: id++,
    priority: 1,
    action: {
      type: 'modifyHeaders',
      responseHeaders: [{
        header: 'set-cookie',
        operation: 'remove'
      }]
    },
    condition: {
      domainType: 'thirdParty'
    }
  });

  if (!preferences.analytics) {
    rules.push({
      id: id++,
      priority: 2,
      action: {
        type: 'modifyHeaders',
        responseHeaders: [{
          header: 'set-cookie',
          operation: 'remove'
        }]
      },
      condition: {
        domainType: 'firstParty',
        urlFilter: CATEGORY_PATTERNS.analytics.join('|')
      }
    });
  }

  if (!preferences.marketing) {
    rules.push({
      id: id++,
      priority: 2,
      action: {
        type: 'modifyHeaders',
        responseHeaders: [{
          header: 'set-cookie',
          operation: 'remove'
        }]
      },
      condition: {
        domainType: 'firstParty',
        urlFilter: CATEGORY_PATTERNS.marketing.join('|')
      }
    });
  }

  return rules;
}

// ─── JavaScript Cookie Cleanup ───────────────────────────────────────────────

async function cleanupJavaScriptCookies(tabUrl) {
  const preferences = await getCookiePreferences();

  chrome.cookies.getAll({ url: tabUrl }, (cookies) => {
    for (const cookie of cookies) {
      if (isCookieEssential(cookie)) continue;

      const category = getCookieCategory(cookie.name);

      if (category === 'functional' && preferences.functional) continue;
      if (category === 'analytics' && preferences.analytics) continue;
      if (category === 'marketing' && preferences.marketing) continue;

      chrome.cookies.remove({
        url: tabUrl,
        name: cookie.name
      });
    }
  });
}

// ─── Initialisation ──────────────────────────────────────────────────────────

export async function initialiseCookieManager() {
  const preferences = await getCookiePreferences();
  await updateRules(preferences);

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
      cleanupJavaScriptCookies(tab.url);
    }
  });
}
