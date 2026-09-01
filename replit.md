# PRISMA 2020 Workbench

PRISMA 2020 Workbench is a systematic literature review workspace for auditing reporting standards, importing records, screening studies, synthesizing evidence, and generating a review manuscript.

## Run & Operate

- `pnpm --filter @workspace/litmatrix run dev` — run the PRISMA Workbench Express/Vite server
- `pnpm --filter @workspace/litmatrix run lint` — typecheck the frontend and server
- `pnpm --filter @workspace/litmatrix run build` — build the frontend and bundled server
- Optional env: `GEMINI_API_KEY` — enable server-side Gemini generation

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 4 with Vite middleware
- Persistence: browser localStorage with an included sample systematic review dataset
- UI: React, Tailwind CSS, Recharts, and Lucide
- AI: optional Google Gemini through `@google/genai`
- Build: Vite plus esbuild server bundle

## Where things live

- `artifacts/litmatrix/src/App.tsx` — PRISMA Workbench state and stage navigation
- `artifacts/litmatrix/src/components/` — checklist, protocol, import, screening, synthesis, and manuscript views
- `artifacts/litmatrix/src/data/` — checklist definitions and sample review dataset
- `artifacts/litmatrix/src/utils/aiClient.ts` — configurable AI provider client and server Gemini integration
- `artifacts/litmatrix/server.ts` — Express API and Vite middleware server

## Architecture decisions

- The frontend and API run in one Express process so relative `/api` calls work in preview and the bundled server.
- Review content is persisted in browser localStorage and can be reset to either the included diabetes demo or a blank review.
- The server Gemini endpoint reports availability through `/prisma-api/health` and fails explicitly when no key is configured.

## Product

- PRISMA 2020, PRISMA-S, and ROSES checklist auditing
- Protocol/PICO editing, search string generation, record import, deduplication, screening, and PRISMA flow diagrams
- Study characteristics, risk of bias, synthesis/forest plots, GRADE certainty, discussion, and manuscript reporting
- Multi-provider AI configuration with server-side Gemini fallback and user-supplied provider keys

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
