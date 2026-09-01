import React, { useState } from "react";
import {
  SLRProtocol,
  SLRRecord,
  StudyCharacteristic,
  RiskOfBiasItem,
  SynthesisResult,
  GradeCertaintyItem,
  DiscussionSections,
  PrismaChecklistItem,
} from "../types/slr";
import { Download, Copy, Printer, Check, BookOpen, FileText, CheckCircle2, ShieldAlert, Sparkles, Layers, SlidersHorizontal, Quote } from "lucide-react";
import PrismaDiagram from "./PrismaDiagram";
import { AIProviderConfig, callAI, parseJSONLoose } from "../utils/aiClient";

interface StructuredAbstract {
  bg: string;
  obj: string;
  meth: string;
  res: string;
  concl: string;
  keywords: string[];
}

interface FullReviewReportProps {
  protocol: SLRProtocol;
  includedRecords: SLRRecord[];
  characteristics: StudyCharacteristic[];
  riskOfBias: RiskOfBiasItem[];
  synthesis: SynthesisResult;
  gradeItems: GradeCertaintyItem[];
  discussion: DiscussionSections;
  checklist: PrismaChecklistItem[];
  counts: any;
  aiConfig: AIProviderConfig;
}

export default function FullReviewReport({
  protocol,
  includedRecords,
  characteristics,
  riskOfBias,
  synthesis,
  gradeItems,
  discussion,
  checklist,
  counts,
  aiConfig,
}: FullReviewReportProps) {
  const [copied, setCopied] = useState(false);
  const [generatedAbstract, setGeneratedAbstract] = useState<StructuredAbstract | null>(null);
  const [generatingAbstract, setGeneratingAbstract] = useState(false);
  const [abstractError, setAbstractError] = useState<string | null>(null);

  const questions = protocol.primaryResearchQuestions || [
    "RQ1: What evidence directly addresses the review topic?",
    "RQ2: What methods, settings, and outcomes are reported?",
    "RQ3: What evidence gaps remain?",
  ];

  const objectives = protocol.secondaryObjectives || [
    "Describe the evidence by themes grounded in the included records",
    "Appraise methodological quality using criteria appropriate to the study designs",
  ];

  // Helper for generating PICOC narrative paragraph in Methods
  const getFrameworkNarrative = () => {
    const fw = protocol.formulationFramework || "PICOC";
    if (fw === "PICOC") {
      const p = protocol.objectivesPICOC?.population || protocol.objectivesPICO.population || "the defined population or unit of analysis";
      const i = protocol.objectivesPICOC?.intervention || protocol.objectivesPICO.intervention || "the intervention, method, policy, technology, or exposure of interest";
      const c = protocol.objectivesPICOC?.comparison || protocol.objectivesPICO.comparator || "any explicitly defined comparator";
      const o = protocol.objectivesPICOC?.outcomes || protocol.objectivesPICO.outcomes || "the prespecified outcomes or phenomena";
      const ctx = protocol.objectivesPICOC?.context || "the defined operational or geographical context";
      const s = protocol.objectivesPICOC?.studyDesigns || protocol.objectivesPICO.studyDesigns || "eligible empirical study designs";
      return `The review scope was structured using PICOC: population or unit of analysis, ${p}; intervention or focus, ${i}; comparison, ${c}; outcomes, ${o}; context, ${ctx}; and study designs, ${s}.`;
    }
    if (fw === "PEO") {
      const p = protocol.objectivesPEO?.population || protocol.objectivesPICO.population;
      const e = protocol.objectivesPEO?.exposure || protocol.objectivesPICO.intervention;
      const o = protocol.objectivesPEO?.outcomes || protocol.objectivesPICO.outcomes;
      const s = protocol.objectivesPEO?.setting || "the defined setting or context";
      const d = protocol.objectivesPEO?.studyDesigns || protocol.objectivesPICO.studyDesigns;
      return `The review scope was structured around the PEO framework. The population or context (P) is ${p}. The exposure or phenomenon (E) is ${e}. The outcomes (O) are ${o}. The setting (S) is ${s}, with eligible study designs defined as ${d}.`;
    }
    if (fw === "SPIDER") {
      const s = protocol.objectivesSPIDER?.sample || protocol.objectivesPICO.population;
      const pi = protocol.objectivesSPIDER?.phenomenonOfInterest || protocol.objectivesPICO.intervention;
      const d = protocol.objectivesSPIDER?.design || "the approved study designs";
      const e = protocol.objectivesSPIDER?.evaluation || protocol.objectivesPICO.outcomes;
      const r = protocol.objectivesSPIDER?.researchType || "the approved research types";
      return `The review was formulated using SPIDER. The sample (S) is ${s}. The phenomenon of interest (PI) is ${pi}. The design (D) is ${d}. The evaluation (E) is ${e}, and the research types (R) are ${r}.`;
    }
    // Default PICO
    const p = protocol.objectivesPICO.population;
    const i = protocol.objectivesPICO.intervention;
    const c = protocol.objectivesPICO.comparator;
    const o = protocol.objectivesPICO.outcomes;
    const s = protocol.objectivesPICO.studyDesigns;
    return `The systematic review protocol was formulated using PICO. The population or unit of analysis (P) is ${p}. The intervention or focal concept (I) is ${i}. The comparator (C) is ${c}. The outcomes (O) are ${o}, with eligible study designs defined as ${s}.`;
  };

  // Group characteristics by category
  const categoriesMap = new Map<string, StudyCharacteristic[]>();
  characteristics.forEach((c) => {
    const cat = c.category || "Uncategorized evidence";
    if (!categoriesMap.has(cat)) {
      categoriesMap.set(cat, []);
    }
    categoriesMap.get(cat)!.push(c);
  });

  // Check if any study has country or sample size populated
  const hasCountryData = characteristics.some((c) => c.country && c.country !== "Not reported" && c.country !== "N/A");
  const hasSampleData = characteristics.some((c) => c.sampleSize && c.sampleSize !== "N/A" && c.sampleSize !== "Not reported");

  const includedIds = new Set(includedRecords.map((record) => record.id));
  const extractedIds = new Set(
    characteristics.filter((item) => includedIds.has(item.recordId)).map((item) => item.recordId)
  );
  const appraisedIds = new Set(
    riskOfBias.filter((item) => includedIds.has(item.recordId)).map((item) => item.recordId)
  );
  const selectionComplete = includedRecords.length > 0 && counts.assessed >= includedRecords.length;
  const extractionComplete =
    includedRecords.length > 0 && includedRecords.every((record) => extractedIds.has(record.id));
  const appraisalComplete =
    includedRecords.length > 0 && includedRecords.every((record) => appraisedIds.has(record.id));
  const synthesisComplete =
    (synthesis.subtopics?.length || 0) > 0 && (synthesis.keyFindingsTable?.length || 0) > 0;
  const abstractReady =
    selectionComplete && extractionComplete && appraisalComplete && synthesisComplete;

  const removeCitationArtifacts = (value: string) =>
    value
      .replace(/\b[A-ZÀ-ÖØ-Þ][\p{L}'’-]+(?:\s+(?:and|&)\s+[A-ZÀ-ÖØ-Þ][\p{L}'’-]+)?\s+et\s+al\.?,?\s*\(?\d{4}[a-z]?\)?/giu, "")
      .replace(/\([^)]*(?:19|20)\d{2}[a-z]?[^)]*\)/gi, "")
      .replace(/\[(?:\d+\s*[,–-]?\s*)+\]/g, "")
      .replace(/https?:\/\/\S+|doi:\s*\S+/gi, "")
      .replace(/\s{2,}/g, " ")
      .replace(/\s+([,.;:])/g, "$1")
      .trim();

  const pendingAbstract: StructuredAbstract = {
    bg: "Generate the abstract after final study selection, extraction, methodological appraisal, and evidence synthesis are complete.",
    obj: "The review objective will be summarized from the approved protocol.",
    meth: "The methods summary will report only recorded search, screening, full-text, and appraisal procedures.",
    res: "Synthesis-level results are not yet available for abstract generation.",
    concl: "No abstract conclusion is generated before the finalized synthesis is available.",
    keywords: [protocol.reviewType || "Systematic Review", "Evidence Synthesis"],
  };

  const abstract = generatedAbstract || pendingAbstract;

  const handleGenerateAbstract = async () => {
    if (!abstractReady) return;
    setGeneratingAbstract(true);
    setAbstractError(null);

    const synthesisEvidence = {
      themes: (synthesis.subtopics || []).map((item) => ({
        title: removeCitationArtifacts(item.title),
        synthesis: removeCitationArtifacts(item.prose),
      })),
      crossStudyFindings: (synthesis.keyFindingsTable || []).map((item) => ({
        topic: removeCitationArtifacts(item.topic),
        summary: removeCitationArtifacts(item.summary),
        consistency: removeCitationArtifacts(item.consistency),
        evidenceBase: removeCitationArtifacts(item.evidenceBase),
      })),
      heterogeneity: removeCitationArtifacts(synthesis.heterogeneityDiscussion || ""),
    };
    const appraisalSummary = {
      totalAppraised: riskOfBias.filter((item) => includedIds.has(item.recordId)).length,
      lowConcern: riskOfBias.filter(
        (item) => includedIds.has(item.recordId) && (item.overall === "Low" || item.overall === "High Rigor")
      ).length,
      someConcerns: riskOfBias.filter(
        (item) => includedIds.has(item.recordId) && (item.overall === "Some concerns" || item.overall === "Moderate Rigor")
      ).length,
      highConcern: riskOfBias.filter(
        (item) => includedIds.has(item.recordId) && (item.overall === "High" || item.overall === "Low Rigor")
      ).length,
    };
    const uploadedSources = counts.identifiedDbSources?.join(", ") || "uploaded source records";

    const prompt = `Generate a structured systematic-review abstract from FINALIZED SYNTHESIS-LEVEL EVIDENCE only.

Review title: ${protocol.title}
Approved rationale: ${protocol.introductionRationale || protocol.backgroundContext || "Not provided"}
Approved objectives: ${JSON.stringify(objectives)}
Recorded methods: Sources represented in uploaded records: ${uploadedSources}. Records screened: ${counts.screened || 0}. Full texts assessed: ${counts.assessed || 0}. Final included studies: ${includedRecords.length}. Appraisal approach: ${protocol.riskOfBiasMethods.toolName || "study-design-appropriate appraisal"}.
Final synthesis: ${JSON.stringify(synthesisEvidence)}
Methodological appraisal summary: ${JSON.stringify(appraisalSummary)}

STRICT ABSTRACT RULES:
1. Return Background, Objective, Methods, Results, Conclusion, and Keywords.
2. Results must answer what the review found after cross-study synthesis. Summarize dominant patterns, relationships, consistencies, contradictions, methodological limitations, and evidence gaps.
3. Do not list studies or write a sequence of individual-study findings.
4. Do not include author names, years, citations, reference numbers, DOI links, or URLs anywhere.
5. Do not derive findings from screening counts, keyword frequencies, titles alone, excluded records, or records awaiting full-text assessment.
6. Use only the supplied finalized synthesis. If a relationship is not supported there, omit it.
7. Do not invent numerical values. Use recorded flow counts only in Methods or Results when useful.
8. Do not report pooled effects, confidence intervals, heterogeneity statistics, GRADE ratings, p-values, or meta-analysis unless present in the supplied finalized synthesis.
9. The Conclusion must reflect evidence strength and limitations and must not turn association, prediction, modelling performance, or theoretical potential into demonstrated real-world effectiveness.
10. Keep Results concise and synthesis-level, with no citations.

Return ONLY JSON:
{
  "background": "Why the topic matters",
  "objective": "What the review investigated",
  "methods": "Brief recorded sources, screening, PRISMA flow, extraction, appraisal, and synthesis approach",
  "results": "Cross-study synthesized findings without citations",
  "conclusion": "Meaning, limitations, principal gap, and implication",
  "keywords": ["3 to 6 concise terms"]
}`;

    try {
      const text = await callAI(
        prompt,
        "You are a systematic review abstract editor. Write synthesis-level findings only and never include citations in the abstract.",
        aiConfig
      );
      const parsed = parseJSONLoose(text);
      if (!parsed?.results || !parsed?.conclusion) {
        throw new Error("The AI response did not contain a complete structured abstract.");
      }
      setGeneratedAbstract({
        bg: removeCitationArtifacts(String(parsed.background || "")),
        obj: removeCitationArtifacts(String(parsed.objective || "")),
        meth: removeCitationArtifacts(String(parsed.methods || "")),
        res: removeCitationArtifacts(String(parsed.results || "")),
        concl: removeCitationArtifacts(String(parsed.conclusion || "")),
        keywords: Array.isArray(parsed.keywords)
          ? parsed.keywords.map((item: unknown) => removeCitationArtifacts(String(item))).filter(Boolean).slice(0, 6)
          : ["Systematic Review", "Evidence Synthesis"],
      });
    } catch (error: any) {
      setAbstractError(error?.message || "The synthesis abstract could not be generated.");
    } finally {
      setGeneratingAbstract(false);
    }
  };

  const generateFullMarkdown = () => {
    let md = `# ${protocol.title || "Systematic Literature Review Manuscript"}\n\n`;
    md += `**Methodology:** ${protocol.reviewType}\n`;
    md += `\n---\n\n`;

    md += `## Abstract\n\n`;
    md += `**Background:** ${abstract.bg}\n\n`;
    md += `**Objectives:** ${abstract.obj}\n\n`;
    md += `**Methods:** ${abstract.meth}\n\n`;
    md += `**Results:** ${abstract.res}\n\n`;
    md += `**Discussion and Conclusion:** ${abstract.concl}\n\n`;
    md += `**Keywords:** ${abstract.keywords.join(", ")}\n\n`;
    md += `---\n\n`;

    md += `## 1. Introduction and Academic Rationale\n\n`;
    md += `### 1.1 Scientific Rationale and Motivation for Conducting the Review\n`;
    md += `${protocol.introductionRationale || "No review rationale has been approved by the researcher."}\n\n`;

    if (protocol.backgroundContext) {
      md += `In theoretical and domain context, ${protocol.backgroundContext}\n\n`;
    }

    if (protocol.knowledgeGap) {
      md += `Regarding the existing literature gap, ${protocol.knowledgeGap}\n\n`;
    }

    md += `### 1.2 Review Objectives and Research Questions\n`;
    const questionsParagraph = questions.map((q, i) => `Specifically, research question ${i + 1} investigates ${q.replace(/^RQ\d+:\s*/, "")}`).join(". Furthermore, ");
    const objectivesParagraph = objectives.map((obj) => `to ${obj.toLowerCase().replace(/^to\s+/, "")}`).join(", as well as ");
    md += `The overarching objective of this investigation is ${objectivesParagraph}. In addressing this mandate, three core research questions guide the empirical synthesis: ${questionsParagraph}.\n\n`;

    md += `## 2. Methods\n\n`;
    md += `### 2.1 Study Formulation and Scope Definition\n`;
    md += `${getFrameworkNarrative()}\n\n`;

    md += `### 2.2 Eligibility Criteria\n`;
    const incText = protocol.eligibilityCriteria.inclusion.join(", ");
    const excText = protocol.eligibilityCriteria.exclusion.join(", ");
    md += `Studies were eligible for inclusion if they satisfied predefined criteria encompassing ${incText}. Records were excluded when they met ${excText}. The planned synthesis grouping strategy follows ${protocol.eligibilityCriteria.groupingForSynthesis || "researcher-approved grouping criteria"}.\n\n`;

    md += `### 2.3 Information Sources and Search Strategy\n`;
    const searchDatabases = protocol.searchStrategies.map((s) => s.database).filter(Boolean).join(", ");
    md += searchDatabases
      ? `The protocol documents search strategies for ${searchDatabases}. This report does not claim that a search was executed unless records from those sources were uploaded.\n\n`
      : `No database search strategy is recorded in the protocol. The report describes only the uploaded records.\n\n`;

    md += `### 2.4 Selection Process, Reviewer Moderation, and Exclusion Rationales\n`;
    md += `The application distinguishes title and abstract screening from full-text retrieval and eligibility. ${counts.assessed || 0} full-text reports have recorded eligibility assessments, and ${includedRecords.length} studies have reviewer-approved full-text inclusion. Independent duplicate review and consensus adjudication are not claimed unless separately documented.\n\n`;

    md += `### 2.5 Methodological Quality and Systematic Assessment Methodology\n`;
    md += `Methodological quality was assessed using ${protocol.riskOfBiasMethods.toolName || "a transparent, study-design-appropriate appraisal framework"}. The approved domains were ${protocol.riskOfBiasMethods.domainsAssessed || "not specified"}. Appraisal claims are limited to recorded judgments.\n\n`;

    md += `## 3. Results\n\n`;
    md += `### 3.1 Study Selection and Flow of Evidence\n`;
    md += `${counts.identifiedDb || 0} uploaded records were represented, including ${counts.duplicatesRemoved || 0} duplicates recorded as removed. ${counts.screened || 0} records have title and abstract decisions; ${counts.soughtRetrieval || 0} reports were sought, ${counts.notRetrieved || 0} were not retrieved, ${counts.assessed || 0} were assessed at full text, ${counts.assessedExcluded || 0} were excluded at full text, and ${includedRecords.length} studies were finally included.\n\n`;

    md += `### 3.2 Characteristics of Included Studies Grouped by Category (Table 1)\n\n`;
    if (hasCountryData || hasSampleData) {
      md += `| Study | Evidence Category | ${hasCountryData ? "Location | " : ""}${hasSampleData ? "Sample / Evidence Base | " : ""}Intervention / Exposure / Phenomenon | Comparator | Reported Outcome | Study Design | Key Finding |\n`;
      md += `| --- | --- | ${hasCountryData ? "--- | " : ""}${hasSampleData ? "--- | " : ""}--- | --- | --- | --- | --- |\n`;
      characteristics.forEach((c) => {
        md += `| ${c.authorYear} | ${c.category || "Not categorized"} | ${hasCountryData ? `${c.country || "Not reported"} | ` : ""}${hasSampleData ? `${c.sampleSize || "Not reported"} | ` : ""}${c.interventionOrFocus.replace(/\|/g, "/")} | ${(c.comparator || "Not reported").replace(/\|/g, "/")} | ${c.primaryOutcome.replace(/\|/g, "/")} | ${(c.studyDesign || "Not reported").replace(/\|/g, "/")} | ${c.keyFinding.replace(/\|/g, "/")} |\n`;
      });
    } else {
      md += `| Study | Evidence Category | Intervention / Exposure / Phenomenon | Comparator | Reported Outcome | Study Design | Key Finding |\n`;
      md += `| --- | --- | --- | --- | --- | --- | --- |\n`;
      characteristics.forEach((c) => {
        md += `| ${c.authorYear} | ${c.category || "Not categorized"} | ${c.interventionOrFocus.replace(/\|/g, "/")} | ${(c.comparator || "Not reported").replace(/\|/g, "/")} | ${c.primaryOutcome.replace(/\|/g, "/")} | ${(c.studyDesign || "Not reported").replace(/\|/g, "/")} | ${c.keyFinding.replace(/\|/g, "/")} |\n`;
      });
    }
    md += `\n`;

    md += `### 3.3 Methodological Quality and Rigor Assessment (Table 2)\n\n`;
    md += `| Study | Study Design & Setup | Benchmark Data Adequacy | Measurement Methodology | Baseline Validation | Repeatability & Reporting | Overall Rigor | Methodological Justification |\n`;
    md += `| --- | --- | --- | --- | --- | --- | --- | --- |\n`;
    riskOfBias.forEach((r) => {
      md += `| ${r.authorYear} | ${r.d1Selection} | ${r.d2Performance} | ${r.d3Attrition} | ${r.d4Detection} | ${r.d5Reporting} | ${r.overall} | ${r.justification.replace(/\|/g, "/")} |\n`;
    });
    md += `\n`;

    md += `### 3.4 Evidence Synthesis Grouped by Study Characteristics and Shared Author Similarities\n\n`;
    (synthesis.subtopics || []).forEach((sub) => {
      md += `#### ${sub.title}\n${sub.prose}\n\n`;
    });

    if (synthesis.heterogeneityDiscussion) {
      md += `Regarding between-study variance and heterogeneity exploration, ${synthesis.heterogeneityDiscussion}\n\n`;
    }

    if (gradeItems.length > 0) {
      md += `### 3.5 Optional Certainty of Evidence Assessment\n\n`;
      md += `A certainty assessment was included only because it was explicitly populated by the reviewer. It was not generated automatically.\n\n`;
      md += `| Evaluated Outcome | Studies | Risk / Rigor | Inconsistency | Indirectness | Imprecision | Publication Bias | Certainty Rating | Synthesis Summary |\n`;
      md += `| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n`;
      gradeItems.forEach((g) => {
        md += `| ${g.outcome} | ${g.numStudies} | ${g.riskOfBias} | ${g.inconsistency} | ${g.indirectness} | ${g.imprecision} | ${g.publicationBias} | ${g.overallCertainty} | ${g.explanation.replace(/\|/g, "/")} |\n`;
      });
      md += `\n`;
    } else {
      md += `### 3.5 Certainty Assessment\n\n`;
      md += `GRADE was not applied. Methodological quality was considered using the researcher-approved appraisal approach appropriate to the available study designs.\n\n`;
    }

    md += `## 4. Discussion\n\n`;
    md += `### 4.1 Principal Findings, Category Clusters, and Cross-Author Synthesis\n${discussion.item23aGeneralInterpretation}\n\n`;
    md += `### 4.2 Methodological Strengths and Limitations of Included Evidence\n${discussion.item23bLimitationsOfEvidence}\n\n`;
    md += `### 4.3 Limitations of Systematic Review Methodology\n${discussion.item23cLimitationsOfReviewProcess}\n\n`;
    md += `### 4.4 Practical Implications and Future Research Directions\n${discussion.item23dImplications}\n\n`;

    md += `## References of Included Studies\n\n`;
    includedRecords.forEach((r) => {
      const auth = (r.authors || []).join(", ") || "Unknown authors";
      md += `${auth} (${r.year || "n.d."}). ${r.title}. *${r.source || "Journal"}*${r.doi ? `, https://doi.org/${r.doi}` : ""}.\n\n`;
    });

    return md;
  };

  const handleCopy = () => {
    const md = generateFullMarkdown();
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const md = generateFullMarkdown();
    const blob = new Blob([md], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "Systematic_Literature_Review_Manuscript.md";
    a.click();
  };

  const handleDownloadDoc = () => {
    const formatBadge = (val: string) => {
      if (val === "Low" || val === "High Rigor" || val === "Met") {
        return `<span style="background-color: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 9pt;">Met / High</span>`;
      }
      if (val === "High" || val === "Low Rigor" || val === "Not Met") {
        return `<span style="background-color: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 9pt;">Unmet / Low</span>`;
      }
      return `<span style="background-color: #fef9c3; color: #854d0e; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 9pt;">Some Concerns</span>`;
    };

    const docHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${protocol.title || "Systematic Literature Review Manuscript"}</title>
  <style>
    body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.6; color: #1e293b; margin: 40px; }
    h1 { font-size: 20pt; font-weight: 800; color: #0f172a; margin-bottom: 8px; line-height: 1.25; }
    h2 { font-size: 14pt; font-weight: 700; color: #1e293b; border-bottom: 1.5pt solid #cbd5e1; padding-bottom: 4px; margin-top: 28px; margin-bottom: 12px; }
    h3 { font-size: 12pt; font-weight: 700; color: #334155; margin-top: 18px; margin-bottom: 6px; }
    h4 { font-size: 11pt; font-weight: 700; color: #475569; margin-top: 14px; margin-bottom: 4px; }
    p { margin-bottom: 12px; text-align: justify; }
    .meta-box { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; margin-bottom: 24px; border-radius: 4px; font-size: 10pt; }
    .abstract-box { background-color: #f1f5f9; border-left: 3pt solid #4338ca; padding: 14px 18px; margin-bottom: 24px; }
    table { border-collapse: collapse; width: 100%; margin: 18px 0; font-size: 10pt; page-break-inside: avoid; }
    th { background-color: #f1f5f9; color: #0f172a; font-weight: 700; padding: 8px 10px; border: 1px solid #cbd5e1; text-align: left; }
    td { padding: 7px 10px; border: 1px solid #e2e8f0; vertical-align: top; }
    tr:nth-child(even) { background-color: #f8fafc; }
    .table-caption { font-weight: 700; font-size: 11pt; color: #0f172a; margin-top: 20px; margin-bottom: 6px; }
  </style>
</head>
<body>

  <h1>${protocol.title || "Systematic Literature Review Manuscript"}</h1>
  <div class="meta-box">
    <strong>Review Methodology:</strong> ${protocol.reviewType}<br>
  </div>

  <div class="abstract-box">
    <h2 style="margin-top: 0; border-bottom: none; font-size: 13pt;">Abstract</h2>
    <p><strong>Background:</strong> ${abstract.bg}</p>
    <p><strong>Objectives:</strong> ${abstract.obj}</p>
    <p><strong>Methods:</strong> ${abstract.meth}</p>
    <p><strong>Results:</strong> ${abstract.res}</p>
    <p><strong>Discussion and Conclusion:</strong> ${abstract.concl}</p>
    <p><strong>Keywords:</strong> <em>${abstract.keywords.join(", ")}</em></p>
  </div>

  <h2>1. Introduction and Academic Rationale</h2>
  
  <h3>1.1 Scientific Rationale and Motivation for Conducting the Review</h3>
   <p>${protocol.introductionRationale || `This review examines evidence relevant to ${protocol.title || "the defined topic"}.`}</p>
  
  ${protocol.backgroundContext ? `<p>In theoretical and domain context, ${protocol.backgroundContext}</p>` : ""}
  ${protocol.knowledgeGap ? `<p>Regarding the existing literature gap, ${protocol.knowledgeGap}</p>` : ""}

  <h3>1.2 Review Objectives and Research Questions</h3>
  <p>The overarching objective of this investigation is ${objectives.map((obj) => `to ${obj.toLowerCase().replace(/^to\s+/, "")}`).join(", as well as ")}. In addressing this mandate, the systematic review addresses three core research questions: ${questions.map((q, i) => `Research question ${i + 1} investigates ${q.replace(/^RQ\d+:\s*/, "")}`).join(". Furthermore, ")}.</p>

  <h2>2. Methods</h2>
  
  <h3>2.1 Study Formulation and Scope Definition</h3>
  <p>${getFrameworkNarrative()}</p>

  <h3>2.2 Eligibility Criteria</h3>
  <p>Studies were eligible for inclusion if they satisfied predefined criteria encompassing ${protocol.eligibilityCriteria.inclusion.join(", ")}. Records were excluded when they met ${protocol.eligibilityCriteria.exclusion.join(", ")}. The planned synthesis grouping strategy follows ${protocol.eligibilityCriteria.groupingForSynthesis || "researcher-approved grouping criteria"}.</p>

  <h3>2.3 Information Sources and Search Strategy</h3>
  <p>${protocol.searchStrategies.length > 0 ? `The protocol documents search strategies for ${protocol.searchStrategies.map((s) => s.database).filter(Boolean).join(", ")}. Search execution is not claimed unless matching source records were uploaded.` : "No database search strategy is recorded. This report describes only uploaded records."}</p>

  <h3>2.4 Selection Process</h3>
  <p>The application distinguishes title and abstract screening from full-text eligibility. ${counts.assessed || 0} reports have recorded full-text assessments and ${includedRecords.length} studies have reviewer-approved inclusion. Independent duplicate review and adjudication are not claimed unless separately documented.</p>

  <h3>2.5 Methodological Quality and Risk of Bias Assessment Methods</h3>
  <p>Methodological quality was appraised using ${protocol.riskOfBiasMethods.toolName || "a transparent, study-design-appropriate framework"}. The approved domains were ${protocol.riskOfBiasMethods.domainsAssessed || "not specified"}.</p>

  <h2>3. Results</h2>

  <h3>3.1 Study Selection and Flow of Evidence</h3>
  <p>${counts.identifiedDb || 0} records were uploaded and ${counts.duplicatesRemoved || 0} duplicates were recorded as removed. ${counts.screened || 0} records have title and abstract decisions; ${counts.soughtRetrieval || 0} reports were sought, ${counts.notRetrieved || 0} were not retrieved, ${counts.assessed || 0} were assessed at full text, ${counts.assessedExcluded || 0} were excluded at full text, and ${includedRecords.length} studies were finally included.</p>

  <h3>3.2 Characteristics of Included Studies (Table 1)</h3>
  <div class="table-caption">Table 1: Characteristics of Included Studies Grouped by Category</div>
  <table>
    <thead>
      <tr>
        <th>Study</th>
        <th>Category / Paradigm</th>
        ${hasCountryData ? "<th>Country</th>" : ""}
        ${hasSampleData ? "<th>Sample / Dataset</th>" : ""}
        <th>Intervention / Exposure / Phenomenon</th>
        <th>Comparator</th>
        <th>Reported Outcome</th>
        <th>Study Design</th>
        <th>Key Finding</th>
      </tr>
    </thead>
    <tbody>
      ${characteristics.map((c) => `
        <tr>
          <td><strong>${c.authorYear}</strong></td>
          <td>${c.category || "Empirical"}</td>
          ${hasCountryData ? `<td>${c.country || "Not reported"}</td>` : ""}
          ${hasSampleData ? `<td>${c.sampleSize || "N/A"}</td>` : ""}
          <td><strong style="color: #4338ca;">${c.interventionOrFocus}</strong></td>
          <td>${c.comparator || "Not reported"}</td>
          <td><strong style="color: #065f46;">${c.primaryOutcome}</strong></td>
          <td>${c.studyDesign || "Empirical Study"}</td>
          <td>${c.keyFinding}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <h3>3.3 Methodological Quality and Rigor Assessment (Table 2)</h3>
  <div class="table-caption">Table 2: Methodological Quality and Rigor Appraisal Matrix</div>
  <table>
    <thead>
      <tr>
        <th>Study</th>
        <th style="text-align: center;">Study Design & Setup</th>
        <th style="text-align: center;">Data Adequacy</th>
        <th style="text-align: center;">Measurement Methodology</th>
        <th style="text-align: center;">Baseline Validation</th>
        <th style="text-align: center;">Repeatability & Reporting</th>
        <th style="text-align: center;">Overall Rigor</th>
        <th>Methodological Justification</th>
      </tr>
    </thead>
    <tbody>
      ${riskOfBias.map((r) => `
        <tr>
          <td><strong>${r.authorYear}</strong></td>
          <td style="text-align: center;">${formatBadge(r.d1Selection)}</td>
          <td style="text-align: center;">${formatBadge(r.d2Performance)}</td>
          <td style="text-align: center;">${formatBadge(r.d3Attrition)}</td>
          <td style="text-align: center;">${formatBadge(r.d4Detection)}</td>
          <td style="text-align: center;">${formatBadge(r.d5Reporting)}</td>
          <td style="text-align: center;">${formatBadge(r.overall)}</td>
          <td>${r.justification}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <h3>3.4 Evidence Synthesis Grouped by Study Characteristics and Author Similarities</h3>
  ${(synthesis.subtopics || []).map((st) => `
    <h4>${st.title}</h4>
    <p>${st.prose}</p>
  `).join("")}

  <h2>4. Discussion</h2>
  <h3>4.1 Principal Findings, Category Clusters, and Cross-Author Synthesis</h3>
  <p>${discussion.item23aGeneralInterpretation}</p>

  <h3>4.2 Methodological Strengths and Limitations of Included Evidence</h3>
  <p>${discussion.item23bLimitationsOfEvidence}</p>

  <h3>4.3 Limitations of Systematic Review Methodology</h3>
  <p>${discussion.item23cLimitationsOfReviewProcess}</p>

  <h3>4.4 Practical Implications and Future Research Directions</h3>
  <p>${discussion.item23dImplications}</p>

  <h2>References of Included Studies</h2>
  ${includedRecords.map((r) => {
    const auth = (r.authors || []).join(", ") || "Unknown authors";
    return `<p>${auth} (${r.year || "n.d."}). <em>${r.title}</em>. ${r.source || "Journal"}${r.doi ? `, doi:${r.doi}` : ""}.</p>`;
  }).join("")}

</body>
</html>`;

    const blob = new Blob([docHTML], { type: "application/msword;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(protocol.title || "Systematic_Literature_Review_Manuscript").replace(/[^a-zA-Z0-9]/g, "_").slice(0, 45)}.doc`;
    a.click();
  };

  return (
    <div id="full-review-report-container" className="space-y-6">
      {/* Action Bar */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] text-indigo-600 uppercase tracking-wider font-bold">
            Consolidated SLR Manuscript
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-0.5">
            Full Systematic Review Manuscript & Evidence Report
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative, publication-grade systematic review manuscript with a structured academic abstract, continuous paragraph statements without bullet points, categorized study characteristics, and cross-author synthesis.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopy}
            disabled={!generatedAbstract}
            title={!generatedAbstract ? "Generate the synthesis-level abstract before exporting" : undefined}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy Markdown"}
          </button>
          <button
            onClick={handleDownload}
            disabled={!generatedAbstract}
            title={!generatedAbstract ? "Generate the synthesis-level abstract before exporting" : undefined}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            Download Markdown (.md)
          </button>
          <button
            onClick={handleDownloadDoc}
            disabled={!generatedAbstract}
            title={!generatedAbstract ? "Generate the synthesis-level abstract before exporting" : undefined}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            Download Word (.doc)
          </button>
          <button
            onClick={() => window.print()}
            disabled={!generatedAbstract}
            title={!generatedAbstract ? "Generate the synthesis-level abstract before exporting" : undefined}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / PDF
          </button>
        </div>
      </div>

      {/* Formatted Manuscript Card */}
      <article className="bg-white border border-slate-200 p-8 sm:p-12 rounded-xl shadow-xs font-sans space-y-8 max-w-4xl mx-auto print:border-none print:shadow-none print:p-0">
        {/* Title Header */}
        <header className="border-b border-slate-200 pb-6 space-y-2">
          <div className="font-mono text-[10px] text-indigo-600 uppercase font-bold tracking-wider">
            Systematic Literature Review Manuscript
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {protocol.title || "Systematic Review Title"}
          </h1>
          <div className="text-xs font-mono text-slate-500 pt-1 space-y-1">
            <div>Methodology: <span className="font-semibold text-slate-800">{protocol.reviewType}</span></div>
          </div>
        </header>

        {/* Structured Academic Abstract */}
        <section className="bg-slate-50/80 border border-slate-200 p-6 sm:p-8 rounded-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <h2 className="text-base font-bold text-slate-900 font-mono flex items-center gap-2 uppercase tracking-wide">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              Structured Academic Abstract
            </h2>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono border px-2 py-0.5 rounded ${
                generatedAbstract
                  ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                  : abstractReady
                  ? "text-indigo-700 bg-indigo-50 border-indigo-200"
                  : "text-amber-700 bg-amber-50 border-amber-200"
              }`}>
                {generatedAbstract ? "Synthesis Abstract Ready" : abstractReady ? "Ready to Generate" : "Prerequisites Incomplete"}
              </span>
              <button
                onClick={handleGenerateAbstract}
                disabled={!abstractReady || generatingAbstract}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {generatingAbstract ? "Synthesizing..." : generatedAbstract ? "Regenerate Abstract" : "Generate Abstract"}
              </button>
            </div>
          </div>

          {!abstractReady && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              Complete all final-evidence stages first:
              <span className="ml-1 font-mono">
                selection {selectionComplete ? "✓" : "○"} · extraction {extractionComplete ? "✓" : "○"} · appraisal {appraisalComplete ? "✓" : "○"} · synthesis {synthesisComplete ? "✓" : "○"}
              </span>
            </div>
          )}
          {abstractError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              Abstract generation failed: {abstractError}
            </div>
          )}

          <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed font-sans text-justify">
            <p>
              <strong className="font-mono font-bold text-slate-900 uppercase text-[11px] mr-1.5">Background:</strong>
              {abstract.bg}
            </p>
            <p>
              <strong className="font-mono font-bold text-slate-900 uppercase text-[11px] mr-1.5">Objectives:</strong>
              {abstract.obj}
            </p>
            <p>
              <strong className="font-mono font-bold text-slate-900 uppercase text-[11px] mr-1.5">Methods:</strong>
              {abstract.meth}
            </p>
            <p>
              <strong className="font-mono font-bold text-slate-900 uppercase text-[11px] mr-1.5">Results:</strong>
              {abstract.res}
            </p>
            <p>
              <strong className="font-mono font-bold text-slate-900 uppercase text-[11px] mr-1.5">Discussion & Conclusion:</strong>
              {abstract.concl}
            </p>
            <div className="pt-2 border-t border-slate-200 text-xs font-mono text-slate-600">
              <strong className="text-slate-900 mr-1.5 font-bold">Keywords:</strong>
              <span className="text-slate-700 italic">{abstract.keywords.join(", ")}</span>
            </div>
          </div>
        </section>

        {/* Section 1: Introduction & Objectives */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">
            1. Introduction and Academic Rationale
          </h2>
          
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm font-mono">1.1 Scientific Rationale and Motivation for Conducting the Review</h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans text-justify">
              {protocol.introductionRationale || `This review examines evidence relevant to ${protocol.title || "the defined topic"}.`}
            </p>
            {protocol.backgroundContext && (
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans text-justify">
                In theoretical and domain context, {protocol.backgroundContext}
              </p>
            )}
            {protocol.knowledgeGap && (
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans text-justify">
                Regarding the existing literature gap, {protocol.knowledgeGap}
              </p>
            )}
          </div>

          <div className="space-y-2 pt-2">
            <h3 className="font-bold text-slate-900 text-sm font-mono">1.2 Review Objectives and Research Questions</h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans text-justify">
              The overarching objective of this investigation is {objectives.map((obj) => `to ${obj.toLowerCase().replace(/^to\s+/, "")}`).join(", as well as ")}. In addressing this mandate, the review investigates three core research questions: {questions.map((q, i) => `Research question ${i + 1} addresses ${q.replace(/^RQ\d+:\s*/, "")}`).join(". Furthermore, ")}.
            </p>
          </div>
        </section>

        {/* Section 2: Methods (PICOC in statement paragraph, no bullet points) */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">
            2. Methods
          </h2>
          <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <h3 className="font-bold text-slate-900 text-sm font-mono">2.1 Study Formulation and Scope Definition</h3>
            <p className="text-justify bg-indigo-50/40 p-4 rounded-xl border border-indigo-100">
              {getFrameworkNarrative()}
            </p>

            <h3 className="font-bold text-slate-900 text-sm font-mono">2.2 Eligibility Criteria</h3>
            <p className="text-justify">
              Studies were eligible for inclusion if they satisfied predefined criteria encompassing {protocol.eligibilityCriteria.inclusion.join(", ")}. Records were excluded when they met {protocol.eligibilityCriteria.exclusion.join(", ")}. Synthesis grouping was structured around {protocol.eligibilityCriteria.groupingForSynthesis || "researcher-approved grouping criteria"}.
            </p>

            <h3 className="font-bold text-slate-900 text-sm font-mono">2.3 Information Sources and Search Strategy</h3>
            <p className="text-justify">
              {protocol.searchStrategies.length > 0
                ? `The protocol documents search strategies for ${protocol.searchStrategies.map((s) => s.database).filter(Boolean).join(", ")}. Search execution is not claimed unless matching source records were uploaded.`
                : "No database search strategy is recorded. This report describes only uploaded records."}
            </p>

            <h3 className="font-bold text-slate-900 text-sm font-mono">2.4 Selection Process and Evidence Status</h3>
            <p className="text-justify">
              The application distinguishes title and abstract screening from full-text eligibility. {counts.assessed || 0} reports have recorded full-text assessments and {includedRecords.length} studies have reviewer-approved inclusion. Independent duplicate review and adjudication are not claimed unless separately documented.
            </p>

            <h3 className="font-bold text-slate-900 text-sm font-mono">2.5 Methodological Quality and Rigor Assessment Methods</h3>
            <p className="text-justify">
              Methodological quality was appraised using {protocol.riskOfBiasMethods.toolName || "a transparent, study-design-appropriate framework"}. The approved domains were {protocol.riskOfBiasMethods.domainsAssessed || "not specified"}.
            </p>
          </div>
        </section>

        {/* Section 3: Results */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">
            3. Results
          </h2>

          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-sm font-mono">3.1 Study Selection and Flow Diagram</h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed text-justify">
              The workspace contains {counts.identifiedDb || 0} uploaded records and {counts.duplicatesRemoved || 0} duplicates recorded as removed. {counts.screened || 0} records have title and abstract decisions; {counts.soughtRetrieval || 0} reports were sought, {counts.notRetrieved || 0} were not retrieved, {counts.assessed || 0} were assessed at full text, {counts.assessedExcluded || 0} were excluded at full text, and {includedRecords.length} studies were finally included.
            </p>

            {/* Illustrated Flow Diagram */}
            <div className="pt-2">
              <PrismaDiagram counts={counts} />
            </div>
          </div>

          {/* Table 1: Characteristics Grouped by Category */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono font-bold text-slate-900">
                Table 1: Characteristics of Included Studies Grouped by Category
              </div>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {characteristics.length} Primary Studies
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-[11px] font-sans">
                <thead className="bg-slate-50 border-b border-slate-200 font-mono text-[10px]">
                  <tr>
                    <th className="p-2.5 font-bold">Study</th>
                    <th className="p-2.5 font-bold">Category / Paradigm</th>
                    {hasCountryData && <th className="p-2.5 font-bold">Country</th>}
                    {hasSampleData && <th className="p-2.5 font-bold">Sample</th>}
                    <th className="p-2.5 font-bold">Intervention / Exposure / Phenomenon</th>
                    <th className="p-2.5 font-bold">Comparator</th>
                    <th className="p-2.5 font-bold">Reported Outcome</th>
                    <th className="p-2.5 font-bold">Study Design</th>
                    <th className="p-2.5 font-bold">Key Finding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {characteristics.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-mono font-semibold text-slate-900 whitespace-nowrap">{c.authorYear}</td>
                      <td className="p-2.5 font-mono text-indigo-900">{c.category || "Not categorized"}</td>
                      {hasCountryData && <td className="p-2.5">{c.country || "Not reported"}</td>}
                      {hasSampleData && <td className="p-2.5 font-mono">{c.sampleSize || "N/A"}</td>}
                      <td className="p-2.5 font-mono text-indigo-700 font-medium">{c.interventionOrFocus}</td>
                      <td className="p-2.5 text-slate-600">{c.comparator || "Not reported"}</td>
                      <td className="p-2.5 font-mono font-bold text-emerald-800">{c.primaryOutcome}</td>
                      <td className="p-2.5 text-slate-600">{c.studyDesign || "Not reported"}</td>
                      <td className="p-2.5 text-slate-700 italic">{c.keyFinding}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 2: Methodological Quality and Rigor Appraisal */}
          <div className="space-y-2 pt-4">
            <div className="text-xs font-mono font-bold text-slate-900">
              Table 2: Methodological Quality and Rigor Assessment Matrix
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-[11px] font-sans">
                <thead className="bg-slate-50 border-b border-slate-200 font-mono text-[10px]">
                  <tr>
                    <th className="p-2 font-bold">Study</th>
                    <th className="p-2 font-bold text-center">Design & Setup</th>
                    <th className="p-2 font-bold text-center">Data Adequacy</th>
                    <th className="p-2 font-bold text-center">Measurement</th>
                    <th className="p-2 font-bold text-center">Baseline Validation</th>
                    <th className="p-2 font-bold text-center">Repeatability</th>
                    <th className="p-2 font-bold text-center">Overall Rigor</th>
                    <th className="p-2 font-bold">Appraisal Justification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {riskOfBias.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="p-2 font-mono font-semibold">{r.authorYear}</td>
                      <td className="p-2 text-center font-mono text-[10px]">{r.d1Selection}</td>
                      <td className="p-2 text-center font-mono text-[10px]">{r.d2Performance}</td>
                      <td className="p-2 text-center font-mono text-[10px]">{r.d3Attrition}</td>
                      <td className="p-2 text-center font-mono text-[10px]">{r.d4Detection}</td>
                      <td className="p-2 text-center font-mono text-[10px]">{r.d5Reporting}</td>
                      <td className="p-2 text-center font-mono font-bold text-indigo-700">{r.overall}</td>
                      <td className="p-2 text-slate-600 text-[10px]">{r.justification}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Narrative Synthesis with Cross-Author Similarities */}
          <div className="space-y-3 pt-4">
            <h3 className="font-bold text-slate-900 text-sm font-mono">3.4 Evidence Synthesis Grouped by Study Characteristics and Author Similarities</h3>
            {(synthesis.subtopics || []).map((st, i) => (
              <div key={i} className="space-y-1">
                <h4 className="font-bold text-xs text-slate-900 font-mono">{st.title}</h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans text-justify">{st.prose}</p>
              </div>
            ))}
          </div>

          {/* Optional Table 3: reviewer-populated certainty assessment */}
          {gradeItems.length > 0 && <div className="space-y-2 pt-4">
            <div className="text-xs font-mono font-bold text-slate-900">
              Table 3: Certainty of Evidence and Summary of Findings
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-[11px] font-sans">
                <thead className="bg-slate-50 border-b border-slate-200 font-mono text-[10px]">
                  <tr>
                    <th className="p-2 font-bold">Outcome</th>
                    <th className="p-2 font-bold">Studies (N)</th>
                    <th className="p-2 font-bold">Certainty Rating</th>
                    <th className="p-2 font-bold">Synthesis Explanation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {gradeItems.map((g, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="p-2 font-mono font-semibold">{g.outcome}</td>
                      <td className="p-2 font-mono">{g.numStudies}</td>
                      <td className="p-2 font-mono font-bold text-emerald-800">{g.overallCertainty}</td>
                      <td className="p-2 text-slate-600">{g.explanation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>}
        </section>

        {/* Section 4: Discussion (Strictly in Statements / Paragraphs with Author Comparisons) */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">
            4. Discussion
          </h2>
          <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <div>
              <h3 className="font-bold text-slate-900 text-xs font-mono mb-1">4.1 Principal Findings, Category Clusters, and Cross-Author Synthesis</h3>
              <p className="text-justify">{discussion.item23aGeneralInterpretation}</p>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xs font-mono mb-1">4.2 Methodological Strengths and Limitations of Included Evidence</h3>
              <p className="text-justify">{discussion.item23bLimitationsOfEvidence}</p>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xs font-mono mb-1">4.3 Limitations of Systematic Review Methodology</h3>
              <p className="text-justify">{discussion.item23cLimitationsOfReviewProcess}</p>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xs font-mono mb-1">4.4 Practical Implications and Future Research Directions</h3>
              <p className="text-justify">{discussion.item23dImplications}</p>
            </div>
          </div>
        </section>

        {/* References */}
        <section className="space-y-3 border-t border-slate-200 pt-6">
          <h2 className="text-xl font-bold text-slate-900">
            References of Included Studies
          </h2>
          <div className="space-y-2 text-xs text-slate-600 font-sans leading-relaxed">
            {includedRecords.map((r, i) => (
              <p key={i} className="text-justify">
                <span className="font-semibold text-slate-800">{(r.authors || []).join(", ") || "Unknown authors"}</span> ({r.year || "n.d."}). {r.title}. <em>{r.source || "Journal"}</em>{r.doi ? `, doi:${r.doi}` : ""}.
              </p>
            ))}
          </div>
        </section>
      </article>
    </div>
  );
}
