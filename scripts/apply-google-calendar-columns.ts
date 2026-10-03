import "dotenv/config";
import { neon } from "@neondatabase/serverless";

async function main() {
	const url = process.env.DATABASE_URL;
	if (!url) throw new Error("DATABASE_URL is not set");
	const sql = neon(url);
	await sql`ALTER TABLE service_types ADD COLUMN IF NOT EXISTS google_calendar_id text`;
	await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS google_calendar_id text`;
	console.log("google_calendar_id columns applied.");
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
