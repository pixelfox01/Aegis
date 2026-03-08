import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import LandingPage from "./landing/page";
import OnboardingSurvey from "./onboarding/OnboardingSurvey";
import Dashboard from "./dashboard/Dashboard";
import Docs from './docs/Docs'

function RequireAuth({ children }: { children: React.ReactNode }) {
	const { isAuthenticated, isLoading } = useAuth0();

	if (isLoading) return null;
	if (!isAuthenticated) return <Navigate to="/" replace />;

	return <>{children}</>;
}

function AuthRedirect() {
	const { isAuthenticated, isLoading } = useAuth0();

	if (isLoading) return null;

	if (isAuthenticated) {
		const onboarded = localStorage.getItem("raven_onboarded") === "true";
		return <Navigate to={onboarded ? "/dashboard" : "/onboarding"} replace />;
	}

	return <LandingPage />;
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
