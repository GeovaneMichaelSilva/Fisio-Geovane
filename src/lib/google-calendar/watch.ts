import { randomBytes } from "node:crypto";

export const createChannelToken = () => {
	return randomBytes(24).toString("hex");
};

export const getGoogleCalendarWebhookUrl = () => {
	const explicit = process.env.GOOGLE_CALENDAR_WEBHOOK_URL?.trim();
	if (explicit) return explicit;
	const base =
		process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
		"http://localhost:3000";
	return `${base}/api/integrations/google-calendar/webhook`;
};

type WatchResponse = {
	id?: string;
	resourceId?: string;
	expiration?: string;
	error?: { message?: string };
};

/**
 * Abre canal push do Google Calendar para a agenda.
 * Expiração típica ~7 dias; renovar via cron.
 */
export const startCalendarWatch = async (input: {
	accessToken: string;
	calendarId: string;
	channelId: string;
	channelToken: string;
}) => {
	const encoded = encodeURIComponent(input.calendarId);
	const res = await fetch(
		`https://www.googleapis.com/calendar/v3/calendars/${encoded}/events/watch`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${input.accessToken}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				id: input.channelId,
				type: "web_hook",
				address: getGoogleCalendarWebhookUrl(),
				token: input.channelToken
			})
		}
	);
	const json = (await res.json()) as WatchResponse;
	if (!res.ok || !json.id || !json.resourceId) {
		throw new Error(json.error?.message || "Falha ao abrir watch do Google.");
	}
	return {
		channelId: json.id,
		resourceId: json.resourceId,
		expiration: json.expiration
			? new Date(Number(json.expiration))
			: null
	};
};

/**
 * Encerra canal push (best-effort).
 */
export const stopCalendarWatch = async (input: {
	accessToken: string;
	channelId: string;
	resourceId: string;
}) => {
	try {
		await fetch("https://www.googleapis.com/calendar/v3/channels/stop", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${input.accessToken}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				id: input.channelId,
				resourceId: input.resourceId
			})
		});
	} catch {
		// ignore
	}
};
