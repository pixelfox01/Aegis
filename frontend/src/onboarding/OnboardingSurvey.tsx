import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { surveyQuestionConfigs, SurveyQuestion } from "./surveyQuestions";
import { env } from "../config/env";

export default function OnboardingSurvey() {
	const navigate = useNavigate();
	const { getAccessTokenSilently, user } = useAuth0();
	const [step, setStep] = useState(0);
	const [answers, setAnswers] = useState<Record<string, string>>({});
	const [visible, setVisible] = useState(false);
	const [dark, setDark] = useState(true);
	const [saving, setSaving] = useState(false);
	const [surveyQuestions, setSurveyQuestions] = useState<SurveyQuestion[]>([]);
	const [loading, setLoading] = useState(true);

	const total = surveyQuestions.length;
	const current = surveyQuestions[step];

	useEffect(() => {
		fetchSurveyQuestions();
	}, []);

	useEffect(() => {
		if (!loading) {
			const t = setTimeout(() => setVisible(true), 100);
			return () => clearTimeout(t);
		}
	}, [loading]);

	async function fetchSurveyQuestions() {
		try {
			const response = await fetch(`${env.apiUrl}/questions/survey`);
			if (!response.ok) {
				throw new Error('Failed to fetch survey questions');
			}
			const questions: { id: number; text: string; survey_key: string }[] = await response.json();
			
			const mappedQuestions: SurveyQuestion[] = questions
				.map(q => {
					const config = surveyQuestionConfigs[q.survey_key];
					if (!config) return null;
					
					return {
						id: q.survey_key,
						...config
					};
				})
				.filter((q): q is SurveyQuestion => q !== null);
			
			setSurveyQuestions(mappedQuestions);
		} catch (error) {
			console.error('Failed to load survey questions:', error);
		} finally {
			setLoading(false);
		}
	}

	// fade-in reset when step changes
	const [stepVisible, setStepVisible] = useState(false);
	useEffect(() => {
		setStepVisible(false);
		const t = setTimeout(() => setStepVisible(true), 50);
		return () => clearTimeout(t);
	}, [step]);

	function selectOption(value: string) {
		setAnswers((prev) => ({ ...prev, [current.id]: value }));
	}

	function handleNext() {
		if (step < total - 1) {
			setStep(step + 1);
		} else {
			finishSurvey(answers);
		}
	}

	function handleBack() {
		if (step > 0) setStep(step - 1);
	}

	function handleSkip() {
		const defaults: Record<string, string> = {};
		for (const q of surveyQuestions) {
			defaults[q.id] = q.default;
		}
		finishSurvey(defaults);
	}

	if (loading) {
		return (
			<div className="survey-root theme-dark" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
				<p style={{ color: '#f0ede8', fontFamily: 'DM Mono, monospace', fontSize: '12px' }}>Loading survey...</p>
			</div>
		);
	}

	if (surveyQuestions.length === 0) {
		return (
			<div className="survey-root theme-dark" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
				<p style={{ color: '#f0ede8', fontFamily: 'DM Mono, monospace', fontSize: '12px' }}>No survey questions available.</p>
			</div>
		);
	}

	async function finishSurvey(prefs: Record<string, string>) {
		setSaving(true);
		
		try {
			let token: string | null = null;
			let userSub: string | undefined;
			
			if (env.authMode === 'auth0') {
				token = await getAccessTokenSilently();
				userSub = user?.sub;
			} else {
				token = localStorage.getItem('aegis_token');
			}
			
			if (token) {
				const headers: Record<string, string> = {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				};
				if (userSub) {
					headers['X-User-Sub'] = userSub;
				}
				
				await fetch(`${env.apiUrl}/users/preferences`, {
					method: 'PUT',
					headers,
					body: JSON.stringify({ preferences: prefs })
				});
			}
		} catch (error) {
			console.error('Failed to save preferences:', error);
		}
		
		localStorage.setItem("raven_preferences", JSON.stringify(prefs));
		localStorage.setItem("raven_onboarded", "true");
		setSaving(false);
		navigate("/dashboard", { replace: true });
	}

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
					--option-bg: rgba(255,255,255,0.04);
					--option-hover: rgba(255,255,255,0.08);
					--option-selected: rgba(224,84,68,0.12);
					--option-selected-border: rgba(224,84,68,0.5);
					--cta-bg: rgba(240,237,232,0.92);
					--cta-color: #0d0d14;
					--cta-hover: #ffffff;
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
					--option-bg: rgba(14,14,14,0.03);
					--option-hover: rgba(14,14,14,0.06);
					--option-selected: rgba(192,57,43,0.08);
					--option-selected-border: rgba(192,57,43,0.4);
					--cta-bg: #0e0e0e;
					--cta-color: #f5f2ed;
					--cta-hover: #2a2a2a;
					--grain-opacity: 0.035;
				}

				.survey-root {
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
				.survey-nav {
					display: flex; align-items: center; justify-content: space-between;
					padding: 28px 48px;
					border-bottom: 1px solid var(--border);
					backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
					background: var(--nav-bg);
					position: relative; z-index: 2;
					opacity: 0; transform: translateY(-8px);
					transition: opacity 0.6s ease, transform 0.6s ease, background 0.5s ease;
				}
				.survey-nav.visible { opacity: 1; transform: translateY(0); }

				.nav-logo {
					font-family: 'Cormorant Garamond', serif;
					font-size: 22px; font-weight: 300;
					letter-spacing: 0.12em; text-transform: uppercase;
					color: var(--ink); text-decoration: none;
					display: flex; align-items: center; gap: 10px;
					transition: color 0.5s ease;
				}
				.nav-logo svg { width: 18px; height: 18px; }

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

				/* SURVEY BODY */
				.survey-page {
					position: relative; z-index: 1;
					display: flex; flex-direction: column; align-items: center;
					min-height: calc(100vh - 90px);
					padding: 60px 24px 80px;
				}

				.survey-card {
					max-width: 560px; width: 100%;
					opacity: 0; transform: translateY(16px);
					transition: opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s;
				}
				.survey-card.visible { opacity: 1; transform: translateY(0); }

				.survey-progress {
					display: flex; gap: 6px; margin-bottom: 48px;
				}
				.progress-dot {
					flex: 1; height: 3px; border-radius: 2px;
					background: var(--border);
					transition: background 0.3s ease;
				}
				.progress-dot.filled { background: var(--accent); }

				.survey-step-label {
					font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase;
					color: var(--muted); margin-bottom: 16px;
					transition: color 0.5s ease;
				}

				.survey-question {
					font-family: 'Cormorant Garamond', serif;
					font-size: 32px; font-weight: 300; line-height: 1.2;
					color: var(--ink); margin-bottom: 12px;
					transition: color 0.5s ease;
				}

				.survey-description {
					font-size: 12px; color: var(--muted); line-height: 1.7;
					margin-bottom: 36px;
					transition: color 0.5s ease;
				}

				/* STEP CONTENT FADE */
				.step-content {
					opacity: 0; transform: translateY(10px);
					transition: opacity 0.35s ease, transform 0.35s ease;
				}
				.step-content.step-visible { opacity: 1; transform: translateY(0); }

				/* OPTIONS */
				.option-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 40px; }

				.option-btn {
					display: block; width: 100%; text-align: left;
					font-family: 'DM Mono', monospace; font-size: 12px;
					letter-spacing: 0.04em;
					padding: 16px 20px;
					background: var(--option-bg);
					border: 1px solid var(--border);
					border-radius: 4px;
					color: var(--ink);
					cursor: pointer;
					transition: background 0.2s ease, border-color 0.2s ease, color 0.5s ease;
				}
				.option-btn:hover { background: var(--option-hover); }
				.option-btn.selected {
					background: var(--option-selected);
					border-color: var(--option-selected-border);
				}

				/* ACTIONS */
				.survey-actions {
					display: flex; align-items: center; justify-content: space-between;
				}

				.action-btn {
					font-family: 'DM Mono', monospace; font-size: 11px;
					letter-spacing: 0.08em; text-transform: uppercase;
					padding: 12px 24px; border-radius: 2px;
					cursor: pointer; border: 1px solid transparent;
					transition: all 0.2s ease;
				}
				.action-btn.primary {
					background: var(--cta-bg); color: var(--cta-color);
					border-color: var(--cta-bg);
				}
				.action-btn.primary:hover { background: var(--cta-hover); border-color: var(--cta-hover); }
				.action-btn.primary:disabled { opacity: 0.35; cursor: not-allowed; }

				.action-btn.ghost {
					background: transparent; color: var(--muted); border-color: transparent;
				}
				.action-btn.ghost:hover { color: var(--ink); }

				.skip-link {
					font-family: 'DM Mono', monospace; font-size: 11px;
					letter-spacing: 0.06em; color: var(--muted);
					text-decoration: none; cursor: pointer;
					background: none; border: none;
					transition: color 0.2s ease;
					margin-top: 28px;
				}
				.skip-link:hover { color: var(--ink); }

				@media (max-width: 640px) {
					.survey-nav { padding: 20px 24px; }
					.survey-page { padding: 40px 16px 60px; }
					.survey-question { font-size: 26px; }
				}
			`}</style>

			<div className={`survey-root ${dark ? "theme-dark" : "theme-light"}`}>
				<div className="bg-orbs">
					<div className="orb orb-1" />
					<div className="orb orb-2" />
				</div>
				<div className="grain" />

				<div className={`survey-nav ${visible ? "visible" : ""}`}>
					<span className="nav-logo">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
							<path d="M12 2C6 2 3 7 3 12c0 3 1.5 5.5 4 7l5-9 5 9c2.5-1.5 4-4 4-7 0-5-3-10-9-10z" />
						</svg>
						Raven
					</span>
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

				<div className="survey-page">
					<div className={`survey-card ${visible ? "visible" : ""}`}>
						{/* progress bar */}
						<div className="survey-progress">
							{surveyQuestions.map((_, i) => (
								<div key={i} className={`progress-dot ${i <= step ? "filled" : ""}`} />
							))}
						</div>

						<div className={`step-content ${stepVisible ? "step-visible" : ""}`}>
							<p className="survey-step-label">
								Question {step + 1} of {total}
							</p>
							<h2 className="survey-question">{current.question}</h2>
							{current.description && (
								<p className="survey-description">{current.description}</p>
							)}

							<div className="option-list">
								{current.options.map((opt) => (
									<button
										key={opt.value}
										className={`option-btn ${answers[current.id] === opt.value ? "selected" : ""}`}
										onClick={() => selectOption(opt.value)}
									>
										{opt.label}
									</button>
								))}
							</div>

							<div className="survey-actions">
								<button
									className="action-btn ghost"
									onClick={handleBack}
									style={{ visibility: step === 0 ? "hidden" : "visible" }}
								>
									Back
								</button>
								<button
									className="action-btn primary"
									onClick={handleNext}
									disabled={!answers[current.id] || saving}
								>
									{saving ? "Saving..." : step === total - 1 ? "Finish" : "Continue"}
								</button>
							</div>
						</div>

						<div style={{ textAlign: "center" }}>
							<button className="skip-link" onClick={handleSkip}>
								Skip survey — use defaults
							</button>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
