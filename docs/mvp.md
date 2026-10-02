# MVP / Pós-MVP / Futuro

Alinhado a [`decisions.md`](./decisions.md) (respostas 2026-10-02).

---

## MVP — primeira versão real (`/admin` em `www.fisiogeovane.com.br`)

1. **NextAuth** — e-mail/senha + recuperação via Resend
2. **Pacientes** — CRUD + busca + **arquivar**
3. **Cadastro de tipos de atendimento** — nome, ativo, duração padrão, valor padrão (seed: Vestibular 220 / Ortopédico 220 / Domiciliar 280)
4. **Agenda semanal** — criar/abrir; duração default 50; overlap com **override**
5. **Sessões** — status Agendado/Realizado/Cancelado/Faltou; valor editável (pré-preenchido do tipo)
6. **Fluxo clínico** — assessment / evolution / activities (texto livre); concluir exige evolução
7. **INICIAR** — agenda → clínico
8. **Financeiro básico** — KPIs + pago/data/NFS-e (flag)
9. **Placeholder Despesas** — página “Em breve” em financeiro
10. **Auditoria** — motivo obrigatório; append-only; sem exclusão
11. **Export PDF** — histórico do paciente (nome completo + Crefito)
12. **Settings** — dados da clínica (Geovane Michael da Silva, Crefito 549225-F)
13. **Placeholder Integrações** — Google Agenda “Em breve” (alta prioridade pós-MVP)
14. **Empty/loading/error** básicos
15. **Schema Neon + Drizzle** — roles `owner`/`staff` no modelo; **MVP single-user** (sem UI de equipe); authz na app
16. **`/`** — página “Em breve” (mesmo host)
17. **Password recovery** — Resend · from `nao-responda@fisiogeovane.com.br`

### Critério de pronto

Owner autentica → cadastra paciente → agenda → atende → registra evolução → marca pagamento/NFS-e → exporta PDF, em local e em prod.

---

## Pós-MVP (ordem sugerida)

1. **Google Agenda** — prioridade alta
2. Multi-usuário / secretária (UI + permissões) — quando precisar
3. Filtros financeiros por período
4. Validação CPF
5. Melhorias de busca/paginação
6. Landing no lugar do “Em breve”

---

## Futuro (anotado, sem implementar)

- Despesas / caixa (UI já terá placeholder)
- WhatsApp / lembretes
- LGPD formal
- `/client`
- Ficha vestibular estruturada
- NFS-e automática
- Landing + SEO em `fisiogeovane.com.br`
- Staging
- 2FA
- Biblioteca de exercícios

---

## Ordem de implementação sugerida

```text
1. Scaffold Next.js + shadcn + NextAuth + middleware /admin
2. Schema Neon (users, clinics, service_types, patients, sessions, session_audits)
3. Settings + service_types
4. Patients (archive)
5. Agenda + sessions + overlap override
6. Clinical + audit append-only
7. Finance KPIs + flags + placeholder despesas
8. PDF
9. Placeholders integrações (Google Agenda)
10. Password recovery (e-mail provider)
```
