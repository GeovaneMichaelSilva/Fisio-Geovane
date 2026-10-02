# Decisões fechadas + backlog futuro

Atualizado com as respostas do product owner (2026-10-02, complementos A–E).

---

## Decisões (1–22)

| # | Tema | Decisão |
|---|---|---|
| 1 | Branding | Híbrido: produto `fisio-geovane` / domínio `fisiogeovane.com.br`; marca **Geovane Michael da Silva**. Um único host na Vercel: `www.fisiogeovane.com.br` (`/` = “Em breve”; `/login` e `/admin` = app). |
| 2 | Crefito | **549225-F** |
| 3 | Tipos de atendimento | Cadastro editável; seed inicial só os 3 do protótipo (novos tipos via UI depois) |
| 4 | Duração padrão | **50 min** |
| 5 | Sobreposição | **Override permitido** |
| 6 | Pacientes | **Arquivar** |
| 7 | Multi-usuário | **Capacidade no schema** (`owner`/`staff` + membership); **sem UI/fluxo de secretária agora** |
| 8 | Login | **E-mail + senha** |
| 9 | Auth | **NextAuth (Auth.js v5)** Credentials + JWT; DB **Neon** + Drizzle |
| 10 | Auth extras | Recuperação de senha via **Resend**; from **`nao-responda@fisiogeovane.com.br`**; sem 2FA |
| 11 | LGPD formal | Futuro |
| 12 | `/client` | Não especificar agora |
| 13 | Ficha vestibular | Texto livre |
| 14 | Auditoria | Append-only; retenção indefinida |
| 15 | NFS-e | Flag |
| 16 | Despesas | Placeholder “Em breve” |
| 17 | Valores padrão | Cadastro de tipos; seeds abaixo |
| 18 | Google Agenda | Alta prioridade, depois; placeholder Integrações |
| 19 | WhatsApp/lembretes | Futuro |
| 20 | Infra | local + prod; `app.` + root “em breve”; **Neon** (Vercel) |
| 21 | Backup JSON | Só se útil / fixture — não importar como dados reais |
| 22 | Idioma | **pt-BR** |

### Conta owner (C)

| Campo | Valor |
|---|---|
| E-mail login | `fisiogeoms@gmail.com` |
| Nome exibido clínica | Geovane Michael da Silva |

### E-mail transacional (B)

| Campo | Valor |
|---|---|
| Provedor | **Resend** |
| Domínio | `fisiogeovane.com.br` |
| From | **`nao-responda@fisiogeovane.com.br`** |

### Seeds de valor (#17)

| Tipo | Valor padrão (R$) |
|---|---|
| Vestibular | 220,00 |
| Ortopédico | 220,00 |
| Domiciliar | 280,00 |

---

## A — Multi-usuário (revisado)

```text
[DECISÃO]
Não implementar secretária / convites / matriz de permissões na UI agora.
Manter no banco/roles a capacidade de ter outros usuários depois
(users, clinic_members, role owner|staff) para não refazer o modelo.
MVP opera como single-user (só o owner).
```

---

## Importante, mas **não agora**

| Item | Onde | Prioridade |
|---|---|---|
| UI/convite multi-usuário + permissões reais | Schema já preparado | Quando precisar de secretária |
| Google Agenda | Settings → Integrações (placeholder) | Alta pós-MVP |
| Despesas | `/admin/finance/expenses` placeholder | Média |
| WhatsApp / lembretes | Integrações | Futuro |
| LGPD formal | — | Futuro |
| `/client` | — | Futuro |
| Ficha vestibular estruturada | — | Quando definir campos |
| NFS-e automática | — | Futuro |
| Landing em `fisiogeovane.com.br` | Hoje: “Em breve” | Futuro |
| Staging | — | Se precisar |
| 2FA | — | Futuro |

---

## Impacto no MVP

- 1 usuário efetivo: `fisiogeoms@gmail.com`
- Schema com `clinic_members` + roles (sem telas de gestão de equipe)
- Root domain = “Em breve”; app no mesmo host (`/login`, `/admin`)
- Resend para recovery
- Tipos: só seed dos 3; cadastro permite adicionar depois

---

## Backup JSON (#21)

`docs/references/fisio-backup-2026-09-30.json` — fixture/referência, não dados reais de produção.
