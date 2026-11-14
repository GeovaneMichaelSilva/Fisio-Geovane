CREATE TYPE "public"."google_calendar_sync_log_status" AS ENUM('ok', 'error', 'ignored');

CREATE TABLE "google_calendar_sync_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"subscription_id" uuid,
	"source" text NOT NULL,
	"status" "google_calendar_sync_log_status" NOT NULL,
	"detail" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "google_calendar_sync_logs"
	ADD CONSTRAINT "google_calendar_sync_logs_clinic_id_clinics_id_fk"
	FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "google_calendar_sync_logs"
	ADD CONSTRAINT "google_calendar_sync_logs_subscription_id_google_calendar_subscriptions_id_fk"
	FOREIGN KEY ("subscription_id") REFERENCES "public"."google_calendar_subscriptions"("id") ON DELETE set null ON UPDATE no action;

CREATE INDEX "google_calendar_sync_logs_clinic_created_idx"
	ON "google_calendar_sync_logs" ("clinic_id", "created_at");
