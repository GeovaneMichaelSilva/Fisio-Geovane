import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const SCOPES = [
	"https://www.googleapis.com/auth/calendar.events",
	"https://www.googleapis.com/auth/calendar.calendarlist.readonly",
	"openid",
	"email",
	"profile"
].join(" ");

export type GoogleTokenResponse = {
	access_token: string;
	expires_in: number;
	refresh_token?: string;
	scope?: string;
	token_type: string;
	id_token?: string;
};

const requireGoogleEnv = () => {
	const clientId = process.env.GOOGLE_CLIENT_ID;
	const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
	if (!clientId || !clientSecret) {
		throw new Error(
			"Google Calendar não configurado (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)."
		);
	}
	return { clientId, clientSecret };
}

export const isGoogleCalendarConfigured = () => {
	return Boolean(
		process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
	);
}

export const getGoogleRedirectUri = () => {
	const explicit = process.env.GOOGLE_REDIRECT_URI?.trim();
	if (explicit) return explicit;
	const base =
		process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
		"http://localhost:3000";
	return `${base}/api/admin/integrations/google-calendar/callback`;
}

const signState = (payload: string) => {
	const secret = process.env.AUTH_SECRET;
	if (!secret) throw new Error("AUTH_SECRET is not set");
	return createHmac("sha256", secret).update(payload).digest("base64url");
}

/**
 * Gera state CSRF assinado: nonce.userId.clinicId.exp.sig
 */
export const createOAuthState = (userId: string, clinicId: string) => {
	const nonce = randomBytes(16).toString("hex");
	const exp = String(Date.now() + 10 * 60 * 1000);
	const body = `${nonce}.${userId}.${clinicId}.${exp}`;
	return `${body}.${signState(body)}`;
}

export const parseOAuthState = (state: string): {
	userId: string;
	clinicId: string;
} => {
	const parts = state.split(".");
	if (parts.length !== 5) throw new Error("State OAuth inválido.");
	const [nonce, userId, clinicId, exp, sig] = parts;
	const body = `${nonce}.${userId}.${clinicId}.${exp}`;
	const expected = signState(body);
	const a = Buffer.from(sig);
	const b = Buffer.from(expected);
	if (a.length !== b.length || !timingSafeEqual(a, b)) {
		throw new Error("State OAuth inválido.");
	}
	if (Date.now() > Number(exp)) {
		throw new Error("State OAuth expirado. Tente conectar de novo.");
	}
	return { userId, clinicId };
}

export const buildGoogleAuthUrl = (state: string) => {
	const { clientId } = requireGoogleEnv();
	const params = new URLSearchParams({
		client_id: clientId,
		redirect_uri: getGoogleRedirectUri(),
		response_type: "code",
		scope: SCOPES,
		access_type: "offline",
		prompt: "consent",
		include_granted_scopes: "true",
		state
	});
	return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export const exchangeCodeForTokens = async (code: string) => {
	const { clientId, clientSecret } = requireGoogleEnv();
	const res = await fetch("https://oauth2.googleapis.com/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			code,
			client_id: clientId,
			client_secret: clientSecret,
			redirect_uri: getGoogleRedirectUri(),
			grant_type: "authorization_code"
		})
	});
	const json = (await res.json()) as GoogleTokenResponse & { error?: string };
	if (!res.ok) {
		throw new Error(json.error || "Falha ao trocar código OAuth.");
	}
	return json;
}

export const refreshAccessToken = async (refreshToken: string) => {
	const { clientId, clientSecret } = requireGoogleEnv();
	const res = await fetch("https://oauth2.googleapis.com/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			refresh_token: refreshToken,
			client_id: clientId,
			client_secret: clientSecret,
			grant_type: "refresh_token"
		})
	});
	const json = (await res.json()) as GoogleTokenResponse & { error?: string };
	if (!res.ok) {
		throw new Error(json.error || "Falha ao renovar token Google.");
	}
	return json;
}

export const fetchGoogleAccountEmail = async (accessToken: string) => {
	const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
		headers: { Authorization: `Bearer ${accessToken}` }
	});
	const json = (await res.json()) as { email?: string; error?: { message?: string } };
	if (!res.ok || !json.email) {
		throw new Error(json.error?.message || "Falha ao ler conta Google.");
	}
	return json.email;
}

/**
 * Revoga o refresh token no Google (best-effort).
 */
export const revokeGoogleToken = async (token: string) => {
	try {
		await fetch("https://oauth2.googleapis.com/revoke", {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({ token })
		});
	} catch {
		// ignore
	}
}
