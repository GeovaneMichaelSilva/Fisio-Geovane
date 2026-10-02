-- Initial schema — Fisio Geovane (Neon / PostgreSQL)
-- Aplicar: pnpm db:migrate  ou  drizzle-kit push

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "public"."user_role" AS ENUM('owner', 'staff');
CREATE TYPE "public"."session_status" AS ENUM('scheduled', 'completed', 'canceled', 'no_show');

CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL UNIQUE,
	"password_hash" text NOT NULL,
	"full_name" text NOT NULL,
	"role" "user_role" DEFAULT 'owner' NOT NULL,
	"created_at" timestamptz DEFAULT now() NOT NULL,
	"updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"token_hash" text NOT NULL UNIQUE,
	"expires_at" timestamptz NOT NULL,
	"used_at" timestamptz,
	"created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE "clinics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL REFERENCES "users"("id"),
	"display_name" text NOT NULL,
	"profession_label" text DEFAULT 'Fisioterapeuta' NOT NULL,
	"license_number" text,
	"timezone" text DEFAULT 'America/Sao_Paulo' NOT NULL,
	"default_session_duration_minutes" integer DEFAULT 50 NOT NULL,
	"created_at" timestamptz DEFAULT now() NOT NULL,
	"updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE "clinic_members" (
	"clinic_id" uuid NOT NULL REFERENCES "clinics"("id") ON DELETE CASCADE,
	"user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"role" "user_role" DEFAULT 'owner' NOT NULL,
	PRIMARY KEY ("clinic_id", "user_id")
);

CREATE TABLE "service_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL REFERENCES "clinics"("id") ON DELETE CASCADE,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"default_duration_minutes" integer DEFAULT 50 NOT NULL,
	"default_value_brl" numeric(10, 2) DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamptz DEFAULT now() NOT NULL,
	"updated_at" timestamptz DEFAULT now() NOT NULL,
	UNIQUE ("clinic_id", "slug"),
	CONSTRAINT "service_types_duration_check" CHECK ("default_duration_minutes" BETWEEN 5 AND 480),
	CONSTRAINT "service_types_value_check" CHECK ("default_value_brl" >= 0)
);

CREATE TABLE "patients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL REFERENCES "clinics"("id") ON DELETE CASCADE,
	"full_name" text NOT NULL,
	"phone" text,
	"cpf" text,
	"birth_date" date,
	"weight_kg" numeric(5, 2),
	"height_cm" numeric(5, 2),
	"preferred_service_type_id" uuid NOT NULL REFERENCES "service_types"("id"),
	"address_street" text,
	"address_number" text,
	"address_neighborhood" text,
	"address_city" text,
	"address_zip" text,
	"notes" text,
	"archived_at" timestamptz,
	"created_by" uuid REFERENCES "users"("id"),
	"created_at" timestamptz DEFAULT now() NOT NULL,
	"updated_at" timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT "patients_name_check" CHECK (char_length(trim("full_name")) > 0),
	CONSTRAINT "patients_weight_check" CHECK ("weight_kg" IS NULL OR ("weight_kg" >= 1 AND "weight_kg" <= 500)),
	CONSTRAINT "patients_height_check" CHECK ("height_cm" IS NULL OR ("height_cm" >= 30 AND "height_cm" <= 250))
);

CREATE INDEX "patients_clinic_name_idx" ON "patients" ("clinic_id", "full_name");
CREATE INDEX "patients_clinic_active_idx" ON "patients" ("clinic_id") WHERE "archived_at" IS NULL;
CREATE UNIQUE INDEX "patients_clinic_cpf_uidx" ON "patients" ("clinic_id", "cpf")
	WHERE "cpf" IS NOT NULL AND "archived_at" IS NULL;

CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL REFERENCES "clinics"("id") ON DELETE CASCADE,
	"patient_id" uuid NOT NULL REFERENCES "patients"("id"),
	"scheduled_date" date NOT NULL,
	"scheduled_time" time NOT NULL,
	"duration_minutes" integer DEFAULT 50 NOT NULL,
	"service_type_id" uuid NOT NULL REFERENCES "service_types"("id"),
	"status" "session_status" DEFAULT 'scheduled' NOT NULL,
	"value_brl" numeric(10, 2) DEFAULT '0' NOT NULL,
	"paid" boolean DEFAULT false NOT NULL,
	"paid_at" date,
	"invoice_issued" boolean DEFAULT false NOT NULL,
	"assessment" text,
	"evolution" text,
	"activities" text,
	"created_by" uuid REFERENCES "users"("id"),
	"updated_by" uuid REFERENCES "users"("id"),
	"created_at" timestamptz DEFAULT now() NOT NULL,
	"updated_at" timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_duration_check" CHECK ("duration_minutes" BETWEEN 5 AND 480),
	CONSTRAINT "sessions_value_check" CHECK ("value_brl" >= 0),
	CONSTRAINT "sessions_paid_requires_date" CHECK ("paid" = false OR "paid_at" IS NOT NULL),
	CONSTRAINT "sessions_completed_requires_evolution" CHECK (
		"status" <> 'completed'
		OR ("evolution" IS NOT NULL AND length(trim("evolution")) > 0)
	)
);

CREATE INDEX "sessions_clinic_date_idx" ON "sessions" ("clinic_id", "scheduled_date", "scheduled_time");
CREATE INDEX "sessions_patient_idx" ON "sessions" ("patient_id", "scheduled_date" DESC);
CREATE INDEX "sessions_status_idx" ON "sessions" ("clinic_id", "status");
CREATE INDEX "sessions_unpaid_completed_idx" ON "sessions" ("clinic_id")
	WHERE "status" = 'completed' AND "paid" = false;

CREATE TABLE "session_audits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL REFERENCES "clinics"("id") ON DELETE CASCADE,
	"session_id" uuid NOT NULL REFERENCES "sessions"("id") ON DELETE CASCADE,
	"edited_at" timestamptz DEFAULT now() NOT NULL,
	"edited_by" uuid REFERENCES "users"("id"),
	"reason" text NOT NULL,
	"before_state" jsonb NOT NULL,
	"after_state" jsonb,
	CONSTRAINT "session_audits_reason_check" CHECK (char_length(trim("reason")) > 0)
);

CREATE INDEX "session_audits_session_idx" ON "session_audits" ("session_id", "edited_at" DESC);
