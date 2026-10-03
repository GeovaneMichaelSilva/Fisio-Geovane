-- Colunas para mapeamento Tipo → agenda Google e vínculo do evento na sessão.
-- Rode se `pnpm db:push` não estiver disponível no ambiente.

ALTER TABLE service_types
  ADD COLUMN IF NOT EXISTS google_calendar_id text;

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS google_calendar_id text;
