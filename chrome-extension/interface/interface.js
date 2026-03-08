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

// ── Score ring animation ───────────────────────────────────────────────────
// DEMO value — replace with real score from storage/background when ready.

const DEMO_SCORE = 28;
const RADIUS = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // 163.36

const ringFill = document.getElementById("ringFill");
const scoreNum = document.getElementById("scoreNum");

function animateScore(targetScore) {
  const duration = 1000;
  const start = performance.now();

  function tick(now) {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
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

animateScore(DEMO_SCORE);

// ── Active tab domain ──────────────────────────────────────────────────────
// Populate the domain label from the current tab's URL.

const siteDomain = document.getElementById("siteDomain");

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const url = tabs[0]?.url;
  if (!url) return;
  try {
    siteDomain.textContent = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    // leave placeholder
  }
});
