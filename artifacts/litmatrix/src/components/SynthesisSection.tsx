import React, { useEffect, useRef, useState } from "react";
import { SLRProtocol, SLRRecord, SynthesisResult, StudyCharacteristic } from "../types/slr";
import { Sparkles, BarChart2, BookOpen, Layers, Download, CheckCircle, RefreshCw, AlertCircle, Zap, Tag, Quote, Filter, Copy } from "lucide-react";
import { callAI, parseJSONLoose } from "../utils/aiClient";

interface SynthesisSectionProps {
  protocol: SLRProtocol;
  onUpdateProtocol: (protocol: SLRProtocol) => void;
  synthesis: SynthesisResult;
  onUpdateSynthesis: (synthesis: SynthesisResult) => void;
  includedRecords: SLRRecord[];
  characteristics: StudyCharacteristic[];
  aiConfig: any;
  onNavigateToScreening?: () => void;
}

const MIN_SYNTHESIS_CLUSTERS = 3;

type SynthesisStudy = StudyCharacteristic;

const firstAuthorSurname = (record: SLRRecord) => {
  const firstAuthor = record.authors?.[0]?.trim();
  if (!firstAuthor) return "Author";
  return firstAuthor.includes(",")
    ? firstAuthor.split(",")[0].trim()
    : firstAuthor.split(/\s+/).slice(-1)[0] || "Author";
};

const authorYearLabel = (record: SLRRecord) =>
  `${firstAuthorSurname(record)} et al. (${record.year || "n.d."})`;

const RECORD_NOT_REPORTED = "Not reported in the supplied record";
const OUTCOME_CLUSTER = "Outcomes, performance, and reported effects";

const buildStudiesFromRecords = (records: SLRRecord[]): SynthesisStudy[] =>
  records.map((record) => ({
    recordId: record.id,
    authorYear: authorYearLabel(record),
    country: RECORD_NOT_REPORTED,
    sampleSize: RECORD_NOT_REPORTED,
    population: RECORD_NOT_REPORTED,
    interventionOrFocus: record.title,
    comparator: RECORD_NOT_REPORTED,
    primaryOutcome: RECORD_NOT_REPORTED,
    studyDesign: RECORD_NOT_REPORTED,
    keyFinding: record.abstract?.trim().slice(0, 260) || RECORD_NOT_REPORTED,
  }));

const getSynthesisStudies = (
  includedRecords: SLRRecord[],
  characteristics: StudyCharacteristic[]
) => characteristics.length > 0 ? characteristics : buildStudiesFromRecords(includedRecords);

const clusterStudies = (studies: SynthesisStudy[]) => {
  const themes = [
    {
      key: "Methods, models, and study designs",
      terms: ["method", "model", "algorithm", "framework", "simulation", "design", "validation", "experiment"],
    },
    {
      key: "Applications, interventions, and contexts",
      terms: ["intervention", "exposure", "population", "context", "application", "technology", "system", "setting"],
    },
    {
      key: "Outcomes, performance, and reported effects",
      terms: ["outcome", "performance", "efficiency", "accuracy", "impact", "emission", "effect", "result", "evaluation"],
    },
  ];
  const buckets = themes.map((theme) => ({ key: theme.key, studies: [] as SynthesisStudy[] }));

  studies.forEach((study, studyIndex) => {
    const searchableText = [
      study.category,
      study.interventionOrFocus,
      study.studyDesign,
      study.primaryOutcome,
      study.keyFinding,
    ].join(" ").toLowerCase();
    const scores = themes.map((theme) =>
      theme.terms.reduce((score, term) => score + (searchableText.includes(term) ? 1 : 0), 0)
    );
    const highestScore = Math.max(...scores);
    const matchingIndexes = scores
      .map((score, index) => score === highestScore ? index : -1)
      .filter((index) => index >= 0);
    const selectedIndex = matchingIndexes.length > 1
      ? studyIndex % themes.length
      : matchingIndexes[0];
    buckets[selectedIndex].studies.push(study);
  });

  // Keep all three clusters populated whenever at least three records exist.
  for (let index = 0; index < buckets.length; index++) {
    if (buckets[index].studies.length === 0 && studies.length >= MIN_SYNTHESIS_CLUSTERS) {
      const donor = buckets
        .map((bucket, donorIndex) => ({ donorIndex, size: bucket.studies.length }))
        .filter((bucket) => bucket.size > 1)
        .sort((a, b) => b.size - a.size)[0];
      if (donor) {
        buckets[index].studies.push(buckets[donor.donorIndex].studies.pop()!);
      }
    }
  }

  return buckets;
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const studyCitationLine = (study: SynthesisStudy) => {
  const rawFinding = (study.keyFinding || "No finding was reported in the supplied record.")
    .replace(/\s+/g, " ")
    .trim();
  const finding = rawFinding.split(/(?<=[.!?])\s+/)[0].slice(0, 220).trim();
  return `${study.authorYear}: ${finding}${rawFinding.length > 220 ? "…" : ""}`;
};

const themeTerms = (studies: SynthesisStudy[]) => {
  const stopWords = new Set([
    "about", "across", "after", "among", "based", "between", "could", "from",
    "into", "more", "other", "reported", "record", "records", "study", "studies",
    "their", "these", "those", "using", "with", "within", "not", "supplied",
    "information", "described", "details", "available", "included",
  ]);
  const counts = new Map<string, number>();
  studies.forEach((study) => {
    const text = [
      study.interventionOrFocus,
      study.primaryOutcome,
      study.keyFinding,
    ].join(" ").toLowerCase();
    text.match(/[a-z][a-z0-9]{3,}/g)?.forEach((word) => {
      if (!stopWords.has(word) && !word.includes("reported")) {
        counts.set(word, (counts.get(word) || 0) + 1);
      }
    });
  });
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 4)
    .map(([word]) => word);
};

const outcomeFocuses = (studies: SynthesisStudy[]) => {
  const focuses = studies.map((study) => {
    const suppliedOutcome = study.primaryOutcome?.trim();
    if (suppliedOutcome && suppliedOutcome !== RECORD_NOT_REPORTED) {
      return suppliedOutcome.split(/[.;]/)[0].slice(0, 80).trim();
    }
    const keywords = themeTerms([study]).slice(0, 2);
    return keywords.join(" and ") || "reported findings";
  });
  return Array.from(new Set(focuses)).slice(0, 4);
};

const buildThematicDiscussion = (
  cluster: { key: string; studies: SynthesisStudy[] },
  suppliedProse = "",
) => {
  if (cluster.studies.length === 0) {
    return `No included records were assigned to the ${cluster.key.toLowerCase()} cluster.`;
  }

  const terms = themeTerms(cluster.studies);
  const topicPhrase = terms.length > 0 ? terms.join(", ") : "the reported study findings";
  const discussion = cluster.key === OUTCOME_CLUSTER
    ? (() => {
        const focuses = outcomeFocuses(cluster.studies);
        const focusPhrase = focuses.join("; ");
        return `The ${cluster.key.toLowerCase()} cluster comprises ${cluster.studies.length} included record${cluster.studies.length === 1 ? "" : "s"} organized around ${topicPhrase}. The reported outcome focuses include ${focusPhrase}. These records are therefore compared by outcome family, considering how each study evaluates performance or reported effects, rather than treating unlike measures as a single pooled result.`;
      })()
    : `The ${cluster.key.toLowerCase()} cluster comprises ${cluster.studies.length} included record${cluster.studies.length === 1 ? "" : "s"} with recurring emphasis on ${topicPhrase}. The records are discussed together because these shared features provide a thematic basis for comparing the reported approaches and findings.`;

  const supplied = formatClusterProse(suppliedProse, cluster.studies);
  const citationEvidence = cluster.studies.map(studyCitationLine).join("\n\n");
  const supportingNarrative = cluster.key === OUTCOME_CLUSTER
    ? citationEvidence
    : supplied || citationEvidence;
  if (cluster.key !== OUTCOME_CLUSTER && supplied.startsWith(discussion)) {
    return supplied;
  }
  return `${discussion}\n\n${supportingNarrative}`;
};

const formatClusterProse = (prose: string, studies: SynthesisStudy[]) => {
  let formatted = (prose || "").replace(/\r\n/g, "\n").trim();
  studies.forEach((study) => {
    const label = study.authorYear;
    const labelMatch = label.match(/^(.*?)(?:\s+et al\.)?\s*\(([^)]+)\)$/);
    const surname = labelMatch?.[1] || label.split(" et al.")[0];
    const year = labelMatch?.[2];
    if (year) {
      const variantPattern = new RegExp(
        `${escapeRegExp(surname)}\\s+et\\s+al\\.?\\s*(?:,|\\()\\s*${escapeRegExp(year)}\\)?`,
        "gi"
      );
      formatted = formatted.replace(variantPattern, label);
    }
    const canonicalPattern = new RegExp(`${escapeRegExp(label)}\\s*:??\\s*`, "g");
    formatted = formatted.replace(canonicalPattern, `${label}: `);
    const labelPattern = new RegExp(`\\s+(?=${escapeRegExp(label)}\\s*:?)`, "g");
    formatted = formatted.replace(labelPattern, "\n\n");
    if (!formatted.includes(label)) {
      formatted = `${formatted}${formatted ? "\n\n" : ""}${studyCitationLine(study)}`;
    }
  });
  return formatted || studies.map(studyCitationLine).join("\n\n");
};

const fallbackSubtopics = (studies: SynthesisStudy[]) =>
  clusterStudies(studies).map((cluster, index) => ({
    title: `${index + 1}. ${cluster.key} evidence`,
    prose: buildThematicDiscussion(cluster),
  }));

const normalizeSubtopics = (subtopics: any[], studies: SynthesisStudy[]) => {
  const clusters = clusterStudies(studies);
  return clusters.map((cluster, index) => {
    const supplied = subtopics[index];
    const title = typeof supplied?.title === "string" && supplied.title.trim()
      ? supplied.title.trim()
      : `${index + 1}. ${cluster.key} evidence`;
    return {
      title: title.replace(/^\d+\.\s*/, `${index + 1}. `),
      prose: buildThematicDiscussion(
        cluster,
        typeof supplied?.prose === "string" ? supplied.prose : "",
      ),
    };
  });
};

const suggestReviewTitle = (studies: SynthesisStudy[], subtopics: SynthesisResult["subtopics"]) => {
  const stopWords = new Set([
    "about", "across", "after", "among", "based", "between", "from", "into",
    "methods", "method", "model", "models", "study", "studies", "using",
    "reported", "evidence", "analysis", "review", "research", "design",
    "outcomes", "outcome", "results", "record", "records", "not", "reported",
  ]);
  const wordCounts = new Map<string, number>();
  studies.forEach((study) => {
    const text = `${study.interventionOrFocus} ${study.keyFinding}`.toLowerCase();
    text.match(/[a-z][a-z0-9]{3,}/g)?.forEach((word) => {
      if (!stopWords.has(word)) wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    });
  });
  const topicWords = Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([word]) => word);
  const clusterWords = subtopics
    .map((subtopic) => subtopic.title.replace(/^\d+\.\s*/, "").replace(/\bevidence\b/gi, "").trim())
    .filter(Boolean)
    .slice(0, 2);
  const subject = topicWords.length >= 2
    ? topicWords.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(", ")
    : clusterWords.join(" and ") || "The Included Literature";
  return `${subject}: A Narrative and Thematic Synthesis`;
};

export default function SynthesisSection({
  protocol,
  onUpdateProtocol,
  synthesis,
  onUpdateSynthesis,
  includedRecords,
  characteristics,
  aiConfig,
  onNavigateToScreening,
}: SynthesisSectionProps) {
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"prose" | "groups" | "table">("prose");
  const [groupingMode, setGroupingMode] = useState<"category" | "intervention" | "design" | "outcome">("category");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const normalizationInFlight = useRef<string | null>(null);

  useEffect(() => {
    const studies = getSynthesisStudies(includedRecords, characteristics);
    if (studies.length === 0 || synthesis.subtopics.length === 0) return;

    const normalizedSubtopics = normalizeSubtopics(synthesis.subtopics, studies);
    const normalizedSignature = JSON.stringify(normalizedSubtopics);
    const changed = normalizedSubtopics.some((subtopic, index) =>
      subtopic.title !== synthesis.subtopics[index]?.title
      || subtopic.prose !== synthesis.subtopics[index]?.prose
    );
    if (!changed) return;
    if (normalizationInFlight.current === normalizedSignature) return;
    normalizationInFlight.current = normalizedSignature;

    onUpdateSynthesis({
      ...synthesis,
      suggestedTitle: synthesis.suggestedTitle || suggestReviewTitle(studies, normalizedSubtopics),
      subtopics: normalizedSubtopics,
      keyFindingsTable: normalizedSubtopics.map((subtopic, index) => ({
        topic: subtopic.title.replace(/^\d+\.\s*/, ""),
        summary: subtopic.prose,
        consistency: synthesis.keyFindingsTable[index]?.consistency || "Not assessed quantitatively",
        evidenceBase: synthesis.keyFindingsTable[index]?.evidenceBase
          || `${clusterStudies(studies)[index].studies.length} screened-in record${clusterStudies(studies)[index].studies.length === 1 ? "" : "s"}`,
      })),
    });
  }, [includedRecords, characteristics, synthesis, onUpdateSynthesis]);

  // Group characteristics dynamically
  const getGroupedCharacteristics = () => {
    const map = new Map<string, StudyCharacteristic[]>();

    characteristics.forEach((c) => {
      let groupKey = "Uncategorized evidence";
      if (groupingMode === "category") {
        groupKey = c.category || "Uncategorized evidence";
      } else if (groupingMode === "design") {
        groupKey = c.studyDesign || "Study design details in supplied records";
      } else if (groupingMode === "intervention") {
        groupKey = c.interventionOrFocus ? c.interventionOrFocus.split(",")[0].trim() : "Focus described in supplied records";
      } else if (groupingMode === "outcome") {
        groupKey = c.primaryOutcome ? c.primaryOutcome.split("(")[0].trim() : "Outcome details in supplied records";
      }

      if (!map.has(groupKey)) {
        map.set(groupKey, []);
      }
      map.get(groupKey)!.push(c);
    });

    return Array.from(map.entries()).map(([groupTitle, studies]) => ({
      groupTitle,
      studies,
    }));
  };

  // Conservative narrative fallback. It never manufactures quantitative results.
  const runHeuristicSynthesis = () => {
    if (includedRecords.length === 0 && characteristics.length === 0) return;

    const studies = getSynthesisStudies(includedRecords, characteristics);
    const clusters = clusterStudies(studies);
    const fallbackTopics = fallbackSubtopics(studies);

    const generated: SynthesisResult = {
      suggestedTitle: suggestReviewTitle(studies, fallbackTopics),
      subtopics: fallbackTopics,
      keyFindingsTable: clusters.map((cluster) => ({
        topic: cluster.key,
        summary: buildThematicDiscussion(cluster),
        consistency: "Not assessed quantitatively",
        evidenceBase: `${cluster.studies.length} screened-in record${cluster.studies.length === 1 ? "" : "s"}`,
      })),
      forestPlotEstimates: [],
      pooledEffectEstimate: undefined,
      heterogeneityDiscussion: "Differences across records are described through reported methods, contexts, outcomes, and recurring themes.",
    };

    onUpdateSynthesis(generated);
    setErrorMessage(null);
  };

  const handleGenerateSynthesis = async () => {
    if (includedRecords.length === 0 && characteristics.length === 0) return;
    setGenerating(true);
    setErrorMessage(null);

    const studiesData = getSynthesisStudies(includedRecords, characteristics);
    const clusters = clusterStudies(studiesData);

    const prompt = `Act as a systematic review synthesis methodologist. Produce a narrative and thematic synthesis of the ${studiesData.length} screened-in records.

Group studies using the following record-grounded cluster assignments. Use all clusters, and return at least ${MIN_SYNTHESIS_CLUSTERS} non-quantitative subtopics:
${JSON.stringify(clusters.map((cluster, index) => ({
  cluster: index + 1,
  basis: cluster.key,
  recordIds: cluster.studies.map((study) => study.recordId),
})))}

Within each category or thematic group, explicitly identify authors who share similarities in their methods, designs, or outcomes, and compare/contrast their empirical results.

Included Studies and Detailed Characteristics:
${JSON.stringify(studiesData)}

STRICT WRITING RULES:
1. Write in strictly third-person objective academic voice. NEVER use first-person pronouns (DO NOT use "we", "our", "us", "in our study", "we observed").
2. DO NOT use dashes or hyphens as punctuation dividers. Use standard sentence structure with commas, semicolons, and parentheses.
3. DO NOT mention "PRISMA Item", "PRISMA", "Item 20", etc.
4. CITE EVERY INCLUDED STUDY EXPLICITLY in the narrative text using exactly "Author et al. (Year): finding". Put each study citation on its own paragraph. Never concatenate one citation directly after another, and never use a bare author name without its year.
5. Return at least ${MIN_SYNTHESIS_CLUSTERS} structured subtopics, matching the supplied cluster assignments. Each subtopic must contain the citations for its assigned records.
6. Use only supplied facts. Do not invent methods, sample sizes, settings, outcomes, comparisons, validation, reviewer activity, or findings.
7. Do not calculate or report pooled effects, confidence intervals, p-values, weights, or statistical significance.
8. Do not mention citation metadata, the application, extraction state, or system limitations. If a supplied record itself omits a relevant design, population, sample, comparator, or outcome detail, describe that only as "not reported in the supplied record" for that study. Do not make blanket claims about missing information across the review.

Generate a JSON object conforming strictly to:
{
  "subtopics": [
    {
      "title": "Descriptive subtopic grounded in the supplied records",
      "prose": "Evidence-grounded narrative citing the relevant supplied studies"
    }
  ],
  "keyFindingsTable": [
    {
      "topic": "Synthesis Domain",
      "summary": "Concise summary citing findings",
      "consistency": "Describe cautiously or state not assessable",
      "evidenceBase": "Number of records contributing to this theme"
    }
  ]
}`;

    try {
      const text = await callAI(
        prompt,
        "You are an expert systematic review methodologist focused on transparent narrative and thematic synthesis.",
        aiConfig
      );
      const parsed = parseJSONLoose(text);
      if (parsed && parsed.subtopics) {
        const normalizedSubtopics = normalizeSubtopics(parsed.subtopics, studiesData);
        onUpdateSynthesis({
          ...synthesis,
          suggestedTitle: suggestReviewTitle(studiesData, normalizedSubtopics),
          subtopics: normalizedSubtopics,
          keyFindingsTable: normalizedSubtopics.map((subtopic, index) => ({
            topic: subtopic.title.replace(/^\d+\.\s*/, ""),
            summary: subtopic.prose,
            consistency: parsed.keyFindingsTable?.[index]?.consistency || "Not assessed quantitatively",
            evidenceBase: `${clusters[index].studies.length} screened-in record${clusters[index].studies.length === 1 ? "" : "s"}`,
          })),
          forestPlotEstimates: [],
          pooledEffectEstimate: undefined,
          heterogeneityDiscussion: "Differences across records are described through reported methods, contexts, outcomes, and recurring themes.",
        });
      } else {
        throw new Error("Could not parse AI response as valid synthesis object.");
      }
    } catch (e: any) {
      console.warn("AI synthesis error:", e);
      setErrorMessage(`AI Synthesis Notice: ${e.message || "Request failed"}. Automatic structured synthesis was applied as a fallback.`);
      runHeuristicSynthesis();
    } finally {
      setGenerating(false);
    }
  };

  const groupedData = getGroupedCharacteristics();
  const suggestedTitle = synthesis.suggestedTitle
    || (synthesis.subtopics.length > 0
      ? suggestReviewTitle(getSynthesisStudies(includedRecords, characteristics), synthesis.subtopics)
      : "");
  const [titleCopied, setTitleCopied] = useState(false);

  return (
    <div id="synthesis-section-container" className="space-y-6">
      {/* Error / Notice Alert */}
      {errorMessage && (
        <div className="p-3.5 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-xs flex items-center justify-between font-mono">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-amber-700 hover:text-amber-900 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-mono text-[10px] text-indigo-600 uppercase tracking-wider font-bold">
              Results & Evidence Synthesis
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-0.5">
              Narrative & Thematic Synthesis
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Group and summarize only findings supported by the supplied records and extracted characteristics.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleGenerateSynthesis}
              disabled={generating || (includedRecords.length === 0 && characteristics.length === 0)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
              {generating ? "Synthesizing Findings..." : "AI Synthesize Findings (Grouped Subtopics)"}
            </button>
            <button
              onClick={runHeuristicSynthesis}
              disabled={includedRecords.length === 0 && characteristics.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-600" />
              Instant Narrative Synthesis
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100 flex-wrap">
          {[
            { key: "prose", label: "Narrative Synthesis by Subtopics" },
            { key: "groups", label: "Findings Grouped by Study Characteristics" },
            { key: "table", label: "Summary of Findings Matrix" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
                activeTab === t.key
                  ? "bg-slate-900 text-white font-semibold shadow-2xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* When no included records are found */}
      {includedRecords.length === 0 && characteristics.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
          <h3 className="text-sm font-bold text-amber-900">No Included Studies Available for Synthesis</h3>
          <p className="text-xs text-amber-700 max-w-md mx-auto">
            Synthesis requires studies included during the Screening stage.
          </p>
          {onNavigateToScreening && (
            <button
              onClick={onNavigateToScreening}
              className="px-4 py-2 text-xs font-mono font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors cursor-pointer"
            >
              Go to Screening Stage
            </button>
          )}
        </div>
      )}

      {/* Tab 1: Thematic Subtopics Prose */}
      {activeTab === "prose" && (
        <div className="space-y-4">
          {synthesis.subtopics && synthesis.subtopics.length > 0 ? (
            synthesis.subtopics.map((st, i) => (
              <div key={i} className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 font-mono">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                    {st.title}
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    Subtopic {i + 1}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans whitespace-pre-line text-justify">
                  {st.prose}
                </p>
              </div>
            ))
          ) : (
            <div className="bg-white border border-slate-200 p-12 text-center rounded-xl space-y-4">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">Narrative Synthesis Not Yet Generated</h3>
                <p className="text-xs text-slate-500">
                   Click 'AI Synthesize Findings' or 'Instant Narrative Synthesis' above to generate a thematic synthesis.
                </p>
              </div>
            </div>
          )}

          {synthesis.heterogeneityDiscussion && (
            <div className="bg-indigo-50/50 border border-indigo-200 p-6 rounded-xl space-y-2">
              <h3 className="text-sm font-bold text-indigo-950 font-mono">
                Patterns and Differences Across Records
              </h3>
              <p className="text-xs text-indigo-900 font-sans leading-relaxed text-justify">
                {synthesis.heterogeneityDiscussion}
              </p>
            </div>
          )}

          <div className="bg-emerald-50/70 border border-emerald-200 p-5 rounded-xl space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-emerald-950 font-mono">
                  Suggested review title
                </h3>
                <span className="text-[10px] font-mono text-emerald-800">
                  Editable
                </span>
              </div>

              <input
                type="text"
                value={synthesis.suggestedTitle ?? suggestedTitle}
                onChange={(event) =>
                  onUpdateSynthesis({
                    ...synthesis,
                    suggestedTitle: event.target.value,
                  })
                }
                placeholder="Generate a synthesis or enter a suggested review title"
                className="w-full px-3 py-2.5 text-sm font-semibold text-emerald-950 bg-white border border-emerald-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400"
                aria-label="Suggested review title"
              />

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    const title = (synthesis.suggestedTitle ?? suggestedTitle).trim();
                    if (!title) return;
                    onUpdateProtocol({ ...protocol, title });
                  }}
                  disabled={!(synthesis.suggestedTitle ?? suggestedTitle).trim()}
                  className="px-3 py-1.5 text-[10px] font-mono font-semibold text-white bg-emerald-700 rounded-md hover:bg-emerald-800 disabled:bg-emerald-300 cursor-pointer disabled:cursor-not-allowed"
                >
                  Use as review title
                </button>
                <button
                  onClick={() => {
                    const title = synthesis.suggestedTitle ?? suggestedTitle;
                    if (!title) return;
                    navigator.clipboard.writeText(title);
                    setTitleCopied(true);
                    window.setTimeout(() => setTitleCopied(false), 1800);
                  }}
                  disabled={!(synthesis.suggestedTitle ?? suggestedTitle).trim()}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-mono font-semibold text-emerald-900 bg-white border border-emerald-300 rounded-md hover:bg-emerald-100 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Copy className="w-3 h-3" />
                  {titleCopied ? "Copied" : "Copy title"}
                </button>
              </div>

              <p className="text-xs text-emerald-800">
                A generated suggestion appears after synthesis. You can edit it here, copy it, or apply it to the review protocol.
              </p>
            </div>
        </div>
      )}

      {/* Tab 2: Findings Grouped by Study Characteristics */}
      {activeTab === "groups" && (
        <div className="space-y-6">
          {/* Grouping Mode Controls */}
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-700">
              <Filter className="w-4 h-4 text-indigo-600" />
              <span className="font-bold">Group Characteristics by:</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { id: "intervention", label: "Intervention / Technology" },
                { id: "design", label: "Study Design" },
                { id: "population", label: "Country & Population" },
                { id: "outcome", label: "Outcome Measure" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setGroupingMode(m.id as any)}
                  className={`px-3 py-1 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
                    groupingMode === m.id
                      ? "bg-indigo-600 text-white font-semibold shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grouped Cards */}
          {groupedData.length > 0 ? (
            <div className="space-y-4">
              {groupedData.map((group, gIdx) => (
                <div key={gIdx} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs space-y-3">
                  <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-800 text-xs font-mono font-bold flex items-center justify-center">
                        {gIdx + 1}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 font-mono">
                        {group.groupTitle}
                      </h4>
                    </div>
                    <span className="text-xs font-mono text-slate-600 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
                      {group.studies.length} {group.studies.length === 1 ? "Study" : "Studies"}
                    </span>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {group.studies.map((study, sIdx) => (
                        <div key={sIdx} className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-lg space-y-2 text-xs">
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <span className="font-mono font-bold text-indigo-900 text-xs">
                              {study.authorYear}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                              {study.country} · {study.sampleSize}
                            </span>
                          </div>
                          <div className="space-y-1 text-slate-700">
                            <p><strong>Design:</strong> {study.studyDesign}</p>
                            <p><strong>Intervention / Model:</strong> {study.interventionOrFocus}</p>
                            <p><strong>Primary Outcome:</strong> {study.primaryOutcome}</p>
                            <p className="pt-1 text-slate-900 italic font-serif">"{study.keyFinding}"</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center bg-white border border-slate-200 rounded-xl text-slate-500 text-xs font-mono">
              No study characteristics extracted yet. Navigate to the Study Characteristics stage to extract study data.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Key Findings Matrix */}
      {activeTab === "table" && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-mono text-[11px]">
              <tr>
                <th className="py-3 px-4 font-bold">Thematic Domain / Metric</th>
                <th className="py-3 px-4 font-bold">Summary of Synthesized Evidence</th>
                <th className="py-3 px-4 font-bold">Consistency</th>
                <th className="py-3 px-4 font-bold">Evidence Base</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {synthesis.keyFindingsTable && synthesis.keyFindingsTable.length > 0 ? (
                synthesis.keyFindingsTable.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 align-top max-w-[180px]">
                      {row.topic}
                    </td>
                    <td className="py-3 px-4 text-slate-700 align-top leading-relaxed">
                      {row.summary}
                    </td>
                    <td className="py-3 px-4 font-mono text-indigo-700 align-top max-w-[160px]">
                      {row.consistency}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 align-top max-w-[160px]">
                      {row.evidenceBase}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-xs font-mono text-slate-400">
                    No summary table rows available. Click 'AI Synthesize Findings' above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
