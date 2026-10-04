import { NextResponse } from "next/server";

import { runAllClinicDriveBackups } from "@/lib/google-drive/backup";
import { authorizeCronRequest } from "@/lib/google-drive/retention";

/**
 * Cron diário: backup no Drive para todas as clínicas conectadas.
 * Protegido por Authorization: Bearer CRON_SECRET.
 */
const handle = async (request: Request) => {
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
};

export const GET = async (request: Request) => {
	return handle(request);
};

export const POST = async (request: Request) => {
	return handle(request);
};
