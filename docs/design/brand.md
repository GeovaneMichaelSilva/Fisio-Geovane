# Identidade visual — Brand

## Fonte

```text
[PROTÓTIPO]
Logo embutida no HTML como <image> SVG (PNG 2048×2048 em data-URI).
Header: “Geovane M. da Silva” + “Gestão de atendimentos”.
PDF: “GEOVANE M. DA SILVA” + “Crefito: 549225-F”.
```

## Arquivos canônicos

| Item | Caminho | Uso |
|---|---|---|
| Marca (só símbolo) | [`../../assets/brand/logo-mark.png`](../../assets/brand/logo-mark.png) | Header admin |
| Logo completa | [`../../assets/brand/logo-full.png`](../../assets/brand/logo-full.png) | Login, landing |
| Servidas em runtime | `public/brand/logo-mark.png`, `public/brand/logo-full.png` | Next.js `<Image>` |

```text
[DECISÃO]
- `logo-mark`: símbolo dourado do cérebro, sem texto
- `logo-full`: símbolo + tipografia “GEOVANE / M. DA SILVA / FISIOTERAPEUTA”
Não inventar logotipo novo; manter as artes oficiais do cliente.
```

## Tipografia da marca

```text
[PROTÓTIPO]
Montserrat embutida via @font-face (TTF completo no HTML).
```

```text
[PROPOSTA]
Reutilizar Montserrat via `next/font` (Google) se confirmado pelo cliente.
Não embutir o TTF do protótipo (arquivo pesado ~745KB).
UI de produto (shadcn) pode usar a stack padrão do design system;
a marca pode aparecer principalmente em header/PDF/landing.
```

## Dados profissionais no protótipo

| Campo | Valor | Origem |
|---|---|---|
| Nome | Geovane Michael da Silva | `[DECISÃO]` (completo); protótipo usava “Geovane M. da Silva” |
| Especialidade | Fisioterapeuta / Fisioterapia | `[PROTÓTIPO]` |
| Crefito | 549225-F | `[PROTÓTIPO]` (PDF) |

```text
[DECISÃO ARQUITETURAL]
Esses dados devem vir de configuração (`clinic_settings`), não hardcoded,
exceto seed inicial.
```

## O que NÃO faz parte da identidade a reutilizar

- Espaçamentos, radius, shadows, cards, botões, tabelas
- Layout da home em tiles
- Grade da agenda
- Estilos de formulário do HTML

Ver também [`colors.md`](./colors.md).
