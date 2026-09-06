---
name: Evidence-grounded review outputs
description: Guardrails for generated systematic-review claims and calculations.
---

Review outputs must distinguish imported citation metadata, abstracts, reviewer-confirmed screening decisions, and synthesized evidence. The configured workflow is abstract-based: reviewer-confirmed title/abstract inclusions are final, and full-text retrieval or assessment must not be claimed. Never auto-include imported records or invent reviewer activity, unreported study characteristics, quality judgments, effect sizes, confidence intervals, heterogeneity, or significance.

**Why:** Abstracts provide limited evidence and cannot support claims about unreported methods or results. Invented values or implied full-text verification can make a manuscript internally inconsistent and academically invalid.

**How to apply:** Derive counts from stored records and explicit reviewer decisions. Label extraction, appraisal, synthesis, and manuscripts as abstract-based; use “not reported” for absent fields. Default heterogeneous evidence to narrative synthesis and require explicit comparable effect data before quantitative pooling.