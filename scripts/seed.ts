/**
 * Seed mínimo: cria só o usuário owner para login.
 * Clínica e tipos de atendimento entram depois pelo sistema.
 *
 * Uso: OWNER_PASSWORD no .env → pnpm db:seed
 */
import { config } from "dotenv";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { users } from "../src/db/schema";

config({ path: ".env" });

const OWNER_EMAIL = "fisiogeoms@gmail.com";
const OWNER_NAME = "Geovane Michael da Silva";

async function main() {
	const url = process.env.DATABASE_URL;
	if (!url) throw new Error("DATABASE_URL is not set");

	const password = process.env.OWNER_PASSWORD;
	if (!password || password.length < 8) {
		throw new Error(
			"Defina OWNER_PASSWORD (mín. 8 caracteres) no .env ou no comando"
		);
	}

	const db = drizzle(neon(url), { schema: { users } });

	const [existing] = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.email, OWNER_EMAIL))
		.limit(1);

	if (existing) {
		console.log("Owner já existe:", OWNER_EMAIL);
		return;
	}

	const [user] = await db
		.insert(users)
		.values({
			email: OWNER_EMAIL,
			passwordHash: await hash(password, 12),
			fullName: OWNER_NAME,
			role: "owner"
		})
		.returning({ id: users.id, email: users.email });

	console.log("Seed OK — owner:", user.email, user.id);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
