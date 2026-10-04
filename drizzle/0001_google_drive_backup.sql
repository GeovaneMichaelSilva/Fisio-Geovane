CREATE TYPE "public"."backup_run_status" AS ENUM('success', 'error');

CREATE TABLE "google_drive_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"connected_by_user_id" uuid NOT NULL,
	"google_account_email" text NOT NULL,
	"refresh_token_encrypted" text NOT NULL,
	"access_token_encrypted" text,
	"access_token_expires_at" timestamp with time zone,
	"folder_id" text,
	"connected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "google_drive_connections"
	ADD CONSTRAINT "google_drive_connections_clinic_id_clinics_id_fk"
	FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "google_drive_connections"
	ADD CONSTRAINT "google_drive_connections_connected_by_user_id_users_id_fk"
	FOREIGN KEY ("connected_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "google_drive_connections"
	ADD CONSTRAINT "google_drive_connections_clinic_id_unique" UNIQUE("clinic_id");

CREATE TABLE "backup_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"status" "backup_run_status" NOT NULL,
	"trigger" text DEFAULT 'manual' NOT NULL,
	"drive_file_id" text,
	"file_name" text,
	"bytes" integer,
	"error_message" text,
	"deleted_old_files" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "backup_runs"
	ADD CONSTRAINT "backup_runs_clinic_id_clinics_id_fk"
	FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "backup_runs_clinic_created_idx"
	ON "backup_runs" ("clinic_id", "created_at");
