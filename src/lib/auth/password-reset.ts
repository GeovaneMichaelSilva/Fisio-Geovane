import { createHash, randomBytes } from "node:crypto";

import { and, eq, gt, isNull } from "drizzle-orm";
import { Resend } from "resend";

import { getDb } from "@/db";
import { passwordResetTokens, users } from "@/db/schema";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1h

export const hashToken = (token: string) => {
	return createHash("sha256").update(token).digest("hex");
}

export const generateResetToken = () => {
	return randomBytes(32).toString("hex");
}

/**
 * Cria token de reset e envia e-mail via Resend.
 * Sempre retorna ok=true para não vazar existência de conta.
 */
export const requestPasswordReset = async (emailRaw: string) => {
	const email = emailRaw.trim().toLowerCase();
	const db = getDb();

	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.email, email))
		.limit(1);

	if (!user) {
		return { ok: true as const };
	}

	const token = generateResetToken();
	const tokenHash = hashToken(token);
	const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

	await db.insert(passwordResetTokens).values({
		userId: user.id,
		tokenHash,
		expiresAt
	});

	const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
	const resetUrl = `${appUrl}/update-password?token=${token}`;

	const apiKey = process.env.RESEND_API_KEY;
	const from = process.env.EMAIL_FROM || "nao-responda@fisiogeovane.com.br";

	if (!apiKey) {
		console.warn(
			"[password-reset] RESEND_API_KEY ausente — link gerado (dev):",
			resetUrl
		);
		return { ok: true as const, devResetUrl: resetUrl };
	}

	const resend = new Resend(apiKey);
	await resend.emails.send({
		from,
		to: user.email,
		subject: "Redefinir senha — Fisio Geovane",
		html: `
			<p>Olá, ${user.fullName}.</p>
			<p>Recebemos um pedido para redefinir sua senha.</p>
			<p><a href="${resetUrl}">Clique aqui para definir uma nova senha</a></p>
			<p>O link expira em 1 hora. Se você não solicitou, ignore este e-mail.</p>
		`
	});

	return { ok: true as const };
}

export const resetPasswordWithToken = async (token: string, newPassword: string) => {
	if (newPassword.length < 8) {
		return { ok: false as const, error: "Senha muito curta." };
	}

	const db = getDb();
	const tokenHash = hashToken(token);
	const now = new Date();

	const [row] = await db
		.select()
		.from(passwordResetTokens)
		.where(
			and(
				eq(passwordResetTokens.tokenHash, tokenHash),
				isNull(passwordResetTokens.usedAt),
				gt(passwordResetTokens.expiresAt, now)
			)
		)
		.limit(1);

	if (!row) {
		return { ok: false as const, error: "Link inválido ou expirado." };
	}

	const { hash } = await import("bcryptjs");
	const passwordHash = await hash(newPassword, 12);

	await db
		.update(users)
		.set({ passwordHash, updatedAt: now })
		.where(eq(users.id, row.userId));

	await db
		.update(passwordResetTokens)
		.set({ usedAt: now })
		.where(eq(passwordResetTokens.id, row.id));

	return { ok: true as const };
}
