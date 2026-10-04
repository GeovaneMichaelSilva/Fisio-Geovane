import {
	createOAuthState,
	fetchGoogleAccountEmail,
	parseOAuthState,
	refreshAccessToken,
	revokeGoogleToken,
	type GoogleTokenResponse
} from "@/lib/google-calendar/oauth";

const DRIVE_SCOPES = [
	"https://www.googleapis.com/auth/drive.file",
	"openid",
	"email",
	"profile"
].join(" ");

const requireGoogleEnv = () => {
	const clientId = process.env.GOOGLE_CLIENT_ID;
	const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
	if (!clientId || !clientSecret) {
		throw new Error(
			"Google Drive não configurado (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)."
		);
	}
	return { clientId, clientSecret };
}

export const isGoogleDriveConfigured = () => {
	return Boolean(
		process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
	);
}

export const getGoogleDriveRedirectUri = () => {
	const explicit = process.env.GOOGLE_DRIVE_REDIRECT_URI?.trim();
	if (explicit) return explicit;
	const base =
		process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
		"http://localhost:3000";
	return `${base}/api/admin/integrations/google-drive/callback`;
}

export const buildGoogleDriveAuthUrl = (state: string) => {
	const { clientId } = requireGoogleEnv();
	const params = new URLSearchParams({
		client_id: clientId,
		redirect_uri: getGoogleDriveRedirectUri(),
		response_type: "code",
		scope: DRIVE_SCOPES,
		access_type: "offline",
		prompt: "consent",
		include_granted_scopes: "true",
		state
	});
	return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export const exchangeDriveCodeForTokens = async (code: string) => {
	const { clientId, clientSecret } = requireGoogleEnv();
	const res = await fetch("https://oauth2.googleapis.com/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			code,
			client_id: clientId,
			client_secret: clientSecret,
			redirect_uri: getGoogleDriveRedirectUri(),
			grant_type: "authorization_code"
		})
	});
	const json = (await res.json()) as GoogleTokenResponse & { error?: string };
	if (!res.ok) {
		throw new Error(json.error || "Falha ao trocar código OAuth do Drive.");
	}
	return json;
}

export {
	createOAuthState,
	fetchGoogleAccountEmail,
	parseOAuthState,
	refreshAccessToken,
	revokeGoogleToken
};
