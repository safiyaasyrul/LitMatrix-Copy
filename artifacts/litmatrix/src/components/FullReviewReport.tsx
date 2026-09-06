import React, { useEffect, useState } from "react";
import {
  SLRProtocol,
  SLRRecord,
  StudyCharacteristic,
  AbstractReportingAssessment,
  SynthesisResult,
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

interface StructuredJournalManuscript {
  title: string;
  abstract: StructuredAbstract;
  introduction: string;
  methods: string;
  results: string;
  discussion: string;
  conclusion: string;
  keywords: string[];
}

interface FullReviewReportProps {
  protocol: SLRProtocol;
  includedRecords: SLRRecord[];
  characteristics: StudyCharacteristic[];
  reportingAssessments: AbstractReportingAssessment[];
  synthesis: SynthesisResult;
  discussion: DiscussionSections;
  checklist: PrismaChecklistItem[];
  counts: any;
  aiConfig: AIProviderConfig;
}

export default function FullReviewReport({
  protocol,
  includedRecords,
  characteristics,
  reportingAssessments,
  synthesis,
  discussion,
  checklist,
  counts,
  aiConfig,
}: FullReviewReportProps) {
  const [copied, setCopied] = useState(false);
  const [generatedAbstract, setGeneratedAbstract] = useState<StructuredAbstract | null>(null);
  const [generatingAbstract, setGeneratingAbstract] = useState(false);
  const [abstractError, setAbstractError] = useState<string | null>(null);
  const [generatedManuscript, setGeneratedManuscript] = useState<StructuredJournalManuscript | null>(null);
  const [generatingManuscript, setGeneratingManuscript] = useState(false);
  const [manuscriptError, setManuscriptError] = useState<string | null>(null);
  const [grammarChecking, setGrammarChecking] = useState(false);
  const [grammarChecked, setGrammarChecked] = useState(false);

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
  const uploadedDatabaseNames = (counts.identifiedDbSources || []).filter(Boolean);
  const executedSearchNarrative = uploadedDatabaseNames.length > 0
    ? `The uploaded records identify ${uploadedDatabaseNames.join(", ")} as the database source${uploadedDatabaseNames.length === 1 ? "" : "s"} represented in this review. This report does not list planned databases as searched unless their records are represented in the uploaded provenance.`
    : "No executed database search is claimed because the uploaded records do not contain database provenance.";

  const includedIds = new Set(includedRecords.map((record) => record.id));
  const extractedIds = new Set(
    characteristics.filter((item) => includedIds.has(item.recordId)).map((item) => item.recordId)
  );
  const appraisedIds = new Set(
    reportingAssessments.filter((item) => includedIds.has(item.recordId)).map((item) => item.recordId)
  );
  const selectionComplete =
    includedRecords.length > 0 && (counts.recordsNotScreened || 0) === 0;
  const extractionComplete =
    includedRecords.length > 0 && includedRecords.every((record) => extractedIds.has(record.id));
  const reportingComplete =
    includedRecords.length > 0 && includedRecords.every((record) => appraisedIds.has(record.id));
  const rqFindings = synthesis.rqFindings || [];
  const expectedRqIds = questions.map((_, index) => `RQ${index + 1}`);
  const rqSynthesisComplete =
    expectedRqIds.length > 0 &&
    expectedRqIds.every((rqId) =>
      rqFindings.some(
        (finding) => finding.rqId === rqId && Boolean(finding.synthesizedAnswer?.trim())
      )
    );
  const synthesisComplete =
    synthesis.status === "finalized" &&
    Boolean(synthesis.descriptiveSynthesis?.overview?.trim()) &&
    (synthesis.studyEvidence?.length || 0) > 0 &&
    (synthesis.subtopics?.length || 0) > 0 &&
    (synthesis.clusters?.length || 0) > 0 &&
    rqSynthesisComplete &&
    Boolean(synthesis.crossStudySynthesis?.overallPatterns?.trim()) &&
    Boolean(synthesis.crossStudySynthesis?.evidenceGaps?.trim()) &&
    (synthesis.researchGaps?.length || 0) > 0 &&
    (synthesis.futureResearchAgenda?.length || 0) > 0;
  const abstractReady =
    selectionComplete && extractionComplete && reportingComplete && synthesisComplete;

  const removeCitationArtifacts = (value: string) =>
    value
      .replace(/\b[A-ZÀ-ÖØ-Þ][\p{L}'’-]+(?:\s+(?:and|&)\s+[A-ZÀ-ÖØ-Þ][\p{L}'’-]+)?\s+et\s+al\.?,?\s*\(?\d{4}[a-z]?\)?/giu, "")
      .replace(/\([^)]*(?:19|20)\d{2}[a-z]?[^)]*\)/gi, "")
      .replace(/\[(?:\d+\s*[,–-]?\s*)+\]/g, "")
      .replace(/https?:\/\/\S+|doi:\s*\S+/gi, "")
      .replace(/\s{2,}/g, " ")
      .replace(/\s+([,.;:])/g, "$1")
      .trim();

  const citationKeyByRecordId = new Map(
    includedRecords.map((record) => [
      record.id,
      record.authors?.[0]
        ? `${record.authors[0]}${record.authors.length > 1 ? " et al." : ""}, ${record.year || "n.d."}`
        : `${record.id}, ${record.year || "n.d."}`,
    ])
  );

  const resolveCitationMarkers = (value: string) =>
    value.replace(/\{\{([^}]+)\}\}/g, (_, recordId: string) => {
      const citation = citationKeyByRecordId.get(recordId.trim());
      return citation ? `(${citation})` : "";
    });

  const renderJournalText = (value: string) =>
    resolveCitationMarkers(value)
      .replace(/(^|\n)\s*(?:[-*•]|\d+[.)](?!\d))\s+/g, "$1")
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);

  const renderJournalBlocks = (value: string) => {
    const normalized = resolveCitationMarkers(value)
      .replace(/(^|\n)\s*(?:[-*•]|\d+[.)](?!\d))\s+/g, "$1")
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .filter(Boolean);
    const headingPattern = /^\d+(?:\.\d+)+\s+[^.!?]+$/;

    return normalized.flatMap((block) => {
      const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
      if (lines.length > 1 && headingPattern.test(lines[0])) {
        return [
          { kind: "heading" as const, text: lines[0] },
          { kind: "paragraph" as const, text: lines.slice(1).join(" ") },
        ];
      }
      if (lines.length === 1 && headingPattern.test(lines[0])) {
        return [{ kind: "heading" as const, text: lines[0] }];
      }
      return [{ kind: "paragraph" as const, text: lines.join(" ") }];
    });
  };

  const abstractStatement = (value: StructuredAbstract) =>
    [value.bg, value.obj, value.meth, value.res, value.concl]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(" ");

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const pendingAbstract: StructuredAbstract = {
    bg: abstractReady
      ? "The finalized synthesis is ready to be compressed into a structured abstract."
      : "Generate the abstract after final study selection, extraction, methodological appraisal, and evidence synthesis are complete.",
    obj: "The review objective will be summarized from the approved protocol.",
    meth: "The methods summary will report only recorded search, title/abstract screening, appraisal, and synthesis procedures.",
    res: abstractReady
      ? "Select Generate Abstract to create Results from the finalized RQ findings and cross-study synthesis."
      : "Synthesis-level results are not yet available for abstract generation.",
    concl: abstractReady
      ? "The generated conclusion will compress the finalized patterns, gaps, and cautious implications."
      : "No abstract conclusion is generated before the finalized synthesis is available.",
    keywords: [protocol.reviewType || "Systematic Review", "Evidence Synthesis"],
  };

  const abstract = generatedAbstract || pendingAbstract;

  useEffect(() => {
    setGeneratedAbstract(null);
    setAbstractError(null);
    setGeneratedManuscript(null);
    setManuscriptError(null);
    setGrammarChecked(false);
  }, [synthesis, protocol.primaryResearchQuestions, protocol.title, includedRecords.length]);

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
      rqBasedFindings: rqFindings.map((item) => ({
        rqId: item.rqId,
        question: removeCitationArtifacts(item.question),
        synthesizedAnswer: removeCitationArtifacts(item.synthesizedAnswer),
        dominantPatterns: removeCitationArtifacts(item.dominantPatterns),
        contradictions: removeCitationArtifacts(item.contradictions),
        evidenceGaps: removeCitationArtifacts(item.evidenceGaps),
      })),
      integratedSynthesis: synthesis.crossStudySynthesis
        ? {
            overallPatterns: removeCitationArtifacts(synthesis.crossStudySynthesis.overallPatterns),
            contradictions: removeCitationArtifacts(synthesis.crossStudySynthesis.contradictions),
            evidenceGaps: removeCitationArtifacts(synthesis.crossStudySynthesis.evidenceGaps),
            implications: removeCitationArtifacts(synthesis.crossStudySynthesis.implications),
          }
        : null,
      researchGaps: synthesis.researchGaps || [],
      futureResearchAgenda: synthesis.futureResearchAgenda || [],
      heterogeneity: removeCitationArtifacts(synthesis.heterogeneityDiscussion || ""),
    };
    const appraisalSummary = {
      totalAssessed: reportingAssessments.filter((item) => includedIds.has(item.recordId)).length,
      completeness: reportingAssessments
        .filter((item) => includedIds.has(item.recordId))
        .reduce((counts, item) => {
          counts[item.abstractReportingCompleteness] += 1;
          return counts;
        }, { High: 0, Moderate: 0, Low: 0 } as Record<"High" | "Moderate" | "Low", number>),
      note: "Abstract-reporting appraisal only; no risk-of-bias or certainty judgment was assigned.",
    };
    const uploadedSources = counts.identifiedDbSources?.join(", ") || "uploaded source records";
    const recordedSearchDates = protocol.informationSources
      .map((source) => source.lastSearchedDate)
      .filter(Boolean)
      .join(", ");
    const synthesisApproach =
      protocol.synthesisMethods?.synthesisModel ||
      protocol.eligibilityCriteria.groupingForSynthesis ||
      "narrative and thematic synthesis";
    const risAbstractEvidence = includedRecords.map((record) => ({
      recordId: record.id,
      title: record.title,
      authors: record.authors,
      year: record.year,
      source: record.source,
      abstract: record.abstract,
    }));

    const prompt = `Generate a structured systematic-review abstract from the uploaded RIS records and their abstracts.

Review title: ${protocol.title}
Approved rationale: ${protocol.introductionRationale || protocol.backgroundContext || "Not provided"}
Approved objectives: ${JSON.stringify(objectives)}
Recorded methods: Databases or sources represented in uploaded records: ${uploadedSources}. Recorded search period or dates: ${recordedSearchDates || protocol.eligibilityCriteria.timeframe || "not reported"}. Reporting framework: PRISMA 2020. Records screened by title and abstract: ${counts.screened || 0}. Reviewer-confirmed included records: ${includedRecords.length}. Synthesis approach: ${synthesisApproach}. Appraisal approach: structured abstract-reporting checklist; no formal risk-of-bias judgment.
Uploaded RIS records and abstracts (sole empirical source): ${JSON.stringify(risAbstractEvidence)}
Finalized synthesis map to use only for organization, then verify against the RIS records: ${JSON.stringify(synthesisEvidence)}
Methodological appraisal summary: ${JSON.stringify(appraisalSummary)}

STRICT ABSTRACT RULES:
1. Return Background, Objective, Methods, Results, Conclusion, and Keywords.
2. Results must answer the approved research questions by comparing what the uploaded RIS abstracts actually report. Use the finalized synthesis only to locate candidate patterns, then verify every pattern against the RIS records. Summarize approaches, outcomes, consistencies, contradictions, weak reporting, and gaps without inventing details.
3. Do not list studies or write a sequence of individual-study findings.
4. Do not include author names, years, citations, reference numbers, DOI links, or URLs anywhere.
5. Do not derive findings from screening counts, keyword frequencies, titles alone, excluded records, or records with missing abstracts.
6. Use only the supplied RIS records and abstracts for empirical content. If a relationship is not directly supported by those records, omit it.
7. Do not invent numerical values. Use recorded flow counts only in Methods or Results when useful.
8. Do not report pooled effects, confidence intervals, heterogeneity statistics, GRADE ratings, p-values, or meta-analysis unless present in the supplied finalized synthesis.
9. The Conclusion must state what the total evidence means, the principal research gap, and cautious implications. It must not turn association, prediction, modelling performance, or theoretical potential into demonstrated real-world effectiveness.
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
      const message = error?.message || "The synthesis abstract could not be generated.";
      setAbstractError(
        message.includes("(401)")
          ? `${message} The managed provider rejected this request; please retry once so its server-side session can refresh.`
          : message
      );
    } finally {
      setGeneratingAbstract(false);
    }
  };

  const runGrammarCheck = async (draft: StructuredJournalManuscript) => {
    const grammarPrompt = `Perform a publication-grade grammar and academic-style check on the supplied systematic-review manuscript.

Return ONLY valid JSON with the exact same structure and fields as the input.

Correct spelling, grammar, punctuation, sentence structure, agreement, tense consistency, word choice, and awkward repetition. Improve transitions and formal journal readability. Keep all sections as continuous academic prose paragraphs. Preserve numbered manuscript subheadings such as “3.1 Study Selection” and “4.1 Principal Findings” on their own lines; do not turn them into bullets, numbered lists, magazine-style labels, promotional language, or decorative formatting.

Do not change the scientific meaning, study counts, dates, methods, results, limitations, evidence strength, citation markers, record identifiers, or conclusions. Do not add facts, citations, studies, numerical results, external context, or interpretations. Do not remove any evidence statement. Treat the uploaded RIS records and abstracts as the only factual source; grammar correction must never turn a derived synthesis phrase into a new factual claim. The abstract segments must remain suitable for one single continuous abstract paragraph when concatenated.

Input manuscript:
${JSON.stringify(draft)}`;
    const text = await callAI(
      grammarPrompt,
      "You are a senior scientific copy editor. Correct language only; preserve every evidence-grounded claim exactly.",
      aiConfig
    );
    const parsed = parseJSONLoose(text);
    if (!parsed?.introduction || !parsed?.methods || !parsed?.results || !parsed?.discussion || !parsed?.conclusion) {
      throw new Error("The grammar checker did not return a complete manuscript.");
    }
    const normalize = (value: unknown) => resolveCitationMarkers(String(value || "").trim());
    const normalizedAbstract = {
      bg: normalize(parsed.abstract?.bg || draft.abstract.bg),
      obj: normalize(parsed.abstract?.obj || draft.abstract.obj),
      meth: normalize(parsed.abstract?.meth || draft.abstract.meth),
      res: normalize(parsed.abstract?.res || draft.abstract.res),
      concl: normalize(parsed.abstract?.concl || draft.abstract.concl),
      keywords: Array.isArray(parsed.abstract?.keywords)
        ? parsed.abstract.keywords.map((item: unknown) => String(item)).filter(Boolean).slice(0, 6)
        : draft.abstract.keywords,
    };
    return {
      title: normalize(parsed.title || draft.title),
      abstract: normalizedAbstract,
      introduction: normalize(parsed.introduction),
      methods: normalize(parsed.methods),
      results: normalize(parsed.results),
      discussion: normalize(parsed.discussion),
      conclusion: normalize(parsed.conclusion),
      keywords: Array.isArray(parsed.keywords)
        ? parsed.keywords.map((item: unknown) => String(item)).filter(Boolean).slice(0, 6)
        : normalizedAbstract.keywords,
    } satisfies StructuredJournalManuscript;
  };

  const handleGrammarCheck = async () => {
    if (!generatedManuscript || grammarChecking) return;
    setGrammarChecking(true);
    setManuscriptError(null);
    try {
      const checked = await runGrammarCheck(generatedManuscript);
      setGeneratedManuscript(checked);
      setGeneratedAbstract(checked.abstract);
      setGrammarChecked(true);
    } catch (error: any) {
      setManuscriptError(error?.message || "The grammar check could not be completed.");
    } finally {
      setGrammarChecking(false);
    }
  };

  const handleGenerateManuscript = async () => {
    if (!abstractReady || generatingManuscript) return;
    setGeneratingManuscript(true);
    setManuscriptError(null);

    const risEvidence = includedRecords.map((record) => ({
      recordId: record.id,
      citationKey: citationKeyByRecordId.get(record.id),
      title: record.title,
      authors: record.authors,
      year: record.year,
      source: record.source,
      databaseSource: record.databaseSource,
      doi: record.doi,
      abstract: record.abstract,
    }));

    const manuscriptEvidence = {
      approvedProtocol: {
        title: protocol.title,
        reviewType: protocol.reviewType,
        rationale: protocol.introductionRationale,
        background: protocol.backgroundContext,
        knowledgeGap: protocol.knowledgeGap,
        objectives: protocol.secondaryObjectives,
        researchQuestions: questions,
        formulationFramework: protocol.formulationFramework,
        objectivesPICO: protocol.objectivesPICO,
        objectivesPICOC: protocol.objectivesPICOC,
        objectivesPEO: protocol.objectivesPEO,
        objectivesSPIDER: protocol.objectivesSPIDER,
        inclusion: protocol.eligibilityCriteria.inclusion,
        exclusion: protocol.eligibilityCriteria.exclusion,
        groupingForSynthesis: protocol.eligibilityCriteria.groupingForSynthesis,
        timeframe: protocol.eligibilityCriteria.timeframe,
        language: protocol.eligibilityCriteria.language,
      },
      executedReviewFlow: {
        counts,
        uploadedDatabaseSources: counts.identifiedDbSources || [],
        includedRecordCount: includedRecords.length,
        selectionStatement:
          "Reviewer-confirmed title/abstract inclusions are final in this workflow. Full-text retrieval and eligibility assessment were not performed.",
        appraisalStatement:
          "Abstract-level reporting completeness only; Unclear means not reported in the abstract, not high risk of bias.",
      },
      risRecords: risEvidence,
      studyCharacteristics: characteristics,
      reportingAssessments,
      finalizedSynthesis: {
        descriptiveSynthesis: synthesis.descriptiveSynthesis,
        studyEvidence: synthesis.studyEvidence,
        subtopics: synthesis.subtopics,
        researchQuestionFindings: synthesis.rqFindings,
        clusters: synthesis.clusters,
        crossStudySynthesis: synthesis.crossStudySynthesis,
        researchGaps: synthesis.researchGaps,
        futureResearchAgenda: synthesis.futureResearchAgenda,
        keyFindingsTable: synthesis.keyFindingsTable,
      },
      reviewerDiscussion: discussion,
      sourceBoundary: {
        empiricalSource:
          "Only the uploaded RIS record metadata and abstracts may support empirical facts, study findings, comparisons, gaps, and implications.",
        protocolUse:
          "The approved protocol may define the review scope and report the review methods, but it is not evidence of study findings.",
        synthesisUse:
          "The finalized synthesis is a derived organizational map. Every empirical statement taken from it must be checked against the RIS records and omitted if the RIS records do not support it.",
      },
    };

    const prompt = `Write a submission-ready full systematic review manuscript for a high-impact peer-reviewed journal.

Return ONLY valid JSON with exactly these fields:
{
  "title": "precise scientific title",
  "abstract": {
    "bg": "Opening background clause for one continuous abstract paragraph",
    "obj": "Objective clause continuing the same paragraph",
    "meth": "Methods clause continuing the same paragraph",
    "res": "Results clause continuing the same paragraph",
    "concl": "Conclusion clause continuing the same paragraph",
    "keywords": ["3 to 6 keywords"]
  },
  "introduction": "3 to 6 coherent academic paragraphs",
  "methods": "6 to 10 coherent academic paragraphs",
  "results": "8 to 15 coherent academic paragraphs",
  "discussion": "6 to 10 coherent academic paragraphs",
  "conclusion": "2 to 3 coherent academic paragraphs",
  "keywords": ["3 to 6 keywords"]
}

The supplied evidence bundle contains the approved protocol, the actual uploaded RIS records and abstracts, reviewer-confirmed selection, abstract-level reporting assessments, study characteristics, and a finalized qualitative synthesis map.

SOURCE BOUNDARY — THIS IS NON-NEGOTIABLE:
- The uploaded RIS records and their abstracts are the sole source of empirical facts and findings. Use no external knowledge, background literature, facts from the reference PDF, named studies, prevalence claims, mechanisms, effectiveness claims, or contextual details that are not present in the RIS records.
- The approved protocol may be used only to describe the review question, scope, eligibility criteria, workflow, and methods. It cannot be used as evidence that a study found something.
- Study characteristics, reporting assessments, reviewer discussion, and finalized synthesis are derived annotations. Use them to organize the manuscript, but verify every empirical statement against the matching RIS record or abstract. If a derived statement cannot be verified in the RIS bundle, omit it.
- When an abstract does not report a detail, say that it was not reported in the available abstract. Never fill the gap with domain knowledge.

MANUSCRIPT STANDARD:
- Write a conventional original systematic review manuscript with a distinct authorial voice, not a magazine article, briefing, blog post, evidence report, or list of study summaries.
- Use formal journal prose with numbered section logic: Introduction; Methods; Results; Discussion; Conclusion.
- Consolidate the evidence into comparative scientific claims. Do not merely enumerate individual studies.
- Use continuous academic paragraphs and normal academic subheadings inside the section text. Do not use bullets, numbered lists, checklists, promotional language, decorative labels, or conversational phrasing.
- Do not write a fill-in template. Avoid repeating stock openings such as “This review,” “The included studies,” “The literature,” or “Overall” at the start of successive paragraphs. Build a logical argument: establish the review question, explain how the evidence was assembled, compare what the RIS abstracts report, identify where findings converge or diverge, and end with only the implications supported by those records.
- Write synthesis as interpretation across evidence, not as a sequence of abstracts. Group records by the themes and research questions that are actually supported by their titles and abstracts; compare methods, populations, settings, outcomes, and directions of findings only when those details are reported.
- Do not force symmetry. If a research question, theme, outcome, or comparison has little or no directly reported evidence in the RIS bundle, state that limitation plainly rather than manufacturing a balanced subsection.
- The abstract clauses must read as one uninterrupted paragraph when concatenated. Do not prefix them with “Background,” “Objective,” “Methods,” “Results,” or “Conclusion.”
- Use numbered manuscript subheadings on their own line when the synthesis moves to a new analytical unit. In Results, organize the synthesis as: study selection and flow; characteristics of included evidence; one subsection for each approved research question; integrated cross-study thematic synthesis; evidence gaps; and future research agenda. In Discussion, organize the interpretation as: principal findings; interpretation by research question or theme; contradictions and evidence limitations; review-process limitations; and implications.
- Each numbered subheading must be followed by one or more continuous prose paragraphs. Do not turn research gaps, future agenda items, themes, or study characteristics into bullet lists.
- The manuscript must be complete enough for editorial review, while remaining explicit about the abstract-only evidence boundary.

EVIDENCE AND CITATION RULES:
- Every Methods and Results statement must be directly supported by the supplied protocol, counts, RIS fields/abstracts, reviewer-confirmed decisions, reporting assessments, or finalized synthesis.
- Use the finalized synthesis to locate candidate patterns, contrasts, themes, gaps, and agenda items, but verify each one against the RIS records before writing it and do not add conclusions absent from those records.
- When making a direct claim about one or more included studies in Results or Discussion, append one or more exact citation markers in the form {{recordId}}. Only use recordId values supplied in the RIS bundle. The application will convert valid markers to author-year citations.
- Do not cite or invent studies that are not in the RIS bundle. Do not invent references, sample sizes, locations, outcomes, validation details, effect estimates, confidence intervals, p-values, heterogeneity statistics, or causal effects.
- Do not claim full-text retrieval, full-text assessment, duplicate independent review, adjudication, formal risk-of-bias appraisal, GRADE, meta-analysis, pooled effects, or forest plots.
- Report “Unclear” as “not reported in the available abstract,” never as high risk or poor quality.
- State clearly that quantitative synthesis was not applicable or not justified because outcome definitions, study designs, and reported measures were not sufficiently comparable.
- The reference list will be generated from the included RIS records; do not create a separate invented reference list in the prose.

AUTHORIAL WRITING:
- You may use your own words to create transitions, conceptual framing, and a coherent rationale, but those words must not introduce factual claims beyond the RIS records and approved protocol. The Introduction may explain why the approved question warrants synthesis, but it must not add external statistics, named prior studies, citations, or effectiveness claims.
- The Results and Discussion must remain traceable to RIS record IDs. Use citation markers such as {{recordId}} for study-level or comparative claims, and do not use citation markers for general method statements.

Evidence bundle:
${JSON.stringify(manuscriptEvidence)}`;

    try {
      const text = await callAI(
        prompt,
        "You are a senior systematic-review author and medical/scientific editor. Produce a rigorous, evidence-traceable journal manuscript, not a magazine-style summary.",
        aiConfig
      );
      const parsed = parseJSONLoose(text);
      if (!parsed?.introduction || !parsed?.methods || !parsed?.results || !parsed?.discussion || !parsed?.conclusion) {
        throw new Error("The AI response did not contain all required manuscript sections.");
      }
      const normalize = (value: unknown) => resolveCitationMarkers(String(value || "").trim());
      const normalizedAbstract = {
        bg: normalize(parsed.abstract?.bg || ""),
        obj: normalize(parsed.abstract?.obj || ""),
        meth: normalize(parsed.abstract?.meth || ""),
        res: normalize(parsed.abstract?.res || ""),
        concl: normalize(parsed.abstract?.concl || ""),
        keywords: Array.isArray(parsed.abstract?.keywords)
          ? parsed.abstract.keywords.map((item: unknown) => String(item)).filter(Boolean).slice(0, 6)
          : [],
      };
      const normalized: StructuredJournalManuscript = {
        title: normalize(parsed.title || protocol.title),
        abstract: normalizedAbstract,
        introduction: normalize(parsed.introduction),
        methods: normalize(parsed.methods),
        results: normalize(parsed.results),
        discussion: normalize(parsed.discussion),
        conclusion: normalize(parsed.conclusion),
        keywords: Array.isArray(parsed.keywords)
          ? parsed.keywords.map((item: unknown) => String(item)).filter(Boolean).slice(0, 6)
          : normalizedAbstract.keywords,
      };
      try {
        setGrammarChecking(true);
        const checked = await runGrammarCheck(normalized);
        setGeneratedManuscript(checked);
        setGeneratedAbstract(checked.abstract);
        setGrammarChecked(true);
      } catch (grammarError: any) {
        setGeneratedManuscript(normalized);
        setGeneratedAbstract(normalized.abstract);
        setGrammarChecked(false);
        setManuscriptError(`Manuscript generated, but grammar checking failed: ${grammarError?.message || "unknown error"}`);
      } finally {
        setGrammarChecking(false);
      }
    } catch (error: any) {
      setManuscriptError(error?.message || "The full journal manuscript could not be generated.");
    } finally {
      setGeneratingManuscript(false);
    }
  };

  const generateFullMarkdown = () => {
    if (generatedManuscript) {
      const manuscript = generatedManuscript;
      let generated = `# ${manuscript.title}\n\n`;
      generated += `## Abstract\n\n${abstractStatement(manuscript.abstract)}\n\n**Keywords:** ${manuscript.keywords.join(", ")}\n\n`;
      generated += `## 1. Introduction\n\n${manuscript.introduction}\n\n`;
      generated += `## 2. Methods\n\n${manuscript.methods}\n\n`;
      generated += `## 3. Results\n\n${manuscript.results}\n\n`;
      generated += `## 4. Discussion\n\n${manuscript.discussion}\n\n`;
      generated += `## 5. Conclusion\n\n${manuscript.conclusion}\n\n`;
      generated += `## References\n\n`;
      includedRecords.forEach((record) => {
        const authors = (record.authors || []).join(", ") || "Unknown authors";
        generated += `${authors} (${record.year || "n.d."}). ${record.title}. *${record.source || "Journal"}*${record.doi ? `, https://doi.org/${record.doi}` : ""}.\n\n`;
      });
      return generated;
    }

    let md = `# ${protocol.title || "Systematic Literature Review Manuscript"}\n\n`;
    md += `**Methodology:** ${protocol.reviewType}\n`;
    md += `\n---\n\n`;

    md += `## Abstract\n\n`;
    md += `${abstractStatement(abstract)}\n\n`;
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
    md += `${executedSearchNarrative}\n\n`;

    md += `### 2.4 Selection Process, Reviewer Moderation, and Exclusion Rationales\n`;
    md += `Eligibility was determined through reviewer-confirmed title and abstract screening. ${includedRecords.length} records were included for abstract-based extraction and synthesis. Full-text retrieval and assessment were not performed in this workflow. Independent duplicate review and consensus adjudication are not claimed unless separately documented.\n\n`;

    md += `### 2.5 Methodological Reporting and Evidence Appraisal\n`;
    md += `The included records were assessed with an abstract-level reporting checklist. The checklist records whether study design, sample or dataset, outcomes, validation, comparators, external validation, uncertainty, implementation, and the direct target outcome were reported. “Unclear” means not reported in the available abstract; it is not a risk-of-bias judgment. Formal risk-of-bias and certainty-of-evidence assessments were not performed.\n\n`;

    md += `## 3. Results\n\n`;
    md += `### 3.1 Study Selection and Flow of Evidence\n`;
    md += `${counts.identifiedDb || 0} records were identified, ${counts.duplicatesRemoved || 0} duplicates were removed, and ${counts.recordsAfterDuplicatesRemoved || 0} records remained. ${counts.screened || 0} records received reviewer title/abstract decisions, ${counts.recordsNotScreened || 0} remain pending, ${counts.screenedExcluded || 0} were excluded, and ${includedRecords.length} were included for abstract-based synthesis.\n\n`;

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

    md += `### 3.3 Abstract Reporting Completeness (Table 2)\n\n`;
    md += `| Study | Design | Dataset / sample | Outcome | Validation | Comparator / baseline | External validation | Uncertainty | Real-world implementation | Direct target outcome | Completeness |\n`;
    md += `| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n`;
    reportingAssessments.forEach((r) => {
      md += `| ${r.authorYear} | ${r.studyDesignIdentifiable} | ${r.datasetSampleDescribed} | ${r.outcomeClearlyDefined} | ${r.validationDescribed} | ${r.comparatorBaselineDescribed} | ${r.externalValidation} | ${r.uncertaintyReported} | ${r.realWorldImplementation} | ${r.directTargetOutcome} | ${r.abstractReportingCompleteness} |\n`;
    });
    md += `\n`;

    rqFindings.forEach((finding, index) => {
      md += `### 3.${index + 4} ${finding.rqId}: ${finding.question.replace(/^RQ\d+:\s*/i, "")}\n\n`;
      md += `${finding.synthesizedAnswer}\n\n`;
      md += `**Dominant patterns:** ${finding.dominantPatterns}\n\n`;
      md += `**Contradictions:** ${finding.contradictions}\n\n`;
      md += `**Evidence gaps:** ${finding.evidenceGaps}\n\n`;
    });

    const crossStudySectionNumber = rqFindings.length + 4;
    if (synthesis.crossStudySynthesis) {
      md += `### 3.${crossStudySectionNumber} Cross-study Synthesis\n\n`;
      md += `${synthesis.crossStudySynthesis.overallPatterns}\n\n`;
      md += `**Cross-cutting contradictions:** ${synthesis.crossStudySynthesis.contradictions}\n\n`;
      md += `**Principal evidence gaps:** ${synthesis.crossStudySynthesis.evidenceGaps}\n\n`;
    }

    md += `### 3.${crossStudySectionNumber + 1} Research Gap Analysis\n\n`;
    (synthesis.researchGaps || []).forEach((item) => {
      md += `**${item.gap}:** ${item.evidenceBasis}\n\n`;
    });

    md += `### 3.${crossStudySectionNumber + 2} Future Research Agenda\n\n`;
    (synthesis.futureResearchAgenda || []).forEach((item) => {
      md += `**${item.priority}:** ${item.rationale} Suggested approach: ${item.suggestedApproach}\n\n`;
    });

    md += `## 4. Discussion\n\n`;
    md += `### 4.1 Principal Findings\n${discussion.item23aGeneralInterpretation}\n\n`;
    md += `### 4.2 Interpretation by Research Question\n`;
    rqFindings.forEach((finding) => {
      md += `**${finding.rqId}:** ${finding.synthesizedAnswer}\n\n`;
    });
    md += `### 4.3 Comparison with Previous Reviews\nNo comparison is claimed unless previous-review evidence is explicitly supplied and appraised.\n\n`;
    md += `### 4.4 Contradictions and Limitations of the Evidence\n${discussion.item23bLimitationsOfEvidence}\n\n`;
    md += `### 4.5 Research and Practice Implications\n${discussion.item23dImplications}\n\n`;

    md += `## 5. Limitations\n\n`;
    md += `${discussion.item23bLimitationsOfEvidence}\n\n${discussion.item23cLimitationsOfReviewProcess}\n\n`;

    md += `## 6. Conclusion\n\n`;
    md += `${abstract.concl}\n\n`;

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
    if (generatedManuscript) {
      const manuscript = generatedManuscript;
      const paragraphHtml = (value: string) =>
        renderJournalText(value).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
      const journalHtml = (value: string) =>
        renderJournalBlocks(value).map((block) =>
          block.kind === "heading"
            ? `<h3>${escapeHtml(block.text)}</h3>`
            : `<p>${escapeHtml(block.text)}</p>`
        ).join("");
      const abstractHtml = `
        <h2 style="margin-top: 0; border-bottom: none; font-size: 13pt;">Abstract</h2>
        <p>${escapeHtml(abstractStatement(manuscript.abstract))}</p>
        <p><strong>Keywords:</strong> <em>${escapeHtml(manuscript.keywords.join(", "))}</em></p>`;
      const generatedDocHTML = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(manuscript.title)}</title><style>body{font-family:'Times New Roman',Times,serif;font-size:11pt;line-height:1.6;color:#1e293b;margin:40px}h1{font-size:20pt;color:#0f172a;line-height:1.25}h2{font-size:14pt;color:#1e293b;margin-top:28px;margin-bottom:10px}h3{font-size:11pt;font-style:italic;color:#334155;margin-top:18px;margin-bottom:6px}p{margin-bottom:12px;text-align:justify}</style></head><body><p><em>Systematic Review</em></p><h1>${escapeHtml(manuscript.title)}</h1><p>${escapeHtml(protocol.reviewType)} · PRISMA 2020 reporting · ${includedRecords.length} included records</p>${abstractHtml}<h2>1. Introduction</h2>${journalHtml(manuscript.introduction)}<h2>2. Methods</h2>${journalHtml(manuscript.methods)}<h2>3. Results</h2>${journalHtml(manuscript.results)}<h2>4. Discussion</h2>${journalHtml(manuscript.discussion)}<h2>5. Conclusion</h2>${journalHtml(manuscript.conclusion)}<h2>References</h2>${includedRecords.map((record) => `<p>${escapeHtml((record.authors || []).join(", ") || "Unknown authors")} (${escapeHtml(String(record.year || "n.d."))}). ${escapeHtml(record.title)}. <em>${escapeHtml(record.source || "Journal")}</em>${record.doi ? `, doi:${escapeHtml(record.doi)}` : ""}.</p>`).join("")}</body></html>`;
      const generatedBlob = new Blob([generatedDocHTML], { type: "application/msword;charset=utf-8" });
      const generatedLink = document.createElement("a");
      generatedLink.href = URL.createObjectURL(generatedBlob);
      generatedLink.download = `${(manuscript.title || "Systematic_Review_Manuscript").replace(/[^a-zA-Z0-9]/g, "_").slice(0, 55)}.doc`;
      generatedLink.click();
      return;
    }

    const formatBadge = (val: string) => {
      if (val === "Yes") {
        return `<span style="background-color: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 9pt;">Yes</span>`;
      }
      if (val === "No") {
        return `<span style="background-color: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 9pt;">No</span>`;
      }
      return `<span style="background-color: #fef9c3; color: #854d0e; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 9pt;">Unclear</span>`;
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
    .abstract-box { padding: 14px 0; margin-bottom: 24px; border-top: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; }
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
    <p>${abstractStatement(abstract)}</p>
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
  <p>${executedSearchNarrative}</p>

  <h3>2.4 Selection Process</h3>
  <p>Eligibility was determined through reviewer-confirmed title and abstract screening. ${includedRecords.length} records were included for abstract-based extraction and synthesis. Full-text retrieval and assessment were not performed in this workflow. Independent duplicate review and adjudication are not claimed unless separately documented.</p>

  <h3>2.5 Methodological Reporting and Evidence Appraisal</h3>
  <p>Included records were assessed with an abstract-level reporting checklist. “Unclear” means that an item was not reported in the available abstract; it is not a high-risk judgment. Formal risk-of-bias and certainty-of-evidence assessments were not performed.</p>

  <h2>3. Results</h2>

  <h3>3.1 Study Selection and Flow of Evidence</h3>
  <p>${counts.identifiedDb || 0} records were identified, ${counts.duplicatesRemoved || 0} duplicates were removed, and ${counts.recordsAfterDuplicatesRemoved || 0} records remained. ${counts.screened || 0} records received reviewer title/abstract decisions, ${counts.recordsNotScreened || 0} remain pending, ${counts.screenedExcluded || 0} were excluded, and ${includedRecords.length} were included for abstract-based synthesis.</p>

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

  <h3>3.3 Abstract Reporting Completeness (Table 2)</h3>
  <div class="table-caption">Table 2: Abstract-level methodological reporting checklist</div>
  <table>
    <thead>
      <tr>
        <th>Study</th>
        <th style="text-align: center;">Design</th>
        <th style="text-align: center;">Sample</th>
        <th style="text-align: center;">Outcome</th>
        <th style="text-align: center;">Validation</th>
        <th style="text-align: center;">Comparator</th>
        <th style="text-align: center;">External validation</th>
        <th style="text-align: center;">Uncertainty</th>
        <th style="text-align: center;">Implementation</th>
        <th style="text-align: center;">Direct outcome</th>
        <th style="text-align: center;">Completeness</th>
      </tr>
    </thead>
    <tbody>
      ${reportingAssessments.map((r) => `
        <tr>
          <td><strong>${r.authorYear}</strong></td>
          <td style="text-align: center;">${formatBadge(r.studyDesignIdentifiable)}</td>
          <td style="text-align: center;">${formatBadge(r.datasetSampleDescribed)}</td>
          <td style="text-align: center;">${formatBadge(r.outcomeClearlyDefined)}</td>
          <td style="text-align: center;">${formatBadge(r.validationDescribed)}</td>
          <td style="text-align: center;">${formatBadge(r.comparatorBaselineDescribed)}</td>
          <td style="text-align: center;">${formatBadge(r.externalValidation)}</td>
          <td style="text-align: center;">${formatBadge(r.uncertaintyReported)}</td>
          <td style="text-align: center;">${formatBadge(r.realWorldImplementation)}</td>
          <td style="text-align: center;">${formatBadge(r.directTargetOutcome)}</td>
          <td style="text-align: center;">${r.abstractReportingCompleteness}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  ${rqFindings.map((finding, index) => `
    <h3>3.${index + 4} ${finding.rqId}: ${finding.question.replace(/^RQ\d+:\s*/i, "")}</h3>
    <p>${finding.synthesizedAnswer}</p>
    <p><strong>Dominant patterns:</strong> ${finding.dominantPatterns}</p>
    <p><strong>Contradictions:</strong> ${finding.contradictions}</p>
    <p><strong>Evidence gaps:</strong> ${finding.evidenceGaps}</p>
  `).join("")}
  ${synthesis.crossStudySynthesis ? `
    <h3>3.${rqFindings.length + 4} Cross-study Synthesis</h3>
    <p>${synthesis.crossStudySynthesis.overallPatterns}</p>
    <p><strong>Cross-cutting contradictions:</strong> ${synthesis.crossStudySynthesis.contradictions}</p>
    <p><strong>Principal evidence gaps:</strong> ${synthesis.crossStudySynthesis.evidenceGaps}</p>
  ` : ""}
  <h3>3.${rqFindings.length + 5} Research Gap Analysis</h3>
  ${(synthesis.researchGaps || []).map((item) => `
    <p><strong>${item.gap}:</strong> ${item.evidenceBasis}</p>
  `).join("")}

  <h3>3.${rqFindings.length + 6} Future Research Agenda</h3>
  ${(synthesis.futureResearchAgenda || []).map((item) => `
    <p><strong>${item.priority}:</strong> ${item.rationale} Suggested approach: ${item.suggestedApproach}</p>
  `).join("")}

  <h2>4. Discussion</h2>
  <h3>4.1 Principal Findings</h3>
  <p>${discussion.item23aGeneralInterpretation}</p>

  <h3>4.2 Interpretation by Research Question</h3>
  ${rqFindings.map((finding) => `<p><strong>${finding.rqId}:</strong> ${finding.synthesizedAnswer}</p>`).join("")}

  <h3>4.3 Comparison with Previous Reviews</h3>
  <p>No comparison is claimed unless previous-review evidence is explicitly supplied and appraised.</p>

  <h3>4.4 Contradictions and Limitations of the Evidence</h3>
  <p>${discussion.item23bLimitationsOfEvidence}</p>

  <h3>4.5 Research and Practice Implications</h3>
  <p>${discussion.item23dImplications}</p>

  <h2>5. Limitations</h2>
  <p>${discussion.item23bLimitationsOfEvidence}</p>
  <p>${discussion.item23cLimitationsOfReviewProcess}</p>

  <h2>6. Conclusion</h2>
  <p>${abstract.concl}</p>

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
            Full Systematic Review Manuscript
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Publication-style manuscript with a single-paragraph abstract, numbered analytical subsections, and narrative cross-study synthesis.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleGenerateManuscript}
            disabled={!abstractReady || generatingManuscript}
            title={!abstractReady ? "Complete selection, extraction, reporting appraisal, and all synthesis stages first" : undefined}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {generatingManuscript ? "Writing Manuscript..." : generatedManuscript ? "Regenerate Journal Manuscript" : "Generate Full Journal Manuscript"}
          </button>
          {generatedManuscript && (
            <button
              onClick={handleGrammarCheck}
              disabled={grammarChecking}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {grammarChecking ? "Checking Grammar..." : grammarChecked ? "Grammar Checked" : "Run Grammar Check"}
            </button>
          )}
          <button
            onClick={handleCopy}
            disabled={!generatedAbstract && !generatedManuscript}
            title={!generatedAbstract && !generatedManuscript ? "Generate the journal manuscript or abstract before exporting" : undefined}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy Markdown"}
          </button>
          <button
            onClick={handleDownload}
            disabled={!generatedAbstract && !generatedManuscript}
            title={!generatedAbstract && !generatedManuscript ? "Generate the journal manuscript or abstract before exporting" : undefined}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            Download Markdown (.md)
          </button>
          <button
            onClick={handleDownloadDoc}
            disabled={!generatedAbstract && !generatedManuscript}
            title={!generatedAbstract && !generatedManuscript ? "Generate the journal manuscript or abstract before exporting" : undefined}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            Download Word (.doc)
          </button>
          <button
            onClick={() => window.print()}
            disabled={!generatedAbstract && !generatedManuscript}
            title={!generatedAbstract && !generatedManuscript ? "Generate the journal manuscript or abstract before exporting" : undefined}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / PDF
          </button>
        </div>
      </div>

      {/* Formatted Manuscript Card */}
      <article className="bg-white p-8 sm:p-12 rounded-none shadow-none font-serif space-y-8 max-w-4xl mx-auto print:p-0">
        {/* Title Header */}
        <header className="border-b border-slate-200 pb-6 space-y-2">
          <div className="font-serif text-xs italic text-slate-600">
            Systematic Review
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {generatedManuscript?.title || protocol.title || "Systematic Review Title"}
          </h1>
          <div className="text-xs text-slate-500 pt-1 space-y-1">
            <div>{protocol.reviewType} · PRISMA 2020 reporting · {includedRecords.length} included records</div>
          </div>
        </header>

        {/* Structured Academic Abstract */}
        <section className="border-y border-slate-300 py-6 sm:py-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-600" />
              Abstract
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
                selection {selectionComplete ? "✓" : "○"} · extraction {extractionComplete ? "✓" : "○"} · reporting appraisal {reportingComplete ? "✓" : "○"} · synthesis {synthesisComplete ? "✓" : "○"}
              </span>
            </div>
          )}
          {abstractError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              Abstract generation failed: {abstractError}
            </div>
          )}
          {manuscriptError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              Full manuscript generation failed: {manuscriptError}
            </div>
          )}

          <div className="space-y-3 text-sm sm:text-base text-slate-800 leading-relaxed text-justify">
            <p>{abstractStatement(abstract)}</p>
            <div className="pt-2 text-xs sm:text-sm text-slate-600">
              <strong className="text-slate-900 mr-1.5 font-bold">Keywords:</strong>
              <span className="text-slate-700 italic">{abstract.keywords.join(", ")}</span>
            </div>
          </div>
        </section>

        {generatedManuscript && (
          <section className="space-y-6 border-t border-slate-200 pt-8">
            {[
              ["1. Introduction", generatedManuscript.introduction],
              ["2. Methods", generatedManuscript.methods],
              ["3. Results", generatedManuscript.results],
              ["4. Discussion", generatedManuscript.discussion],
              ["5. Conclusion", generatedManuscript.conclusion],
            ].map(([heading, content]) => (
              <section key={heading} className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900">{heading}</h2>
                <div className="space-y-3 text-sm sm:text-base text-slate-800 leading-relaxed text-justify">
                  {renderJournalBlocks(content).map((block, index) =>
                    block.kind === "heading"
                      ? <h3 key={index} className="pt-3 text-base sm:text-lg font-semibold italic text-slate-900">{block.text}</h3>
                      : <p key={index}>{block.text}</p>
                  )}
                </div>
              </section>
            ))}
            <section className="space-y-3 border-t border-slate-200 pt-6">
              <h2 className="text-xl font-bold text-slate-900">References</h2>
              <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
                {includedRecords.map((record, index) => (
                  <p key={index} className="text-justify">
                    {(record.authors || []).join(", ") || "Unknown authors"} ({record.year || "n.d."}). {record.title}. <em>{record.source || "Journal"}</em>{record.doi ? `, doi:${record.doi}` : ""}.
                  </p>
                ))}
              </div>
            </section>
          </section>
        )}

        {/* Section 1: Introduction & Objectives */}
        <section className={generatedManuscript ? "hidden" : "space-y-4"}>
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
        <section className={generatedManuscript ? "hidden" : "space-y-4"}>
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
              {executedSearchNarrative}
            </p>

            <h3 className="font-bold text-slate-900 text-sm font-mono">2.4 Selection Process and Evidence Status</h3>
            <p className="text-justify">
              Eligibility was determined through reviewer-confirmed title and abstract screening. {includedRecords.length} records were included for abstract-based extraction and synthesis. Full-text retrieval and assessment were not performed in this workflow. Independent duplicate review and adjudication are not claimed unless separately documented.
            </p>

            <h3 className="font-bold text-slate-900 text-sm font-mono">2.5 Methodological Reporting and Evidence Appraisal</h3>
            <p className="text-justify">
              Included records were assessed with an abstract-level reporting checklist. “Unclear” means the item was not reported in the available abstract; it is not a high-risk judgment. Formal risk-of-bias and certainty-of-evidence assessments were not performed.
            </p>
          </div>
        </section>

        {/* Section 3: Results */}
        <section className={generatedManuscript ? "hidden" : "space-y-6"}>
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">
            3. Results
          </h2>

          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-sm font-mono">3.1 Study Selection and Flow Diagram</h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed text-justify">
              The workspace contains {counts.identifiedDb || 0} identified records. After removing {counts.duplicatesRemoved || 0} duplicates, {counts.recordsAfterDuplicatesRemoved || 0} records remained. {counts.screened || 0} records received reviewer title/abstract decisions, {counts.recordsNotScreened || 0} remain pending, {counts.screenedExcluded || 0} were excluded, and {includedRecords.length} were included for abstract-based synthesis.
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

          {/* Table 2: Abstract-level methodological reporting */}
          <div className="space-y-2 pt-4">
            <div className="text-xs font-mono font-bold text-slate-900">
              Table 2: Abstract Reporting Completeness
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-[11px] font-sans">
                <thead className="bg-slate-50 border-b border-slate-200 font-mono text-[10px]">
                  <tr>
                    <th className="p-2 font-bold">Study</th>
                    <th className="p-2 font-bold text-center">Design</th>
                    <th className="p-2 font-bold text-center">Sample</th>
                    <th className="p-2 font-bold text-center">Outcome</th>
                    <th className="p-2 font-bold text-center">Validation</th>
                    <th className="p-2 font-bold text-center">Comparator</th>
                    <th className="p-2 font-bold text-center">External</th>
                    <th className="p-2 font-bold text-center">Uncertainty</th>
                    <th className="p-2 font-bold text-center">Implementation</th>
                    <th className="p-2 font-bold text-center">Direct outcome</th>
                    <th className="p-2 font-bold text-center">Completeness</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportingAssessments.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="p-2 font-mono font-semibold">{r.authorYear}</td>
                      <td className="p-2 text-center font-mono text-[10px]">{r.studyDesignIdentifiable}</td>
                      <td className="p-2 text-center font-mono text-[10px]">{r.datasetSampleDescribed}</td>
                      <td className="p-2 text-center font-mono text-[10px]">{r.outcomeClearlyDefined}</td>
                      <td className="p-2 text-center font-mono text-[10px]">{r.validationDescribed}</td>
                      <td className="p-2 text-center font-mono text-[10px]">{r.comparatorBaselineDescribed}</td>
                      <td className="p-2 text-center font-mono text-[10px]">{r.externalValidation}</td>
                      <td className="p-2 text-center font-mono text-[10px]">{r.uncertaintyReported}</td>
                      <td className="p-2 text-center font-mono text-[10px]">{r.realWorldImplementation}</td>
                      <td className="p-2 text-center font-mono text-[10px]">{r.directTargetOutcome}</td>
                      <td className="p-2 text-center font-mono font-bold text-indigo-700">{r.abstractReportingCompleteness}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* RQ-controlled synthesis results */}
          <div className="space-y-3 pt-4">
            {rqFindings.map((finding, index) => (
              <div key={finding.rqId} className="space-y-2 border border-indigo-100 rounded-xl p-4">
                <h3 className="font-bold text-slate-900 text-sm font-mono">
                  3.{index + 4} {finding.rqId}: {finding.question.replace(/^RQ\d+:\s*/i, "")}
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed text-justify">{finding.synthesizedAnswer}</p>
                <div className="grid md:grid-cols-3 gap-2 text-xs">
                  <p><strong>Dominant patterns:</strong> {finding.dominantPatterns}</p>
                  <p><strong>Contradictions:</strong> {finding.contradictions}</p>
                  <p><strong>Evidence gaps:</strong> {finding.evidenceGaps}</p>
                </div>
              </div>
            ))}
            {synthesis.crossStudySynthesis && (
              <div className="space-y-2 bg-indigo-950 text-white rounded-xl p-5">
                <h3 className="font-bold text-sm font-mono">
                  3.{rqFindings.length + 4} Cross-study Synthesis
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed">{synthesis.crossStudySynthesis.overallPatterns}</p>
                <p className="text-xs"><strong>Cross-cutting contradictions:</strong> {synthesis.crossStudySynthesis.contradictions}</p>
                <p className="text-xs"><strong>Principal evidence gaps:</strong> {synthesis.crossStudySynthesis.evidenceGaps}</p>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4 pt-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <h3 className="font-bold text-sm text-amber-950">Research Gap Analysis</h3>
              {(synthesis.researchGaps || []).map((item, index) => (
                <div key={index} className="mt-3">
                  <div className="text-xs font-bold text-amber-900">{item.gap}</div>
                  <p className="text-xs text-amber-900 mt-1">{item.evidenceBasis}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5">
              <h3 className="font-bold text-sm text-indigo-950">Future Research Agenda</h3>
              {(synthesis.futureResearchAgenda || []).map((item, index) => (
                <div key={index} className="mt-3">
                  <div className="text-xs font-bold text-indigo-900">{item.priority}</div>
                  <p className="text-xs text-indigo-900 mt-1">{item.rationale}</p>
                  <p className="text-xs text-indigo-800 mt-1"><strong>Suggested approach:</strong> {item.suggestedApproach}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 4: interpretation of synthesized results */}
        <section className={generatedManuscript ? "hidden" : "space-y-4"}>
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">
            4. Discussion
          </h2>
          <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <div>
              <h3 className="font-bold text-slate-900 text-xs font-mono mb-1">4.1 Principal Findings</h3>
              <p className="text-justify">{discussion.item23aGeneralInterpretation}</p>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xs font-mono mb-1">4.2 Interpretation by Research Question</h3>
              {rqFindings.map((finding) => (
                <p key={finding.rqId} className="text-justify"><strong>{finding.rqId}:</strong> {finding.synthesizedAnswer}</p>
              ))}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xs font-mono mb-1">4.3 Comparison with Previous Reviews</h3>
              <p className="text-justify">No comparison is claimed unless previous-review evidence is explicitly supplied and appraised.</p>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xs font-mono mb-1">4.4 Contradictions and Limitations of the Evidence</h3>
              <p className="text-justify">{discussion.item23bLimitationsOfEvidence}</p>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xs font-mono mb-1">4.5 Research and Practice Implications</h3>
              <p className="text-justify">{discussion.item23dImplications}</p>
            </div>
          </div>
        </section>

        <section className={generatedManuscript ? "hidden" : "space-y-3"}>
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">5. Limitations</h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed text-justify">{discussion.item23bLimitationsOfEvidence}</p>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed text-justify">{discussion.item23cLimitationsOfReviewProcess}</p>
        </section>

        <section className={generatedManuscript ? "hidden" : "space-y-3"}>
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">6. Conclusion</h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed text-justify">{abstract.concl}</p>
        </section>

        {/* References */}
        <section className={generatedManuscript ? "hidden" : "space-y-3 border-t border-slate-200 pt-6"}>
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
