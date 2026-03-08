import { extractCompanyName } from '../utils/api-client.js';

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
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // 163.36

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
    ringFill.setAttribute(
      "stroke-dashoffset",
      CIRCUMFERENCE - (current / 100) * CIRCUMFERENCE
    );

    if (t < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

// ── Data helpers ───────────────────────────────────────────────────────────

function deriveScore(answers) {
  if (!answers?.length) return 0;
  const points = { low: 100, medium: 50, high: 0 };
  const total = answers.reduce((sum, a) => sum + (points[a.concern_level] ?? 50), 0);
  return Math.round(total / answers.length);
}

// ── Fixed metric definitions ────────────────────────────────────────────────
// Each metric scans the API's question list for keyword matches.
// Rows are shown only when a matching answer is found; otherwise hidden.

const METRICS = {
  cookies:  ['cookie', 'cookies', 'non-essential', 'consent'],
  trackers: ['track', 'tracker', 'analytics', 'fingerprint', 'behavioral', 'advertising'],
  services: ['location', 'geolocation', 'microphone', 'camera', 'permission', 'sensor'],
};

const metricRows = {
  cookies:  document.getElementById('metricCookies'),
  trackers: document.getElementById('metricTrackers'),
  services: document.getElementById('metricServices'),
  account:  document.getElementById('metricAccount'),
};

function hasMatchForMetric(questions, keywords) {
  if (!questions?.length) return false;
  return questions.some(q => keywords.some(kw => q.toLowerCase().includes(kw)));
}

// ── State renderers ────────────────────────────────────────────────────────

function setLoadingState() {
  scoreNum.textContent = "—";
  ringFill.setAttribute("stroke-dashoffset", CIRCUMFERENCE);
  Object.values(metricRows).forEach(row => { if (row) row.style.display = 'none'; });
}

function setErrorState() {
  scoreNum.textContent = "—";
  ringFill.setAttribute("stroke-dashoffset", CIRCUMFERENCE);
  Object.values(metricRows).forEach(row => { if (row) row.style.display = 'none'; });
}

function renderData(response) {
  animateScore(deriveScore(response.answers));

  for (const [metric, keywords] of Object.entries(METRICS)) {
    const row = metricRows[metric];
    if (row) row.style.display = hasMatchForMetric(response.questions, keywords) ? '' : 'none';
  }
  // account: always hidden until implemented
  if (metricRows.account) metricRows.account.style.display = 'none';
}

// ── Logo → landing page ────────────────────────────────────────────────────

document.getElementById("ravenLogo").addEventListener("click", () => {
  chrome.tabs.create({ url: "https://example.com" }); // TODO: update with landing page URL
});

// ── Active tab domain + data fetch ─────────────────────────────────────────

const siteDomain = document.getElementById("siteDomain");
const faviconImg = document.getElementById("faviconImg");
const viewFullReportBtn = document.querySelector(".footer-link");

let cachedPolicyData = null;

setLoadingState();

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const url = tabs[0]?.url;
  if (!url) { setErrorState(); return; }

  // Favicon
  const favIconUrl = tabs[0]?.favIconUrl;
  if (favIconUrl) {
    faviconImg.src = favIconUrl;
  }

  let hostname;
  try {
    hostname = new URL(url).hostname.replace(/^www\./, "");
    siteDomain.textContent = extractCompanyName(hostname);
  } catch {
    setErrorState();
    return;
  }

  chrome.runtime.sendMessage(
    { type: "GET_POLICY_DATA", payload: { hostname } },
    (response) => {
      if (chrome.runtime.lastError || !response || response.error) {
        setErrorState();
      } else {
        cachedPolicyData = response;
        renderData(response);
      }
    }
  );
});

// ── View full report ───────────────────────────────────────────────────────
// Sends the cached policy data to the active tab's content script,
// which will inject the summary overlay directly into the page.

viewFullReportBtn.addEventListener("click", () => {
  if (!cachedPolicyData) return;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0]?.id;
    if (!tabId) return;
    chrome.tabs.sendMessage(tabId, {
      type: "SHOW_POLICY_POPUP",
      payload: cachedPolicyData,
    });
  });
});
