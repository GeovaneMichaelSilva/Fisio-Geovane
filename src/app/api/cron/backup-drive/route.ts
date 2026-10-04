import { NextResponse } from "next/server";

import { runAllClinicDriveBackups } from "@/lib/google-drive/backup";
import { authorizeCronRequest } from "@/lib/google-drive/retention";

/**
 * Cron diário: backup no Drive para todas as clínicas conectadas.
 * Protegido por Authorization: Bearer CRON_SECRET.
 */
export async function GET(request: Request) {
	return handle(request);
}

export async function POST(request: Request) {
	return handle(request);
}

async function handle(request: Request) {
	if (!authorizeCronRequest(request)) {
		return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
	}

	try {
		const summary = await runAllClinicDriveBackups();
		return NextResponse.json({ data: summary });
	} catch (err) {
		console.error(err);
		return NextResponse.json(
			{ error: "Falha ao executar backups do cron." },
			{ status: 500 }
		);
	}
}
