// active-detection/detect-policy.js

const AGREEMENT_PATTERNS = [
    'agree',
    'accept',
    'agree to',
    'accept the',
    'by checking',
    'by signing'
];

const POLICY_TYPES = [
    { type: 'terms', patterns: ['terms of service', 'terms and conditions', 'terms & conditions'] },
    { type: 'privacy', patterns: ['privacy policy', 'privacy notice'] },
];

function getTextNearElement(element) {
    let node = element;
    for (let i = 0; i < 3; i++) {
        if (node.parentElement) node = node.parentElement;
    }
    return node.innerText?.toLowerCase() || '';
}

function identifyPolicyTypes(text) {
    const found = [];
    for (const { type, patterns } of POLICY_TYPES) {
        if (patterns.some(pattern => text.includes(pattern))) {
            found.push(type);
        }
    }
    return found;
}

function hasAgreementLanguage(text) {
    return AGREEMENT_PATTERNS.some(pattern => text.includes(pattern));
}

function hasNearbyLink(element) {
    let node = element;
    for (let i = 0; i < 3; i++) {
        if (node.parentElement) node = node.parentElement;
    }
    return node.querySelector('a[href]') !== null;
}

function scanForPolicyCheckboxes() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const detectedPolicies = new Set();

    for (const checkbox of checkboxes) {
        const surroundingText = getTextNearElement(checkbox);

        if (!hasAgreementLanguage(surroundingText)) continue;
        if (!hasNearbyLink(checkbox)) continue;

        const policyTypes = identifyPolicyTypes(surroundingText);
        if (policyTypes.length === 0) continue;

        policyTypes.forEach(type => detectedPolicies.add(type));
    }

    return [...detectedPolicies];
}

// ── Deduplication guard ───────────────────────────────────────────────────────
// Prevents the MutationObserver from firing duplicate POLICY_DETECTED messages.

const _notifiedHostnames = new Set();

function notifyPipelineIfDetected() {
    const policies = scanForPolicyCheckboxes();
    if (policies.length === 0) return;

    const hostname = window.location.hostname.replace(/^www\./, '');
    if (_notifiedHostnames.has(hostname)) return;
    _notifiedHostnames.add(hostname);

    chrome.runtime.sendMessage({
        type: 'POLICY_DETECTED',
        payload: { site: hostname, policies }
    });
}

// ── Overlay: CSS injection ────────────────────────────────────────────────────

function injectRavenStyles() {
    if (document.getElementById('raven-styles')) return;
    const link = document.createElement('link');
    link.id = 'raven-styles';
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('summary-popup/policy-summary.css');
    document.head.appendChild(link);
}

// ── Overlay: HTML builder ─────────────────────────────────────────────────────

function concernLevelToDotClass(level) {
    if (level === 'high') return 'raven-dot-bad';
    if (level === 'medium') return 'raven-dot-warn';
    return 'raven-dot-ok';
}

function buildItemsHTML(data) {
    if (data.error || !data.questions?.length) {
        return `
          <li class="raven-item">
            <span class="raven-dot raven-dot-warn"></span>
            <div class="raven-item-body">
              <span class="raven-item-label">Summary unavailable</span>
              <span class="raven-item-desc">Raven could not retrieve data for this site.</span>
            </div>
          </li>`;
    }

    return data.questions.map((question, i) => {
        const answer = data.answers[i];
        const dotClass = concernLevelToDotClass(answer?.concern_level);
        const desc = answer?.summary_text || '';
        return `
          <li class="raven-item">
            <span class="raven-dot ${dotClass}"></span>
            <div class="raven-item-body">
              <span class="raven-item-label">${escapeHTML(question)}</span>
              <span class="raven-item-desc">${escapeHTML(desc)}</span>
            </div>
          </li>`;
    }).join('');
}

function escapeHTML(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function buildOverlayHTML(data) {
    const site = escapeHTML(data.site || '');
    const scoreDisplay = data.error ? '—' : '0';
    const readBtnStyle = data.error ? ' style="display:none"' : '';

    return `
      <div class="raven-overlay" id="ravenOverlay">
        <div class="raven-panel" id="ravenPanel">

          <div class="raven-header">
            <div class="raven-header-left">
              <span class="raven-logo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2C6 2 3 7 3 12c0 3 1.5 5.5 4 7l5-9 5 9c2.5-1.5 4-4 4-7 0-5-3-10-9-10z"/>
                </svg>
                Raven
              </span>
              <div class="raven-header-text">
                <h2 class="raven-title">Before you agree —</h2>
                <p class="raven-subtitle">Here's what <em>${site}</em>'s terms actually say.</p>
              </div>
            </div>
            <div class="raven-header-right">
              <button class="raven-theme-toggle" id="ravenThemeToggle" title="Toggle theme">
                <span class="raven-toggle-icon raven-icon-sun">☀️</span>
                <span class="raven-toggle-icon raven-icon-moon">🌙</span>
                <span class="raven-toggle-knob"></span>
              </button>
              <button class="raven-close" id="ravenClose" title="Dismiss">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          <ul class="raven-items">
            ${buildItemsHTML(data)}
          </ul>

          <div class="raven-footer">
            <p class="raven-score-line">
              Privacy score for this site: <strong id="ravenScore">${scoreDisplay}</strong><span class="raven-score-max">/100</span>
            </p>
            <div class="raven-actions">
              <button class="raven-btn-ghost" id="ravenDismiss">Dismiss</button>
              <button class="raven-btn-primary"${readBtnStyle}>Read full policy →</button>
            </div>
          </div>

        </div>
      </div>`;
}

// ── Overlay: score animation ──────────────────────────────────────────────────

function animateRavenScore(target, root) {
    const el = root.querySelector('#ravenScore');
    if (!el) return;
    const duration = 900;
    const start = performance.now();

    function tick(now) {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(eased * target);
        if (t < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
}

// ── Overlay: show ─────────────────────────────────────────────────────────────

function showRavenOverlay(data) {
    const existing = document.getElementById('raven-overlay-root');
    if (existing) existing.remove();

    injectRavenStyles();

    const wrapper = document.createElement('div');
    wrapper.id = 'raven-overlay-root';
    wrapper.innerHTML = buildOverlayHTML(data);
    document.body.appendChild(wrapper);

    // Apply saved theme
    chrome.storage.local.get(['ravenTheme'], (result) => {
        const theme = result.ravenTheme === 'light' ? 'theme-light' : 'theme-dark';
        wrapper.querySelector('.raven-overlay')?.classList.add(theme);
    });

    // Trigger slide-in animation (double rAF ensures CSS transition fires)
    requestAnimationFrame(() => requestAnimationFrame(() => {
        wrapper.querySelector('.raven-panel')?.classList.add('raven-visible');
    }));

    // Animate score counter
    if (!data.error && typeof data.score === 'number') {
        setTimeout(() => animateRavenScore(data.score, wrapper), 200);
    }

    // Dismiss
    function dismiss() {
        const panel = wrapper.querySelector('.raven-panel');
        if (!panel) return;
        panel.style.transform = 'translateY(24px)';
        panel.style.opacity = '0';
        panel.style.transition = 'transform 0.3s ease, opacity 0.25s ease';
        setTimeout(() => wrapper.remove(), 300);
    }

    wrapper.querySelector('#ravenClose')?.addEventListener('click', dismiss);
    wrapper.querySelector('#ravenDismiss')?.addEventListener('click', dismiss);

    // Theme toggle
    wrapper.querySelector('#ravenThemeToggle')?.addEventListener('click', () => {
        const overlay = wrapper.querySelector('.raven-overlay');
        if (!overlay) return;
        const isDark = overlay.classList.contains('theme-dark');
        overlay.classList.toggle('theme-dark', !isDark);
        overlay.classList.toggle('theme-light', isDark);
        chrome.storage.local.set({ ravenTheme: isDark ? 'light' : 'dark' });
    });
}

// ── Message listener ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message) => {
    if (message.type !== 'SHOW_POLICY_POPUP') return;
    showRavenOverlay(message.payload);
});

// ── Run ───────────────────────────────────────────────────────────────────────

// Run once on page load
notifyPipelineIfDetected();

// Watch for dynamically injected policy checkboxes
// (e.g. loaded in after the page via JavaScript)
const observer = new MutationObserver(() => {
    notifyPipelineIfDetected();
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});
