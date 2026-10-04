# Documentação — Fisio Geovane

Setup e scripts: ver o [`README.md`](../README.md) na raiz.

## Fatos do produto

| Item | Valor |
|---|---|
| Marca | Geovane Michael da Silva |
| Crefito | 549225-F |
| Domínio | `www.fisiogeovane.com.br` |
| Owner (seed) | `fisiogeoms@gmail.com` |
| Auth | NextAuth (e-mail/senha) + recuperação via Resend |
| From e-mail | `nao-responda@fisiogeovane.com.br` |
| Idioma | pt-BR |
| Stack | Next.js · Neon/Drizzle · TanStack Query · Zod |

## Identidade visual

- [`design/brand.md`](./design/brand.md) — logos e dados profissionais
- [`design/colors.md`](./design/colors.md) — paleta (green / gold / sand / paper)

Tokens CSS vivem em `src/styles/variables.css`. Fonte da verdade do schema: `src/db/schema.ts`.

## Backlog (não bloqueante)

- Landing no lugar do “Em breve”
- Despesas (CRUD; hoje placeholder em financeiro)
- WhatsApp / lembretes
- Área do paciente (`/client`)
- Ficha vestibular estruturada
- NFS-e automática
- 2FA / staging
