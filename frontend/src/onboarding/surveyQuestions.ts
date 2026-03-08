/**
 * Onboarding survey questions — edit this file to add, remove, or reorder questions.
 *
 * Each question has:
 *   id          – unique key, used as the localStorage preference key
 *   question    – what the user sees
 *   description – optional helper text shown below the question
 *   options     – the choices (value is stored, label is displayed)
 *   default     – the value assigned when the user skips the survey
 */

export interface SurveyOption {
	value: string;
	label: string;
}

export interface SurveyQuestion {
	id: string;
	question: string;
	description?: string;
	options: SurveyOption[];
	default: string;
}

export const surveyQuestionConfigs: Record<string, Omit<SurveyQuestion, 'id'>> = {
	data_collection: {
		question: "How much do you care about what data is collected?",
		description:
			"This includes personal info, browsing habits, location data, and device identifiers.",
		options: [
			{ value: "high", label: "Very important to me" },
			{ value: "medium", label: "Somewhat important" },
			{ value: "low", label: "Not a priority" },
		],
		default: "medium",
	},
	third_party_sharing: {
		question: "How do you feel about third-party data sharing?",
		description:
			"Many services share or sell your data to advertisers, analytics firms, or other partners.",
		options: [
			{ value: "strict", label: "I want to know every instance" },
			{ value: "moderate", label: "Flag it if it seems excessive" },
			{ value: "relaxed", label: "I'm not too concerned" },
		],
		default: "moderate",
	},
	data_retention: {
		question: "Do you care how long companies keep your data?",
		description:
			"Some services retain data indefinitely, even after you delete your account.",
		options: [
			{ value: "strict", label: "Shorter retention is better" },
			{ value: "moderate", label: "Depends on the context" },
			{ value: "relaxed", label: "Doesn't bother me" },
		],
		default: "moderate",
	},
	tracking_cookies: {
		question: "How do you feel about tracking and cookies?",
		description:
			"Cross-site tracking, fingerprinting, and persistent cookies used for ad targeting.",
		options: [
			{ value: "block", label: "I'd prefer to block all tracking" },
			{ value: "limit", label: "Limit to essential tracking only" },
			{ value: "allow", label: "I don't mind being tracked" },
		],
		default: "limit",
	},
	account_deletion: {
		question: "Is easy account deletion important to you?",
		description:
			"Some services make it difficult to fully delete your account and associated data.",
		options: [
			{ value: "critical", label: "Yes — a dealbreaker if missing" },
			{ value: "nice", label: "Nice to have" },
			{ value: "indifferent", label: "Not something I think about" },
		],
		default: "nice",
	},
};
