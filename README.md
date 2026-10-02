# fisio-geovane

Sistema de gestão de atendimentos — **Geovane Michael da Silva**.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4 + componentes no padrão do Hub
- **NextAuth (Auth.js v5)** + **Neon PostgreSQL** (Drizzle)
- TanStack Query · React Hook Form · Zod · Resend
- Deploy: Vercel (`www.fisiogeovane.com.br`)

## Começar

1. Copie as variáveis do Neon na Vercel para o `.env` local (`DATABASE_URL` e `DATABASE_URL_UNPOOLED` bastam para o DB).
2. Confirme `AUTH_SECRET` (já pode gerar com `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`).

```bash
cp .env.example .env
# cole DATABASE_URL / DATABASE_URL_UNPOOLED da Vercel

pnpm install
pnpm db:push
OWNER_PASSWORD='sua-senha-forte' pnpm db:seed
pnpm dev
```

- Público “Em breve”: http://localhost:3000
- Login: http://localhost:3000/login
- Admin: http://localhost:3000/admin

## Scripts

| Comando | Uso |
|---|---|
| `pnpm dev` | Dev server (Turbopack) |
| `pnpm build` | Build produção |
| `pnpm lint` | ESLint |
| `pnpm db:push` | Aplica schema no Neon |
| `pnpm db:seed` | Cria owner + clínica + tipos |
| `pnpm db:studio` | Drizzle Studio |

## Env (resumo)

| Variável | Precisa? |
|---|---|
| `DATABASE_URL` | Sim — app |
| `DATABASE_URL_UNPOOLED` | Sim — migrations |
| `AUTH_SECRET` | Sim |
| `RESEND_API_KEY` / `EMAIL_FROM` | Recovery |
| `PG*` / `POSTGRES_*` | Não (aliases da integração Vercel) |

## Documentação

Ver [`docs/README.md`](./docs/README.md).
