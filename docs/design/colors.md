# Cores — identidade básica

## Cores oficiais do tema (CSS variables do protótipo)

```text
[PROTÓTIPO]
:root {
  --green: #104031;
  --gold:  #a5894f;
  --sand:  #e0ccad;
  --paper: #f7f7f7;
}
```

Estas quatro cores são a **única paleta de identidade** a reutilizar de forma deliberada.

### Green (primária / fundo de marca)

| Formato | Valor |
|---|---|
| HEX | `#104031` |
| RGB | `16, 64, 49` |
| HSL | `hsl(158, 60%, 16%)` approx |

Uso no protótipo: header, botão primário, texto principal, header do PDF.

Hover observado no protótipo: `#1b5743` — **não** é token oficial; pode virar `primary/hover` no design system se fizer sentido.

### Gold (acento / destaque de marca)

| Formato | Valor |
|---|---|
| HEX | `#a5894f` |
| RGB | `165, 137, 79` |
| HSL | `hsl(40, 35%, 48%)` approx |

Uso: borda inferior do header, outline de foco, borda esquerda de eventos da agenda, linhas do PDF.

### Sand (secundária suave)

| Formato | Valor |
|---|---|
| HEX | `#e0ccad` |
| RGB | `224, 204, 173` |
| HSL | `hsl(36, 45%, 78%)` approx |

Uso: texto auxiliar no header, hover de botão secundário, linha de rodapé do PDF.

### Paper (fundo de página)

| Formato | Valor |
|---|---|
| HEX | `#f7f7f7` |
| RGB | `247, 247, 247` |
| HSL | `hsl(0, 0%, 97%)` approx |

Uso: background da aplicação.

---

## Mapeamento sugerido para Tailwind / shadcn

```text
[DECISÃO ARQUITETURAL]
Mapear tokens shadcn sem copiar o CSS do protótipo:

--primary:           green #104031
--primary-foreground: paper / white
--accent:            gold #a5894f
--accent-foreground: green (ou branco, testar contraste)
--background:        paper #f7f7f7
--muted:             sand com opacidade / neutro derivado
--ring:              gold
```

Neutros de UI (bordas, muted text) devem ser **definidos no design system**,
não importados das dezenas de cinzas ad-hoc do protótipo.

---

## Cores do logo (inferidas)

```text
[INFERÊNCIA]
O símbolo da logo é ouro metálico (gradiente/texture), não uma cor flat única.
O texto tipográfico da logo é ouro/bronze próximo de --gold.
Fundo da arte: branco.
```

Para UI flat, usar `--gold` como representação estável.

---

## Cores presentes no protótipo que NÃO são identidade

Exemplos a **ignorar** como brand:

- `#087f8c`, `#173044`, `#113e50` — restos de tema anterior (ainda no CSS legado)
- `#a12720` — erro/mensagem (`#msg`)
- Cinzas de tabela/borda (`#dae5e9`, `#e2ebef`, etc.)

```text
[PROTÓTIPO]
Há dois “temas” CSS no arquivo: um teal/azul legado e o tema green/gold final.
A identidade a seguir é a do bloco `:root` green/gold/sand/paper.
```

---

## Acessibilidade

```text
[PROPOSTA]
Validar contraste WCAG:
- green (#104031) em paper (#f7f7f7): tipicamente OK para texto
- gold (#a5894f) como texto em paper: pode falhar para texto pequeno;
  preferir gold como accent/borda, não como corpo de texto
```
