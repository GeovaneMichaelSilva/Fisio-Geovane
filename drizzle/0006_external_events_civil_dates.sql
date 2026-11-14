-- All-day = datas civis; timed = timestamptz. End de all-day é exclusivo (Google).

ALTER TABLE "external_calendar_events"
	ADD COLUMN IF NOT EXISTS "start_date" date;

ALTER TABLE "external_calendar_events"
	ADD COLUMN IF NOT EXISTS "end_date" date;

ALTER TABLE "external_calendar_events"
	ALTER COLUMN "start_at" DROP NOT NULL;

ALTER TABLE "external_calendar_events"
	ALTER COLUMN "end_at" DROP NOT NULL;

UPDATE "external_calendar_events"
SET
	"start_date" = ("start_at" AT TIME ZONE 'UTC')::date,
	"end_date" = ("end_at" AT TIME ZONE 'UTC')::date,
	"start_at" = NULL,
	"end_at" = NULL
WHERE "all_day" = true
	AND "start_at" IS NOT NULL
	AND "end_at" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "external_calendar_events_clinic_date_range_idx"
	ON "external_calendar_events" ("clinic_id", "start_date", "end_date");

ALTER TABLE "external_calendar_events"
	DROP CONSTRAINT IF EXISTS "external_calendar_events_bounds_check";

ALTER TABLE "external_calendar_events"
	ADD CONSTRAINT "external_calendar_events_bounds_check" CHECK (
		(
			all_day = true
			AND start_date IS NOT NULL
			AND end_date IS NOT NULL
			AND start_at IS NULL
			AND end_at IS NULL
		)
		OR
		(
			all_day = false
			AND start_at IS NOT NULL
			AND end_at IS NOT NULL
			AND start_date IS NULL
			AND end_date IS NULL
		)
	);
