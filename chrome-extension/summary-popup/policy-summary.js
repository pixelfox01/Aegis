// ── Theme ─────────────────────────────────────────────────────────────────
// The demo page uses document.body for theming; when injected as a content
// script, swap this to target the injected panel's root element instead.

const root = document.body;
const themeToggle = document.getElementById("ravenThemeToggle");

let dark = true;

// In the real content script, read from chrome.storage rather than localStorage.
const saved = localStorage.getItem("ravenTheme");
if (saved) dark = saved !== "light";
applyTheme();

function applyTheme() {
  root.className = root.className
    .replace(/theme-\w+/, "")
    .trim() + (dark ? " theme-dark" : " theme-light");
  localStorage.setItem("ravenTheme", dark ? "dark" : "light");
}

themeToggle?.addEventListener("click", () => {
  dark = !dark;
  applyTheme();
});

// ── Slide-in ──────────────────────────────────────────────────────────────

const panel = document.getElementById("ravenPanel");

requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    panel?.classList.add("raven-visible");
  });
});

// ── Close / dismiss ───────────────────────────────────────────────────────

function dismiss() {
  if (!panel) return;
  panel.style.transform = "translateY(24px)";
  panel.style.opacity = "0";
  panel.style.transition = "transform 0.3s ease, opacity 0.25s ease";
  setTimeout(() => {
    document.getElementById("ravenOverlay")?.remove();
  }, 300);
}

document.getElementById("ravenClose")?.addEventListener("click", dismiss);
document.getElementById("ravenDismiss")?.addEventListener("click", dismiss);

// ── Score counter ─────────────────────────────────────────────────────────
// DEMO value — replace with real computed score from storage when wired up.

const DEMO_SCORE = 28;
const scoreEl = document.getElementById("ravenScore");

function animateScore(target) {
  const duration = 900;
  const start = performance.now();

  function tick(now) {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    if (scoreEl) scoreEl.textContent = Math.round(eased * target);
    if (t < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

// Start after the panel slides in
setTimeout(() => animateScore(DEMO_SCORE), 200);
