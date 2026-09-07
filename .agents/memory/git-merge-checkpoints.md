---
name: Git merge checkpoints
description: How to verify upstream merges when automatic Replit checkpoints intervene.
---

After resolving an upstream merge, verify that the resulting commit has both the local commit and the upstream tip as parents. A clean working tree alone does not prove the upstream history was merged.

**Why:** Replit's automatic checkpointing can commit the resolved tree and clear the pending merge metadata during a longer validation run, leaving the branch clean but still reported as behind upstream.

**How to apply:** After conflict resolution, check the current commit's parents and the ahead/behind count. If the validated checkpoint contains the correct tree but lacks the upstream parent, create a merge commit that references the checkpoint and upstream tip without changing the tree.