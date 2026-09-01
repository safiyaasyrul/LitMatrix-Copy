---
name: Artifact API routing
description: Replit artifact path-routing behavior when an app has server-side API endpoints alongside the shared API service.
---

Use a unique application-specific API prefix for server routes rather than assuming `/api` belongs to the web artifact.

**Why:** In this workspace, the shared API service also receives `/api` requests, so same-origin calls to `/api/...` can return the shared service's HTML or 404 response instead of reaching the artifact's Express server.

**How to apply:** Register the unique prefix in the artifact service paths and use the same prefix in the browser client and server route definitions. Verify through the proxied development domain, not only localhost.