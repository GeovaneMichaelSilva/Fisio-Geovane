# Pontos em aberto

As rodadas 1–22 e A–E foram fechadas em [`decisions.md`](./decisions.md).

---

## Ainda aberto (só detalhes finos na implementação)

Nada bloqueante de produto. Na hora de implementar:

1. Senha inicial do owner em prod (`OWNER_PASSWORD=... pnpm db:seed` — **não** versionar senha no git)

**From de e-mail:** `nao-responda@fisiogeovane.com.br` (fechado).

---

## Explicitamente adiado

- Secretária / UI de permissões (schema preparado)
- Google Agenda (placeholder)
- Despesas CRUD (placeholder)
- WhatsApp / lembretes
- LGPD formal
- `/client`
- Ficha vestibular estruturada
- NFS-e automática
- Landing completa (root fica “Em breve”)
- Staging
- 2FA

---

## Já decidido (resumo)

| Tema | Decisão |
|---|---|
| Marca | Geovane Michael da Silva · Crefito 549225-F |
| Domínios | Um host: `www.fisiogeovane.com.br` (`/` Em breve; `/admin` app) |
| Owner | `fisiogeoms@gmail.com` |
| Auth | NextAuth · Neon · e-mail/senha · Resend recovery |
| Multi-user | Capacidade no schema; sem secretária agora |
| Tipos | Cadastro; seed Vestibular/Ortopédico/Domiciliar |
| Ambientes | local + prod |
| Idioma | pt-BR |
