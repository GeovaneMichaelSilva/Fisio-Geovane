# Fluxos principais

Fluxos identificados no protótipo e adaptados às rotas propostas.

---

## 1. Login → área de trabalho

```text
[DECISÃO ARQUITETURAL — protótipo não tinha login]

/login
  ↓ autentica
/admin (hub)
  ↓ escolhe módulo
agenda | patients | finance | records
```

---

## 2. Cadastrar paciente e agendar

```text
[PROTÓTIPO]

Home → CADASTRAR PACIENTE
  ↓
Lista pacientes → + Novo paciente
  ↓ preenche formulário
Salvar cadastro
  ↓
Agendar atendimento / AGENDAR
  ↓
Agenda (novo agendamento com patientId pré-selecionado)
  ↓
Salvar atendimento (status Agendado)
```

---

## 3. Realizar atendimento clínico

```text
[PROTÓTIPO]

Agenda → abrir sessão Agendada
  ↓
INICIAR
  ↓
Avaliação e evolução (clinical)
  ↓ preenche assessment / evolution / activities
Salvar (status → Realizado; exige evolution)
  ↓
Registro em somente leitura
  ↓ opcional
EXPORTAR PDF (todos os realizados do paciente)
```

---

## 4. Consultar histórico e editar

```text
[PROTÓTIPO]

Atendimentos realizados → buscar paciente → Abrir
  ↓
Visualizar (read-only) + histórico anterior (details)
  ↓
Editar atendimento → motivo obrigatório
  ↓
Salvar → audit trail atualizado
```

---

## 5. Financeiro / pagamento

```text
[PROTÓTIPO]

Financeiro → Abrir sessão
  ↓
Editar → valor / pago / data pagamento / NFS-e + motivo
  ↓
Salvar pagamento
  ↓
KPIs recalculados (derivados)
```

**Regra:** `paid=Sim` exige `paymentDate`.

---

## 6. Agendar retorno

```text
[PROTÓTIPO]

Em qualquer detalhe de sessão → Agendar retorno
  ↓
Agenda com patientId selecionado + formulário novo
```

---

## 7. Conflito de horário

```text
[PROTÓTIPO]

Salvar sessão
  ↓ detecta overlap (exceto Cancelado/Faltou)
confirm("Existe sobreposição... Salvar mesmo assim?")
  ↓ sim → persiste / não → aborta
```

---

## 8. Backup (protótipo) → equivalente MVP

```text
[PROTÓTIPO]
Backup → Exportar JSON / Restaurar JSON (destrutivo)

[PROPOSTA MVP]
Settings → Exportar JSON (download)
Restore apenas em ambiente admin avançado / suporte
Dados vivos ficam no Postgres (backup automático do Supabase)
```

---

## Diagrama resumido do dia a dia

```text
Login
  ↓
Admin hub
  ↓
Agenda do dia/semana
  ↓
Selecionar paciente / agendamento
  ↓
INICIAR atendimento
  ↓
Registrar avaliação + evolução + atividades
  ↓
Concluir (Realizado)
  ↓
(opcional) Registrar pagamento / NFS-e
  ↓
(opcional) Exportar PDF do histórico
```
