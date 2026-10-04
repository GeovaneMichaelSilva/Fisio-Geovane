/**
 * Seed: owner + clínica + 3 tipos de atendimento.
 *
 * Uso: OWNER_PASSWORD no .env → pnpm db:seed
 */
import { config } from "dotenv";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import {
	clinicMembers,
	clinics,
	serviceTypes,
	users
} from "../src/db/schema";
import {
	DEFAULT_CLINIC,
	DEFAULT_SERVICE_TYPES
} from "../src/lib/clinic/defaults";
import { passwordSchema } from "../src/lib/auth/password";

config({ path: ".env" });

const OWNER_EMAIL = "fisiogeoms@gmail.com";
const OWNER_NAME = "Geovane Michael da Silva";

async function main() {
	const url = process.env.DATABASE_URL;
	if (!url) throw new Error("DATABASE_URL is not set");

	const db = drizzle(neon(url), {
		schema: { users, clinics, clinicMembers, serviceTypes }
	});

	let [user] = await db
		.select()
		.from(users)
		.where(eq(users.email, OWNER_EMAIL))
		.limit(1);

	if (!user) {
		const parsedPassword = passwordSchema.safeParse(
			process.env.OWNER_PASSWORD ?? ""
		);
		if (!parsedPassword.success) {
			throw new Error(
				`Defina OWNER_PASSWORD no .env: ${parsedPassword.error.issues[0]?.message ?? "senha inválida"}`
			);
		}
		const password = parsedPassword.data;

		[user] = await db
			.insert(users)
			.values({
				email: OWNER_EMAIL,
				passwordHash: await hash(password, 12),
				fullName: OWNER_NAME,
				role: "owner"
			})
			.returning();
		console.log("Owner criado:", user.email);
	} else {
		console.log("Owner já existe:", user.email);
	}

	let [clinic] = await db
		.select()
		.from(clinics)
		.where(eq(clinics.ownerUserId, user.id))
		.limit(1);

	if (!clinic) {
		[clinic] = await db
			.insert(clinics)
			.values({
				ownerUserId: user.id,
				displayName: DEFAULT_CLINIC.displayName,
				professionLabel: DEFAULT_CLINIC.professionLabel,
				licenseNumber: DEFAULT_CLINIC.licenseNumber,
				timezone: DEFAULT_CLINIC.timezone,
				defaultSessionDurationMinutes:
					DEFAULT_CLINIC.defaultSessionDurationMinutes
			})
			.returning();
		console.log("Clínica criada:", clinic.displayName);
	} else {
		console.log("Clínica já existe:", clinic.displayName);
	}

	await db
		.insert(clinicMembers)
		.values({ clinicId: clinic.id, userId: user.id, role: "owner" })
		.onConflictDoNothing();

	const existingTypes = await db
		.select({ id: serviceTypes.id })
		.from(serviceTypes)
		.where(eq(serviceTypes.clinicId, clinic.id))
		.limit(1);

	if (existingTypes.length === 0) {
		await db.insert(serviceTypes).values(
			DEFAULT_SERVICE_TYPES.map((t) => ({
				clinicId: clinic.id,
				name: t.name,
				slug: t.slug,
				defaultDurationMinutes: t.defaultDurationMinutes,
				defaultValueBrl: t.defaultValueBrl,
				sortOrder: t.sortOrder,
				isActive: true
			}))
		);
		console.log("Tipos seed:", DEFAULT_SERVICE_TYPES.map((t) => t.name).join(", "));
	} else {
		console.log("Tipos de atendimento já existem.");
	}

	console.log("Seed OK.");
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
