---
name: Evidence-grounded review outputs
description: Guardrails for generated systematic-review claims and calculations.
---

Review outputs must distinguish imported citation metadata, abstracts, reviewer-confirmed screening decisions, and synthesized evidence. The configured workflow is abstract-based: reviewer-confirmed title/abstract inclusions are final, and full-text retrieval or assessment must not be claimed. Never auto-include imported records or invent reviewer activity, unreported study characteristics, quality judgments, effect sizes, confidence intervals, heterogeneity, or significance.

The required qualitative synthesis chain is study → finding → comparison → pattern → theme → cross-study conclusion → research gaps → future research agenda. Descriptive synthesis, thematic synthesis, cluster analysis, cross-study synthesis, gap analysis, and agenda are separate workflow stages backed by one finalized evidence object. GRADE is not a standard stage, and forest plots are not produced by default.

Abstract-level appraisal must be framed as reporting completeness (for example, design, sample, outcome, validation, comparator, uncertainty, implementation, and direct target-outcome reporting). “Unclear” means not reported in the abstract; it must not be converted into a risk-of-bias, overall-quality, or certainty judgment.

The manuscript export should use a conventional journal structure and consolidate the included RIS records, abstracts, reviewer decisions, reporting assessments, and finalized synthesis. Introduction framing may use scientific judgement, but Methods and Results must remain traceable to the supplied evidence; valid study citation markers resolve only to included record IDs.

**Why:** Abstracts provide limited evidence and cannot support claims about unreported methods or results. A single traceable qualitative chain keeps six workflow pages and the manuscript consistent, while clinical certainty tools and quantitative displays would overstate heterogeneous abstract-level evidence.

**How to apply:** Derive counts from stored records and explicit reviewer decisions. Label outputs as abstract-based; use “not reported” for absent fields. Finalize Discussion and Manuscript only when all six qualitative stages exist and remain traceable to record IDs.

Manuscript and grammar-provider responses may be partial or wrapped in an envelope such as `manuscript` or `data`. Always unwrap known envelopes and merge missing sections from the grounded fallback rather than failing the whole manuscript.

**Why:** Managed providers can return valid content with one omitted section or a different JSON wrapper; rejecting that response makes manuscript generation fail even when the supplied evidence is sufficient for a complete fallback.

**How to apply:** Validate and normalize each section independently, preserve valid provider prose, and use the evidence-grounded fallback for missing title, abstract clauses, or manuscript sections.