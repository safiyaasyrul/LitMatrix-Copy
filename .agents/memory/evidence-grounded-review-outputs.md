---
name: Evidence-grounded review outputs
description: Guardrails for evidence-grounded systematic-review screening, extraction, synthesis, citations, and manuscript generation.
---

# Evidence-Grounded Review Outputs

All review outputs must be grounded in the evidence actually available in the workspace.

The system must distinguish:

1. imported bibliographic metadata;
2. available abstracts;
3. recorded screening decisions;
4. extracted study characteristics;
5. full-text evidence, only when full text has actually been supplied and analyzed.

Full-text retrieval is OPTIONAL. The system must never imply that full-text screening, full-text eligibility assessment, or full-text extraction occurred unless full-text documents were actually provided and processed.

## Core rule

Never invent evidence.

Never fabricate:

- reviewer activity;
- independent duplicate screening;
- adjudication;
- full-text retrieval;
- full-text eligibility assessment;
- study characteristics;
- sample sizes;
- datasets;
- intervention details;
- comparator details;
- outcome measurements;
- effect sizes;
- confidence intervals;
- p-values;
- heterogeneity statistics;
- meta-analysis results;
- risk-of-bias judgments;
- quality scores;
- GRADE ratings;
- causal conclusions;
- quantitative findings not explicitly supported by the available evidence.

If information is unavailable, write:

"Not reported"

or

"Not reported in the available abstract/metadata"

as appropriate.

## Evidence depth

Every extracted claim must have an evidence-depth label:

- METADATA_ONLY
- ABSTRACT
- FULL_TEXT

Do not upgrade evidence depth.

For example:

A bibliographic record cannot establish a study's sample size.

An abstract cannot establish information that appears only in the full text.

A full-text claim may only be used when the corresponding document was actually supplied and analyzed.

## Screening

Imported records are NOT automatically included.

Every record must have a screening status:

- INCLUDE
- EXCLUDE
- UNCERTAIN

Screening decisions must be based only on information available at the screening stage.

For metadata/abstract screening, decisions may use:

- title;
- abstract;
- authors;
- year;
- journal/conference;
- keywords;
- bibliographic metadata.

Do not infer unavailable methodological details.

The user retains final authority over screening decisions.

## PRISMA accounting

All PRISMA numbers must be calculated from the stored evidence ledger and recorded screening decisions.

Never invent PRISMA counts.

Never create a full-text eligibility stage unless full-text assessment actually occurred.

For an abstract/metadata-only workflow, the valid flow may be:

Records identified
→ duplicates removed
→ records screened
→ records excluded
→ records included

If full text was not retrieved, do not report:

- reports sought for retrieval;
- reports not retrieved;
- reports assessed for eligibility;
- full-text exclusion reasons.

## Deduplication

Deduplication must be based on available bibliographic identifiers and normalized metadata.

Prefer, in order:

1. DOI;
2. database identifier;
3. normalized title + author + year.

Do not delete records solely because titles are similar unless the duplicate relationship is sufficiently supported.

Report the number of records removed as duplicates from the evidence ledger.

## Study characteristics

Only extract characteristics supported by the available evidence.

Permitted fields may include:

- Study ID
- Authors
- Year
- Country/region
- Journal/venue
- Study design
- Population/system
- Vessel or transport type
- Sample/dataset
- Intervention/exposure
- Comparator
- Outcome
- Measurement method
- Data source
- Validation method
- Main finding
- Evidence type
- Reported limitation

Missing information must be recorded as:

"Not reported"

Do not reconstruct missing information from general knowledge.

## Outcome interpretation

Clearly distinguish:

- directly measured CO2;
- calculated/estimated CO2;
- fuel consumption;
- energy consumption;
- carbon-intensity indicators;
- model-predicted emissions;
- simulation outcomes;
- lifecycle emissions;
- intended or projected reductions.

Prediction accuracy is NOT equivalent to demonstrated emission reduction.

Simulation-based reduction is NOT equivalent to real-world reduction.

Fuel reduction is NOT automatically equivalent to CO2 reduction unless the relationship is explicitly established.

## Quality assessment

Do not assign arbitrary numerical quality scores.

Do not convert missing reporting into poor methodological quality.

Formal risk-of-bias assessment may only be performed when:

1. an appropriate instrument has been selected for the study design;
2. sufficient information is available;
3. the appraisal criteria can actually be applied.

For abstract-only evidence, prefer:

"Methodological reporting: limited / unclear / not reported in abstract"

rather than inventing a formal risk-of-bias rating.

GRADE must not be automatically applied to heterogeneous engineering, modelling, simulation, optimization, or technology studies.

## Synthesis

Default to narrative and thematic synthesis when included studies are heterogeneous.

Do not perform quantitative pooling merely because numerical values are available.

Do not pool incompatible metrics such as:

- R²;
- RMSE;
- MAE;
- fuel savings;
- CO2 reduction;
- carbon intensity;
- CII;
- lifecycle emissions

into a single effect estimate.

Quantitative synthesis is permitted only when studies provide genuinely comparable:

- populations;
- interventions/exposures;
- comparators;
- outcomes;
- effect measures;
- units;
- analytical assumptions.

If quantitative pooling is not justified, explicitly state:

"Quantitative synthesis was not considered appropriate because of substantial heterogeneity in study design, outcomes, measurement approaches, and/or effect measures."

## Citation integrity

Every substantive factual claim in the manuscript must be traceable to one or more included records or authoritative sources actually available to the system.

Do not generate citations from model memory.

Do not attach a citation to a claim merely because the cited paper is topically related.

The cited study must support the specific claim being made.

Do not cite excluded studies as evidence for the review findings.

Do not use screening records as evidence for results unless they are part of the defined evidence base.

## Writing style

Write as a conventional academic systematic literature review suitable for Scopus-indexed Q3/Q4 journals.

Do not imitate promotional, marketing, or "high-impact" AI language.

Avoid:

- "groundbreaking";
- "decisive frontier";
- "revolutionary";
- "indispensable paradigm";
- "proves" unless genuinely supported;
- exaggerated novelty claims;
- generic AI filler.

Prefer:

- "The included studies indicate..."
- "Evidence from the reviewed literature suggests..."
- "Several studies reported..."
- "However, the findings varied according to..."
- "Direct comparison was limited by..."
- "The available evidence remains insufficient to..."

Results should synthesize multiple studies rather than summarize papers one by one.

Discussion should interpret patterns, differences, limitations, and implications rather than simply repeat the Results.

## Abstract

The abstract must describe only what the completed review actually did and found.

It must not:

- claim full-text screening when none occurred;
- claim independent reviewers when none were documented;
- claim meta-analysis when none was performed;
- report invented study counts;
- report invented quantitative findings;
- make conclusions broader than the evidence base.

Recommended structure:

Background
Objective
Methods
Results
Conclusion

The Results section of the abstract must report actual evidence patterns from the final included set.

## Evidence lock

Only records with final screening status INCLUDE may contribute to:

- study characteristics;
- evidence synthesis;
- results;
- discussion;
- conclusions;
- evidence tables;
- quantitative synthesis.

EXCLUDE and DUPLICATE records must not contribute evidence.

UNCERTAIN records must not contribute to the final evidence synthesis unless the user explicitly changes their final status to INCLUDE.

## Final validation gate

Before generating the final manuscript, verify:

1. PRISMA counts reconcile.
2. Included-study count matches the final evidence ledger.
3. Every included study exists in the source records.
4. No excluded record contributes to synthesis.
5. No duplicate contributes twice.
6. Every quantitative claim is traceable.
7. No unsupported full-text claim exists.
8. No invented reviewer activity exists.
9. No unjustified risk-of-bias or quality score exists.
10. No unjustified meta-analysis exists.
11. Research questions align with the included evidence.
12. Conclusions do not exceed the evidence.
13. References correspond to actual records.
14. Citation claims are supported by the cited studies.
15. The abstract accurately reflects the final review.

If any validation fails, do not silently repair the evidence.

Return a validation warning and identify the affected records or claims.
