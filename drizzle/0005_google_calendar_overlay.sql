CREATE TABLE "google_calendar_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"google_calendar_id" text NOT NULL,
	"label" text NOT NULL,
	"channel_token" text NOT NULL,
	"sync_token" text,
	"watch_channel_id" text,
	"watch_resource_id" text,
	"watch_expiration" timestamp with time zone,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "google_calendar_subscriptions"
	ADD CONSTRAINT "google_calendar_subscriptions_clinic_id_clinics_id_fk"
	FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "google_calendar_subscriptions"
	ADD CONSTRAINT "google_calendar_subscriptions_clinic_id_google_calendar_id_unique"
	UNIQUE("clinic_id", "google_calendar_id");

CREATE INDEX "google_calendar_subscriptions_clinic_idx"
	ON "google_calendar_subscriptions" ("clinic_id");

CREATE INDEX "google_calendar_subscriptions_channel_idx"
	ON "google_calendar_subscriptions" ("watch_channel_id");

CREATE TABLE "external_calendar_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"subscription_id" uuid NOT NULL,
	"google_calendar_id" text NOT NULL,
	"google_event_id" text NOT NULL,
	"summary" text,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"all_day" boolean DEFAULT false NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"etag" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "external_calendar_events"
	ADD CONSTRAINT "external_calendar_events_clinic_id_clinics_id_fk"
	FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "external_calendar_events"
	ADD CONSTRAINT "external_calendar_events_subscription_id_google_calendar_subscriptions_id_fk"
	FOREIGN KEY ("subscription_id") REFERENCES "public"."google_calendar_subscriptions"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "external_calendar_events"
	ADD CONSTRAINT "external_calendar_events_clinic_id_google_calendar_id_google_event_id_unique"
	UNIQUE("clinic_id", "google_calendar_id", "google_event_id");

CREATE INDEX "external_calendar_events_clinic_range_idx"
	ON "external_calendar_events" ("clinic_id", "start_at", "end_at");

CREATE INDEX "external_calendar_events_subscription_idx"
	ON "external_calendar_events" ("subscription_id");
