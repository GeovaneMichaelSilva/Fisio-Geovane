# Melhorias em relação ao protótipo

Formato: **Protótipo atual → problema → proposta → motivo**

---

## Autenticação e persistência

**Protótipo:** `localStorage` sem senha.  
**Problema:** dados clínicos sem proteção; perda ao limpar browser; sem multi-dispositivo.  
**Proposta:** Auth + Postgres/Supabase.  
**Motivo:** requisito mínimo de produção e LGPD básica.

---

## Navegação

**Protótipo:** home em tiles + nav mínima (Início/Backup).  
**Problema:** pouco contexto de “onde estou”; Backup misturado com navegação.  
**Proposta:** shell `/admin` com sidebar/topnav persistente (Agenda, Pacientes, Atendimentos, Financeiro, Configurações).  
**Motivo:** menos cliques entre áreas no dia a dia.

---

## Sessão única com 3 UIs paralelas

**Protótipo:** formulários parecidos em agenda/clinical/records/finance.  
**Problema:** duplicação mental e de código; estados `editing`/`editable` frágeis.  
**Proposta:** uma página de detalhe da sessão com seções (Agendamento | Clínico | Pagamento).  
**Motivo:** um registro = uma URL compartilhável.

---

## Avaliação “campo livre provisório”

**Protótipo:** textareas livres + aviso de ficha vestibular futura.  
**Problema:** difícil evoluir qualidade clínica; sem estrutura.  
**Proposta:** MVP mantém texto livre; modelar JSON extensível depois sem quebrar.  
**Motivo:** não inventar ficha clínica sem o profissional.

---

## Exclusão inexistente

**Protótipo:** sem delete.  
**Problema:** cadastros errados ficam para sempre.  
**Proposta:** arquivar paciente; cancelar/no-show na sessão.  
**Motivo:** preserva histórico e limpa listas.

---

## Confirmação destrutiva / override

**Protótipo:** só `confirm()` nativo em overlap e restore.  
**Problema:** UX frágil; fácil confirmar sem ler.  
**Proposta:** AlertDialog com resumo do conflito (horários).  
**Motivo:** segurança operacional.

---

## Busca e escala

**Protótipo:** filter client-side em memória.  
**Problema:** não escala.  
**Proposta:** busca server-side + paginação/infinite query.  
**Motivo:** dezenas/centenas de pacientes reais.

---

## Financeiro

**Protótipo:** KPIs all-time; sem filtro de período; NFS-e só flag.  
**Problema:** pouco útil no fechamento mensal.  
**Proposta:** pós-MVP filtros por mês; MVP já separar “hoje/semana” se barato.  
**Motivo:** fecha o ciclo de caixa sem complexidade de NF.

---

## Responsividade da agenda

**Protótipo:** grade 7 colunas com `min-width:800` + scroll.  
**Problema:** ruim no celular.  
**Proposta:** mobile = lista do dia + seletor de data; desktop = semana.  
**Motivo:** uso entre consultas no telefone.

---

## Acessibilidade

**Protótipo:** alguns `aria-label` e focus ring gold; forms dinâmicos via `innerHTML`.  
**Problema:** SPA via `innerHTML` prejudica leitores de tela; botões sem hierarchy clara.  
**Proposta:** componentes React semânticos (shadcn); foco gerenciado em dialogs.  
**Motivo:** base a11y sem custo alto.

---

## Feedback de ações

**Protótipo:** `#msg` texto vermelho/status.  
**Problema:** fácil não notar; some na navegação.  
**Proposta:** toasts + status inline de formulário.  
**Motivo:** confiança ao salvar dados clínicos.

---

## Validação

**Protótipo:** validações pontuais no submit.  
**Problema:** erros tardios; CEP/CPF fracos.  
**Proposta:** Zod + RHF com mensagens por campo.  
**Motivo:** menos retrabalho.

---

## Auditoria

**Protótipo:** boa ideia (motivo + snapshot).  
**Problema:** embutida no documento; difícil consultar globalmente; editável no JSON importado.  
**Proposta:** tabela `session_audits` append-only (sem update/delete via RLS).  
**Motivo:** o próprio protótipo lista “proteção do histórico contra adulteração” como próximo passo.

---

## Backup

**Protótipo:** export/import destrutivo central.  
**Problema:** restore apaga tudo; usuário técnico.  
**Proposta:** export opcional; backups automáticos do provedor.  
**Motivo:** reduzir risco operacional.

---

## Identidade visual

**Protótipo:** logo + green/gold bons; resto UI genérica/mista (tema teal legado).  
**Problema:** CSS inconsistente.  
**Proposta:** redesenhar UI com shadcn usando **apenas** tokens de marca.  
**Motivo:** pedido explícito do projeto.
