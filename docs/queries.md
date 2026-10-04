# TanStack Query — convenção

Hooks centralizados em `src/queries/*Query.ts` (padrão próximo ao Hub).

## Regras

1. **Keys estáveis** — exportar `*QueryKeys` hierárquicos (`root` → `list` / `detail`).
2. **Páginas só consomem hooks** — sem `useMutation` + invalidação ad-hoc.
3. **Mutations atualizam o cache**:
   - **update** → `setQueryData` no detalhe + patch nas listagens quando possível
   - **create** → `setQueryData` no detalhe (se shape completo) + `invalidateQueries` nas listas paginadas
   - **delete/archive** → remove/patch no cache; optimistic quando seguro (ex.: archive paciente, toggle tipo, remove membro)
4. **Invalidate** só quando patch for inviável (agenda por range, finance/records agregados).
5. **API** deve devolver o recurso atualizado (ou confirmação no delete).

## Domínios

| Arquivo | Domínio |
|---|---|
| `meQuery.ts` | perfil / trocar senha |
| `patientQuery.ts` | pacientes |
| `sessionQuery.ts` | agenda + detalhe de sessão |
| `serviceTypeQuery.ts` | tipos de atendimento |
| `clinicQuery.ts` | clínica |
| `teamQuery.ts` | equipe |
| `financeQuery.ts` | financeiro |
| `recordsQuery.ts` | atendimentos realizados |
| `googleIntegrationsQuery.ts` | Google Agenda / Drive |
