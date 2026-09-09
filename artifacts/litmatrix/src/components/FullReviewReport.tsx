import React, { useState } from "react";
import {
  SLRProtocol,
  SLRRecord,
  ScreeningDecision,
  StudyCharacteristic,
  SynthesisResult,
  DiscussionSections,
} from "../types/slr";
import { Download, Copy, Printer, Check, BookOpen, FileText } from "lucide-react";
import PrismaDiagram from "./PrismaDiagram";

interface FullReviewReportProps {
  protocol: SLRProtocol;
  includedRecords: SLRRecord[];
  screenedRecords: SLRRecord[];
  screening: Record<string, ScreeningDecision>;
  characteristics: StudyCharacteristic[];
  synthesis: SynthesisResult;
  discussion: DiscussionSections;
  checklist: any[];
  counts: any;
}

interface LandscapeCount {
  label: string;
  count: number;
}

interface EvidenceLandscape {
  yearCounts: LandscapeCount[];
}

const countLabels = (labels: string[]) =>
  Array.from(
    labels.reduce((counts, label) => {
      counts.set(label, (counts.get(label) || 0) + 1);
      return counts;
    }, new Map<string, number>())
  )
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

const getEvidenceLandscape = (records: SLRRecord[]): EvidenceLandscape => ({
  yearCounts: countLabels(
    records.map((record) => record.year?.trim() || "Undated record")
  ).sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { numeric: true })
  ),
});

const summarizeLandscape = (counts: LandscapeCount[], limit = 4) =>
  counts.slice(0, limit).map((item) => `${item.label} (${item.count})`).join(", ");

const getCharacteristicsLandscape = (records: SLRRecord[], characteristics: StudyCharacteristic[]) => {
  const hasExtractedCharacteristics = characteristics.length > 0;
  const unavailable = "Not reported in supplied records";
  return {
    yearCounts: getEvidenceLandscape(records).yearCounts,
    categoryCounts: hasExtractedCharacteristics
      ? countLabels(characteristics.map((item) => item.category?.trim() || item.interventionOrFocus?.trim() || unavailable))
      : countLabels(records.map(() => unavailable)),
    contextCounts: hasExtractedCharacteristics
      ? countLabels(characteristics.map((item) => item.population?.trim() || unavailable))
      : countLabels(records.map(() => unavailable)),
    methodologyCounts: hasExtractedCharacteristics
      ? countLabels(characteristics.map((item) => item.studyDesign?.trim() || unavailable))
      : countLabels(records.map(() => unavailable)),
    outcomeCounts: hasExtractedCharacteristics
      ? countLabels(characteristics.map((item) => item.primaryOutcome?.trim() || unavailable))
      : countLabels(records.map(() => unavailable)),
    geographyCounts: hasExtractedCharacteristics
      ? countLabels(characteristics.map((item) => item.country?.trim() || unavailable))
      : countLabels(records.map(() => unavailable)),
  };
};

export default function FullReviewReport({
  protocol,
  includedRecords,
  screenedRecords,
  screening,
  characteristics,
  synthesis,
  discussion,
  checklist,
  counts,
}: FullReviewReportProps) {
  const [copied, setCopied] = useState(false);
  const configuredTitle = protocol.title?.trim();
  const manuscriptTitle = configuredTitle && !/^untitled systematic review$/i.test(configuredTitle)
    ? configuredTitle
    : synthesis.suggestedTitle?.trim()
    || "Systematic Literature Review Manuscript";
  const evidenceLandscape = getEvidenceLandscape(includedRecords);
  const characteristicsLandscape = getCharacteristicsLandscape(includedRecords, characteristics);
  const recordGroundedRationale = includedRecords.length > 0
    ? `This review examines ${manuscriptTitle} through ${includedRecords.length} included records. The descriptive evidence is summarized from the publication and study characteristics available for the included records.`
    : protocol.introductionRationale || `This review examines evidence relevant to ${manuscriptTitle}.`;

  const questions = protocol.primaryResearchQuestions || [
    "RQ1: What evidence directly addresses the review topic?",
    "RQ2: What methods, settings, and outcomes are reported?",
    "RQ3: What evidence gaps remain?",
  ];

  const objectives = protocol.secondaryObjectives || [
    "Describe the evidence by themes grounded in the included records",
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
      const s = protocol.objectivesPEO?.setting || "ecological and geographical setting";
      const d = protocol.objectivesPEO?.studyDesigns || protocol.objectivesPICO.studyDesigns;
      return `The review scope was structured around the PEO framework. The study population and ecological targets (P) include ${p}. The investigated exposure factors and environmental stressors (E) encompass ${e}. The evaluated ecological outcomes and impact metrics (O) reflect ${o}. The geographical and operational setting (S) corresponds to ${s}, with eligible study designs (D) restricted to ${d}.`;
    }
    if (fw === "SPIDER") {
      const s = protocol.objectivesSPIDER?.sample || protocol.objectivesPICO.population;
      const pi = protocol.objectivesSPIDER?.phenomenonOfInterest || protocol.objectivesPICO.intervention;
      const d = protocol.objectivesSPIDER?.design || "qualitative thematic investigations";
      const e = protocol.objectivesSPIDER?.evaluation || protocol.objectivesPICO.outcomes;
      const r = protocol.objectivesSPIDER?.researchType || "qualitative and mixed-methods research";
      return `The review was formulated around the SPIDER qualitative synthesis framework. The study sample (S) encompasses ${s}. The phenomenon of interest (PI) investigates ${pi}. The research design (D) incorporates ${d}. The evaluation criteria (E) assess ${e}, focusing on research types (R) classified as ${r}.`;
    }
    // Default PICO
    const p = protocol.objectivesPICO.population;
    const i = protocol.objectivesPICO.intervention;
    const c = protocol.objectivesPICO.comparator;
    const o = protocol.objectivesPICO.outcomes;
    const s = protocol.objectivesPICO.studyDesigns;
    return `The systematic review protocol was formulated around the PICO framework. The target population (P) comprises ${p}. The investigated intervention (I) encompasses ${i}. The comparison methods (C) consist of ${c}. The primary outcomes of interest (O) evaluate ${o}, with eligible study designs (S) defined as ${s}.`;
  };

  const getArticleRecord = (record: SLRRecord) => {
    const authors = record.authors?.join(", ") || "Author not reported";
    const journal = record.source || "Journal not reported";
    return `${record.title} — ${authors} — ${journal}`;
  };
  const getScreeningStatus = (record: SLRRecord) =>
    screening[record.id]?.agreed === true
      ? "Included"
      : screening[record.id]?.agreed === false
      ? "Excluded"
      : "Excluded";

  // Structured Abstract generator
  const getAbstractContent = () => {
    const bg = recordGroundedRationale;
    const obj = `This systematic review aimed to ${objectives.map((o) => o.toLowerCase().replace(/^to\s+/, "")).join(", and to ")}, addressing three principal research questions: ${questions.map((q, i) => `RQ${i + 1} (${q.replace(/^RQ\d+:\s*/, "")})`).join(", ")}.`;
    const searchDbs = protocol.searchStrategies.map((s) => s.database).join(", ") || "major electronic bibliographic databases";
    const meth = `The review draws on records from ${searchDbs}. Screening decisions follow predefined eligibility criteria, and the included evidence is organized for narrative and thematic synthesis.`;
    
    const res = `${includedRecords.length} records were retained for synthesis from ${counts.afterDedup || counts.screened || includedRecords.length} records after deduplication. Publication years were distributed as follows: ${summarizeLandscape(evidenceLandscape.yearCounts) || "no publication-year pattern was available"}. The descriptive evidence landscape was organized by study categories, contexts, methodological approaches, and reported outcome types.`;
    const concl = `The included literature presents a narrative and thematic evidence base organized around the reported methods, technologies, and outcomes. Interpretation is anchored to the findings and publication characteristics of the included records.`;
    const keywords = [
      protocol.reviewType || "Systematic Literature Review",
      "Evidence Synthesis",
      "Narrative Synthesis",
      "Publication Trends",
      "Thematic Evidence Landscape",
    ].filter(Boolean);

    return { bg, obj, meth, res, concl, keywords };
  };

  const abstract = getAbstractContent();

  const markdownCountTable = (heading: string, values: LandscapeCount[]) => {
    let table = `#### ${heading}\n\n| Description | Records |\n| --- | ---: |\n`;
    values.forEach((item) => {
      table += `| ${item.label.replace(/\|/g, "/")} | ${item.count} |\n`;
    });
    return `${table}\n`;
  };

  const escapeHtml = (value: any) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const cleanAppendixText = (value: any, fallback = "Not reported") =>
    typeof value === "string" && value.trim() ? value.trim() : fallback;

  const getSearchStrategyValue = (strategy: any, keys: string[]) => {
    for (const key of keys) {
      const value = strategy?.[key];
      if (typeof value === "string" && value.trim()) return value.trim();
      if (Array.isArray(value) && value.length > 0) {
        return value.map((item) => String(item)).join(", ");
      }
    }
    return "";
  };

  const getEligibilityCriteria = () => ({
    inclusion: Array.isArray(protocol.eligibilityCriteria?.inclusion)
      ? protocol.eligibilityCriteria.inclusion.filter(Boolean)
      : [],
    exclusion: Array.isArray(protocol.eligibilityCriteria?.exclusion)
      ? protocol.eligibilityCriteria.exclusion.filter(Boolean)
      : [],
  });

  const getSearchStrategies = () =>
    Array.isArray(protocol.searchStrategies) ? protocol.searchStrategies : [];

  const generateAppendixMarkdown = () => {
    const criteria = getEligibilityCriteria();
    let appendix = `## Appendix A. Eligibility Criteria\n\n`;
    appendix += `### A.1 Inclusion Criteria\n\n`;
    if (criteria.inclusion.length) {
      criteria.inclusion.forEach((item, index) => {
        appendix += `${index + 1}. ${item}\n`;
      });
    } else {
      appendix += `Not reported in the review protocol.\n`;
    }

    appendix += `\n### A.2 Exclusion Criteria\n\n`;
    if (criteria.exclusion.length) {
      criteria.exclusion.forEach((item, index) => {
        appendix += `${index + 1}. ${item}\n`;
      });
    } else {
      appendix += `Not reported in the review protocol.\n`;
    }

    appendix += `\n## Appendix B. Search Strategy and Search Strings\n\n`;
    const strategies = getSearchStrategies();

    if (!strategies.length) {
      appendix += `No search strategy was recorded in the review protocol.\n`;
      return appendix;
    }

    strategies.forEach((strategy: any, index: number) => {
      const database = cleanAppendixText(strategy?.database, `Source ${index + 1}`);
      const searchDate = getSearchStrategyValue(strategy, ["searchDate", "date", "searchedAt"]);
      const fields = getSearchStrategyValue(strategy, ["fields", "searchFields", "field"]);
      const searchString = getSearchStrategyValue(
        strategy,
        ["searchString", "query", "string", "searchQuery", "queryString"]
      );
      const filters = getSearchStrategyValue(strategy, ["filters", "filter", "limits", "limitations"]);

      appendix += `### B.${index + 1} ${database}\n\n`;
      appendix += `- Search date: ${searchDate || "Not reported"}\n`;
      appendix += `- Fields searched: ${fields || "Not reported"}\n`;
      appendix += `- Filters/limits: ${filters || "Not reported"}\n\n`;
      appendix += `**Exact stored search string:**\n\n`;
      appendix += "```text\n";
      appendix += `${searchString || "Not reported in the stored search strategy"}\n`;
      appendix += "```\n\n";
    });

    return appendix;
  };

  const generateAppendixHtml = () => {
    const criteria = getEligibilityCriteria();
    const strategies = getSearchStrategies();

    const listHtml = (items: string[]) =>
      items.length
        ? `<ol>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>`
        : `<p>Not reported in the review protocol.</p>`;

    let html = `<h2>Appendix A. Eligibility Criteria</h2>`;
    html += `<h3>A.1 Inclusion Criteria</h3>${listHtml(criteria.inclusion)}`;
    html += `<h3>A.2 Exclusion Criteria</h3>${listHtml(criteria.exclusion)}`;
    html += `<h2>Appendix B. Search Strategy and Search Strings</h2>`;

    if (!strategies.length) {
      html += `<p>No search strategy was recorded in the review protocol.</p>`;
      return html;
    }

    strategies.forEach((strategy: any, index: number) => {
      const database = cleanAppendixText(strategy?.database, `Source ${index + 1}`);
      const searchDate = getSearchStrategyValue(strategy, ["searchDate", "date", "searchedAt"]);
      const fields = getSearchStrategyValue(strategy, ["fields", "searchFields", "field"]);
      const searchString = getSearchStrategyValue(
        strategy,
        ["searchString", "query", "string", "searchQuery", "queryString"]
      );
      const filters = getSearchStrategyValue(strategy, ["filters", "filter", "limits", "limitations"]);

      html += `<h3>B.${index + 1} ${escapeHtml(database)}</h3>`;
      html += `<p><strong>Search date:</strong> ${escapeHtml(searchDate || "Not reported")}<br>`;
      html += `<strong>Fields searched:</strong> ${escapeHtml(fields || "Not reported")}<br>`;
      html += `<strong>Filters/limits:</strong> ${escapeHtml(filters || "Not reported")}</p>`;
      html += `<p><strong>Exact stored search string:</strong></p>`;
      html += `<pre class="search-string">${escapeHtml(searchString || "Not reported in the stored search strategy")}</pre>`;
    });

    return html;
  };

  const generateFullMarkdown = () => {
    let md = `# ${manuscriptTitle}\n\n`;
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
    md += `${recordGroundedRationale}\n\n`;

    if (protocol.backgroundContext && includedRecords.length === 0) {
      md += `In theoretical and domain context, ${protocol.backgroundContext}\n\n`;
    }

    if (protocol.knowledgeGap && includedRecords.length === 0) {
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
    md += `Records were eligible for inclusion if they satisfied predefined criteria encompassing ${incText}. Records were excluded if they exhibited ${excText}. The planned synthesis grouping strategy follows ${protocol.eligibilityCriteria.groupingForSynthesis || "thematic and technological categorization"}.\n\n`;

    md += `### 2.3 Information Sources and Search Strategy\n`;
    const searchDatabases = protocol.searchStrategies.map((s) => s.database).join(", ");
    md += `Comprehensive systematic search strategies were executed across major academic databases, including ${searchDatabases}. Queries combined Boolean operators, controlled vocabulary terms, and truncation tailored to each database search syntax.\n\n`;

    md += `### 2.4 Study Selection\n`;
    md += `Records were screened against the predefined eligibility criteria using the available title, abstract, and bibliographic information. The final included set was used for the reported descriptive and narrative synthesis. No full-text retrieval or full-text eligibility assessment was performed.\n\n`;

    md += `## 3. Results\n\n`;
    md += `### 3.1 Study Selection and Flow of Evidence\n`;
    const afterDedup = counts.afterDedup ?? counts.screened ?? screenedRecords.length;
    const excludedCount = counts.screenedExcluded ?? Math.max(0, afterDedup - includedRecords.length);
    md += `${counts.uploaded ?? counts.identifiedDb ?? 0} records were uploaded, including ${counts.duplicatesRemoved ?? 0} duplicates recorded as removed. After deduplication, ${afterDedup} records remained. Of these, ${includedRecords.length} were included and ${excludedCount} were excluded. No full-text retrieval or full-text eligibility assessment was performed in this workflow.\n\n`;

    md += `### 3.1 Screening Decision Audit Table (Table 1)\n\n`;
    md += `| Article Information (Title, Author & Journal) | Screening Status | Academic Screening Justification |\n`;
    md += `| --- | --- | --- |\n`;
    screenedRecords.forEach((record) => {
      const justification = screening[record.id]?.reason || "No screening justification was supplied for this record.";
      md += `| ${getArticleRecord(record).replace(/\|/g, "/")} | ${getScreeningStatus(record)} | ${justification.replace(/\|/g, "/")} |\n`;
    });
    md += `\n`;

    md += `### 3.2 Characteristics of Included Studies\n\n`;
    md += `${includedRecords.length} included studies contributed to the descriptive results. The available characteristics are summarized across publication year, study or intervention category, context, methodological approach, reported outcome type, and geographical context where reported.\n\n`;
    md += markdownCountTable("Publication year distribution", characteristicsLandscape.yearCounts);
    md += markdownCountTable("Study and intervention categories", characteristicsLandscape.categoryCounts);
    md += markdownCountTable("Contexts", characteristicsLandscape.contextCounts);
    md += markdownCountTable("Methodological approaches", characteristicsLandscape.methodologyCounts);
    md += markdownCountTable("Reported outcome types", characteristicsLandscape.outcomeCounts);
    md += markdownCountTable("Geographical context", characteristicsLandscape.geographyCounts);

    md += `### 3.3 Descriptive Evidence Landscape\n\n`;
    md += `The descriptive landscape is reported using characteristics directly available for the included records. No predefined keyword taxonomy was used to assign records to themes.\n\n`;

    md += `### 3.3 Narrative and Thematic Synthesis\n\n`;
    synthesis.subtopics.forEach((sub) => {
      md += `#### ${sub.title}\n${sub.prose}\n\n`;
    });

    if (synthesis.heterogeneityDiscussion) {
      md += `Across-record patterns and differences were described as follows: ${synthesis.heterogeneityDiscussion}\n\n`;
    }

    md += `## 4. Discussion\n\n`;
    md += `### 4.1 Principal Findings, Category Clusters, and Cross-Author Synthesis\n${discussion.item23aGeneralInterpretation}\n\n`;
    md += `### 4.2 Methodological Characteristics of Included Evidence\n${discussion.item23bLimitationsOfEvidence}\n\n`;
    md += `### 4.3 Review Methodological Context\n${discussion.item23cLimitationsOfReviewProcess}\n\n`;
    md += `### 4.4 Practical Implications and Future Research Directions\n${discussion.item23dImplications}\n\n`;

    md += generateAppendixMarkdown();
    md += `\n## References of Included Studies\n\n`;
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

  const htmlCountTable = (heading: string, values: LandscapeCount[]) => `
    <div class="table-caption">${heading}</div>
    <table>
      <thead><tr><th>Description</th><th>Records</th></tr></thead>
      <tbody>${values.map((item) => `<tr><td>${item.label}</td><td>${item.count}</td></tr>`).join("")}</tbody>
    </table>
  `;

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
  <title>${manuscriptTitle}</title>
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
    .search-string { white-space: pre-wrap; word-break: break-word; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; font-family: "Courier New", monospace; font-size: 9pt; }
  </style>
</head>
<body>

  <h1>${manuscriptTitle}</h1>
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
   <p>${recordGroundedRationale}</p>
  
   ${protocol.backgroundContext && includedRecords.length === 0 ? `<p>In theoretical and domain context, ${protocol.backgroundContext}</p>` : ""}
   ${protocol.knowledgeGap && includedRecords.length === 0 ? `<p>Regarding the existing literature gap, ${protocol.knowledgeGap}</p>` : ""}

  <h3>1.2 Review Objectives and Research Questions</h3>
  <p>The overarching objective of this investigation is ${objectives.map((obj) => `to ${obj.toLowerCase().replace(/^to\s+/, "")}`).join(", as well as ")}. In addressing this mandate, the systematic review addresses three core research questions: ${questions.map((q, i) => `Research question ${i + 1} investigates ${q.replace(/^RQ\d+:\s*/, "")}`).join(". Furthermore, ")}.</p>

  <h2>2. Methods</h2>
  
  <h3>2.1 Study Formulation and Scope Definition</h3>
  <p>${getFrameworkNarrative()}</p>

  <h3>2.2 Eligibility Criteria</h3>
  <p>Records were eligible for inclusion if they satisfied predefined criteria encompassing ${protocol.eligibilityCriteria.inclusion.join(", ")}. Records were excluded if they exhibited ${protocol.eligibilityCriteria.exclusion.join(", ")}. The planned synthesis grouping strategy follows ${protocol.eligibilityCriteria.groupingForSynthesis || "thematic and technological categorization"}.</p>

  <h3>2.3 Information Sources and Search Strategy</h3>
  <p>Search strategies were conducted across the configured information sources (${protocol.searchStrategies.map((s) => s.database).join(", ")}). The exact stored search strings and available search metadata are reproduced in Appendix B.</p>

  <h3>2.4 Study Selection</h3>
  <p>Records were screened against the predefined eligibility criteria using the available title, abstract, and bibliographic information. The final included set was used for the reported descriptive and narrative synthesis. No full-text retrieval or full-text eligibility assessment was performed.</p>

  <h2>3. Results</h2>

  <h3>3.1 Study Selection and Flow of Evidence</h3>
  <p>${counts.uploaded || counts.identifiedDb || 0} records were uploaded, including ${counts.duplicatesRemoved || 0} duplicates recorded as removed. After deduplication, ${counts.afterDedup || counts.screened || 0} records remained, with ${includedRecords.length} included and ${(counts.afterDedup || counts.screened || 0) - includedRecords.length} excluded. The results describe the records retained by the configured screening criteria.</p>

  <h3>3.1 Screening Decision Audit Table (Table 1)</h3>
  <div class="table-caption">Table 1: Article information, screening status, and academic screening justification</div>
  <table>
    <thead>
      <tr>
        <th>Article Information (Title, Author &amp; Journal)</th>
        <th>Screening Status</th>
        <th>Academic Screening Justification</th>
      </tr>
    </thead>
    <tbody>
      ${screenedRecords.map((record) => {
        return `
        <tr>
          <td><strong>${getArticleRecord(record)}</strong></td>
          <td>${getScreeningStatus(record)}</td>
          <td>${screening[record.id]?.reason || "No screening justification was supplied for this record."}</td>
        </tr>
      `;
      }).join("")}
    </tbody>
  </table>

  <h3>3.2 Characteristics of Included Studies</h3>
  <p>${includedRecords.length} included studies contributed to the descriptive results. The available characteristics are summarized across publication year, study or intervention category, context, methodological approach, reported outcome type, and geographical context where reported.</p>
  ${htmlCountTable("Publication year distribution", characteristicsLandscape.yearCounts)}
  ${htmlCountTable("Study and intervention categories", characteristicsLandscape.categoryCounts)}
  ${htmlCountTable("Contexts", characteristicsLandscape.contextCounts)}
  ${htmlCountTable("Methodological approaches", characteristicsLandscape.methodologyCounts)}
  ${htmlCountTable("Reported outcome types", characteristicsLandscape.outcomeCounts)}
  ${htmlCountTable("Geographical context", characteristicsLandscape.geographyCounts)}

  <h3>3.3 Evidence Landscape</h3>
  <p>The main record-derived thematic categories were ${summarizeLandscape(evidenceLandscape.themeCounts) || "not specified in the supplied records"}.</p>
  ${htmlCountTable("Main thematic and intervention categories", evidenceLandscape.themeCounts)}

  <h3>3.4 Narrative and Thematic Synthesis</h3>
  ${synthesis.subtopics.map((st) => `
    <h4>${st.title}</h4>
    <p>${st.prose}</p>
  `).join("")}

  <h2>4. Discussion</h2>
  <h3>4.1 Principal Findings, Category Clusters, and Cross-Author Synthesis</h3>
  <p>${discussion.item23aGeneralInterpretation}</p>

  <h3>4.2 Methodological Characteristics of Included Evidence</h3>
  <p>${discussion.item23bLimitationsOfEvidence}</p>

  <h3>4.3 Review Methodological Context</h3>
  <p>${discussion.item23cLimitationsOfReviewProcess}</p>

  <h3>4.4 Practical Implications and Future Research Directions</h3>
  <p>${discussion.item23dImplications}</p>

  ${generateAppendixHtml()}

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
    a.download = `${manuscriptTitle.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 45)}.doc`;
    a.click();
  };

  return (
    <div id="full-review-report-container" className="space-y-6">
{/* Narrative Synthesis with Cross-Author Similarities */}
          <div className="space-y-3 pt-4">
              <h3 className="font-bold text-slate-900 text-sm font-mono">3.4 Narrative and Thematic Synthesis</h3>
            {synthesis.subtopics.map((st, i) => (
              <div key={i} className="space-y-1">
                <h4 className="font-bold text-xs text-slate-900 font-mono">{st.title}</h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans text-justify">{st.prose}</p>
              </div>
            ))}
          </div>

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
              <h3 className="font-bold text-slate-900 text-xs font-mono mb-1">4.2 Methodological Characteristics of Included Evidence</h3>
              <p className="text-justify">{discussion.item23bLimitationsOfEvidence}</p>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xs font-mono mb-1">4.3 Review Methodological Context</h3>
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
