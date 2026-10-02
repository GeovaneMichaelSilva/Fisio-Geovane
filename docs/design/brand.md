# Identidade visual — Brand

## Fonte

```text
[PROTÓTIPO]
Logo embutida no HTML como <image> SVG (PNG 2048×2048 em data-URI).
Header: “Geovane M. da Silva” + “Gestão de atendimentos”.
PDF: “GEOVANE M. DA SILVA” + “Crefito: 549225-F”.
```

## Arquivo canônico

| Item | Caminho |
|---|---|
| Logo PNG (extraída do protótipo) | [`../../assets/brand/logo.png`](../../assets/brand/logo.png) |
| ViewBox usado no protótipo | `635 580 833 815` (recorte do canvas 2048×2048) |

```text
[INFERÊNCIA]
O PNG completo inclui símbolo metálico dourado + tipografia
“GEOVANE / M. DA SILVA / FISIOTERAPEUTA” sobre fundo branco.
```

```text
[PROPOSTA]
Na app Next.js, preferir:
- `logo.png` (ou versão otimizada WebP/AVIF) para header admin
- eventualmente `logo-mark.png` (só o símbolo) se for gerado depois
Não inventar logotipo novo nesta etapa.
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
