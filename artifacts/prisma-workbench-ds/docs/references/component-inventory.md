# PRISMA 2020 Workbench component inventory

Source: `artifacts/litmatrix` in this workspace. The Workbench does not currently
ship a standalone primitive library; this inventory normalizes the repeated
visual families used across its workflow screens into reusable design-system
families.

| Family | Reference | Evidence in source | Chunk | Status |
| --- | --- | --- | --- | --- |
| Button | `components/button.md` | Repeated primary, outline, ghost, disabled, and icon actions across `App.tsx`, `MethodsProtocol.tsx`, and `FullReviewReport.tsx` | Pilot | implemented |
| Badge | `components/badge.md` | Status, completion, source, and evidence labels across `App.tsx`, `ApiKeySection.tsx`, and synthesis stages | Pilot | implemented |
| Card | `components/card.md` | Rounded bordered workflow sections and evidence panels across every stage component | Pilot | implemented |
| Input | `components/input.md` | Protocol, search, provider, and reviewer controls in `MethodsProtocol.tsx`, `SearchStringsGenerator.tsx`, and `ApiKeySection.tsx` | Pilot | implemented |
| Table | `components/table.md` | Study characteristics, appraisal, checklist, and manuscript evidence tables | Pilot | implemented |

The remaining raw compositions are intentionally deferred until the user
approves this pilot. They include workflow navigation, alert/status banners,
evidence rows, tabs, and dialog surfaces.