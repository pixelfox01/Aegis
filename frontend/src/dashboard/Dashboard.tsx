import { useState, useMemo, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { env } from "../config/env";
import { useNavigate } from "react-router-dom";
import { useLinkedServices } from "../hooks/useLinkedServices";
import { usePreferences, PREF_LABELS, PREF_OPTIONS, VALUE_LABELS } from "../hooks/usePreferences";

/* ── Score computation from survey preferences ── */

const SCORE_MAP: Record<string, Record<string, number>> = {
	data_collection:    { high: 100, medium: 50, low: 0 },
	third_party_sharing:{ strict: 100, moderate: 50, relaxed: 0 },
	data_retention:     { strict: 100, moderate: 50, relaxed: 0 },
	tracking_cookies:   { block: 100, limit: 50, allow: 0 },
	account_deletion:   { critical: 100, nice: 50, indifferent: 0 },
	data_encryption:    { essential: 100, preferred: 50, indifferent: 0 },
	gdpr_rights:        { important: 100, somewhat: 50, unconcerned: 0 },
	opt_out:            { required: 100, nice: 50, unnecessary: 0 },
	data_encryption:    { essential: 100, preferred: 50, indifferent: 0 },
	gdpr_rights:        { important: 100, somewhat: 50, unconcerned: 0 },
	opt_out:            { required: 100, nice: 50, unnecessary: 0 },
};

function computeScore(prefs: Record<string, string>): number {
	const keys = Object.keys(SCORE_MAP);
	if (keys.length === 0) return 50;
	let total = 0;
	for (const key of keys) {
		const val = prefs[key];
		total += SCORE_MAP[key]?.[val] ?? 50;
	}
	return Math.round(total / keys.length);
}

/* ── Mock history ── */

interface ScorePoint { date: string; score: number; }

const MOCK_HISTORY: ScorePoint[] = [
	{ date: "Jan 10", score: 50 },
	{ date: "Jan 22", score: 48 },
	{ date: "Feb 03", score: 52 },
	{ date: "Feb 14", score: 55 },
	{ date: "Feb 20", score: 47 },
	{ date: "Feb 28", score: 53 },
	{ date: "Mar 01", score: 58 },
	{ date: "Mar 05", score: 50 },
];

/* ── SVG History Chart ── */

function HistoryChart({ data, currentScore, dark }: { data: ScorePoint[]; currentScore: number; dark: boolean }) {
	const W = 560; const H = 180;
	const PAD_X = 36; const PAD_TOP = 16; const PAD_BOTTOM = 28;
	const chartW = W - PAD_X * 2;
	const chartH = H - PAD_TOP - PAD_BOTTOM;
	const points = [...data, { date: "Now", score: currentScore }];
	const n = points.length;
	function x(i: number) { return PAD_X + (i / (n - 1)) * chartW; }
	function y(v: number) { return PAD_TOP + chartH - (v / 100) * chartH; }
	const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.score).toFixed(1)}`).join(" ");
	const areaPath = `${linePath} L${x(n - 1).toFixed(1)},${(PAD_TOP + chartH).toFixed(1)} L${PAD_X},${(PAD_TOP + chartH).toFixed(1)} Z`;
	const guides = [0, 25, 50, 75, 100];
	const mutedColor  = dark ? "#8a8fa8" : "#8a8680";
	const borderColor = dark ? "rgba(255,255,255,0.06)" : "rgba(14,14,14,0.06)";
	const accentColor = dark ? "#e05444" : "#c0392b";
	return (
		<svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
			<defs>
				<linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor={accentColor} stopOpacity="0.18" />
					<stop offset="100%" stopColor={accentColor} stopOpacity="0" />
				</linearGradient>
			</defs>
			{guides.map((v) => (
				<g key={v}>
					<line x1={PAD_X} y1={y(v)} x2={W - PAD_X} y2={y(v)} stroke={borderColor} strokeWidth="1" />
					<text x={PAD_X - 5} y={y(v) + 3} textAnchor="end" fill={mutedColor} fontSize="8" fontFamily="'DM Mono', monospace">{v}</text>
				</g>
			))}
			<path d={areaPath} fill="url(#areaGrad)" />
			<path d={linePath} fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
			{points.map((p, i) => <circle key={i} cx={x(i)} cy={y(p.score)} r="3" fill={accentColor} />)}
			{points.map((p, i) => (
				<text key={i} x={x(i)} y={H - 5} textAnchor="middle" fill={mutedColor} fontSize="7" fontFamily="'DM Mono', monospace">{p.date}</text>
			))}
		</svg>
	);
}

/* ── Component ── */

export default function Dashboard() {
	const auth0Context = env.authMode === 'auth0' ? useAuth0() : null;
	const navigate     = useNavigate();
	const { services, loading: servicesLoading } = useLinkedServices();
	const { preferences, loading: prefsLoading, saving: prefsSaving, savePreferences } = usePreferences();
	const [visible, setVisible]         = useState(false);
	const [dark, setDark]               = useState(true);
	const [animatedScore, setAnimatedScore] = useState(0);
	const [prefsOpen, setPrefsOpen]     = useState(false);
	const [prefsEditing, setPrefsEditing] = useState(false);
	const [draftPrefs, setDraftPrefs]   = useState<Record<string, string>>({});

	const handleLogout = () => {
		if (env.authMode === 'auth0' && auth0Context) {
			auth0Context.logout({ logoutParams: { returnTo: window.location.origin } });
		} else {
			localStorage.removeItem('aegis_token');
			localStorage.removeItem('aegis_user_id');
			localStorage.removeItem('raven_onboarded');
			localStorage.removeItem('raven_preferences');
			navigate('/', { replace: true });
		}
	};

	const score = useMemo(() => computeScore(preferences), [preferences]);

	useEffect(() => {
		const t = setTimeout(() => setVisible(true), 100);
		return () => clearTimeout(t);
	}, []);

	useEffect(() => {
		if (!visible) return;
		const duration = 1200;
		const start = performance.now();
		let raf: number;
		function tick(now: number) {
			const elapsed = now - start;
			const progress = Math.min(elapsed / duration, 1);
			const eased = 1 - Math.pow(1 - progress, 3);
			setAnimatedScore(Math.round(eased * score));
			if (progress < 1) raf = requestAnimationFrame(tick);
		}
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [visible, score]);

	const RADIUS = 38;
	const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
	const offset = CIRCUMFERENCE - (animatedScore / 100) * CIRCUMFERENCE;
	const scoreLabel = score >= 75 ? "Privacy-conscious" : score >= 40 ? "Moderate" : "Relaxed";

	const prefEntries = Object.entries(preferences).filter(([k]) => PREF_LABELS[k]);

	return (
		<>
			<style>{`
				@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Mono:wght@300;400&display=swap');
				*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

				.theme-dark {
					--ink: #f0ede8; --muted: #8a8fa8; --accent: #e05444;
					--border: rgba(255,255,255,0.1); --bg: #0d0d14;
					--nav-bg: rgba(13,13,20,0.85); --btn-hover-bg: rgba(255,255,255,0.08);
					--ring-track: rgba(255,255,255,0.06); --panel-bg: #111119; --grain-opacity: 0.06;
				}
				.theme-light {
					--ink: #0e0e0e; --muted: #8a8680; --accent: #c0392b;
					--border: rgba(14,14,14,0.12); --bg: #f5f2ed;
					--nav-bg: rgba(245,242,237,0.85); --btn-hover-bg: rgba(14,14,14,0.04);
					--ring-track: rgba(14,14,14,0.08); --panel-bg: #ebe8e2; --grain-opacity: 0.035;
				}

				.dash-root {
					min-height: 100vh; background: var(--bg); color: var(--ink);
					font-family: 'DM Mono', monospace; display: flex; overflow-x: hidden;
					transition: background 0.5s ease, color 0.5s ease;
				}

				.bg-orbs { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; transition: opacity 0.5s ease; }
				.theme-light .bg-orbs { opacity: 0; }
				.theme-dark  .bg-orbs { opacity: 1; }
				.orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.55; }
				.orb-1 { width: 600px; height: 600px; background: radial-gradient(circle, #c0392b55, transparent 70%); top: -150px; left: -100px; }
				.orb-2 { width: 500px; height: 500px; background: radial-gradient(circle, #1a1a6e66, transparent 70%); bottom: -100px; right: -80px; }

				.grain {
					position: fixed; inset: 0; pointer-events: none; z-index: 200;
					opacity: var(--grain-opacity);
					background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
					transition: opacity 0.5s ease;
				}

				/* ── LEFT PANEL ── */
				.left-panel {
					position: fixed; top: 0; left: 0; bottom: 0; width: 320px; z-index: 10;
					background: var(--panel-bg); border-right: 1px solid var(--border);
					display: flex; flex-direction: column; overflow-y: auto;
					opacity: 0; transform: translateX(-12px);
					transition: opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s,
					            background 0.5s ease, border-color 0.5s ease;
				}
				.left-panel.visible { opacity: 1; transform: translateX(0); }

				.panel-logo {
					display: flex; align-items: center; gap: 10px;
					padding: 28px 24px 24px; border-bottom: 1px solid var(--border);
					font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 300;
					letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink);
					transition: color 0.5s ease, border-color 0.5s ease;
				}
				.panel-logo svg { width: 16px; height: 16px; flex-shrink: 0; }

				.panel-nav {
					padding: 16px 16px; border-bottom: 1px solid var(--border);
					display: flex; flex-direction: column; gap: 2px;
					transition: border-color 0.5s ease;
				}
				.panel-nav-item {
					font-family: 'DM Mono', monospace; font-size: 11px;
					letter-spacing: 0.07em; text-transform: uppercase;
					color: var(--muted); background: none; border: none;
					text-align: left; padding: 9px 12px; border-radius: 3px; cursor: pointer;
					transition: color 0.2s ease, background 0.2s ease;
				}
				.panel-nav-item:hover { color: var(--ink); background: var(--btn-hover-bg); }
				.panel-nav-item.active { color: var(--ink); }

				/* ── PREFERENCES ACCORDION ── */
				.prefs-section { flex: 1; display: flex; flex-direction: column; }

				.prefs-toggle {
					display: flex; align-items: center; justify-content: space-between;
					padding: 16px 24px; border-bottom: 1px solid var(--border);
					background: none; border-left: none; border-right: none; border-top: none;
					width: 100%; cursor: pointer; text-align: left;
					transition: background 0.2s ease, border-color 0.5s ease;
					overflow-y: auto;
					min-height: 0;
				}
				.prefs-toggle:hover { background: var(--btn-hover-bg); }

				.prefs-toggle-label {
					font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase;
					color: var(--muted); transition: color 0.5s ease;
				}

				.prefs-chevron {
					color: var(--muted); transition: transform 0.3s ease, color 0.5s ease;
					flex-shrink: 0;
				}
				.prefs-chevron.open { transform: rotate(180deg); }

				.prefs-body {
					overflow: hidden;
					max-height: 0;
					transition: max-height 0.35s cubic-bezier(.4,0,.2,1);
				}
				.prefs-body.open { max-height: 600px; }

				.prefs-inner { padding: 12px 24px 16px; }

				.pref-row {
					display: flex; align-items: center; justify-content: space-between;
					padding: 8px 0; border-bottom: 1px solid var(--border);
					transition: border-color 0.5s ease;
				}
				.pref-row:last-child { border-bottom: none; }
				.pref-key {
					font-size: 10px; color: var(--muted); letter-spacing: 0.03em;
					transition: color 0.5s ease;
				}
				.pref-val {
					font-size: 10px; color: var(--ink); letter-spacing: 0.03em;
					transition: color 0.5s ease;
				}
				.pref-empty {
					font-size: 10px; color: var(--muted); letter-spacing: 0.04em;
					padding: 8px 0;
				}
				.pref-loading {
					font-size: 10px; color: var(--muted); letter-spacing: 0.06em;
					padding: 8px 0;
				}

				.pref-select {
					font-family: 'DM Mono', monospace; font-size: 10px;
					color: var(--ink); background: var(--btn-hover-bg);
					border: 1px solid var(--border); border-radius: 3px;
					padding: 3px 6px; cursor: pointer; outline: none;
					transition: color 0.4s ease, background 0.4s ease, border-color 0.4s ease;
					max-width: 110px;
				}
				.pref-select:focus { border-color: var(--accent); }

				.prefs-actions {
					display: flex; gap: 8px; padding: 10px 0 2px;
					border-top: 1px solid var(--border);
					margin-top: 4px;
					transition: border-color 0.5s ease;
				}
				.prefs-action-btn {
					font-family: 'DM Mono', monospace; font-size: 10px;
					letter-spacing: 0.07em; text-transform: uppercase;
					background: none; border: 1px solid var(--border); border-radius: 3px;
					padding: 6px 12px; cursor: pointer;
					transition: color 0.2s ease, background 0.2s ease, border-color 0.2s ease;
				}
				.prefs-action-btn.save {
					color: var(--ink); border-color: var(--ink);
				}
				.prefs-action-btn.save:hover { background: var(--ink); color: var(--bg); }
				.prefs-action-btn.save:disabled { opacity: 0.45; cursor: default; }
				.prefs-action-btn.cancel {
					color: var(--muted); border-color: var(--border);
				}
				.prefs-action-btn.cancel:hover { color: var(--ink); border-color: var(--muted); }
				.prefs-edit-link {
					font-family: 'DM Mono', monospace; font-size: 9px;
					letter-spacing: 0.1em; text-transform: uppercase;
					color: var(--muted); background: none; border: none;
					cursor: pointer; padding: 10px 0 2px; display: block;
					transition: color 0.2s ease;
				}
				.prefs-edit-link:hover { color: var(--ink); }

				.panel-footer {
					padding: 16px 24px; border-top: 1px solid var(--border);
					transition: border-color 0.5s ease;
				}
				.prefs-action-btn {
					font-family: 'DM Mono', monospace; font-size: 10px;
					letter-spacing: 0.07em; text-transform: uppercase;
					background: none; border: 1px solid var(--border); border-radius: 3px;
					padding: 6px 12px; cursor: pointer;
					transition: color 0.2s ease, background 0.2s ease, border-color 0.2s ease;
				}
				.prefs-action-btn.save {
					color: var(--ink); border-color: var(--ink);
				}
				.prefs-action-btn.save:hover { background: var(--ink); color: var(--bg); }
				.prefs-action-btn.save:disabled { opacity: 0.45; cursor: default; }
				.prefs-action-btn.cancel {
					color: var(--muted); border-color: var(--border);
				}
				.prefs-action-btn.cancel:hover { color: var(--ink); border-color: var(--muted); }
				.prefs-edit-link {
					font-family: 'DM Mono', monospace; font-size: 9px;
					letter-spacing: 0.1em; text-transform: uppercase;
					color: var(--muted); background: none; border: none;
					cursor: pointer; padding: 10px 0 2px; display: block;
					transition: color 0.2s ease;
				}
				.prefs-edit-link:hover { color: var(--ink); }

				.panel-footer {
					padding: 16px 24px; border-top: 1px solid var(--border);
					transition: border-color 0.5s ease;
					margin-top: auto;
					flex-shrink: 0;
				}
				.panel-footer-btn {
					font-family: 'DM Mono', monospace; font-size: 10px;
					letter-spacing: 0.08em; text-transform: uppercase;
					color: var(--muted); background: none; border: none;
					cursor: pointer; padding: 8px 0; transition: color 0.2s ease;
				}
				.panel-footer-btn:hover { color: var(--accent); }

				/* ── MAIN AREA ── */
				.main-area {
					flex: 1; margin-left: 320px;
					display: flex; flex-direction: column; min-height: 100vh;
					position: relative; z-index: 1;
				}

				/* ── TOP NAV ── */
				.dash-nav {
					display: flex; align-items: center; justify-content: space-between;
					padding: 20px 48px; border-bottom: 1px solid var(--border);
					backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
					background: var(--nav-bg); position: sticky; top: 0; z-index: 5;
					opacity: 0; transform: translateY(-8px);
					transition: opacity 0.6s ease, transform 0.6s ease,
					            background 0.5s ease, border-color 0.5s ease;
				}
				.dash-nav.visible { opacity: 1; transform: translateY(0); }

				.nav-greeting { display: flex; flex-direction: column; gap: 1px; }
				.nav-greeting-name {
					font-family: 'Cormorant Garamond', serif; font-size: 16px;
					font-weight: 300; letter-spacing: 0.04em; color: var(--ink);
					transition: color 0.5s ease;
				}
				.nav-greeting-email {
					font-size: 10px; color: var(--muted); letter-spacing: 0.04em;
					transition: color 0.5s ease;
				}
				.nav-right { display: flex; align-items: center; gap: 12px; }

				.theme-toggle {
					width: 48px; height: 26px; border-radius: 13px;
					border: 1px solid var(--border); background: var(--btn-hover-bg);
					cursor: pointer; position: relative;
					transition: background 0.4s ease, border-color 0.4s ease; flex-shrink: 0;
				}
				.toggle-knob {
					position: absolute; top: 4px; width: 16px; height: 16px; border-radius: 50%;
					background: var(--ink);
					transition: left 0.35s cubic-bezier(.4,0,.2,1), background 0.5s ease;
				}
				.theme-dark  .toggle-knob { left: 24px; }
				.theme-light .toggle-knob { left: 4px; }
				.toggle-icon {
					position: absolute; font-size: 9px; top: 50%; transform: translateY(-50%);
					transition: opacity 0.3s ease; pointer-events: none; line-height: 1;
				}
				.icon-sun  { left: 6px; }
				.icon-moon { right: 5px; }
				.theme-dark  .icon-sun  { opacity: 0.25; }
				.theme-dark  .icon-moon { opacity: 1; }
				.theme-light .icon-sun  { opacity: 1; }
				.theme-light .icon-moon { opacity: 0.25; }

				/* ── MAIN CONTENT ── */
				.dash-body {
					flex: 1; display: flex; flex-direction: column; justify-content: center;
					padding: 48px 56px 80px; max-width: 1100px; width: 100%; margin: 0 auto;
				}

				/* TOP ROW: greeting + score */
				.dash-top {
					display: flex; align-items: center; justify-content: space-between;
					margin-bottom: 48px;
					opacity: 0; transform: translateY(12px);
					transition: opacity 0.7s ease 0.2s, transform 0.7s ease 0.2s;
				}
				.dash-top.visible { opacity: 1; transform: translateY(0); }

				.dash-greeting h1 {
					font-family: 'Cormorant Garamond', serif; font-size: 36px;
					font-weight: 300; line-height: 1.1; color: var(--ink); margin-bottom: 4px;
					transition: color 0.5s ease;
				}
				.dash-greeting h1 em { font-style: italic; color: var(--accent); }
				.dash-greeting p { font-size: 11px; color: var(--muted); letter-spacing: 0.06em; transition: color 0.5s ease; }

				.score-compact { display: flex; align-items: center; gap: 14px; flex-shrink: 0; }
				.score-ring-wrap { position: relative; width: 86px; height: 86px; }
				.score-ring-svg { width: 100%; height: 100%; transform: rotate(-90deg); }
				.ring-track { fill: none; stroke: var(--ring-track); stroke-width: 4; }
				.ring-fill { fill: none; stroke: var(--accent); stroke-width: 4; stroke-linecap: round; transition: stroke 0.5s ease; }
				.score-number { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
				.score-value { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 300; line-height: 1; color: var(--ink); transition: color 0.5s ease; }
				.score-unit { font-size: 8px; color: var(--muted); letter-spacing: 0.12em; text-transform: uppercase; margin-top: 2px; transition: color 0.5s ease; }
				.score-meta { display: flex; flex-direction: column; gap: 2px; }
				.score-label-text { font-size: 12px; color: var(--ink); letter-spacing: 0.03em; transition: color 0.5s ease; }
				.score-sublabel { font-size: 9px; color: var(--muted); letter-spacing: 0.08em; text-transform: uppercase; transition: color 0.5s ease; }

				/* BOTTOM GRID: chart + services side by side */
				.bottom-grid {
					display: grid;
					grid-template-columns: 1fr 260px;
					gap: 32px;
					align-items: start;
					opacity: 0; transform: translateY(16px);
					transition: opacity 0.7s ease 0.35s, transform 0.7s ease 0.35s;
				}
				.bottom-grid.visible { opacity: 1; transform: translateY(0); }

				.section-label {
					font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
					color: var(--muted); margin-bottom: 20px; padding-bottom: 10px;
					border-bottom: 1px solid var(--border);
					transition: color 0.5s ease, border-color 0.5s ease;
				}
				.chart-wrap { padding: 4px 0; }

				/* SERVICES COLUMN */
				.services-col { display: flex; flex-direction: column; }

				.svc-row {
					display: flex; align-items: center; justify-content: space-between;
					padding: 9px 0; border-bottom: 1px solid var(--border);
					transition: border-color 0.5s ease;
				}
				.svc-row:last-child { border-bottom: none; }
				.svc-info { display: flex; flex-direction: column; gap: 1px; }
				.svc-name { font-size: 11px; color: var(--ink); letter-spacing: 0.02em; transition: color 0.5s ease; }
				.svc-domain { font-size: 9px; color: var(--muted); letter-spacing: 0.04em; transition: color 0.5s ease; }
				.svc-date { font-size: 9px; color: var(--muted); letter-spacing: 0.04em; transition: color 0.5s ease; }
				.svc-loading { font-size: 10px; color: var(--muted); letter-spacing: 0.06em; padding: 8px 0; transition: color 0.5s ease; }

				/* ── RESPONSIVE ── */
				@media (max-width: 1100px) {
					.left-panel { width: 260px; }
					.main-area { margin-left: 260px; }
					.bottom-grid { grid-template-columns: 1fr 220px; gap: 24px; }
				}
				@media (max-width: 860px) {
					.bottom-grid { grid-template-columns: 1fr; }
				}
				@media (max-width: 720px) {
					.left-panel { width: 100%; position: relative; height: auto; border-right: none; border-bottom: 1px solid var(--border); }
					.dash-root { flex-direction: column; }
					.main-area { margin-left: 0; }
					.dash-body { padding: 28px 20px 60px; justify-content: flex-start; }
					.dash-top { flex-direction: column; align-items: flex-start; gap: 28px; }
					.dash-greeting h1 { font-size: 28px; }
				}
			`}</style>

			<div className={`dash-root ${dark ? "theme-dark" : "theme-light"}`}>
				<div className="bg-orbs">
					<div className="orb orb-1" />
					<div className="orb orb-2" />
				</div>
				<div className="grain" />

				{/* ── Left panel ── */}
				<aside className={`left-panel ${visible ? "visible" : ""}`}>
					<div className="panel-logo">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
							<path d="M12 2C6 2 3 7 3 12c0 3 1.5 5.5 4 7l5-9 5 9c2.5-1.5 4-4 4-7 0-5-3-10-9-10z" />
						</svg>
						Raven
					</div>

					<nav className="panel-nav">
						<button className="panel-nav-item active">Dashboard</button>
						<button className="panel-nav-item">Scan a policy</button>
						<button className="panel-nav-item">Reports</button>
					</nav>

					{/* Preferences accordion */}
					<div className="prefs-section">
						<button
							className="prefs-toggle"
							onClick={() => setPrefsOpen((o) => !o)}
							aria-expanded={prefsOpen}
						>
							<span className="prefs-toggle-label">Preferences</span>
							<svg
								className={`prefs-chevron ${prefsOpen ? "open" : ""}`}
								width="12" height="12" viewBox="0 0 12 12"
								fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
							>
								<polyline points="2,4 6,8 10,4" />
							</svg>
						</button>

						<div className={`prefs-body ${prefsOpen ? "open" : ""}`}>
							<div className="prefs-inner">
								{prefsLoading ? (
									<p className="pref-loading">Loading…</p>
								) : prefEntries.length === 0 ? (
									<p className="pref-empty">No preferences set yet.</p>
								) : prefEntries.map(([key, val]) => (
									<div className="pref-row" key={key}>
										<span className="pref-key">{PREF_LABELS[key] ?? key}</span>
										{prefsEditing ? (
											<select
												className="pref-select"
												value={draftPrefs[key] ?? val}
												onChange={(e) => setDraftPrefs((d) => ({ ...d, [key]: e.target.value }))}
											>
												{(PREF_OPTIONS[key] ?? []).map((opt) => (
													<option key={opt.value} value={opt.value}>{opt.label}</option>
												))}
											</select>
										) : (
											<span className="pref-val">{VALUE_LABELS[val] ?? val}</span>
										)}
									</div>
								))}

								{!prefsLoading && prefEntries.length > 0 && (
									prefsEditing ? (
										<div className="prefs-actions">
											<button
												className="prefs-action-btn save"
												disabled={prefsSaving}
												onClick={async () => {
													const merged = { ...preferences, ...draftPrefs };
													await savePreferences(merged);
													setPrefsEditing(false);
												}}
											>
												{prefsSaving ? "Saving…" : "Save"}
											</button>
											<button
												className="prefs-action-btn cancel"
												onClick={() => { setDraftPrefs({}); setPrefsEditing(false); }}
											>
												Cancel
											</button>
										</div>
									) : (
										<button
											className="prefs-edit-link"
											onClick={() => { setDraftPrefs({ ...preferences }); setPrefsEditing(true); }}
										>
											Edit preferences
										</button>
									)
								)}
							</div>
						</div>
					</div>

					<div className="panel-footer">
						<button className="panel-footer-btn" onClick={handleLogout}>Log out</button>
					</div>
				</aside>

				{/* ── Main area ── */}
				<div className="main-area">
					{/* Top nav */}
					<div className={`dash-nav ${visible ? "visible" : ""}`}>
						<div className="nav-greeting">
							{auth0Context?.user?.given_name && (
								<span className="nav-greeting-name">{auth0Context.user.given_name}</span>
							)}
							{auth0Context?.user?.email && (
								<span className="nav-greeting-email">{auth0Context.user.email}</span>
							)}
						</div>
						<div className="nav-right">
							<button
								className="theme-toggle"
								onClick={() => setDark(!dark)}
								title={dark ? "Switch to light mode" : "Switch to dark mode"}
							>
								<span className="toggle-icon icon-sun">☀️</span>
								<span className="toggle-icon icon-moon">🌙</span>
								<span className="toggle-knob" />
							</button>
						</div>
					</div>

					{/* Main content */}
					<div className="dash-body">
						{/* Greeting + score */}
						<div className={`dash-top ${visible ? "visible" : ""}`}>
							<div className="dash-greeting">
								<h1>Welcome{auth0Context?.user?.given_name ? `, ${auth0Context.user.given_name}` : ""}<em>.</em></h1>
								<p>Here's your privacy overview.</p>
							</div>
							<div className="score-compact">
								<div className="score-ring-wrap">
									<svg className="score-ring-svg" viewBox="0 0 86 86">
										<circle className="ring-track" cx="43" cy="43" r={RADIUS} />
										<circle className="ring-fill" cx="43" cy="43" r={RADIUS}
											strokeDasharray={CIRCUMFERENCE} strokeDashoffset={offset} />
									</svg>
									<div className="score-number">
										<span className="score-value">{animatedScore}</span>
										<span className="score-unit">/ 100</span>
									</div>
								</div>
								<div className="score-meta">
									<span className="score-label-text">{scoreLabel}</span>
									<span className="score-sublabel">Privacy score</span>
								</div>
							</div>
						</div>

						{/* Chart + services side by side */}
						<div className={`bottom-grid ${visible ? "visible" : ""}`}>
							<div>
								<p className="section-label">Score history</p>
								<div className="chart-wrap">
									<HistoryChart data={MOCK_HISTORY} currentScore={score} dark={dark} />
								</div>
							</div>

							<div className="services-col">
								<p className="section-label">
									Linked services{!servicesLoading && ` (${services.length})`}
								</p>
								{servicesLoading ? (
									<p className="svc-loading">Loading…</p>
								) : services.map((svc) => (
									<div className="svc-row" key={svc.domain}>
										<div className="svc-info">
											<span className="svc-name">{svc.name}</span>
											<span className="svc-domain">{svc.domain}</span>
										</div>
										<span className="svc-date">{svc.linkedAt}</span>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
