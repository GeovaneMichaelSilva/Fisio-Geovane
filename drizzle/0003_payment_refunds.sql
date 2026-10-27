-- Estornos de baixas (total ou parcial). Aditivo — não apaga payments/allocations.
-- Aplicar no Neon (SQL Editor) ou: psql "$DATABASE_URL_UNPOOLED" -f drizzle/0003_payment_refunds.sql

BEGIN;

CREATE TABLE IF NOT EXISTS "payment_refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"clinic_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"amount_brl" numeric(10, 2) NOT NULL,
	"note" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'payment_refunds_payment_id_payments_id_fk'
	) THEN
		ALTER TABLE "payment_refunds"
			ADD CONSTRAINT "payment_refunds_payment_id_payments_id_fk"
			FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id")
			ON DELETE cascade ON UPDATE no action;
	END IF;
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'payment_refunds_clinic_id_clinics_id_fk'
	) THEN
		ALTER TABLE "payment_refunds"
			ADD CONSTRAINT "payment_refunds_clinic_id_clinics_id_fk"
			FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id")
			ON DELETE cascade ON UPDATE no action;
	END IF;
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'payment_refunds_patient_id_patients_id_fk'
	) THEN
		ALTER TABLE "payment_refunds"
			ADD CONSTRAINT "payment_refunds_patient_id_patients_id_fk"
			FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id")
			ON DELETE cascade ON UPDATE no action;
	END IF;
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'payment_refunds_created_by_users_id_fk'
	) THEN
		ALTER TABLE "payment_refunds"
			ADD CONSTRAINT "payment_refunds_created_by_users_id_fk"
			FOREIGN KEY ("created_by") REFERENCES "public"."users"("id")
			ON DELETE no action ON UPDATE no action;
	END IF;
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'payment_refunds_amount_check'
	) THEN
		ALTER TABLE "payment_refunds"
			ADD CONSTRAINT "payment_refunds_amount_check" CHECK ("amount_brl" > 0);
	END IF;
END $$;

CREATE INDEX IF NOT EXISTS "payment_refunds_payment_idx"
	ON "payment_refunds" ("payment_id");

CREATE INDEX IF NOT EXISTS "payment_refunds_patient_created_idx"
	ON "payment_refunds" ("patient_id", "created_at");

CREATE TABLE IF NOT EXISTS "payment_refund_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"refund_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"amount_brl" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'payment_refund_allocations_refund_id_payment_refunds_id_fk'
	) THEN
		ALTER TABLE "payment_refund_allocations"
			ADD CONSTRAINT "payment_refund_allocations_refund_id_payment_refunds_id_fk"
			FOREIGN KEY ("refund_id") REFERENCES "public"."payment_refunds"("id")
			ON DELETE cascade ON UPDATE no action;
	END IF;
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'payment_refund_allocations_session_id_sessions_id_fk'
	) THEN
		ALTER TABLE "payment_refund_allocations"
			ADD CONSTRAINT "payment_refund_allocations_session_id_sessions_id_fk"
			FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id")
			ON DELETE cascade ON UPDATE no action;
	END IF;
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'payment_refund_allocations_amount_check'
	) THEN
		ALTER TABLE "payment_refund_allocations"
			ADD CONSTRAINT "payment_refund_allocations_amount_check" CHECK ("amount_brl" > 0);
	END IF;
END $$;

CREATE INDEX IF NOT EXISTS "payment_refund_allocations_refund_idx"
	ON "payment_refund_allocations" ("refund_id");

CREATE INDEX IF NOT EXISTS "payment_refund_allocations_session_idx"
	ON "payment_refund_allocations" ("session_id");

COMMIT;
