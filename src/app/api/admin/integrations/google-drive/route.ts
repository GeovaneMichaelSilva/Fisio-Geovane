import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { googleDriveConnections } from "@/db/schema";
import { getOrCreateClinicContext } from "@/lib/clinic/context";
import { requireOwner } from "@/lib/clinic/rbac";
import { getLatestBackupRun } from "@/lib/google-drive/backup";
import { isGoogleDriveConfigured } from "@/lib/google-drive/oauth";
import { BACKUP_RETENTION_DAYS } from "@/lib/google-drive/retention";

/**
 * Status da conexão Google Drive (backup) da clínica.
 */
export async function GET() {
	try {
		const ctx = await getOrCreateClinicContext();
		const configured = isGoogleDriveConfigured();

		if (!configured) {
			return NextResponse.json({
				data: {
					configured: false,
					connected: false,
					googleAccountEmail: null,
					connectedAt: null,
					retentionDays: BACKUP_RETENTION_DAYS,
					lastRun: null
				}
			});
		}

		const db = getDb();
		const [conn] = await db
			.select({
				googleAccountEmail: googleDriveConnections.googleAccountEmail,
				connectedAt: googleDriveConnections.connectedAt
			})
			.from(googleDriveConnections)
			.where(eq(googleDriveConnections.clinicId, ctx.clinic.id))
			.limit(1);

		const lastRun = conn
			? await getLatestBackupRun(ctx.clinic.id, db)
			: null;

		return NextResponse.json({
			data: {
				configured: true,
				connected: Boolean(conn),
				googleAccountEmail: conn?.googleAccountEmail ?? null,
				connectedAt: conn?.connectedAt?.toISOString() ?? null,
				retentionDays: BACKUP_RETENTION_DAYS,
				lastRun: lastRun
					? {
							status: lastRun.status,
							trigger: lastRun.trigger,
							fileName: lastRun.fileName,
							bytes: lastRun.bytes,
							errorMessage: lastRun.errorMessage,
							deletedOldFiles: lastRun.deletedOldFiles,
							createdAt: lastRun.createdAt.toISOString()
						}
					: null
			}
		});
	} catch (err) {
		if (err instanceof Response) return err;
		console.error(err);
		return NextResponse.json(
			{ error: "Falha ao carregar status do backup Drive." },
			{ status: 500 }
		);
	}
}

/**
 * Desconecta Google Drive e revoga token (best-effort).
 */
export async function DELETE() {
	try {
		const ctx = await getOrCreateClinicContext();
		requireOwner(ctx);
		const db = getDb();

		const [conn] = await db
			.select()
			.from(googleDriveConnections)
			.where(eq(googleDriveConnections.clinicId, ctx.clinic.id))
			.limit(1);

		if (!conn) {
			return NextResponse.json({ data: { disconnected: true } });
		}

		const { decryptSecret } = await import("@/lib/crypto/secrets");
		const { revokeGoogleToken } = await import("@/lib/google-drive/oauth");

		try {
			const refresh = decryptSecret(conn.refreshTokenEncrypted);
			await revokeGoogleToken(refresh);
		} catch {
			// ignore revoke errors
		}

		await db
			.delete(googleDriveConnections)
			.where(eq(googleDriveConnections.id, conn.id));

		return NextResponse.json({ data: { disconnected: true } });
	} catch (err) {
		if (err instanceof Response) return err;
		console.error(err);
		return NextResponse.json(
			{ error: "Falha ao desconectar Google Drive." },
			{ status: 500 }
		);
	}
}
