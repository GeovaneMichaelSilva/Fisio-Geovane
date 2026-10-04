import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getOrCreateClinicContext } from "@/lib/clinic/context";
import { requireOwner } from "@/lib/clinic/rbac";
import {
	buildGoogleAuthUrl,
	createOAuthState,
	isGoogleCalendarConfigured
} from "@/lib/google-calendar/oauth";

const appBase = () => {
	return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
};

/**
 * Inicia OAuth do Google Agenda (redirect).
 */
export const GET = async () => {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			const url = new URL("/login", appBase());
			url.searchParams.set("next", "/admin/settings/integrations");
			return NextResponse.redirect(url);
		}

		if (!isGoogleCalendarConfigured()) {
			return NextResponse.redirect(
				new URL(
					"/admin/settings/integrations?google=error&message=" +
						encodeURIComponent(
							"Configure GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET."
						),
					appBase()
				)
			);
		}

		const ctx = await getOrCreateClinicContext();
		requireOwner(ctx);
		const state = createOAuthState(ctx.userId, ctx.clinic.id);
		const url = buildGoogleAuthUrl(state);
		return NextResponse.redirect(url);
	} catch (err) {
		console.error(err);
		return NextResponse.redirect(
			new URL(
				"/admin/settings/integrations?google=error&message=" +
					encodeURIComponent("Falha ao iniciar conexão com Google."),
				appBase()
			)
		);
	}
}
