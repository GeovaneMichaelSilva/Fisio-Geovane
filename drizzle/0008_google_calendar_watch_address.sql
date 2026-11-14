ALTER TABLE "google_calendar_subscriptions"
	ADD COLUMN IF NOT EXISTS "watch_address" text;
