import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env" });

async function main() {
	const url = process.env.DATABASE_URL;
	if (!url) throw new Error("DATABASE_URL missing");
	const sql = neon(url);

	await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS google_event_id text`;

	await sql`
		CREATE TABLE IF NOT EXISTS google_calendar_connections (
			id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
			clinic_id uuid NOT NULL UNIQUE REFERENCES clinics(id) ON DELETE CASCADE,
			connected_by_user_id uuid NOT NULL REFERENCES users(id),
			google_account_email text NOT NULL,
			refresh_token_encrypted text NOT NULL,
			access_token_encrypted text,
			access_token_expires_at timestamptz,
			calendar_id text DEFAULT 'primary' NOT NULL,
			connected_at timestamptz DEFAULT now() NOT NULL,
			updated_at timestamptz DEFAULT now() NOT NULL
		)
	`;

	console.log("schema google calendar applied");
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
