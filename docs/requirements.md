# Requisitos — extraídos do protótipo

Fonte: `fisio-prototipo-v09.html` (título: **Geovane • Gestão de atendimentos**, footer: **Protótipo 0.9**).

---

## 1. Visão geral do produto

```text
[PROTÓTIPO]
Aplicação single-page para o fisioterapeuta gerenciar:
agenda, pacientes, financeiro e registros clínicos de atendimentos.
Persistência local via localStorage (chave `fisio-prototype-v1`).
Sem autenticação, sem multi-usuário, sem sincronização cloud.
```

```text
[DECISÃO ARQUITETURAL]
A aplicação real será multi-dispositivo, autenticada, com PostgreSQL/Supabase
e área administrativa em `/admin`. Área `/client` e páginas públicas ficam
fora do MVP, mas a arquitetura deve acomodá-las.
```

---

## 2. Telas / seções identificadas

| Chave interna | Título UI | Finalidade |
|---|---|---|
| `home` | Seu espaço de trabalho | Hub com 4 tiles de navegação |
| `agenda` | Agenda semanal | Grade de 7 dias + agendar/abrir sessão |
| `patients` | Pacientes | Lista, busca, cadastro e histórico por paciente |
| `finance` | Financeiro | KPIs + lista de sessões + edição de pagamento |
| `records` | Atendimentos realizados | Busca + lista de sessões `Realizado` + detalhe clínico |
| `clinical` | Avaliação e evolução | Formulário clínico (marca sessão como realizada ao salvar) |
| `backup` | Backup dos dados de teste | Export/import JSON + avisos de maturidade |

```text
[PROTÓTIPO]
Navegação: home (tiles) → área. Nav superior só aparece fora da home
(botões “← Início” e “Backup”). Não há menu lateral completo.
```

---

## 3. Funcionalidades (por área)

### 3.1 Home

```text
[PROTÓTIPO]
Tiles:
- AGENDA — Horários, agendamentos e retornos
- CADASTRAR PACIENTE — Dados pessoais e cadastros
- FINANCEIRO — Pagamentos, pendências e notas
- ATENDIMENTOS REALIZADOS — Avaliações, evoluções e atividades
```

### 3.2 Agenda

```text
[PROTÓTIPO]
- Visualização semanal (seg→dom), navegação semana anterior/hoje/próxima
- Clique no dia → novo agendamento naquela data
- Eventos mostram: hora, nome do paciente, tipo, situação
- Criar agendamento (+ Agendar)
- Abrir sessão existente
- INICIAR (status Agendado) → vai para tela clínica
- Detecção de sobreposição de horário (confirm dialog)
- Texto explícito: “Agenda local, sem consulta à disponibilidade compartilhada”
- Google Agenda: “Não conectado” (tela backup)
```

### 3.3 Pacientes

```text
[PROTÓTIPO]
CRUD parcial:
- Criar / editar cadastro
- Buscar por nome
- Listar (nome, tipo, telefone)
- Atalho AGENDAR
- Ver atendimentos do paciente + resumo (qtd realizados, valor pendente)
Não há exclusão/arquivamento de paciente no protótipo.
```

**Campos do paciente (protótipo):**

| Campo | Tipo UI | Obrigatório |
|---|---|---|
| `name` | text | sim |
| `phone` | tel | não |
| `cpf` | text (max 14) | não |
| `birth` | date | não |
| `weight` | number (kg) | não |
| `height` | number (cm) | não |
| `type` | enum atendimento | sim (default Vestibular) |
| `address` | text | não |
| `number` | text | não |
| `neighborhood` | text | não |
| `city` | text | não |
| `zip` | CEP (8 dígitos) | não (valida se preenchido) |

**Tipos de atendimento (paciente e sessão):** `Vestibular` | `Ortopédico` | `Domiciliar`

### 3.4 Sessão / atendimento

```text
[PROTÓTIPO]
Uma única entidade `session` cobre agendamento + atendimento clínico + pagamento.
Estados: Agendado | Realizado | Cancelado | Faltou
```

**Campos da sessão:**

| Campo | Persistido | Notas |
|---|---|---|
| `id` | sim | UUID |
| `patientId` | sim | FK lógica |
| `date` | sim | `YYYY-MM-DD` |
| `time` | sim | `HH:mm` |
| `duration` | sim | 5–480 min (default 50) |
| `type` | sim | Vestibular/Ortopédico/Domiciliar |
| `status` | sim | Agendado/Realizado/Cancelado/Faltou |
| `value` | sim | number ≥ 0 |
| `paid` | sim | Sim/Não |
| `paymentDate` | sim | obrigatório se `paid=Sim` |
| `invoice` | sim | Sim/Não (NFS-e emitida) |
| `assessment` | sim | texto livre |
| `evolution` | sim | texto livre; obrigatório para concluir como Realizado |
| `activities` | sim | texto livre |
| `audit` | sim | array de edições |

### 3.5 Clínico (avaliação / evolução)

```text
[PROTÓTIPO]
Campos livres: avaliação, evolução, atividades (dosagem e resposta).
Salvar com status Realizado exige evolução preenchida.
Histórico de atendimentos anteriores do mesmo paciente (details).
Exportar PDF de todos os realizados do paciente.
```

```text
[PROTÓTIPO]
Aviso explícito: “Ficha vestibular — por enquanto há campos livres.
Testes, critérios… serão definidos juntos antes de incluir qualquer sugestão diagnóstica.”
```

```text
[INFERÊNCIA]
Avaliação estruturada (vestibular) é intenção futura, não requisito do MVP
além de campos de texto clínico.
```

### 3.6 Financeiro

```text
[PROTÓTIPO]
KPIs:
- Recebimentos registrados (paid=Sim, todos os períodos)
- A receber (status=Realizado AND paid=Não)
- Contagem de atendimentos realizados
Lista todas as sessões; edita valor/pago/data pagamento/NFS-e.
Aviso: emissão automática de NFS-e e controle de despesas NÃO implementados.
```

### 3.7 Auditoria de edições

```text
[PROTÓTIPO]
Toda edição de sessão existente exige `editReason`.
Cada entrada de audit: { at: ISO, reason, before: snapshot sem audit }.
UI mostra última edição + histórico expansível.
PDF inclui última edição (data + motivo).
```

### 3.8 Backup

```text
[PROTÓTIPO]
Export JSON / import JSON (substitui dados).
Validação de schema no import (version, patients, sessions, audit).
Avisos de que localStorage é frágil.
```

```text
[PROPOSTA]
Na app real: backup automático via banco; export opcional como feature admin.
Import destrutivo não deve ser o fluxo principal.
```

### 3.9 PDF

```text
[PROTÓTIPO]
PDF por paciente com todos os atendimentos Realizado:
header com nome profissional + Crefito 549225-F,
avaliação / evolução / atividades por sessão,
marca d’água de confidencialidade + paginação.
Cores do PDF alinhadas à identidade (#104031, #a5894f, #e0ccad, #f7f7f7).
```

---

## 4. Classificação por tipo de informação

### 4.1 O fisioterapeuta precisa visualizar

- Agenda da semana
- Lista de pacientes e contato/tipo
- Histórico clínico por paciente
- Status de pagamento / pendências
- Auditoria de alterações em sessões
- Totais financeiros simples

### 4.2 Precisa cadastrar

- Pacientes
- Agendamentos
- Registros clínicos (avaliação/evolução/atividades)
- Pagamentos (marcação manual)

### 4.3 Precisa editar

- Cadastro de paciente
- Sessões (com motivo obrigatório)
- Dados financeiros da sessão

### 4.4 Precisa excluir

```text
[PROTÓTIPO]
Não há exclusão de paciente nem de sessão.
Há status Cancelado/Faltou.
```

```text
[PROPOSTA]
MVP: soft-delete / arquivar paciente; cancelar sessão via status.
Hard delete apenas com papel admin e auditoria (pós-MVP).
```

---

## 5. Dados derivados vs persistidos

| Dado | Tipo |
|---|---|
| Totais financeiros | derivado |
| Contagem de realizados | derivado |
| Valor pendente por paciente | derivado |
| Sobreposição de agenda | derivado (validação) |
| Nome do paciente na agenda/lista | derivado via join |
| Snapshot `audit[].before` | persistido (cópia) |
| Campos clínicos e de pagamento | persistidos |

---

## 6. Separação: requisito × visual × melhoria × experimental

### Requisito / necessidade

- Gerir pacientes e agenda
- Registrar atendimento clínico (texto)
- Controlar pagamento básico e flag NFS-e
- Exportar histórico clínico (PDF)
- Trilha de auditoria em edições clínicas/financeiras

### Decisão visual do protótipo (não reutilizar como UI final)

- Tiles grandes na home
- Agenda em 7 colunas
- Cards brancos, botões arredondados, tipografia Montserrat embutida
- Header verde com logo SVG embutida

### Sugestão de melhoria

Ver [`improvements.md`](./improvements.md).

### Experimental / incompleto no protótipo

- Google Agenda (placeholder)
- Ficha vestibular estruturada (placeholder)
- NFS-e automática (não existe)
- Controle de despesas (não existe)
- Persistência só no navegador
- Sem login / sem LGPD real
- Avaliação = “campo livre provisório”

---

## 7. Atores

```text
[PROTÓTIPO]
Um único usuário implícito: o fisioterapeuta Geovane.
```

```text
[DECISÃO ARQUITETURAL]
MVP: um profissional (owner) autenticado.
Futuro: possível multi-profissional / secretaria / paciente.
Modelar `profiles` e `clinic` de forma extensível.
```
