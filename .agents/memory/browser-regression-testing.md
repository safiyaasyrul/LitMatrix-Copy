---
name: Browser regression testing
description: Playwright browser tests in this workspace need explicit Chromium runtime libraries.
---

Browser-level tests should use the workspace Playwright dependency and declare each engine's native runtime libraries through the Replit system dependency configuration rather than relying on ambient browser installations.

**Why:** The bundled Chromium binary launched only after its missing graphics, keyboard, and audio libraries were added to the environment.

Firefox additionally requires GTK/X11 runtime libraries such as GTK3, GDK Pixbuf, Xcursor, and Xi in this workspace.

**How to apply:** When adding or moving Playwright coverage, keep the browser dependency setup alongside the test harness, document engine-specific setup in the Playwright config, and verify each project from a fresh workflow environment.