# Arquitetura — Next.js + NextAuth + Neon + Vercel

## Stack confirmada

| Camada | Tecnologia |
|---|---|
| App | Next.js (App Router) + TypeScript |
| UI | Tailwind CSS + shadcn/ui (padrão Hub) |
| Forms | React Hook Form + Zod |
| Server state | TanStack Query |
| Auth | **NextAuth (Auth.js v5)** — credentials + JWT |
| DB | **Neon PostgreSQL** via Drizzle ORM |
| E-mail | Resend (recuperação de senha) |
| Hosting | Vercel |
| Domínio | `app.fisiogeovane.com.br` (app); root “em breve” |
| Ambientes | **local + prod** |

```text
[DECISÃO — 2026-10-02, atualizado]
Auth = NextAuth Credentials (sem Supabase Auth / Neon Auth).
DB = Neon (integração Vercel).
Recuperação de senha: token próprio + Resend.
Autorização na application layer (sem RLS auth.uid()).
```

---

## Separação de áreas (rotas)

```text
/                     → “Em breve”
/login                → NextAuth credentials
/forgot-password      → pede reset (Resend)
/update-password      → define nova senha (?token=)
/admin/*              → sistema interno (protegido)
/api/auth/[...nextauth]
/api/auth/forgot-password
/api/auth/reset-password
```

---

## Estrutura relevante

```text
src/
  auth.ts                 # NextAuth config
  middleware.ts           # gate /admin
  db/
    index.ts              # drizzle + neon-http
    schema.ts
  lib/auth/password-reset.ts
  app/api/auth/...
drizzle/                  # SQL de referência / migrations
scripts/seed.ts
```

---

## Autenticação e proteção

```text
[DECISÃO ARQUITETURAL]
1. Login e-mail/senha via NextAuth Credentials
2. Sessão JWT (cookie Auth.js), 30 dias
3. middleware: /admin sem sessão → /login
4. Password reset: password_reset_tokens + Resend
5. Autorização por membership (clinic_members) na app — sem RLS
```

---

## Variáveis de ambiente

### Obrigatórias no app

| Variável | Uso |
|---|---|
| `DATABASE_URL` | Neon pooled — queries do app |
| `DATABASE_URL_UNPOOLED` | Migrations (`drizzle-kit`) |
| `AUTH_SECRET` | Assinatura JWT NextAuth |
| `NEXT_PUBLIC_APP_URL` | Links de e-mail / app |
| `RESEND_API_KEY` | Envio de recovery |
| `EMAIL_FROM` | `nao-responda@fisiogeovane.com.br` |

### Injetadas pela Vercel/Neon (não usadas no código)

`PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `POSTGRES_*` — aliases da mesma conexão para templates/Prisma. Podemos ignorar se `DATABASE_URL` estiver setada.

---

## Deploy / DB

```bash
pnpm db:push    # aplica schema Drizzle no Neon
OWNER_PASSWORD='...' pnpm db:seed
```

Não rodar seed automaticamente em produção.
