# Modelagem de dados

## Princípios

```text
[DECISÃO ARQUITETURAL]
- Modelar a partir de evidências do protótipo.
- Separar concerns que o protótipo misturou quando isso melhorar integridade
  (ex.: pagamento vs sessão), sem explodir complexidade.
- Preparar para futura área do paciente sem implementar agora.
- PKs UUID; timestamps; soft-delete onde fizer sentido clínico/financeiro.
```

---

## Diagrama conceitual (MVP)

```text
clinics (1)
   │
   ├── clinic_members / users (owner, staff)
   ├── service_types (cadastro; valor/duração padrão)
   └── patients 1───* sessions
                        └───* session_audits (append-only)
```

```text
[DECISÃO — 2026-10-02]
Tipos de atendimento são cadastro (vários tipos ao longo do tempo),
não enum fechado. Ver decisions.md.
```

---

## Entidades

### 1. `clinic_settings`

```text
[INFERÊNCIA / DECISÃO ARQUITETURAL]
Não existe no protótipo; necessária para nome profissional, Crefito, branding PDF.
```

| Campo | Tipo | Obrig. | Notas |
|---|---|---|---|
| `id` | uuid | sim | PK |
| `owner_user_id` | uuid | sim | FK auth/profile |
| `display_name` | text | sim | **Geovane Michael da Silva** |
| `profession_label` | text | sim | Fisioterapeuta |
| `license_number` | text | não | **549225-F** (confirmado) |
| `timezone` | text | sim | default `America/Sao_Paulo` |
| `default_session_duration_minutes` | int | sim | **50** |
| `created_at` / `updated_at` | timestamptz | sim | |

---

### 2. `users`

```text
[DECISÃO ARQUITETURAL]
Tabela própria (NextAuth Credentials). Sem auth.users do Supabase.
Roles desde o início: owner | staff (secretária no futuro).
```

| Campo | Tipo | Obrig. | Notas |
|---|---|---|---|
| `id` | uuid | sim | PK |
| `email` | text | sim | único |
| `password_hash` | text | sim | bcrypt |
| `full_name` | text | sim | |
| `role` | enum | sim | `owner` \| `staff` |
| `created_at` / `updated_at` | timestamptz | sim | |

---

### 2b. `service_types`

```text
[DECISÃO — 2026-10-02]
Haverá mais tipos além dos 3 do protótipo → tabela editável.
```

| Campo | Tipo | Obrig. | Notas |
|---|---|---|---|
| `id` | uuid | sim | |
| `clinic_id` | uuid | sim | |
| `name` | text | sim | ex.: Vestibular |
| `slug` | text | sim | unique por clínica |
| `default_duration_minutes` | int | sim | default 50 |
| `default_value_brl` | numeric(10,2) | sim | seed: 220 / 220 / 280 |
| `is_active` | boolean | sim | default true |
| `sort_order` | int | sim | |
| `created_at` / `updated_at` | timestamptz | sim | |

Seed inicial: Vestibular (220), Ortopédico (220), Domiciliar (280).

---

### 3. `patients`

```text
[PROTÓTIPO]
Entidade explícita com campos abaixo.
```

| Campo | Tipo | Obrig. | Origem |
|---|---|---|---|
| `id` | uuid | sim | `[PROTÓTIPO]` |
| `clinic_id` | uuid | sim | `[DECISÃO]` multi-tenant leve |
| `full_name` | text | sim | `name` |
| `phone` | text | não | |
| `cpf` | text | não | armazenar só dígitos; unique parcial opcional |
| `birth_date` | date | não | `birth` |
| `weight_kg` | numeric(5,2) | não | |
| `height_cm` | numeric(5,2) | não | |
| `preferred_service_type_id` | uuid | sim | FK `service_types` (substitui enum fixo) |
| `address_street` | text | não | `address` |
| `address_number` | text | não | `number` |
| `address_neighborhood` | text | não | |
| `address_city` | text | não | |
| `address_zip` | text | não | CEP formatado ou só dígitos |
| `notes` | text | não | `[PROPOSTA]` anotações gerais |
| `archived_at` | timestamptz | não | `[PROPOSTA]` substitui delete |
| `created_at` / `updated_at` | timestamptz | sim | |
| `created_by` | uuid | não | profile |

**Tipo preferencial:** FK para `service_types` (cadastro).

**Regras:**

- Nome trim + não vazio
- CEP: se informado, 8 dígitos
- CPF: validação checksum recomendada na app real (`[PROPOSTA]`)
- Não hard-delete no MVP

---

### 4. `sessions`

```text
[PROTÓTIPO]
Núcleo do sistema: agenda + clínico + pagamento na mesma entidade.
```

| Campo | Tipo | Obrig. | Origem |
|---|---|---|---|
| `id` | uuid | sim | |
| `clinic_id` | uuid | sim | |
| `patient_id` | uuid | sim | FK patients |
| `scheduled_date` | date | sim | `date` |
| `scheduled_time` | time | sim | `time` |
| `duration_minutes` | int | sim | 5–480, default 50 |
| `service_type_id` | uuid | sim | FK `service_types` |
| `status` | enum | sim | ver abaixo |
| `value_brl` | numeric(10,2) | sim | ≥ 0 |
| `paid` | boolean | sim | default false |
| `paid_at` | date | cond. | obrig. se paid=true |
| `invoice_issued` | boolean | sim | NFS-e flag |
| `assessment` | text | não | |
| `evolution` | text | não | obrig. ao marcar realized |
| `activities` | text | não | |
| `started_at` | timestamptz | não | `[PROPOSTA]` |
| `completed_at` | timestamptz | não | `[PROPOSTA]` |
| `created_at` / `updated_at` | timestamptz | sim | |
| `created_by` / `updated_by` | uuid | não | |

**Enum `session_status`:**  
`scheduled` | `completed` | `canceled` | `no_show`  
(= Agendado, Realizado, Cancelado, Faltou)

**Regras de negócio (do protótipo + propostas):**

1. Sessão deve referenciar paciente existente.
2. Se `paid=true` → `paid_at` obrigatório.
3. Transição para `completed` exige `evolution` não vazia.
4. Sobreposição de horário: avisar (protótipo permite forçar);  
   `[PROPOSTA]` no MVP: soft-block com override explícito + motivo.
5. Edição após criação exige motivo → gera `session_audits`.
6. Cancelado/Faltou não entram no cálculo de conflito (protótipo).

**Campos derivados (não persistir):**

- `starts_at` / `ends_at` datetime (podem ser gerados por expressão/view)
- totais financeiros
- nome do paciente

---

### 5. `session_audits`

```text
[PROTÓTIPO]
Array embutido em session: { at, reason, before }
```

```text
[DECISÃO — 2026-10-02]
Append-only: a aplicação nunca atualiza/apaga audits.
Retenção indefinida.
```

| Campo | Tipo | Obrig. |
|---|---|---|
| `id` | uuid | sim |
| `session_id` | uuid | sim |
| `clinic_id` | uuid | sim |
| `edited_at` | timestamptz | sim |
| `edited_by` | uuid | não |
| `reason` | text | sim (max ~1000) |
| `before_state` | jsonb | sim |
| `after_state` | jsonb | recomendado |

---

## Entidades consideradas e **não** incluídas no MVP

| Entidade | Motivo |
|---|---|
| Exercícios / protocolos | Sem evidência no protótipo (só texto livre em `activities`) |
| Diagnósticos estruturados | Explicitamente “ainda não” |
| Documentos genéricos / uploads | Só PDF gerado; sem upload |
| Pagamentos separados / parcelas | Flags embutidas bastam no MVP |
| Despesas | Protótipo diz que não existe |
| Integração Google Calendar events | Placeholder |
| Conta do paciente (`client_users`) | Futuro — ver abaixo |

---

## Preparação para área do paciente (futuro)

```text
[DECISÃO ARQUITETURAL]
Não criar tabelas de portal agora, mas:
- patients.clinic_id + RLS por clínica
- opcional patients.auth_user_id nullable (futuro vínculo)
- sessions nunca expõem assessment/evolution sem política explícita
- preferir views/API dedicadas `/client` depois
```

---

## Alternativa de modelagem financeira

### Opção A (recomendada no MVP) — flags na sessão

Como o protótipo. Simples, cobre o fluxo atual.

### Opção B — tabela `payments`

Útil se houver múltiplos pagamentos/parcial/estornos.

```text
[PROPOSTA]
Começar com A; migrar para B se o fisioterapeuta precisar de parcelas.
```
