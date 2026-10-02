# Documentação — Fisio Geovane

Base de especificação para a aplicação em **Next.js + NextAuth + Neon (PostgreSQL) + Vercel**.

## Como usar estes docs

1. Leia [`requirements.md`](./requirements.md) para entender o produto.
2. Leia [`decisions.md`](./decisions.md) — o que já foi fechado.
3. Leia [`mvp.md`](./mvp.md) para saber o que construir primeiro.
4. Leia [`open-questions.md`](./open-questions.md) — o que ainda falta.
5. Leia [`data-model.md`](./data-model.md) + [`database.md`](./database.md) antes de criar migrations.
6. Leia [`architecture.md`](./architecture.md) + [`routes.md`](./routes.md) antes de criar pastas/rotas.
7. Consulte [`design/`](./design/) apenas para **logo + cores**.
8. Consulte [`references/`](./references/) só como referência (protótipo JS / backup JSON).

## O que reaproveitar do protótipo

| Reaproveitar | Não reaproveitar |
|---|---|
| Requisitos e funcionalidades | CSS / layout / componentes |
| Entidades e campos | Tipografia “de preferência” do protótipo (exceto Montserrat se confirmada na marca) |
| Fluxos de trabalho | Estrutura HTML/JS monolítica |
| Logo + cores de identidade | Bordas, sombras, cards, animações |
| Regras de negócio evidentes | Persistência em `localStorage` |

## Escopo do produto (visão)

- **Agora:** sistema interno do fisioterapeuta (`/admin`).
- **Futuro:** páginas públicas (landing/SEO) e área do paciente (`/client`).
- **Não implementar agora:** área do paciente.

## Legenda de origem

Toda documentação relevante marca a origem:

```text
[PROTÓTIPO]      evidência direta
[INFERÊNCIA]     dedução a partir do protótipo
[PROPOSTA]       melhoria / complemento
[DECISÃO ARQUITETURAL]  escolha técnica
```
