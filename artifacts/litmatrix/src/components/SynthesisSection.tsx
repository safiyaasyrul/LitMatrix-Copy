import React, { useMemo, useState } from "react";
import {
  SLRProtocol,
  SLRRecord,
  SynthesisResult,
  StudyCharacteristic,
} from "../types/slr";
import {
  Sparkles,
  BookOpen,
  Filter,
  Copy,
  Zap,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
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

/*
 * The evidence lock is unrestricted.
 * The AI writing pass is capped separately to keep downstream
 * API usage predictable without changing PRISMA/evidence counts.
 */
const AI_SYNTHESIS_LIMIT = 90;
const MIN_SYNTHESIS_CLUSTERS = 3;

type SynthesisStudy = StudyCharacteristic & {
  recordId: string;
  authorYear: string;
};

const RECORD_NOT_REPORTED = "Not reported in the supplied record";

const firstAuthorSurname = (record: SLRRecord) => {
  const firstAuthor = record.authors?.[0]?.trim();

  if (!firstAuthor) return "Author";

  return firstAuthor.includes(",")
    ? firstAuthor.split(",")[0].trim()
    : firstAuthor.split(/\s+/).slice(-1)[0] || "Author";
};

const authorYearLabel = (record: SLRRecord) =>
  `${firstAuthorSurname(record)} et al. (${record.year || "n.d."})`;

const cleanText = (value: any) =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

const buildStudiesFromRecords = (
  records: SLRRecord[],
  characteristics: StudyCharacteristic[]
): SynthesisStudy[] => {
  const characteristicMap = new Map<string, StudyCharacteristic>();

  characteristics.forEach((characteristic) => {
    if (characteristic.recordId) {
      characteristicMap.set(characteristic.recordId, characteristic);
    }
  });

  return records.map((record) => {
    const characteristic = characteristicMap.get(record.id);

    return {
      recordId: record.id,
      authorYear: authorYearLabel(record),

      country:
        cleanText(characteristic?.country) || RECORD_NOT_REPORTED,

      sampleSize:
        cleanText(characteristic?.sampleSize) || RECORD_NOT_REPORTED,

      population:
        cleanText(characteristic?.population) || RECORD_NOT_REPORTED,

      interventionOrFocus:
        cleanText(characteristic?.interventionOrFocus) ||
        cleanText(record.title) ||
        RECORD_NOT_REPORTED,

      comparator:
        cleanText(characteristic?.comparator) || RECORD_NOT_REPORTED,

      primaryOutcome:
        cleanText(characteristic?.primaryOutcome) || RECORD_NOT_REPORTED,

      studyDesign:
        cleanText(characteristic?.studyDesign) || RECORD_NOT_REPORTED,

      keyFinding:
        cleanText(characteristic?.keyFinding) ||
        cleanText(record.abstract)?.slice(0, 500) ||
        RECORD_NOT_REPORTED,

      category:
        cleanText(characteristic?.category) || "Uncategorized evidence",
    };
  });
};

/*
 * IMPORTANT:
 * This function creates mutually exclusive descriptive domains.
 * Every included record belongs to exactly one domain.
 *
 * It does not claim that these are formal evidence categories.
 * They are only an organizational device for narrative synthesis.
 */
const classifyTheme = (study: SynthesisStudy): string => {
  const text = [
    study.category,
    study.interventionOrFocus,
    study.studyDesign,
    study.primaryOutcome,
    study.keyFinding,
  ]
    .join(" ")
    .toLowerCase();

  const outcomeTerms = [
    "emission",
    "co2",
    "carbon",
    "decarbon",
    "fuel consumption",
    "energy consumption",
    "efficiency",
    "performance",
    "accuracy",
    "reduction",
    "impact",
    "result",
    "outcome",
  ];

  const technologyTerms = [
    "technology",
    "optimization",
    "optimisation",
    "algorithm",
    "machine learning",
    "deep learning",
    "artificial intelligence",
    "digital",
    "system",
    "propulsion",
    "fuel",
    "engine",
    "energy",
    "renewable",
    "alternative fuel",
    "electr",
    "hybrid",
    "battery",
  ];

  const methodsTerms = [
    "method",
    "framework",
    "model",
    "simulation",
    "assessment",
    "methodology",
    "life cycle",
    "lca",
    "scenario",
    "forecast",
    "prediction",
    "optimization model",
    "decision",
    "evaluation",
  ];

  const score = (terms: string[]) =>
    terms.reduce(
      (total, term) => total + (text.includes(term) ? 1 : 0),
      0
    );

  const technologyScore = score(technologyTerms);
  const methodsScore = score(methodsTerms);
  const outcomesScore = score(outcomeTerms);

  if (technologyScore >= methodsScore && technologyScore >= outcomesScore) {
    return "Technologies, interventions, and operational strategies";
  }

  if (methodsScore >= outcomesScore) {
    return "Methods, models, and assessment approaches";
  }

  return "Emissions, performance, and reported outcomes";
};

const buildClusters = (studies: SynthesisStudy[]) => {
  const orderedThemes = [
    "Technologies, interventions, and operational strategies",
    "Methods, models, and assessment approaches",
    "Emissions, performance, and reported outcomes",
  ];

  const buckets = orderedThemes.map((key) => ({
    key,
    studies: [] as SynthesisStudy[],
  }));

  studies.forEach((study) => {
    const theme = classifyTheme(study);
    const bucket = buckets.find((item) => item.key === theme);

    if (bucket) {
      bucket.studies.push(study);
    }
  });

  /*
   * If a theme is empty, do not artificially move records just to
   * manufacture a count. Empty domains are legitimate.
   */
  return buckets;
};

const getThemeTerms = (studies: SynthesisStudy[]) => {
  const stopWords = new Set([
    "about",
    "across",
    "after",
    "among",
    "based",
    "between",
    "could",
    "from",
    "into",
    "more",
    "other",
    "reported",
    "record",
    "records",
    "study",
    "studies",
    "their",
    "these",
    "those",
    "using",
    "with",
    "within",
    "not",
    "supplied",
    "information",
    "described",
    "details",
    "available",
    "included",
    "analysis",
    "method",
    "methods",
    "model",
    "models",
  ]);

  const counts = new Map<string, number>();

  studies.forEach((study) => {
    const text = [
      study.interventionOrFocus,
      study.primaryOutcome,
      study.keyFinding,
    ]
      .join(" ")
      .toLowerCase();

    text.match(/[a-z][a-z0-9]{3,}/g)?.forEach((word) => {
      if (!stopWords.has(word)) {
        counts.set(word, (counts.get(word) || 0) + 1);
      }
    });
  });

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([word]) => word);
};

const studyCitationLine = (study: SynthesisStudy) => {
  const finding =
    cleanText(study.keyFinding) ||
    "No specific finding is reported in the supplied record.";

  const sentence =
    finding.split(/(?<=[.!?])\s+/)[0].slice(0, 260).trim();

  return `${study.authorYear}: ${sentence}${
    finding.length > 260 ? "…" : ""
  }`;
};

const buildClusterNarrative = (
  cluster: { key: string; studies: SynthesisStudy[] },
  suppliedProse = ""
) => {
  if (cluster.studies.length === 0) {
    return `No included records were assigned to the ${cluster.key.toLowerCase()} domain.`;
  }

  const terms = getThemeTerms(cluster.studies);
  const topicPhrase =
    terms.length > 0
      ? terms.join(", ")
      : "the reported characteristics and findings";

  const opening = `The ${cluster.key.toLowerCase()} domain contains ${
    cluster.studies.length
  } included record${
    cluster.studies.length === 1 ? "" : "s"
  }. Recurring features include ${topicPhrase}.`;

  const supplied = cleanText(suppliedProse);

  const evidence = cluster.studies
    .map(studyCitationLine)
    .join("\n\n");

  if (supplied) {
    return `${opening}\n\n${supplied}\n\n${evidence}`;
  }

  return `${opening}\n\n${evidence}`;
};

const fallbackSubtopics = (studies: SynthesisStudy[]) =>
  buildClusters(studies)
    .filter((cluster) => cluster.studies.length > 0)
    .map((cluster, index) => ({
      title: `${index + 1}. ${cluster.key}`,
      prose: buildClusterNarrative(cluster),
    }));

/*
 * Keep at least three possible synthesis domains in the UI when
 * enough evidence exists, but never fabricate records.
 */
const normalizeSubtopics = (
  suppliedSubtopics: any[],
  studies: SynthesisStudy[]
) => {
  const clusters = buildClusters(studies);

  const populatedClusters = clusters.filter(
    (cluster) => cluster.studies.length > 0
  );

  const baseClusters =
    populatedClusters.length >= MIN_SYNTHESIS_CLUSTERS
      ? populatedClusters
      : clusters;

  return baseClusters.map((cluster, index) => {
    const supplied =
      suppliedSubtopics?.[index];

    const title =
      typeof supplied?.title === "string" &&
      supplied.title.trim()
        ? supplied.title.trim()
        : `${index + 1}. ${cluster.key}`;

    return {
      title: title.replace(/^\d+\.\s*/, `${index + 1}. `),
      prose: buildClusterNarrative(
        cluster,
        typeof supplied?.prose === "string"
          ? supplied.prose
          : ""
      ),
    };
  });
};

/*
 * Extract a concise subject from the protocol title.
 *
 * The protocol title is preferable to arbitrary word frequency
 * because it reflects the user's defined review question/topic.
 */
const getProtocolSubject = (protocol: SLRProtocol) => {
  const raw = cleanText(protocol?.title);

  if (!raw) return "";

  return raw
    .replace(/^systematic\s+literature\s+review\s*[:\-]?\s*/i, "")
    .replace(/^a\s+systematic\s+review\s+of\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
};

const suggestReviewTitles = (
  protocol: SLRProtocol,
  studies: SynthesisStudy[],
  subtopics: SynthesisResult["subtopics"]
) => {
  const protocolSubject = getProtocolSubject(protocol);

  const themeTerms = Array.from(
    new Set(
      subtopics
        .map((topic) =>
          topic.title
            .replace(/^\d+\.\s*/, "")
            .trim()
        )
        .filter(Boolean)
    )
  );

  const evidenceTerms = getThemeTerms(studies)
    .slice(0, 3)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1)
    );

  const subject =
    protocolSubject ||
    (evidenceTerms.length
      ? evidenceTerms.join(", ")
      : "The Included Literature");

  const titles = [
    `${subject}: A Narrative and Thematic Synthesis`,

    `A Systematic Review of ${subject}`,

    `${subject}: Evidence, Methods, and Reported Outcomes`,

    themeTerms.length > 0
      ? `${subject}: A Thematic Synthesis of ${themeTerms
          .slice(0, 2)
          .join(" and ")}`
      : `${subject}: A Structured Review of the Evidence`,
  ];

  return Array.from(
    new Set(titles.map((title) => title.trim()))
  );
};

const buildEvidenceTable = (
  studies: SynthesisStudy[]
) => {
  return buildClusters(studies)
    .filter((cluster) => cluster.studies.length > 0)
    .map((cluster) => ({
      topic: cluster.key,
      summary: buildClusterNarrative(cluster),
      consistency: "Not assessed quantitatively",
      evidenceBase: `${cluster.studies.length} included record${
        cluster.studies.length === 1 ? "" : "s"
      }`,
    }));
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
  const [activeTab, setActiveTab] =
    useState<"prose" | "groups" | "table">("prose");
  const [groupingMode, setGroupingMode] = useState<
    "category" | "intervention" | "design" | "outcome"
  >("category");
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);
  const [titleCopied, setTitleCopied] =
    useState(false);

  /*
   * Evidence Lock:
   * ALL final included records remain in the synthesis evidence base.
   * Characteristics are supplementary and never determine inclusion.
   */
  const synthesisStudies = useMemo(
    () =>
      buildStudiesFromRecords(
        includedRecords,
        characteristics
      ),
    [includedRecords, characteristics]
  );

  const clusters = useMemo(
    () => buildClusters(synthesisStudies),
    [synthesisStudies]
  );

  const titleOptions = useMemo(
    () =>
      suggestReviewTitles(
        protocol,
        synthesisStudies,
        synthesis.subtopics || []
      ),
    [protocol, synthesisStudies, synthesis.subtopics]
  );

  const suggestedTitle =
    synthesis.suggestedTitle ||
    titleOptions[0] ||
    "";

  const getGroupedCharacteristics = () => {
    const map = new Map<string, SynthesisStudy[]>();

    synthesisStudies.forEach((study) => {
      let groupKey =
        "Uncategorized evidence";

      if (groupingMode === "category") {
        groupKey =
          study.category ||
          "Uncategorized evidence";
      }

      if (groupingMode === "design") {
        groupKey =
          study.studyDesign ||
          "Study design details in supplied records";
      }

      if (groupingMode === "intervention") {
        groupKey =
          study.interventionOrFocus ||
          "Focus described in supplied records";
      }

      if (groupingMode === "outcome") {
        groupKey =
          study.primaryOutcome ||
          "Outcome details in supplied records";
      }

      if (!map.has(groupKey)) {
        map.set(groupKey, []);
      }

      map.get(groupKey)!.push(study);
    });

    return Array.from(map.entries()).map(
      ([groupTitle, studies]) => ({
        groupTitle,
        studies,
      })
    );
  };

  const groupedData = getGroupedCharacteristics();

  const runHeuristicSynthesis = () => {
    if (synthesisStudies.length === 0) return;

    const fallbackTopics =
      fallbackSubtopics(synthesisStudies);

    const generated: SynthesisResult = {
      suggestedTitle:
        suggestReviewTitles(
          protocol,
          synthesisStudies,
          fallbackTopics
        )[0],

      subtopics: fallbackTopics,

      keyFindingsTable:
        buildEvidenceTable(synthesisStudies),

      forestPlotEstimates: [],

      pooledEffectEstimate: undefined,

      heterogeneityDiscussion:
        "Differences across records are described narratively according to their reported approaches, contexts, outcomes, and findings. Quantitative pooling is not performed.",

    };

    onUpdateSynthesis(generated);
    setErrorMessage(null);
  };

  const handleGenerateSynthesis = async () => {
    if (synthesisStudies.length === 0) return;

    setGenerating(true);
    setErrorMessage(null);

    /*
     * AI writing pass is intentionally capped.
     * The evidence lock remains the complete includedRecords set.
     */
    const studiesForAI =
      synthesisStudies.slice(0, AI_SYNTHESIS_LIMIT);

    const aiClusters =
      buildClusters(studiesForAI);

    const prompt = `
Act as an expert systematic review synthesis methodologist.

Prepare a conservative narrative and thematic synthesis based ONLY
on the supplied included study records.

The complete evidence lock contains ${
      synthesisStudies.length
    } included records.

The current writing pass contains ${
      studiesForAI.length
    } records.

Do not invent information for records that are not supplied below.

THEMATIC DOMAINS:
${JSON.stringify(
  aiClusters.map((cluster) => ({
    domain: cluster.key,
    recordIds: cluster.studies.map(
      (study) => study.recordId
    ),
  })),
  null,
  2
)}

SUPPLIED RECORDS:
${JSON.stringify(studiesForAI, null, 2)}

WRITING RULES:

1. Use objective third-person academic writing.

2. Do not mention artificial intelligence, language models,
   software, automation, screening technology, or this application.

3. Do not mention PRISMA items.

4. Do not invent sample sizes, populations, methods, datasets,
   comparisons, outcomes, effect sizes, confidence intervals,
   p-values, statistical significance, heterogeneity statistics,
   risk of bias, GRADE ratings, or reviewer activity.

5. Use only information explicitly supplied in the records.

6. If a characteristic is absent, use:
   "not reported in the supplied record."

7. Distinguish between:
   measured emissions,
   calculated or estimated emissions,
   proxy indicators,
   model predictions,
   simulations,
   intended reductions,
   and demonstrated outcomes.

8. Do not treat model accuracy as evidence of real-world
   decarbonization.

9. Do not treat simulation results as real-world reductions.

10. Do not perform quantitative pooling.

11. Identify similarities and differences between studies only
    where the supplied information supports that comparison.

12. Cite studies using:
    Author et al. (Year)

13. Do not fabricate citations.

14. Do not create numerical evidence counts.
    Evidence counts will be calculated separately by the application.

Return valid JSON only:

{
  "subtopics": [
    {
      "title": "Meaningful thematic domain",
      "prose": "Evidence-grounded narrative"
    }
  ]
}
`;

    try {
      const text = await callAI(
        prompt,
        "You are an expert systematic review methodologist focused on transparent narrative and thematic synthesis.",
        aiConfig
      );

      const parsed = parseJSONLoose(text);

      if (!parsed || !Array.isArray(parsed.subtopics)) {
        throw new Error(
          "The synthesis response could not be parsed."
        );
      }

      const normalizedSubtopics =
        normalizeSubtopics(
          parsed.subtopics,
          synthesisStudies
        );

      onUpdateSynthesis({
        ...synthesis,

        suggestedTitle:
          suggestReviewTitles(
            protocol,
            synthesisStudies,
            normalizedSubtopics
          )[0],

        subtopics: normalizedSubtopics,

        /*
         * IMPORTANT:
         * Counts come from the complete evidence lock,
         * never from AI-generated text.
         */
        keyFindingsTable:
          buildEvidenceTable(synthesisStudies),

        forestPlotEstimates: [],

        pooledEffectEstimate: undefined,

        heterogeneityDiscussion:
          "Differences across records are described narratively according to their reported approaches, contexts, outcomes, and findings. Quantitative pooling is not performed.",
      });
    } catch (error: any) {
      console.warn(
        "Narrative synthesis generation error:",
        error
      );

      setErrorMessage(
        `Automatic synthesis could not be completed. A conservative structured synthesis has been generated instead.`
      );

      runHeuristicSynthesis();
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div
      id="synthesis-section-container"
      className="space-y-6"
    >
      {/* =====================================================
          SUGGESTED TITLE — INTENTIONALLY FIRST
          ===================================================== */}
      <div className="bg-emerald-50/70 border border-emerald-200 p-6 rounded-xl shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-mono text-[10px] text-emerald-700 uppercase tracking-wider font-bold">
              Manuscript Development
            </div>

            <h2 className="text-xl font-bold text-emerald-950 mt-0.5">
              Suggested Review Title
            </h2>

            <p className="text-xs text-emerald-800 mt-1 max-w-3xl">
              A publication-oriented title is suggested from the
              review topic and the evidence themes. The title can
              be edited before being applied to the review protocol.
            </p>
          </div>

          <span className="text-[10px] font-mono text-emerald-800 bg-white border border-emerald-200 px-2 py-1 rounded-md">
            Editable
          </span>
        </div>

        {titleOptions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-emerald-800 font-medium">
              Recommended starting titles
            </p>

            <div className="grid gap-2">
              {titleOptions.map((title) => {
                const selected =
                  (synthesis.suggestedTitle ||
                    suggestedTitle) === title;

                return (
                  <button
                    key={title}
                    type="button"
                    onClick={() =>
                      onUpdateSynthesis({
                        ...synthesis,
                        suggestedTitle: title,
                      })
                    }
                    className={`w-full text-left px-4 py-3 text-sm rounded-lg border transition-colors cursor-pointer ${
                      selected
                        ? "border-emerald-500 bg-emerald-100 text-emerald-950 font-semibold"
                        : "border-emerald-200 bg-white text-emerald-900 hover:bg-emerald-50"
                    }`}
                  >
                    {selected && (
                      <CheckCircle className="inline-block w-4 h-4 mr-2 align-text-bottom" />
                    )}

                    {title}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-wider font-mono font-bold text-emerald-800">
            Working manuscript title
          </label>

          <input
            type="text"
            value={
              synthesis.suggestedTitle ||
              suggestedTitle
            }
            onChange={(event) =>
              onUpdateSynthesis({
                ...synthesis,
                suggestedTitle:
                  event.target.value,
              })
            }
            placeholder="Enter or edit the review title"
            className="w-full px-4 py-3 text-base font-semibold text-emerald-950 bg-white border border-emerald-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400"
            aria-label="Suggested review title"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const title = (
                synthesis.suggestedTitle ||
                suggestedTitle
              ).trim();

              if (!title) return;

              onUpdateProtocol({
                ...protocol,
                title,
              });
            }}
            disabled={
              !(
                synthesis.suggestedTitle ||
                suggestedTitle
              ).trim()
            }
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 disabled:bg-emerald-300 cursor-pointer disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Use as review title
          </button>

          <button
            type="button"
            onClick={() => {
              const title = (
                synthesis.suggestedTitle ||
                suggestedTitle
              ).trim();

              if (!title) return;

              navigator.clipboard.writeText(title);
              setTitleCopied(true);

              window.setTimeout(
                () => setTitleCopied(false),
                1800
              );
            }}
            disabled={
              !(
                synthesis.suggestedTitle ||
                suggestedTitle
              ).trim()
            }
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-semibold text-emerald-900 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-100 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            <Copy className="w-3.5 h-3.5" />

            {titleCopied
              ? "Copied"
              : "Copy title"}
          </button>
        </div>
      </div>

      {/* =====================================================
          ERROR / NOTICE
          ===================================================== */}
      {errorMessage && (
        <div className="p-3.5 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-xs flex items-center justify-between font-mono">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>

          <button
            type="button"
            onClick={() =>
              setErrorMessage(null)
            }
            className="text-amber-700 hover:text-amber-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* =====================================================
          HEADER
          ===================================================== */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-mono text-[10px] text-indigo-600 uppercase tracking-wider font-bold">
              Results & Evidence Synthesis
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mt-0.5">
              Narrative & Thematic Synthesis
            </h2>

            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              Synthesize only evidence supported by the final
              included records. Quantitative pooling is not
              performed unless appropriate data are available.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleGenerateSynthesis}
              disabled={
                generating ||
                synthesisStudies.length === 0
              }
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />

              {generating
                ? "Generating Synthesis..."
                : "Generate Narrative Synthesis"}
            </button>

            <button
              type="button"
              onClick={runHeuristicSynthesis}
              disabled={
                synthesisStudies.length === 0
              }
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-600" />
              Instant Synthesis
            </button>
          </div>
        </div>

        {/* Evidence lock indicator */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
          <div className="text-xs font-mono text-slate-600">
            <strong className="text-slate-900">
              Evidence lock:
            </strong>{" "}
            {includedRecords.length} included record
            {includedRecords.length === 1
              ? ""
              : "s"}
          </div>

          <div className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
            Final included records only
          </div>

          {includedRecords.length > AI_SYNTHESIS_LIMIT && (
            <div className="text-[10px] font-mono text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md">
              Narrative writing pass limited to{" "}
              {AI_SYNTHESIS_LIMIT} records
            </div>
          )}
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100 flex-wrap">
          {[
            {
              key: "prose",
              label: "Narrative Synthesis by Subtopics",
            },
            {
              key: "groups",
              label:
                "Findings Grouped by Study Characteristics",
            },
            {
              key: "table",
              label: "Summary of Findings Matrix",
            },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() =>
                setActiveTab(tab.key as any)
              }
              className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
                activeTab === tab.key
                  ? "bg-slate-900 text-white font-semibold shadow-2xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* =====================================================
          EMPTY STATE
          ===================================================== */}
      {includedRecords.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />

          <h3 className="text-sm font-bold text-amber-900">
            No Included Studies Available for Synthesis
          </h3>

          <p className="text-xs text-amber-700 max-w-md mx-auto">
            Synthesis requires records that have been
            included during the Study Selection stage.
          </p>

          {onNavigateToScreening && (
            <button
              type="button"
              onClick={onNavigateToScreening}
              className="px-4 py-2 text-xs font-mono font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors cursor-pointer"
            >
              Go to Study Selection
            </button>
          )}
        </div>
      )}

      {/* =====================================================
          TAB 1: NARRATIVE
          ===================================================== */}
      {activeTab === "prose" && (
        <div className="space-y-4">
          {synthesis.subtopics &&
          synthesis.subtopics.length > 0 ? (
            synthesis.subtopics.map(
              (subtopic, index) => (
                <div
                  key={index}
                  className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 font-mono">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />

                      {subtopic.title}
                    </h3>

                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      Subtopic {index + 1}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans whitespace-pre-line text-justify">
                    {subtopic.prose}
                  </p>
                </div>
              )
            )
          ) : (
            <div className="bg-white border border-slate-200 p-12 text-center rounded-xl space-y-4">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />

              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">
                  Narrative Synthesis Not Yet Generated
                </h3>

                <p className="text-xs text-slate-500">
                  Generate the synthesis above to
                  organize the included evidence into
                  thematic domains.
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
        </div>
      )}

      {/* =====================================================
          TAB 2: GROUPS
          ===================================================== */}
      {activeTab === "groups" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-700">
              <Filter className="w-4 h-4 text-indigo-600" />

              <span className="font-bold">
                Group Characteristics by:
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {[
                {
                  id: "category",
                  label: "Evidence Category",
                },
                {
                  id: "intervention",
                  label:
                    "Intervention / Technology",
                },
                {
                  id: "design",
                  label: "Study Design",
                },
                {
                  id: "outcome",
                  label: "Outcome Measure",
                },
              ].map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() =>
                    setGroupingMode(
                      mode.id as any
                    )
                  }
                  className={`px-3 py-1 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
                    groupingMode === mode.id
                      ? "bg-indigo-600 text-white font-semibold shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {groupedData.length > 0 ? (
            <div className="space-y-4">
              {groupedData.map(
                (group, groupIndex) => (
                  <div
                    key={group.groupTitle}
                    className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs"
                  >
                    <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-800 text-xs font-mono font-bold flex items-center justify-center">
                          {groupIndex + 1}
                        </span>

                        <h4 className="text-sm font-bold text-slate-900 font-mono">
                          {group.groupTitle}
                        </h4>
                      </div>

                      <span className="text-xs font-mono text-slate-600 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
                        {group.studies.length}{" "}
                        {group.studies.length === 1
                          ? "Study"
                          : "Studies"}
                      </span>
                    </div>

                    <div className="p-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {group.studies.map(
                          (study) => (
                            <div
                              key={study.recordId}
                              className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-lg space-y-2 text-xs"
                            >
                              <div className="flex items-center justify-between gap-1 flex-wrap">
                                <span className="font-mono font-bold text-indigo-900 text-xs">
                                  {study.authorYear}
                                </span>

                                <span className="font-mono text-[10px] text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                                  {study.country} ·{" "}
                                  {study.sampleSize}
                                </span>
                              </div>

                              <div className="space-y-1 text-slate-700">
                                <p>
                                  <strong>
                                    Design:
                                  </strong>{" "}
                                  {study.studyDesign}
                                </p>

                                <p>
                                  <strong>
                                    Intervention /
                                    Model:
                                  </strong>{" "}
                                  {
                                    study.interventionOrFocus
                                  }
                                </p>

                                <p>
                                  <strong>
                                    Primary Outcome:
                                  </strong>{" "}
                                  {
                                    study.primaryOutcome
                                  }
                                </p>

                                <p className="pt-1 text-slate-900 italic font-serif">
                                  "{study.keyFinding}"
                                </p>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="p-10 text-center bg-white border border-slate-200 rounded-xl text-slate-500 text-xs font-mono">
              No study characteristics are available.
            </div>
          )}
        </div>
      )}

      {/* =====================================================
          TAB 3: SUMMARY MATRIX
          ===================================================== */}
      {activeTab === "table" && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-mono text-[11px]">
              <tr>
                <th className="py-3 px-4 font-bold">
                  Thematic Domain
                </th>

                <th className="py-3 px-4 font-bold">
                  Summary of Synthesized Evidence
                </th>

                <th className="py-3 px-4 font-bold">
                  Consistency
                </th>

                <th className="py-3 px-4 font-bold">
                  Evidence Base
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {synthesis.keyFindingsTable &&
              synthesis.keyFindingsTable.length > 0 ? (
                synthesis.keyFindingsTable.map(
                  (row, index) => (
                    <tr
                      key={index}
                      className="hover:bg-slate-50/70"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 align-top max-w-[220px]">
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
                  )
                )
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="p-8 text-center text-xs font-mono text-slate-400"
                  >
                    No summary table rows available.
                    Generate the synthesis above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* =====================================================
          FINAL EVIDENCE NOTE
          ===================================================== */}
      {includedRecords.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />

            <div>
              <p className="text-xs font-bold text-slate-800">
                Evidence lock active
              </p>

              <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
                Only final included records are eligible to
                contribute to the synthesis, evidence matrix,
                discussion, and manuscript results. Missing
                characteristics remain reported as not reported
                rather than being inferred.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
