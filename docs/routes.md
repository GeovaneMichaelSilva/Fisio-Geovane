# Mapa de telas — MVP

Todas as rotas abaixo são **área administrativa** (`/admin`), acesso: fisioterapeuta autenticado.

---

## `/admin`

**Finalidade:** Hub inicial (equivalente à home do protótipo).

**Dados:** atalhos; opcionalmente resumo do dia (próximos atendimentos — `[PROPOSTA]`).

**Ações:** navegar para Agenda, Pacientes, Financeiro, Atendimentos.

**Entidades:** —  

**Estados:** loading da sessão; empty se clínica sem dados.

---

## `/admin/agenda`

**Finalidade:** Agenda semanal + criar/abrir agendamentos.

**Dados exibidos:**
- semana corrente (seg–dom)
- eventos: hora, paciente, tipo, status

**Ações:**
- navegar semanas / hoje
- criar agendamento (dia ou botão)
- abrir sessão
- iniciar atendimento clínico (status scheduled)

**Entidades:** `sessions`, `patients`

**Dependências:** ao menos 1 paciente para salvar agendamento

**Estados:** empty week; conflito de horário; read-only vs edit

---

## `/admin/patients`

**Finalidade:** Listar e buscar pacientes.

**Dados:** nome, tipo preferencial, telefone

**Ações:** buscar; abrir; criar; atalho agendar

**Entidades:** `patients`

**Estados:** empty list; no search results

---

## `/admin/patients/new`

**Finalidade:** Cadastro de paciente.

**Dados / campos:** ver `data-model.md` → patients

**Ações:** salvar → redirect para detalhe

---

## `/admin/patients/[patientId]`

**Finalidade:** Cadastro + histórico (como card detalhe do protótipo).

**Dados:**
- formulário completo
- contagem de realizados
- valor pendente (derivado)
- tabela de sessões do paciente

**Ações:** salvar cadastro; agendar; abrir sessão; (arquivar — `[PROPOSTA]`)

**Entidades:** `patients`, `sessions`

---

## `/admin/records`

**Finalidade:** Atendimentos realizados (lista global + busca).

**Dados:** sessões `completed` (data, paciente, valor, pago, NFS-e)

**Ações:** buscar por nome; abrir detalhe

**Entidades:** `sessions`, `patients`

---

## `/admin/sessions/[sessionId]`

**Finalidade:** Detalhe unificado de agendamento / clínico / pagamento.

**Dados:** todos os campos da sessão + painel de auditoria + histórico anterior do paciente

**Ações:**
- editar (exige motivo)
- iniciar (se scheduled) → foco clínico
- marcar completed (exige evolução)
- exportar PDF do paciente
- agendar retorno
- abrir cadastro do paciente
- salvar pagamento

**Entidades:** `sessions`, `session_audits`, `patients`

**Estados:** view vs edit; validation errors; audit empty

```text
[PROPOSTA]
Uma rota de detalhe unifica `clinical` + formulário de agenda + financialForm
do protótipo, reduzindo telas duplicadas. Query `?mode=clinical|finance` opcional.
```

---

## `/admin/finance`

**Finalidade:** KPIs + lista financeira.

**Dados:**
- total recebido
- a receber (completed unpaid)
- qtd realizados
- tabela de sessões

**Ações:** abrir sessão para editar pagamento

**Entidades:** `sessions` (+ view summary)

**Link:** Despesas (placeholder)

---

## `/admin/finance/expenses`

**Finalidade:** Placeholder — controle de despesas **não** no MVP.

**UI:** página “Em breve” explicando que despesas/caixa virão depois.

```text
[DECISÃO — 2026-10-02]
Existe no produto como lembrete de roadmap, sem CRUD.
```

---

## `/admin/settings`

**Finalidade:** dados da clínica (Geovane Michael da Silva, Crefito 549225-F).

**Ações:** salvar settings

---

## `/admin/settings/service-types`

**Finalidade:** cadastro de tipos de atendimento (nome, duração padrão, valor padrão, ativo).

**Seed:** Vestibular 220 / Ortopédico 220 / Domiciliar 280

**Entidades:** `service_types`

---

## `/admin/settings/integrations`

**Finalidade:** Placeholder de integrações.

**Itens:** Google Agenda — “Em breve” (prioridade alta pós-MVP); WhatsApp/lembretes — futuro.

---

## `/login`

**Finalidade:** e-mail/senha (NextAuth) + link “esqueci a senha”.

**Quem acessa:** não autenticado

---

## Fora do MVP (reservar / futuro)

| Rota | Notas |
|---|---|
| `/` (`fisiogeovane.com.br`) | Landing / redirect — a definir |
| `/client/*` | Portal do paciente — não especificar agora |
| Google Agenda real | pós-MVP |
| Despesas CRUD | substitui o placeholder |
