-- Pagamentos parciais (MIGRAÇÃO ADITIVA — não apaga nem altera value_brl/paid/paid_at existentes)
--
-- Estratégia com dados reais:
-- 1) Só adiciona coluna amount_paid_brl + tabelas novas
-- 2) Backfill: pago → amount_paid = value; em aberto → 0
-- 3) Constraints só depois do backfill
-- 4) NÃO inventa linhas em "payments" para baixas antigas (evita histórico falso)
--
-- Aplicar no Neon (SQL Editor) ou: psql "$DATABASE_URL_UNPOOLED" -f drizzle/0002_partial_payments.sql
-- Antes: backup (Neon → Branches / export) se possível.

BEGIN;

-- Coluna nova (idempotente)
ALTER TABLE "sessions"
	ADD COLUMN IF NOT EXISTS "amount_paid_brl" numeric(10, 2);

-- Default temporário para linhas ainda null
UPDATE "sessions"
SET "amount_paid_brl" = 0
WHERE "amount_paid_brl" IS NULL;

-- Backfill a partir do estado atual (fonte de verdade hoje: paid + value_brl)
UPDATE "sessions"
SET "amount_paid_brl" = "value_brl"
WHERE "paid" = true;

UPDATE "sessions"
SET "amount_paid_brl" = 0
WHERE "paid" = false;

ALTER TABLE "sessions"
	ALTER COLUMN "amount_paid_brl" SET DEFAULT '0';

ALTER TABLE "sessions"
	ALTER COLUMN "amount_paid_brl" SET NOT NULL;

-- Constraints (só após backfill)
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'sessions_amount_paid_check'
	) THEN
		ALTER TABLE "sessions"
			ADD CONSTRAINT "sessions_amount_paid_check"
			CHECK ("amount_paid_brl" >= 0 AND "amount_paid_brl" <= "value_brl");
	END IF;
END $$;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'sessions_paid_matches_amount'
	) THEN
		ALTER TABLE "sessions"
			ADD CONSTRAINT "sessions_paid_matches_amount"
			CHECK (
				("paid" = true AND "amount_paid_brl" = "value_brl")
				OR ("paid" = false AND ("value_brl" = 0 OR "amount_paid_brl" < "value_brl"))
			);
	END IF;
END $$;

-- Enum + tabelas de ledger (só futuras baixas)
DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_origin') THEN
		CREATE TYPE "public"."payment_origin" AS ENUM('session', 'patient');
	END IF;
END $$;

CREATE TABLE IF NOT EXISTS "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"amount_brl" numeric(10, 2) NOT NULL,
	"paid_at" date NOT NULL,
	"origin" "public"."payment_origin" NOT NULL,
	"note" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'payments_clinic_id_clinics_id_fk'
	) THEN
		ALTER TABLE "payments"
			ADD CONSTRAINT "payments_clinic_id_clinics_id_fk"
			FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id")
			ON DELETE cascade ON UPDATE no action;
	END IF;
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'payments_patient_id_patients_id_fk'
	) THEN
		ALTER TABLE "payments"
			ADD CONSTRAINT "payments_patient_id_patients_id_fk"
			FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id")
			ON DELETE cascade ON UPDATE no action;
	END IF;
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'payments_created_by_users_id_fk'
	) THEN
		ALTER TABLE "payments"
			ADD CONSTRAINT "payments_created_by_users_id_fk"
			FOREIGN KEY ("created_by") REFERENCES "public"."users"("id")
			ON DELETE no action ON UPDATE no action;
	END IF;
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'payments_amount_check'
	) THEN
		ALTER TABLE "payments"
			ADD CONSTRAINT "payments_amount_check" CHECK ("amount_brl" > 0);
	END IF;
END $$;

CREATE INDEX IF NOT EXISTS "payments_patient_created_idx"
	ON "payments" ("patient_id", "created_at");

CREATE INDEX IF NOT EXISTS "payments_clinic_created_idx"
	ON "payments" ("clinic_id", "created_at");

CREATE TABLE IF NOT EXISTS "payment_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"amount_brl" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'payment_allocations_payment_id_payments_id_fk'
	) THEN
		ALTER TABLE "payment_allocations"
			ADD CONSTRAINT "payment_allocations_payment_id_payments_id_fk"
			FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id")
			ON DELETE cascade ON UPDATE no action;
	END IF;
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'payment_allocations_session_id_sessions_id_fk'
	) THEN
		ALTER TABLE "payment_allocations"
			ADD CONSTRAINT "payment_allocations_session_id_sessions_id_fk"
			FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id")
			ON DELETE cascade ON UPDATE no action;
	END IF;
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'payment_allocations_amount_check'
	) THEN
		ALTER TABLE "payment_allocations"
			ADD CONSTRAINT "payment_allocations_amount_check" CHECK ("amount_brl" > 0);
	END IF;
END $$;

CREATE INDEX IF NOT EXISTS "payment_allocations_payment_idx"
	ON "payment_allocations" ("payment_id");

CREATE INDEX IF NOT EXISTS "payment_allocations_session_idx"
	ON "payment_allocations" ("session_id");

COMMIT;
