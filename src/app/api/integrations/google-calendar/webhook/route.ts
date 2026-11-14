import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { googleCalendarSubscriptions } from "@/db/schema";
import { syncSubscriptionEvents } from "@/lib/google-calendar/inbound-sync";
import { appendCalendarSyncLog } from "@/lib/google-calendar/sync-log";

/**
 * Webhook push do Google Calendar (sem sessão NextAuth).
 * Valida channel id + token; depois aplica sync incremental.
 */
export const POST = async (request: Request) => {
	const channelId = request.headers.get("x-goog-channel-id");
	const channelToken = request.headers.get("x-goog-channel-token");
	const resourceState = request.headers.get("x-goog-resource-state");

	if (!channelId || !channelToken) {
		return NextResponse.json({ error: "Headers ausentes." }, { status: 400 });
	}

	const db = getDb();
	const [sub] = await db
		.select({
			id: googleCalendarSubscriptions.id,
			clinicId: googleCalendarSubscriptions.clinicId,
			channelToken: googleCalendarSubscriptions.channelToken
		})
		.from(googleCalendarSubscriptions)
		.where(eq(googleCalendarSubscriptions.watchChannelId, channelId))
		.limit(1);

	// Handshake inicial do canal — só ACK (+ log se achar a subscription).
	if (resourceState === "sync") {
		if (sub && sub.channelToken === channelToken) {
			await appendCalendarSyncLog({
				clinicId: sub.clinicId,
				subscriptionId: sub.id,
				source: "handshake",
				status: "ignored",
				detail: "Canal criado (sync)"
			});
		}
		return new NextResponse(null, { status: 200 });
	}

	if (!sub || sub.channelToken !== channelToken) {
		return NextResponse.json({ error: "Canal inválido." }, { status: 404 });
	}

	await appendCalendarSyncLog({
		clinicId: sub.clinicId,
		subscriptionId: sub.id,
		source: "webhook",
		status: "ok",
		detail: `aviso recebido (${resourceState || "unknown"})`
	});

	try {
		await syncSubscriptionEvents(sub.id, { source: "webhook" });
	} catch (err) {
		console.error("[google-calendar] webhook sync failed", sub.id, err);
		return NextResponse.json({ error: "Falha ao sincronizar." }, { status: 500 });
	}

	return new NextResponse(null, { status: 200 });
};
