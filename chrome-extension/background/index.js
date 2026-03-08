import { initialiseCookieManager } from './cookie-manager.js';
import './policy-pipeline.js';

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
