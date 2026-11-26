# manage-products

Web port of the VB6 Product Manager (`ProductManager.exe`) to React + TypeScript (Vite) with a Node/Express backend in `server/`.

## Project guidelines
- Functional components and hooks only; no class components.
- Follow the existing `src/` structure (pages, components, hooks, context, utils, layout, navigation, tabs).
- Reuse existing hooks, utilities, and context before creating new abstractions.
- Keep UI, data access, and state logic separated by feature/module.
- Add new pages/tabs/modules within the existing structure; keep changes minimal.
- Type props, state, and data contracts in TypeScript; avoid `any`.
- Use Jest for unit/component tests focused on behavior and regressions.

## SQL reference (required for new tabs)
Before generating any net-new tab, its server route, or its SQL, consult these in order:

1. `sql/sp_s_proc/sp_s_prodProductHeader.sql` — extract of the original VB6 app's product header stored procedure. It is the source of truth for table names, column names, joins, and filters. Do not invent columns or tables; take them from this file.
2. `sql/queries/*.sql` — existing QA queries, useful for column/table confirmation per area (accounting, components, pricing, etc.).
3. `server/routes/productTables/*.cjs` — existing route patterns to follow.

Rules:
- Every column and table used by a new tab must be traceable to the reference above. If it is not found there, say so and ask rather than guessing.
- Match the original column names and casing in SQL; map to camelCase only in the client-side types.
- Use parameterized queries through `server/db/pool.cjs`; never concatenate user input into SQL.
- Do not copy credentials or server names into the repo.
