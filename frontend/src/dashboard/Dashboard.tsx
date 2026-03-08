import { useState, useEffect, useMemo } from "react";
import { useAuth0 } from "@auth0/auth0-react";

/* ── Score computation from survey preferences ── */

const SCORE_MAP: Record<string, Record<string, number>> = {
	data_collection:    { high: 100, medium: 50, low: 0 },
	third_party_sharing:{ strict: 100, moderate: 50, relaxed: 0 },
	data_retention:     { strict: 100, moderate: 50, relaxed: 0 },
	tracking_cookies:   { block: 100, limit: 50, allow: 0 },
	account_deletion:   { critical: 100, nice: 50, indifferent: 0 },
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

/* ── Mock data ── */

interface LinkedService {
	name: string;
	domain: string;
	linkedAt: string;
}

const MOCK_SERVICES: LinkedService[] = [
	{ name: "Google",      domain: "google.com",      linkedAt: "2026-01-10" },
	{ name: "Discord",     domain: "discord.com",     linkedAt: "2026-01-22" },
	{ name: "Spotify",     domain: "spotify.com",     linkedAt: "2026-02-03" },
	{ name: "GitHub",      domain: "github.com",      linkedAt: "2026-02-14" },
	{ name: "Amazon",      domain: "amazon.com",      linkedAt: "2026-02-20" },
	{ name: "Reddit",      domain: "reddit.com",      linkedAt: "2026-02-28" },
	{ name: "Twitch",      domain: "twitch.tv",       linkedAt: "2026-03-01" },
	{ name: "LinkedIn",    domain: "linkedin.com",    linkedAt: "2026-03-05" },
];

interface ScorePoint {
	date: string;
	score: number;
}

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
	const W = 600;
	const H = 200;
	const PAD_X = 40;
	const PAD_TOP = 20;
	const PAD_BOTTOM = 32;
	const chartW = W - PAD_X * 2;
	const chartH = H - PAD_TOP - PAD_BOTTOM;

	// append current score as the latest point
	const points = [...data, { date: "Now", score: currentScore }];
	const n = points.length;

	const yMin = 0;
	const yMax = 100;

	function x(i: number) { return PAD_X + (i / (n - 1)) * chartW; }
	function y(v: number) { return PAD_TOP + chartH - ((v - yMin) / (yMax - yMin)) * chartH; }

	const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.score).toFixed(1)}`).join(" ");

	// gradient fill area
	const areaPath = `${linePath} L${x(n - 1).toFixed(1)},${(PAD_TOP + chartH).toFixed(1)} L${PAD_X},${(PAD_TOP + chartH).toFixed(1)} Z`;

	// horizontal guide lines
	const guides = [0, 25, 50, 75, 100];

	const mutedColor = dark ? "#8a8fa8" : "#8a8680";
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

			{/* guide lines + labels */}
			{guides.map((v) => (
				<g key={v}>
					<line x1={PAD_X} y1={y(v)} x2={W - PAD_X} y2={y(v)} stroke={borderColor} strokeWidth="1" />
					<text x={PAD_X - 6} y={y(v) + 3} textAnchor="end" fill={mutedColor} fontSize="9" fontFamily="'DM Mono', monospace">{v}</text>
				</g>
			))}

			{/* area fill */}
			<path d={areaPath} fill="url(#areaGrad)" />

			{/* line */}
			<path d={linePath} fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

			{/* data points */}
			{points.map((p, i) => (
				<circle key={i} cx={x(i)} cy={y(p.score)} r="3" fill={accentColor} />
			))}

			{/* x-axis labels */}
			{points.map((p, i) => (
				<text key={i} x={x(i)} y={H - 6} textAnchor="middle" fill={mutedColor} fontSize="8" fontFamily="'DM Mono', monospace">
					{p.date}
				</text>
			))}
		</svg>
	);
}

/* ── Component ── */

export default function Dashboard() {
	const { user, logout } = useAuth0();
	const [visible, setVisible] = useState(false);
	const [dark, setDark] = useState(true);
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [animatedScore, setAnimatedScore] = useState(0);

	const handleLogout = () =>
		logout({ logoutParams: { returnTo: window.location.origin } });

	const prefs: Record<string, string> = useMemo(() => {
		try {
			return JSON.parse(localStorage.getItem("raven_preferences") || "{}");
		} catch {
			return {};
		}
	}, []);

	const score = useMemo(() => computeScore(prefs), [prefs]);

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

	// Score ring math (compact version)
	const RADIUS = 38;
	const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
	const offset = CIRCUMFERENCE - (animatedScore / 100) * CIRCUMFERENCE;

	const scoreLabel =
		score >= 75 ? "Privacy-conscious" :
		score >= 40 ? "Moderate" :
		"Relaxed";

	return (
		<>
			<style>{`
				@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Mono:wght@300;400&display=swap');
				*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

				.theme-dark {
					--ink: #f0ede8;
					--muted: #8a8fa8;
					--accent: #e05444;
					--border: rgba(255,255,255,0.1);
					--bg: #0d0d14;
					--nav-bg: rgba(255,255,255,0.04);
					--btn-hover-bg: rgba(255,255,255,0.08);
					--ring-track: rgba(255,255,255,0.06);
					--sidebar-bg: #111119;
					--overlay-bg: rgba(0,0,0,0.5);
					--grain-opacity: 0.06;
				}
				.theme-light {
					--ink: #0e0e0e;
					--muted: #8a8680;
					--accent: #c0392b;
					--border: rgba(14,14,14,0.12);
					--bg: #f5f2ed;
					--nav-bg: rgba(245,242,237,0.7);
					--btn-hover-bg: rgba(14,14,14,0.04);
					--ring-track: rgba(14,14,14,0.08);
					--sidebar-bg: #ebe8e2;
					--overlay-bg: rgba(0,0,0,0.2);
					--grain-opacity: 0.035;
				}

				.dash-root {
					min-height: 100vh;
					background: var(--bg);
					color: var(--ink);
					font-family: 'DM Mono', monospace;
					overflow-x: hidden;
					transition: background 0.5s ease, color 0.5s ease;
				}

				.bg-orbs {
					position: fixed; inset: 0;
					pointer-events: none; z-index: 0; overflow: hidden;
					transition: opacity 0.5s ease;
				}
				.theme-light .bg-orbs { opacity: 0; }
				.theme-dark  .bg-orbs { opacity: 1; }
				.orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.55; }
				.orb-1 { width: 600px; height: 600px; background: radial-gradient(circle, #c0392b55, transparent 70%); top: -150px; left: -100px; }
				.orb-2 { width: 500px; height: 500px; background: radial-gradient(circle, #1a1a6e66, transparent 70%); bottom: -100px; right: -80px; }

				.grain {
					position: fixed; inset: 0;
					pointer-events: none; z-index: 200;
					opacity: var(--grain-opacity);
					background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
					transition: opacity 0.5s ease;
				}

				/* ── SIDEBAR ── */
				.sidebar-overlay {
					position: fixed; inset: 0; z-index: 90;
					background: var(--overlay-bg);
					opacity: 0; pointer-events: none;
					transition: opacity 0.3s ease;
				}
				.sidebar-overlay.open { opacity: 1; pointer-events: auto; }

				.sidebar {
					position: fixed; top: 0; left: 0; bottom: 0;
					width: 320px; max-width: 85vw;
					z-index: 100;
					background: var(--sidebar-bg);
					border-right: 1px solid var(--border);
					transform: translateX(-100%);
					transition: transform 0.35s cubic-bezier(.4,0,.2,1), background 0.5s ease, border-color 0.5s ease;
					display: flex; flex-direction: column;
					overflow-y: auto;
				}
				.sidebar.open { transform: translateX(0); }

				.sidebar-header {
					display: flex; align-items: center; justify-content: space-between;
					padding: 28px 24px;
					border-bottom: 1px solid var(--border);
				}
				.sidebar-title {
					font-family: 'Cormorant Garamond', serif;
					font-size: 18px; font-weight: 300;
					letter-spacing: 0.1em; text-transform: uppercase;
					color: var(--ink);
					transition: color 0.5s ease;
				}
				.sidebar-close {
					background: none; border: none; cursor: pointer;
					color: var(--muted); padding: 4px;
					transition: color 0.2s ease;
				}
				.sidebar-close:hover { color: var(--ink); }
				.sidebar-close svg { width: 18px; height: 18px; display: block; }

				.sidebar-nav {
					padding: 20px 24px;
					border-bottom: 1px solid var(--border);
					display: flex; flex-direction: column; gap: 4px;
				}
				.sidebar-nav-item {
					font-family: 'DM Mono', monospace; font-size: 11px;
					letter-spacing: 0.08em; text-transform: uppercase;
					color: var(--muted); background: none; border: none;
					text-align: left; padding: 10px 12px; border-radius: 3px;
					cursor: pointer;
					transition: color 0.2s ease, background 0.2s ease;
				}
				.sidebar-nav-item:hover { color: var(--ink); background: var(--btn-hover-bg); }
				.sidebar-nav-item.active { color: var(--ink); }

				.sidebar-services {
					padding: 20px 24px; flex: 1;
				}
				.sidebar-label {
					font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase;
					color: var(--muted); margin-bottom: 16px;
					transition: color 0.5s ease;
				}
				.sb-service {
					display: flex; align-items: center; justify-content: space-between;
					padding: 10px 0;
					border-bottom: 1px solid var(--border);
					transition: border-color 0.5s ease;
				}
				.sb-service:last-child { border-bottom: none; }
				.sb-svc-info { display: flex; flex-direction: column; gap: 1px; }
				.sb-svc-name {
					font-size: 12px; color: var(--ink); letter-spacing: 0.02em;
					transition: color 0.5s ease;
				}
				.sb-svc-domain {
					font-size: 9px; color: var(--muted); letter-spacing: 0.04em;
					transition: color 0.5s ease;
				}
				.sb-svc-date {
					font-size: 9px; color: var(--muted); letter-spacing: 0.04em;
					transition: color 0.5s ease;
				}

				.sidebar-footer {
					padding: 16px 24px;
					border-top: 1px solid var(--border);
				}
				.sidebar-footer-btn {
					font-family: 'DM Mono', monospace; font-size: 10px;
					letter-spacing: 0.08em; text-transform: uppercase;
					color: var(--muted); background: none; border: none;
					cursor: pointer; padding: 8px 0;
					transition: color 0.2s ease;
				}
				.sidebar-footer-btn:hover { color: var(--accent); }

				/* ── NAV ── */
				.dash-nav {
					display: flex; align-items: center; justify-content: space-between;
					padding: 28px 48px;
					border-bottom: 1px solid var(--border);
					backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
					background: var(--nav-bg);
					position: relative; z-index: 2;
					opacity: 0; transform: translateY(-8px);
					transition: opacity 0.6s ease, transform 0.6s ease, background 0.5s ease;
				}
				.dash-nav.visible { opacity: 1; transform: translateY(0); }

				.nav-left { display: flex; align-items: center; gap: 16px; }

				.hamburger {
					background: none; border: none; cursor: pointer;
					color: var(--muted); padding: 4px;
					transition: color 0.2s ease;
				}
				.hamburger:hover { color: var(--ink); }
				.hamburger svg { width: 20px; height: 20px; display: block; }

				.nav-logo {
					font-family: 'Cormorant Garamond', serif;
					font-size: 22px; font-weight: 300;
					letter-spacing: 0.12em; text-transform: uppercase;
					color: var(--ink); text-decoration: none;
					display: flex; align-items: center; gap: 10px;
					transition: color 0.5s ease;
				}
				.nav-logo svg { width: 18px; height: 18px; }

				.nav-right { display: flex; align-items: center; gap: 12px; }

				.nav-btn {
					font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 400;
					letter-spacing: 0.08em; text-transform: uppercase;
					padding: 9px 18px; border-radius: 2px;
					cursor: pointer; text-decoration: none;
					transition: all 0.2s ease;
					border: 1px solid transparent;
					color: var(--muted); background: transparent;
				}
				.nav-btn:hover { color: var(--ink); border-color: var(--border); background: var(--btn-hover-bg); }

				.theme-toggle {
					width: 48px; height: 26px; border-radius: 13px;
					border: 1px solid var(--border); background: var(--btn-hover-bg);
					cursor: pointer; position: relative;
					transition: background 0.4s ease, border-color 0.4s ease;
					flex-shrink: 0;
				}
				.toggle-knob {
					position: absolute; top: 4px; width: 16px; height: 16px;
					border-radius: 50%; background: var(--ink);
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

				/* ── MAIN BODY ── */
				.dash-body {
					position: relative; z-index: 1;
					max-width: 840px;
					margin: 0 auto;
					padding: 48px 48px 80px;
				}

				/* TOP ROW: greeting left, score right */
				.dash-top {
					display: flex; align-items: center; justify-content: space-between;
					margin-bottom: 56px;
					opacity: 0; transform: translateY(12px);
					transition: opacity 0.7s ease 0.15s, transform 0.7s ease 0.15s;
				}
				.dash-top.visible { opacity: 1; transform: translateY(0); }

				.dash-greeting h1 {
					font-family: 'Cormorant Garamond', serif;
					font-size: 36px; font-weight: 300; line-height: 1.1;
					color: var(--ink); margin-bottom: 4px;
					transition: color 0.5s ease;
				}
				.dash-greeting h1 em { font-style: italic; color: var(--accent); }
				.dash-greeting p {
					font-size: 11px; color: var(--muted); letter-spacing: 0.06em;
					transition: color 0.5s ease;
				}

				/* COMPACT SCORE */
				.score-compact {
					display: flex; align-items: center; gap: 14px;
					flex-shrink: 0;
				}
				.score-ring-wrap {
					position: relative;
					width: 86px; height: 86px;
				}
				.score-ring-svg {
					width: 100%; height: 100%;
					transform: rotate(-90deg);
				}
				.ring-track {
					fill: none; stroke: var(--ring-track); stroke-width: 4;
				}
				.ring-fill {
					fill: none; stroke: var(--accent); stroke-width: 4;
					stroke-linecap: round;
					transition: stroke 0.5s ease;
				}
				.score-number {
					position: absolute; inset: 0;
					display: flex; flex-direction: column;
					align-items: center; justify-content: center;
				}
				.score-value {
					font-family: 'Cormorant Garamond', serif;
					font-size: 28px; font-weight: 300; line-height: 1;
					color: var(--ink);
					transition: color 0.5s ease;
				}
				.score-unit {
					font-size: 8px; color: var(--muted);
					letter-spacing: 0.12em; text-transform: uppercase;
					margin-top: 2px;
					transition: color 0.5s ease;
				}
				.score-meta {
					display: flex; flex-direction: column; gap: 2px;
				}
				.score-label-text {
					font-size: 12px; color: var(--ink); letter-spacing: 0.03em;
					transition: color 0.5s ease;
				}
				.score-sublabel {
					font-size: 9px; color: var(--muted); letter-spacing: 0.08em;
					text-transform: uppercase;
					transition: color 0.5s ease;
				}

				/* CHART SECTION */
				.chart-section {
					opacity: 0; transform: translateY(16px);
					transition: opacity 0.7s ease 0.3s, transform 0.7s ease 0.3s;
				}
				.chart-section.visible { opacity: 1; transform: translateY(0); }

				.section-label {
					font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
					color: var(--muted); margin-bottom: 20px;
					padding-bottom: 10px;
					border-bottom: 1px solid var(--border);
					transition: color 0.5s ease, border-color 0.5s ease;
				}

				.chart-wrap {
					padding: 8px 0 4px;
				}

				@media (max-width: 700px) {
					.dash-nav { padding: 20px 24px; }
					.dash-body { padding: 32px 20px 60px; }
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

				{/* ── Sidebar overlay ── */}
				<div
					className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`}
					onClick={() => setSidebarOpen(false)}
				/>

				{/* ── Sidebar ── */}
				<aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
					<div className="sidebar-header">
						<span className="sidebar-title">Menu</span>
						<button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
								<line x1="18" y1="6" x2="6" y2="18" />
								<line x1="6" y1="6" x2="18" y2="18" />
							</svg>
						</button>
					</div>

					<nav className="sidebar-nav">
						<button className="sidebar-nav-item active">Dashboard</button>
						<button className="sidebar-nav-item">Scan a policy</button>
						<button className="sidebar-nav-item">Reports</button>
						<button className="sidebar-nav-item">Preferences</button>
					</nav>

					<div className="sidebar-services">
						<p className="sidebar-label">Linked services ({MOCK_SERVICES.length})</p>
						{MOCK_SERVICES.map((svc) => (
							<div className="sb-service" key={svc.domain}>
								<div className="sb-svc-info">
									<span className="sb-svc-name">{svc.name}</span>
									<span className="sb-svc-domain">{svc.domain}</span>
								</div>
								<span className="sb-svc-date">{svc.linkedAt}</span>
							</div>
						))}
					</div>

					<div className="sidebar-footer">
						<button className="sidebar-footer-btn" onClick={handleLogout}>
							Log out
						</button>
					</div>
				</aside>

				{/* ── Top nav ── */}
				<div className={`dash-nav ${visible ? "visible" : ""}`}>
					<div className="nav-left">
						<button className="hamburger" onClick={() => setSidebarOpen(true)}>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
								<line x1="3" y1="6" x2="21" y2="6" />
								<line x1="3" y1="12" x2="21" y2="12" />
								<line x1="3" y1="18" x2="21" y2="18" />
							</svg>
						</button>
						<span className="nav-logo">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
								<path d="M12 2C6 2 3 7 3 12c0 3 1.5 5.5 4 7l5-9 5 9c2.5-1.5 4-4 4-7 0-5-3-10-9-10z" />
							</svg>
							Raven
						</span>
					</div>
					<div className="nav-right">
						<button className="nav-btn" onClick={handleLogout}>Log out</button>
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

				{/* ── Main content ── */}
				<div className="dash-body">
					{/* Top row: greeting + compact score */}
					<div className={`dash-top ${visible ? "visible" : ""}`}>
						<div className="dash-greeting">
							<h1>
								Welcome{user?.given_name ? `, ${user.given_name}` : ""}<em>.</em>
							</h1>
							<p>{user?.email}</p>
						</div>

						<div className="score-compact">
							<div className="score-ring-wrap">
								<svg className="score-ring-svg" viewBox="0 0 86 86">
									<circle className="ring-track" cx="43" cy="43" r={RADIUS} />
									<circle
										className="ring-fill"
										cx="43" cy="43" r={RADIUS}
										strokeDasharray={CIRCUMFERENCE}
										strokeDashoffset={offset}
									/>
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

					{/* History chart */}
					<div className={`chart-section ${visible ? "visible" : ""}`}>
						<p className="section-label">Score history</p>
						<div className="chart-wrap">
							<HistoryChart data={MOCK_HISTORY} currentScore={score} dark={dark} />
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
