# Badge family

## Source evidence

- `artifacts/litmatrix/src/App.tsx`: checklist completion and included-record
  status labels.
- `artifacts/litmatrix/src/components/ApiKeySection.tsx`: provider readiness
  labels.
- `artifacts/litmatrix/src/components/EvidenceSynthesisStage.tsx`: synthesis
  state and evidence tags.

## Extracted behavior and visual rules

Badges are compact metadata, not primary controls. Emerald communicates
confirmed or ready states, amber communicates pending or provisional states,
rose communicates failure, and indigo communicates active workflow context.
Mono text and subtle borders keep status labels scannable.