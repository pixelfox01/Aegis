import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useState, useEffect } from "react";
import LandingPage from "./landing/page";
import OnboardingSurvey from "./onboarding/OnboardingSurvey";
import Dashboard from "./dashboard/Dashboard";
import Docs from './docs/Docs';
import LocalAuth from './components/LocalAuth';
import { env } from './config/env';
import { useUser } from './hooks/useUser';

function RequireAuth({ children }: { children: React.ReactNode }) {
	if (env.authMode === 'auth0') {
		return <RequireAuth0>{children}</RequireAuth0>;
	}
	return <RequireLocalAuth>{children}</RequireLocalAuth>;
}

function RequireAuth0({ children }: { children: React.ReactNode }) {
	const { isAuthenticated, isLoading } = useAuth0();

	if (isLoading) return null;
	if (!isAuthenticated) return <Navigate to="/" replace />;

	return <>{children}</>;
}

function RequireLocalAuth({ children }: { children: React.ReactNode }) {
	const token = localStorage.getItem('aegis_token');

	if (!token) {
		return <Navigate to="/" replace />;
	}

	return <>{children}</>;
}

function AuthRedirect() {
	if (env.authMode === 'auth0') {
		return <Auth0Redirect />;
	}
	return <LocalAuthRedirect />;
}

function Auth0Redirect() {
	const { isAuthenticated, isLoading } = useAuth0();
	const { loading: userLoading } = useUser();

	if (isLoading || userLoading) return null;

	if (isAuthenticated) {
		const onboarded = localStorage.getItem("raven_onboarded") === "true";
		return <Navigate to={onboarded ? "/dashboard" : "/onboarding"} replace />;
	}

	return <LandingPage />;
}

function LocalAuthRedirect() {
	const [token, setToken] = useState<string | null>(localStorage.getItem('aegis_token'));
	const { loading: userLoading } = useUser();

	useEffect(() => {
		const handleStorageChange = () => {
			setToken(localStorage.getItem('aegis_token'));
		};
		window.addEventListener('storage', handleStorageChange);
		return () => window.removeEventListener('storage', handleStorageChange);
	}, []);

	if (userLoading && token) return null;

	if (token) {
		const onboarded = localStorage.getItem("raven_onboarded") === "true";
		return <Navigate to={onboarded ? "/dashboard" : "/onboarding"} replace />;
	}

	return <LocalAuth onAuthSuccess={(newToken) => {
		setToken(newToken);
		window.location.reload();
	}} />;
}

export default function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<AuthRedirect />} />
				<Route
					path="/onboarding"
					element={
						<RequireAuth>
							<OnboardingSurvey />
						</RequireAuth>
					}
				/>
				<Route
					path="/dashboard"
					element={
						<RequireAuth>
							<Dashboard />
						</RequireAuth>
					}
				/>
        <Route path="/docs" element={<Docs />} />
			</Routes>
		</BrowserRouter>
	);
}
