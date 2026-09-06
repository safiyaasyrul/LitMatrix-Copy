---
name: Browser regression testing
description: Playwright browser tests in this workspace need explicit Chromium runtime libraries.
---

Browser-level tests should use the workspace Playwright dependency and declare Chromium's native runtime libraries through the Replit system dependency configuration rather than relying on an ambient browser installation.

**Why:** The bundled Chromium binary launched only after its missing graphics, keyboard, and audio libraries were added to the environment.

**How to apply:** When adding or moving Playwright coverage, keep the browser dependency setup alongside the test harness and verify the test from a fresh workflow environment.