import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env" });

/**
 * Migrations usam a URL sem pgbouncer (UNPOOLED).
 * Fallback para DATABASE_URL se UNPOOLED não existir.
 */
const connectionString =
	process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error(
		"Defina DATABASE_URL_UNPOOLED (preferencial) ou DATABASE_URL"
	);
}

export default defineConfig({
	schema: "./src/db/schema.ts",
	out: "./drizzle",
	dialect: "postgresql",
	dbCredentials: {
		url: connectionString
	},
	strict: true,
	verbose: true
});
