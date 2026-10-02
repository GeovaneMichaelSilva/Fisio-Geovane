# Banco de dados — Neon PostgreSQL + Drizzle

## Visão

```text
[DECISÃO ARQUITETURAL]
- Neon (PostgreSQL) como fonte de verdade
- Auth via NextAuth; usuários em public.users (password_hash)
- Sem auth.users do Supabase
- Sem RLS: autorização na application layer (clinic_members)
- UUID + timestamptz
- Drizzle ORM + @neondatabase/serverless (HTTP/pooled)
```

---

## Env

| Variável | Quando |
|---|---|
| `DATABASE_URL` | Runtime (pooled / pgbouncer) |
| `DATABASE_URL_UNPOOLED` | `drizzle-kit push` / migrate |

---

## Enums

```sql
create type public.user_role as enum ('owner', 'staff');
create type public.session_status as enum ('scheduled', 'completed', 'canceled', 'no_show');
```

`service_types` é tabela (não enum).

---

## Tabelas

Fonte tipada: `src/db/schema.ts`  
SQL de referência: `drizzle/0000_initial.sql`

Principais:

- `users` — id, email, password_hash, full_name, role
- `password_reset_tokens` — recovery
- `clinics`, `clinic_members`
- `service_types`, `patients`, `sessions`, `session_audits`

`users` substitui o antigo `profiles` + `auth.users`.

---

## Autorização (sem RLS)

```text
[DECISÃO ARQUITETURAL]
Com NextAuth + Neon não há auth.uid() no Postgres.
Server Actions / queries filtram por clinic_id do membership do user logado.
```

---

## Seed

```bash
OWNER_PASSWORD='senha-forte' pnpm db:seed
```

Cria owner `fisiogeoms@gmail.com`, clínica e 3 tipos (Vestibular/Ortopédico/Domiciliar).

---

## Comandos

| Comando | Uso |
|---|---|
| `pnpm db:push` | Sincroniza schema → Neon |
| `pnpm db:studio` | Drizzle Studio |
| `pnpm db:seed` | Owner + clínica + tipos |
