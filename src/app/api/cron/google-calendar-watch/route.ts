import { NextResponse } from "next/server";

import { renewAllCalendarWatches } from "@/lib/google-calendar/inbound-sync";
import { authorizeCronRequest } from "@/lib/google-drive/retention";

/**
 * Cron diário: renova watches e recupera sync de agendas overlay.
 */
const handle = async (request: Request) => {
	if (!authorizeCronRequest(request)) {
		return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
	}

	try {
		const summary = await renewAllCalendarWatches();
		return NextResponse.json({ data: summary });
	} catch (err) {
		console.error(err);
		return NextResponse.json(
			{ error: "Falha ao renovar watches do Google Agenda." },
			{ status: 500 }
		);
	}
};

export const GET = async (request: Request) => {
	return handle(request);
};

export const POST = async (request: Request) => {
	return handle(request);
};
