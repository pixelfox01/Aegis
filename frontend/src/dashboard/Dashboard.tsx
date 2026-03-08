import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";

export default function Dashboard() {
	const { user, logout } = useAuth0();
	const [visible, setVisible] = useState(false);
	const [dark, setDark] = useState(true);

	const handleLogout = () =>
		logout({ logoutParams: { returnTo: window.location.origin } });

	useEffect(() => {
		const t = setTimeout(() => setVisible(true), 100);
		return () => clearTimeout(t);
	}, []);

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
					--card-bg: rgba(255,255,255,0.03);
					--card-border: rgba(255,255,255,0.06);
					--primary-btn-bg: rgba(240,237,232,0.92);
					--primary-btn-color: #0d0d14;
					--primary-btn-hover: #ffffff;
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
					--card-bg: rgba(14,14,14,0.02);
					--card-border: rgba(14,14,14,0.08);
					--primary-btn-bg: #0e0e0e;
					--primary-btn-color: #f5f2ed;
					--primary-btn-hover: #2a2a2a;
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
					pointer-events: none; z-index: 100;
					opacity: var(--grain-opacity);
					background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
					transition: opacity 0.5s ease;
				}

				/* NAV */
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

				/* DASHBOARD BODY */
				.dash-page {
					position: relative; z-index: 1;
					padding: 48px;
				}

				.dash-greeting {
					opacity: 0; transform: translateY(12px);
					transition: opacity 0.7s ease 0.2s, transform 0.7s ease 0.2s;
				}
				.dash-greeting.visible { opacity: 1; transform: translateY(0); }

				.dash-greeting h1 {
					font-family: 'Cormorant Garamond', serif;
					font-size: 42px; font-weight: 300; line-height: 1.1;
					margin-bottom: 8px; color: var(--ink);
					transition: color 0.5s ease;
				}
				.dash-greeting h1 em { font-style: italic; color: var(--accent); }
				.dash-greeting p {
					font-size: 12px; color: var(--muted); letter-spacing: 0.04em;
					transition: color 0.5s ease;
				}

				/* CARDS */
				.dash-grid {
					display: grid;
					grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
					gap: 16px;
					margin-top: 40px;
					opacity: 0; transform: translateY(16px);
					transition: opacity 0.7s ease 0.4s, transform 0.7s ease 0.4s;
				}
				.dash-grid.visible { opacity: 1; transform: translateY(0); }

				.dash-card {
					background: var(--card-bg);
					border: 1px solid var(--card-border);
					border-radius: 6px;
					padding: 28px 24px;
					transition: background 0.3s ease, border-color 0.3s ease;
				}
				.dash-card:hover { border-color: var(--accent); }

				.card-icon {
					font-size: 20px; margin-bottom: 16px; display: block;
				}

				.card-title {
					font-family: 'Cormorant Garamond', serif;
					font-size: 20px; font-weight: 400; margin-bottom: 8px;
					color: var(--ink);
					transition: color 0.5s ease;
				}
				.card-desc {
					font-size: 11px; color: var(--muted); line-height: 1.7;
					letter-spacing: 0.02em;
					transition: color 0.5s ease;
				}

				/* EMPTY STATE HINT */
				.dash-hint {
					text-align: center;
					margin-top: 64px;
					opacity: 0; transform: translateY(12px);
					transition: opacity 0.7s ease 0.6s, transform 0.7s ease 0.6s;
				}
				.dash-hint.visible { opacity: 1; transform: translateY(0); }
				.dash-hint p {
					font-size: 12px; color: var(--muted); line-height: 1.8;
					max-width: 400px; margin: 0 auto;
					transition: color 0.5s ease;
				}

				@media (max-width: 640px) {
					.dash-nav { padding: 20px 24px; }
					.dash-page { padding: 32px 20px; }
					.dash-greeting h1 { font-size: 32px; }
				}
			`}</style>

			<div className={`dash-root ${dark ? "theme-dark" : "theme-light"}`}>
				<div className="bg-orbs">
					<div className="orb orb-1" />
					<div className="orb orb-2" />
				</div>
				<div className="grain" />

				<div className={`dash-nav ${visible ? "visible" : ""}`}>
					<span className="nav-logo">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
							<path d="M12 2C6 2 3 7 3 12c0 3 1.5 5.5 4 7l5-9 5 9c2.5-1.5 4-4 4-7 0-5-3-10-9-10z" />
						</svg>
						Raven
					</span>
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

				<div className="dash-page">
					<div className={`dash-greeting ${visible ? "visible" : ""}`}>
						<h1>
							Welcome{user?.given_name ? `, ${user.given_name}` : ""}
							<em>.</em>
						</h1>
						<p>{user?.email}</p>
					</div>

					<div className={`dash-grid ${visible ? "visible" : ""}`}>
						<div className="dash-card">
							<span className="card-icon">&#x1F50D;</span>
							<h3 className="card-title">Scan a policy</h3>
							<p className="card-desc">
								Paste a URL or upload a privacy policy to get a plain-language breakdown.
							</p>
						</div>
						<div className="dash-card">
							<span className="card-icon">&#x1F4CB;</span>
							<h3 className="card-title">Your reports</h3>
							<p className="card-desc">
								View past scans and saved policy analyses in one place.
							</p>
						</div>
						<div className="dash-card">
							<span className="card-icon">&#x2699;&#xFE0F;</span>
							<h3 className="card-title">Preferences</h3>
							<p className="card-desc">
								Adjust what matters most to you — data collection, sharing, retention, and more.
							</p>
						</div>
					</div>

					<div className={`dash-hint ${visible ? "visible" : ""}`}>
						<p>
							This is your home base. Scan your first privacy policy to get started.
						</p>
					</div>
				</div>
			</div>
		</>
	);
}
