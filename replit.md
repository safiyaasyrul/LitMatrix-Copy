# ScholarPen

ScholarPen is a full-stack systematic literature review workspace for organizing research, screening papers, synthesizing evidence, and drafting a review paper.

## Run & Operate

- `pnpm --filter @workspace/litmatrix run dev` — run the ScholarPen Express/Vite server
- `pnpm --filter @workspace/litmatrix run lint` — typecheck the frontend and API
- `pnpm --filter @workspace/litmatrix run build` — build the frontend and bundled server
- `pnpm --filter @workspace/litmatrix run db:push` — push the Drizzle SQLite schema when schema changes are made
- Optional env: `GEMINI_API_KEY` — enable Gemini-powered decomposition, taxonomy, search, and screening routes

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 with Vite middleware
- DB: SQLite via `@libsql/client` and Drizzle ORM
- UI: React, React Router, Tailwind CSS, TipTap, Recharts, and Lucide
- AI: optional Google Gemini through `@google/genai`
- Build: Vite plus esbuild server bundle

## Where things live

- `artifacts/litmatrix/src/App.tsx` — router and ScholarPen shell
- `artifacts/litmatrix/src/pages/` — nine-step review workflow screens
- `artifacts/litmatrix/server/routes.ts` — project, import, deduplication, screening, and AI API routes
- `artifacts/litmatrix/src/db/` — SQLite schema and Drizzle client
- `artifacts/litmatrix/sqlite.db` — local SQLite database file

## Architecture decisions

- The frontend and API run in one Express process so relative `/api` calls work in both preview and production bundles.
- The SQLite file and upload directory are resolved from the artifact directory rather than the workspace process working directory.
- Gemini routes fail explicitly with a setup message when `GEMINI_API_KEY` is not configured.

## Product

- Nine-step workflow from paper title through final manuscript
- Server-backed project and paper persistence in SQLite
- RIS literature import, source statistics, deduplication, human screening, and AI screening
- AI-assisted topic decomposition, taxonomy, database search strings, theme generation, and paper drafting

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
