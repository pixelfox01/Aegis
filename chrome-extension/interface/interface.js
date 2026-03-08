// ── Theme ──────────────────────────────────────────────────────────────────

const body = document.body;
const themeToggle = document.getElementById("themeToggle");

let dark = true;

chrome.storage.local.get(["ravenTheme"], (result) => {
  dark = result.ravenTheme !== "light";
  applyTheme();
});

function applyTheme() {
  body.className = dark ? "theme-dark" : "theme-light";
}

themeToggle.addEventListener("click", () => {
  dark = !dark;
  applyTheme();
  chrome.storage.local.set({ ravenTheme: dark ? "dark" : "light" });
});

// ── Score ring ─────────────────────────────────────────────────────────────

const RADIUS = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const ringFill = document.getElementById("ringFill");
const scoreNum = document.getElementById("scoreNum");

function animateScore(targetScore) {
  const duration = 1000;
  const start = performance.now();
  function tick(now) {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    const current = Math.round(eased * targetScore);
    scoreNum.textContent = current;
    ringFill.setAttribute("stroke-dashoffset", CIRCUMFERENCE - (current / 100) * CIRCUMFERENCE);
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ── Permission definitions ─────────────────────────────────────────────────
// Each entry maps a chrome.contentSettings property name to a row element id.

const PERMISSIONS = [
  { api: 'geolocation',        id: 'permGeolocation' },
  { api: 'camera',             id: 'permCamera'       },
  { api: 'microphone',         id: 'permMicrophone'   },
  { api: 'notifications',      id: 'permNotifications'},
  { api: 'popups',             id: 'permPopups'       },
  { api: 'automaticDownloads', id: 'permDownloads'    },
];

// ── Logo ───────────────────────────────────────────────────────────────────

document.getElementById("ravenLogo").addEventListener("click", () => {
  chrome.tabs.create({ url: "https://example.com" }); // TODO: update with landing page URL
});

// ── Footer: open Chrome's per-site content settings ────────────────────────

document.querySelector('.footer-link').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = tabs[0]?.url;
    if (!url) return;
    try {
      const origin = encodeURIComponent(new URL(url).origin);
      chrome.tabs.create({ url: `chrome://settings/content/siteDetails?site=${origin}` });
    } catch {}
  });
});

// ── Helpers ────────────────────────────────────────────────────────────────

const breakdownEmpty = document.getElementById('breakdownEmpty');

function updateEmpty() {
  const anyVisible = [...document.querySelectorAll('.breakdown-row')]
    .some(row => row.style.display !== 'none');
  if (breakdownEmpty) breakdownEmpty.style.display = anyVisible ? 'none' : 'block';
}

// ── Active tab + permission checks ─────────────────────────────────────────

scoreNum.textContent = "—";
ringFill.setAttribute("stroke-dashoffset", CIRCUMFERENCE);

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs[0];
  if (!tab?.url) return;

  // Favicon
  if (tab.favIconUrl) document.getElementById("faviconImg").src = tab.favIconUrl;

  let origin, hostname;
  try {
    const parsed = new URL(tab.url);
    origin   = parsed.origin;                              // "https://www.google.com"
    hostname = parsed.hostname.replace(/^www\./, '');      // "google.com"
    document.getElementById("siteDomain").textContent = hostname;
  } catch {
    document.getElementById("siteDomain").textContent = "unknown";
    return;
  }

  // The pattern used for contentSettings.set() calls
  const primaryPattern = origin + '/*';

  // ── Revoke / dismiss handler ─────────────────────────────────────────────

  document.querySelector('.breakdown').addEventListener('click', (e) => {
    const btn = e.target.closest('.metric-dismiss');
    if (!btn) return;

    const apiName = btn.dataset.perm;

    if (apiName === 'cookies') {
      // Delete all existing cookies for this domain, then block future ones
      chrome.cookies.getAll({ domain: hostname }, (cookies) => {
        for (const cookie of cookies) {
          const cookieUrl = `http${cookie.secure ? 's' : ''}://${
            cookie.domain.startsWith('.') ? cookie.domain.slice(1) : cookie.domain
          }${cookie.path}`;
          chrome.cookies.remove({ url: cookieUrl, name: cookie.name });
        }
      });
      chrome.contentSettings.cookies.set({ primaryPattern, setting: 'block' });
    } else {
      const cs = chrome.contentSettings[apiName];
      if (cs) cs.set({ primaryPattern, setting: 'block' });
    }

    const row = btn.closest('.breakdown-row');
    if (row) row.style.display = 'none';
    updateEmpty();
  });

  // ── Cookie count ─────────────────────────────────────────────────────────

  chrome.cookies.getAll({ domain: hostname }, (cookies) => {
    const row = document.getElementById('permCookies');
    const countEl = document.getElementById('cookieCount');
    if (!row) return;
    const count = cookies?.length ?? 0;
    if (countEl) countEl.textContent = count;
    row.style.display = count > 0 ? '' : 'none';
    updateEmpty();
  });

  // ── contentSettings checks ───────────────────────────────────────────────

  let checkedCount = 0;
  let grantedCount = 0;

  for (const perm of PERMISSIONS) {
    const cs = chrome.contentSettings[perm.api];
    const el = document.getElementById(perm.id);

    if (!cs || !el) {
      checkedCount++;
      continue;
    }

    cs.get({ primaryUrl: tab.url }, (details) => {
      checkedCount++;
      const granted = details?.setting === 'allow';
      el.style.display = granted ? '' : 'none';
      if (granted) grantedCount++;

      if (checkedCount === PERMISSIONS.length) {
        // Score: 100 = nothing granted, 0 = everything granted
        const score = Math.round((1 - grantedCount / PERMISSIONS.length) * 100);
        animateScore(score);
        updateEmpty();
      }
    });
  }
});
