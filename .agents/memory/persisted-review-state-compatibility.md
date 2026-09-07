---
name: Persisted review state compatibility
description: Compatibility rule for loading reviews saved before newer evidence workflow fields existed.
---

Treat arrays and nested fields loaded from browser persistence as optional even when current TypeScript interfaces require them. Normalize or guard them before rendering.

**Why:** Older saved reviews can predate newly added synthesis and eligibility fields. Static checks pass because current types are stricter than the runtime data, while opening a later workflow stage can still crash.

**How to apply:** Whenever the persisted review schema gains fields, merge loaded data with current defaults and use safe empty collections at rendering and generation boundaries.