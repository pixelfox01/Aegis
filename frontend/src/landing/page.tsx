import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useScrollDirection } from "../hooks/useScrollDirection";

export default function LandingPage() {
	const [visible, setVisible] = useState(false);
	const [dark, setDark] = useState(true);
	const { loginWithRedirect, isLoading } = useAuth0();
	const { scrollDirection, isTop } = useScrollDirection();

	const handleSignUp = () =>
		loginWithRedirect({ authorizationParams: { screen_hint: "signup" } });

	const handleLogin = () => loginWithRedirect();

	useEffect(() => {
		const t = setTimeout(() => setVisible(true), 100);
		return () => clearTimeout(t);
	}, []);

	const navClasses = [
		visible ? "visible" : "",
		scrollDirection === 'down' && !isTop ? 'header-hidden' : '',
		isTop ? 'header-at-top' : ''
	].filter(Boolean).join(' ');

	return (
		<>
			<style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Mono:wght@300;400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── DARK THEME ── */
        .theme-dark {
          --ink: #f0ede8;
          --muted: #8a8fa8;
          --accent: #e05444;
          --border: rgba(255,255,255,0.1);
          --bg: #0d0d14;
          --nav-bg: rgba(255,255,255,0.04);
          --btn-hover-bg: rgba(255,255,255,0.08);
          --primary-btn-bg: rgba(240,237,232,0.92);
          --primary-btn-color: #0d0d14;
          --primary-btn-hover: #ffffff;
          --cta-bg: rgba(240,237,232,0.92);
          --cta-color: #0d0d14;
          --cta-hover: #ffffff;
          --grain-opacity: 0.06;
        }

        /* ── LIGHT THEME ── */
        .theme-light {
          --ink: #0e0e0e;
          --muted: #8a8680;
          --accent: #c0392b;
          --border: rgba(14,14,14,0.12);
          --bg: #f5f2ed;
          --nav-bg: rgba(245,242,237,0.7);
          --btn-hover-bg: rgba(14,14,14,0.04);
          --primary-btn-bg: #0e0e0e;
          --primary-btn-color: #f5f2ed;
          --primary-btn-hover: #2a2a2a;
          --cta-bg: #0e0e0e;
          --cta-color: #f5f2ed;
          --cta-hover: #2a2a2a;
          --grain-opacity: 0.035;
        }

        .root-wrap {
          min-height: 100vh;
          background: var(--bg);
          color: var(--ink);
          font-family: 'DM Mono', monospace;
          overflow-x: hidden;
          transition: background 0.5s ease, color 0.5s ease;
        }

        /* orbs — fade out in light mode */
        .bg-orbs {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
          transition: opacity 0.5s ease;
        }
        .theme-light .bg-orbs { opacity: 0; }
        .theme-dark  .bg-orbs { opacity: 1; }

        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.55;
        }
        .orb-1 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, #c0392b55, transparent 70%);
          top: -150px; left: -100px;
        }
        .orb-2 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, #1a1a6e66, transparent 70%);
          bottom: -100px; right: -80px;
        }
        .orb-3 {
          width: 350px; height: 350px;
          background: radial-gradient(circle, #2d2d5544, transparent 70%);
          top: 40%; left: 50%;
          transform: translate(-50%, -50%);
        }

        .grain {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 100;
          opacity: var(--grain-opacity);
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          transition: opacity 0.5s ease;
        }

        .page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          position: relative;
          z-index: 1;
        }

        /* NAV */
        nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 28px 48px;
          border-bottom: 1px solid var(--border);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          background: var(--nav-bg);
          opacity: 0;
          transform: translateY(-8px);
          transition: opacity 0.6s ease, transform 0.3s ease,
                      background 0.5s ease, border-color 0.5s ease;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        nav.visible { opacity: 1; transform: translateY(0); }
        nav.header-hidden { transform: translateY(-100%); }
        nav.header-at-top { transform: translateY(0); }

        .nav-logo {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          font-weight: 300;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--ink);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: color 0.5s ease;
        }
        .nav-logo svg { width: 18px; height: 18px; }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .nav-btn {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 9px 18px;
          border-radius: 2px;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s ease;
          border: 1px solid transparent;
          color: var(--muted);
          background: transparent;
        }
        .nav-btn:hover {
          color: var(--ink);
          border-color: var(--border);
          background: var(--btn-hover-bg);
        }
        .nav-btn.primary {
          color: var(--primary-btn-color);
          background: var(--primary-btn-bg);
          border-color: var(--primary-btn-bg);
          transition: background 0.2s ease, border-color 0.2s ease, color 0.5s ease;
        }
        .nav-btn.primary:hover {
          background: var(--primary-btn-hover);
          border-color: var(--primary-btn-hover);
        }

        /* THEME TOGGLE */
        .theme-toggle {
          width: 48px;
          height: 26px;
          border-radius: 13px;
          border: 1px solid var(--border);
          background: var(--btn-hover-bg);
          cursor: pointer;
          position: relative;
          transition: background 0.4s ease, border-color 0.4s ease;
          flex-shrink: 0;
          margin-left: 14px;
        }
        .toggle-knob {
          position: absolute;
          top: 4px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--ink);
          transition: left 0.35s cubic-bezier(.4,0,.2,1), background 0.5s ease;
        }
        .theme-dark  .toggle-knob { left: 24px; }
        .theme-light .toggle-knob { left: 4px; }

        .toggle-icon {
          position: absolute;
          font-size: 9px;
          top: 50%;
          transform: translateY(-50%);
          transition: opacity 0.3s ease;
          pointer-events: none;
          line-height: 1;
        }
        .icon-sun  { left: 6px; }
        .icon-moon { right: 5px; }
        .theme-dark  .icon-sun  { opacity: 0.25; }
        .theme-dark  .icon-moon { opacity: 1; }
        .theme-light .icon-sun  { opacity: 1; }
        .theme-light .icon-moon { opacity: 0.25; }

        /* HERO */
        .hero {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 80px 48px 120px;
        }

        .eyebrow {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 28px;
          opacity: 0;
          transform: translateY(12px);
          transition: opacity 0.7s ease 0.3s, transform 0.7s ease 0.3s, color 0.5s ease;
        }
        .eyebrow.visible { opacity: 1; transform: translateY(0); }

        .hero-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(72px, 12vw, 140px);
          font-weight: 300;
          line-height: 0.9;
          letter-spacing: -0.02em;
          color: var(--ink);
          margin-bottom: 36px;
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 0.8s ease 0.45s, transform 0.8s ease 0.45s, color 0.5s ease;
        }
        .hero-title.visible { opacity: 1; transform: translateY(0); }
        .hero-title em {
          font-style: italic;
          color: var(--accent);
          transition: color 0.5s ease;
        }

        .hero-sub {
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          font-weight: 300;
          color: var(--muted);
          line-height: 1.8;
          max-width: 400px;
          margin-bottom: 56px;
          opacity: 0;
          transform: translateY(12px);
          transition: opacity 0.7s ease 0.6s, transform 0.7s ease 0.6s, color 0.5s ease;
        }
        .hero-sub.visible { opacity: 1; transform: translateY(0); }

        .hero-cta {
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 0.7s ease 0.75s, transform 0.7s ease 0.75s;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .hero-cta.visible { opacity: 1; transform: translateY(0); }

        .cta-primary {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 14px 32px;
          background: var(--cta-bg);
          color: var(--cta-color);
          border: 1px solid var(--cta-bg);
          border-radius: 2px;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.2s ease, border-color 0.2s ease, color 0.5s ease;
        }
        .cta-primary:hover {
          background: var(--cta-hover);
          border-color: var(--cta-hover);
        }

        .cta-ghost {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: color 0.2s ease;
        }
        .cta-ghost:hover { color: var(--ink); }
        .cta-ghost::after { content: '\u2192'; transition: transform 0.2s; }
        .cta-ghost:hover::after { transform: translateX(3px); }

        /* FOOTER */
        footer {
          padding: 24px 48px;
          border-top: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          background: var(--nav-bg);
          opacity: 0;
          transition: opacity 0.6s ease 1s, background 0.5s ease, border-color 0.5s ease;
        }
        footer.visible { opacity: 1; }

        .footer-note {
          font-size: 11px;
          color: var(--muted);
          letter-spacing: 0.05em;
          transition: color 0.5s ease;
        }
        .footer-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--accent);
          animation: pulse 2.5s ease-in-out infinite;
          transition: background 0.5s ease;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }

        @media (max-width: 640px) {
          nav { padding: 20px 24px; }
          .nav-links { gap: 2px; }
          .nav-btn { padding: 8px 12px; font-size: 10px; }
          .hero { padding: 60px 24px 100px; }
          footer { padding: 20px 24px; }
        }
      `}</style>

			<div className={`root-wrap ${dark ? "theme-dark" : "theme-light"}`}>
				<div className="bg-orbs">
					<div className="orb orb-1" />
					<div className="orb orb-2" />
					<div className="orb orb-3" />
				</div>
				<div className="grain" />

				<div className="page">
					<nav className={navClasses}>
						<a href="#" className="nav-logo">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
								<path d="M12 2C6 2 3 7 3 12c0 3 1.5 5.5 4 7l5-9 5 9c2.5-1.5 4-4 4-7 0-5-3-10-9-10z" />
							</svg>
							Raven
						</a>
						<div className="nav-links">
							<a href="#" className="nav-btn">How it works</a>
							<a href="#" onClick={() => { window.location.href = '/docs' }} className="nav-btn">Docs</a>
							<button
								className="nav-btn primary"
								onClick={handleSignUp}
								disabled={isLoading}
							>
								{isLoading ? "..." : "Create account"}
							</button>
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
					</nav>

					<main className="hero">
						<p className={`eyebrow${visible ? " visible" : ""}`}>
							Privacy, finally legible
						</p>
						<h1 className={`hero-title${visible ? " visible" : ""}`}>
							Read the<br /><em>fine print.</em>
						</h1>
						<p className={`hero-sub${visible ? " visible" : ""}`}>
							Raven decodes privacy policies into plain language — so you know exactly what you're agreeing to before you sign up.
						</p>
						<div className={`hero-cta${visible ? " visible" : ""}`}>
							<button className="cta-primary" onClick={handleLogin}>
								Get started
							</button>
							<a href="#" className="cta-ghost">Browse docs</a>
						</div>
					</main>

					<footer className={visible ? "visible" : ""}>
						<span className="footer-note">&copy; 2026 Raven</span>
						<div className="footer-dot" title="All systems operational" />
					</footer>
				</div>
			</div>
		</>
	);
}
