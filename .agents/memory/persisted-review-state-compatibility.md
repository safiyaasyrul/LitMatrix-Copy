---
name: Persisted review state compatibility
description: Compatibility rule for loading reviews saved before newer evidence workflow fields existed.
---

Treat arrays and nested fields loaded from browser persistence as optional even when current TypeScript interfaces require them. Normalize or guard them before rendering, and discard retired quantitative or certainty payloads when the active workflow no longer supports them.

**Why:** Older saved reviews can predate newly added synthesis and eligibility fields or retain outputs from retired appraisal workflows. Static checks pass because current types are stricter than the runtime data, while opening a later workflow stage can still crash or surface unsupported claims.

**How to apply:** Whenever the persisted review schema gains fields or removes an analysis path, merge loaded data with current defaults, use safe empty collections at rendering and generation boundaries, and explicitly strip retired output fields.