import React, { useState } from "react";
import { SLRProtocol, SLRRecord, SynthesisResult, StudyCharacteristic } from "../types/slr";
import { Sparkles, BarChart2, BookOpen, Layers, Download, CheckCircle, RefreshCw, AlertCircle, Zap, Tag, Quote, Filter } from "lucide-react";
import { callAI, parseJSONLoose } from "../utils/aiClient";

interface SynthesisSectionProps {
  synthesis: SynthesisResult;
  onUpdateSynthesis: (synthesis: SynthesisResult) => void;
  includedRecords: SLRRecord[];
  characteristics: StudyCharacteristic[];
  protocol: SLRProtocol;
  aiConfig: any;
  onNavigateToScreening?: () => void;
}

export default function SynthesisSection({
  synthesis,
  onUpdateSynthesis,
  includedRecords,
  characteristics,
  protocol,
  aiConfig,
  onNavigateToScreening,
}: SynthesisSectionProps) {
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"prose" | "groups" | "forest" | "table">("prose");
  const [groupingMode, setGroupingMode] = useState<"category" | "intervention" | "design" | "outcome">("category");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const researchQuestions = (protocol.primaryResearchQuestions || []).filter((question) => question.trim());

  // Group characteristics dynamically
  const getGroupedCharacteristics = () => {
    const map = new Map<string, StudyCharacteristic[]>();

    characteristics.forEach((c) => {
      let groupKey = "Uncategorized evidence";
      if (groupingMode === "category") {
        groupKey = c.category || "Uncategorized evidence";
      } else if (groupingMode === "design") {
        groupKey = c.studyDesign || "Study design not reported";
      } else if (groupingMode === "intervention") {
        groupKey = c.interventionOrFocus ? c.interventionOrFocus.split(",")[0].trim() : "Focus not reported";
      } else if (groupingMode === "outcome") {
        groupKey = c.primaryOutcome ? c.primaryOutcome.split("(")[0].trim() : "Outcome not reported";
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

    const studies = characteristics.length > 0
      ? characteristics
      : includedRecords.map((r) => ({
          recordId: r.id,
          authorYear: `${r.authors[0]?.split(",")[0] || "Author"} et al. (${r.year || "Year not reported"})`,
          country: "Not reported",
          sampleSize: "Not reported",
          population: "Not reported",
          interventionOrFocus: r.title.slice(0, 50),
          comparator: "Not reported",
          primaryOutcome: "Not reported",
          studyDesign: "Not established from citation metadata",
          keyFinding: r.abstract?.slice(0, 240) || "No abstract available.",
        }));
    const categoryMap = new Map<string, typeof studies>();
    studies.forEach((study) => {
      const category = study.category || "Uncategorized evidence";
      categoryMap.set(category, [...(categoryMap.get(category) || []), study]);
    });

    const generated: SynthesisResult = {
      status: "evidence_map",
      studyEvidence: studies.map((study) => ({
        recordId: study.recordId,
        studyLabel: study.authorYear,
        finding: study.keyFinding,
        assignedResearchQuestions: researchQuestions.map((_, index) => `RQ${index + 1}`),
      })),
      subtopics: Array.from(categoryMap.entries()).map(([category, categoryStudies], index) => ({
        title: `${index + 1}. ${category}`,
        prose: `This theme contains findings from ${categoryStudies.length} included ${categoryStudies.length === 1 ? "study" : "studies"}. The extracted findings require AI-assisted or researcher-led comparison before a directional cross-study conclusion is stated.`,
        recordIds: categoryStudies.map((study) => study.recordId),
      })),
      rqFindings: researchQuestions.map((question, index) => ({
        rqId: `RQ${index + 1}`,
        question,
        synthesizedAnswer: `The extracted evidence relevant to this question is mapped across ${studies.length} included ${studies.length === 1 ? "study" : "studies"}. A substantive answer requires comparison of the recorded findings and should not be inferred from citation metadata alone.`,
        dominantPatterns: "Not yet established by cross-study comparison.",
        contradictions: "Not yet established by cross-study comparison.",
        evidenceGaps: "Reporting gaps remain where extracted study fields are marked as not reported.",
        contributingRecordIds: studies.map((study) => study.recordId),
      })),
      crossStudySynthesis: {
        overallPatterns: "A structured evidence map has been created. Overall patterns require AI-assisted or researcher-led comparison of the extracted findings.",
        contradictions: "Contradictions have not yet been established.",
        evidenceGaps: "Missing or unreported extraction fields limit cross-study interpretation.",
        implications: "No substantive implication is generated by the conservative fallback.",
      },
      keyFindingsTable: Array.from(categoryMap.entries()).map(([category, categoryStudies]) => ({
        topic: category,
        summary: `Findings from ${categoryStudies.length} included ${categoryStudies.length === 1 ? "study contribute" : "studies contribute"} to this theme; a cross-study conclusion has not been inferred automatically.`,
        consistency: "Not assessed quantitatively",
        evidenceBase: `${categoryStudies.length} reviewer-included abstract${categoryStudies.length === 1 ? "" : "s"}`,
      })),
      forestPlotEstimates: [],
      pooledEffectEstimate: undefined,
      heterogeneityDiscussion: "Study differences are described narratively. No pooled effect, confidence interval, heterogeneity statistic, or significance test was calculated.",
    };

    onUpdateSynthesis(generated);
    setErrorMessage(null);
  };

  const handleGenerateSynthesis = async () => {
    if (includedRecords.length === 0 && characteristics.length === 0) return;
    setGenerating(true);
    setErrorMessage(null);

    const studiesData = characteristics.length > 0
      ? characteristics
      : includedRecords.map((r) => ({
          recordId: r.id,
          authorYear: `${r.authors[0]?.split(",")[0] || "Author"} et al. (${r.year || "Year not reported"})`,
          country: "Not reported",
          sampleSize: "Not reported",
          population: "Not reported",
          interventionOrFocus: r.title,
          comparator: "Not reported",
          primaryOutcome: "Not reported",
          studyDesign: "Not established from citation metadata",
          keyFinding: (r.abstract || "").slice(0, 260),
        }));

    const prompt = `Act as a systematic review synthesis methodologist. Produce a two-level evidence synthesis of the ${studiesData.length} reviewer-included citation records and abstracts.

Research Questions:
${researchQuestions.map((question, index) => `RQ${index + 1}: ${question.replace(/^RQ\\d+:\\s*/i, "")}`).join("\n") || "No approved research questions were supplied."}

Included Studies and Detailed Characteristics:
${JSON.stringify(studiesData)}

STRICT WRITING RULES:
1. Write in strictly third-person objective academic voice. NEVER use first-person pronouns (DO NOT use "we", "our", "us", "in our study", "we observed").
2. DO NOT use dashes or hyphens as punctuation dividers. Use standard sentence structure with commas, semicolons, and parentheses.
3. DO NOT mention "PRISMA Item", "PRISMA", "Item 20", etc.
4. Level 1 must preserve each supplied study finding and map it to the research question or questions it can actually inform.
5. Group the Level 1 findings into evidence-grounded themes. Theme prose may cite included studies for traceability.
6. Level 2 must synthesize the evidence by research question, then integrate those RQ answers into overall patterns, contradictions, gaps, and implications.
7. Results describe what the studies found. Do not add explanations, recommendations, or broader meaning that belong in Discussion.
8. In rqFindings, crossStudySynthesis, and keyFindingsTable, synthesize across studies without author names, years, citations, reference numbers, DOI links, or individual-study lists.
9. Group the findings into 3-4 structured themes with descriptive academic titles.
10. Each RQ answer must name its contributing recordIds. Do not claim an answer when no supplied finding addresses that RQ; state that the evidence is insufficient.
11. Use only supplied facts. Do not invent methods, sample sizes, settings, outcomes, comparisons, validation, reviewer activity, or findings.
12. Do not calculate or report pooled effects, confidence intervals, p-values, I², weights, meta-analysis, or statistical significance.
13. Treat "Not reported" as missing information, not as evidence of absence.

Generate a JSON object conforming strictly to:
{
  "studyEvidence": [
    {
      "recordId": "Exact supplied recordId",
      "studyLabel": "Supplied authorYear",
      "finding": "Exact or faithfully condensed supplied key finding",
      "assignedResearchQuestions": ["RQ1"]
    }
  ],
  "subtopics": [
    {
      "title": "Descriptive subtopic grounded in the supplied records",
      "prose": "Evidence-grounded narrative citing the relevant supplied studies",
      "recordIds": ["Exact supplied recordId"]
    }
  ],
  "rqFindings": [
    {
      "rqId": "RQ1",
      "question": "Exact approved research question",
      "synthesizedAnswer": "Cross-study answer describing what the evidence found",
      "dominantPatterns": "Dominant approaches, themes, or outcomes",
      "contradictions": "Conflicting or inconsistent findings, or none established",
      "evidenceGaps": "Weak, missing, or insufficient evidence",
      "contributingRecordIds": ["Exact supplied recordId"]
    }
  ],
  "crossStudySynthesis": {
    "overallPatterns": "Patterns that emerge when all RQ answers are considered together",
    "contradictions": "Cross-cutting contradictions",
    "evidenceGaps": "Principal evidence gaps",
    "implications": "Evidence-bounded implications for interpretation"
  },
  "keyFindingsTable": [
    {
      "topic": "Synthesis Domain",
      "summary": "Cross-study synthesis of dominant findings, consistencies, contradictions, limitations, and gaps; no citations or author names",
      "consistency": "Describe cautiously or state not assessable",
      "evidenceBase": "Number of records contributing to this theme"
    }
  ]
}`;

    try {
      const text = await callAI(
        prompt,
        "You are an expert systematic review methodologist and biostatistician.",
        aiConfig
      );
      const parsed = parseJSONLoose(text);
       if (parsed?.subtopics && parsed?.rqFindings && parsed?.crossStudySynthesis) {
        onUpdateSynthesis({
          ...synthesis,
           status: "finalized",
           studyEvidence: parsed.studyEvidence || [],
          subtopics: parsed.subtopics || synthesis.subtopics,
           rqFindings: parsed.rqFindings,
           crossStudySynthesis: parsed.crossStudySynthesis,
          keyFindingsTable: parsed.keyFindingsTable || synthesis.keyFindingsTable,
          forestPlotEstimates: [],
          pooledEffectEstimate: undefined,
          heterogeneityDiscussion: "Study differences are described narratively; no statistical heterogeneity analysis was performed.",
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
  const scaleX = (value: number) => 240 + ((Math.max(0.65, Math.min(1, value)) - 0.65) / 0.35) * 360;

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

      <div className="bg-slate-950 text-white p-5 rounded-xl shadow-xs">
        <div className="font-mono text-[10px] uppercase tracking-widest text-indigo-300 font-bold mb-3">
          Two-level synthesis architecture
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center">
          {[
            "Final included studies",
            "Study-level extraction",
            "Themes",
            "RQ-based findings",
            "Overall patterns",
            "Contradictions",
            "Evidence gaps",
            "Abstract",
          ].map((step, index) => (
            <div key={step} className="flex items-center gap-2">
              <div className="flex-1 min-h-14 rounded-lg border border-white/15 bg-white/5 px-2 py-2 flex items-center justify-center text-[10px] font-mono leading-tight">
                {step}
              </div>
              {index < 7 && <span className="hidden lg:block text-indigo-300">→</span>}
            </div>
          ))}
        </div>
      </div>

      {/* When no included records are found */}
      {includedRecords.length === 0 && characteristics.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
          <h3 className="text-sm font-bold text-amber-900">No Included Studies Available for Synthesis</h3>
          <p className="text-xs text-amber-700 max-w-md mx-auto">
            Synthesis requires records included by the reviewer after title and abstract screening.
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
          {(synthesis.rqFindings || []).length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded-md bg-indigo-600 text-white text-[10px] font-mono font-bold uppercase tracking-wide">
                  Level 2
                </span>
                <h3 className="text-sm font-bold text-slate-900">Results organized by research question</h3>
              </div>
              {(synthesis.rqFindings || []).map((finding) => (
                <div key={finding.rqId} className="bg-white border border-indigo-200 p-6 rounded-xl shadow-xs space-y-3">
                  <div>
                    <div className="font-mono text-[10px] font-bold text-indigo-700 uppercase">{finding.rqId}</div>
                    <h4 className="text-sm font-bold text-slate-900">{finding.question}</h4>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{finding.synthesizedAnswer}</p>
                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3">
                      <div className="font-mono text-[10px] font-bold text-emerald-800 uppercase">Dominant patterns</div>
                      <p className="text-xs text-emerald-950 mt-1">{finding.dominantPatterns}</p>
                    </div>
                    <div className="rounded-lg bg-amber-50 border border-amber-100 p-3">
                      <div className="font-mono text-[10px] font-bold text-amber-800 uppercase">Contradictions</div>
                      <p className="text-xs text-amber-950 mt-1">{finding.contradictions}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                      <div className="font-mono text-[10px] font-bold text-slate-700 uppercase">Evidence gaps</div>
                      <p className="text-xs text-slate-800 mt-1">{finding.evidenceGaps}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {synthesis.crossStudySynthesis && (
            <div className="bg-indigo-950 text-white p-6 rounded-xl shadow-xs space-y-4">
              <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-indigo-300">
                Cross-study synthesis
              </div>
              <div className="grid md:grid-cols-2 gap-4 text-xs leading-relaxed">
                <div><strong className="block text-indigo-200 mb-1">Overall patterns</strong>{synthesis.crossStudySynthesis.overallPatterns}</div>
                <div><strong className="block text-indigo-200 mb-1">Contradictions</strong>{synthesis.crossStudySynthesis.contradictions}</div>
                <div><strong className="block text-indigo-200 mb-1">Evidence gaps</strong>{synthesis.crossStudySynthesis.evidenceGaps}</div>
                <div><strong className="block text-indigo-200 mb-1">Evidence-bounded implications</strong>{synthesis.crossStudySynthesis.implications}</div>
              </div>
            </div>
          )}

          {synthesis.status === "evidence_map" && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
              This is a structured evidence map, not a finalized cross-study synthesis. Review the extracted findings or run AI synthesis before generating the Discussion or Abstract.
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <span className="px-2 py-1 rounded-md bg-slate-200 text-slate-700 text-[10px] font-mono font-bold uppercase tracking-wide">
              Level 1
            </span>
            <h3 className="text-sm font-bold text-slate-900">Thematic evidence groups</h3>
          </div>
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
                Exploration of Between-Study Heterogeneity and Methodological Variance
              </h3>
              <p className="text-xs text-indigo-900 font-sans leading-relaxed text-justify">
                {synthesis.heterogeneityDiscussion}
              </p>
            </div>
          )}
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

      {/* Tab 3: Forest Plot */}
      {false && activeTab === "forest" && (
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Random-Effects Forest Plot (Pooled Effect Estimates)
              </h3>
              <p className="text-xs text-slate-500">
                Inverse-variance weighted effect sizes with 95% Confidence Intervals.
              </p>
            </div>
            {synthesis.pooledEffectEstimate && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-mono">
                <span className="font-bold text-emerald-900">
                  Pooled Effect: {synthesis.pooledEffectEstimate.effectSize} [95% CI: {synthesis.pooledEffectEstimate.ciLower} to {synthesis.pooledEffectEstimate.ciUpper}]
                </span>
                <div className="text-[10px] text-emerald-700">
                  Heterogeneity: I² = {synthesis.pooledEffectEstimate.heterogeneityI2}
                </div>
              </div>
            )}
          </div>

          {/* SVG Forest Plot */}
          {synthesis.forestPlotEstimates && synthesis.forestPlotEstimates.length > 0 ? (
            <div className="overflow-x-auto border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <svg width="680" height={100 + synthesis.forestPlotEstimates.length * 40 + 70} className="font-sans text-xs">
                {/* Header Labels */}
                <text x="10" y="25" className="font-mono font-bold fill-slate-800 text-[11px]">
                  Study (Author, Year)
                </text>
                <text x="240" y="25" className="font-mono font-bold fill-slate-800 text-[11px]">
                  Effect Size (95% CI)
                </text>
                <text x="610" y="25" className="font-mono font-bold fill-slate-800 text-[11px]" textAnchor="end">
                  Weight (%)
                </text>

                {/* Vertical Reference Axis Line */}
                <line x1="240" y1="35" x2="600" y2="35" stroke="#cbd5e1" strokeWidth="1" />
                <line x1={scaleX(0.7)} y1="35" x2={scaleX(0.7)} y2={80 + synthesis.forestPlotEstimates.length * 40} stroke="#94a3b8" strokeDasharray="3 3" />
                <line x1={scaleX(0.8)} y1="35" x2={scaleX(0.8)} y2={80 + synthesis.forestPlotEstimates.length * 40} stroke="#94a3b8" strokeDasharray="3 3" />
                <line x1={scaleX(0.9)} y1="35" x2={scaleX(0.9)} y2={80 + synthesis.forestPlotEstimates.length * 40} stroke="#94a3b8" strokeDasharray="3 3" />

                {/* Scale Ticks at top */}
                <text x={scaleX(0.7)} y="32" textAnchor="middle" className="font-mono text-[9px] fill-slate-400">0.70</text>
                <text x={scaleX(0.8)} y="32" textAnchor="middle" className="font-mono text-[9px] fill-slate-400">0.80</text>
                <text x={scaleX(0.9)} y="32" textAnchor="middle" className="font-mono text-[9px] fill-slate-400">0.90</text>
                <text x={scaleX(1.0)} y="32" textAnchor="middle" className="font-mono text-[9px] fill-slate-400">1.00</text>

                {/* Individual Study Lines */}
                {synthesis.forestPlotEstimates.map((item, idx) => {
                  const y = 65 + idx * 40;
                  const x1 = scaleX(item.ciLower);
                  const x2 = scaleX(item.ciUpper);
                  const xCenter = scaleX(item.effectSize);
                  const boxSize = Math.max(6, Math.min(14, (item.weight / 100) * 45));

                  return (
                    <g key={idx} className="hover:opacity-80 transition-opacity">
                      {/* Study Name */}
                      <text x="10" y={y + 4} className="font-mono font-semibold fill-slate-900 text-xs">
                        {item.study}
                      </text>

                      {/* CI Whiskers */}
                      <line x1={x1} y1={y} x2={x2} y2={y} stroke="#475569" strokeWidth="2" />
                      <line x1={x1} y1={y - 4} x2={x1} y2={y + 4} stroke="#475569" strokeWidth="2" />
                      <line x1={x2} y1={y - 4} x2={x2} y2={y + 4} stroke="#475569" strokeWidth="2" />

                      {/* Center Effect Box (Size proportional to weight) */}
                      <rect
                        x={xCenter - boxSize / 2}
                        y={y - boxSize / 2}
                        width={boxSize}
                        height={boxSize}
                        fill="#4f46e5"
                        rx="1"
                      />

                      {/* Numeric Values */}
                      <text x="610" y={y + 4} textAnchor="end" className="font-mono font-medium fill-slate-700 text-xs">
                        {item.effectSize.toFixed(3)} [{item.ciLower.toFixed(3)}, {item.ciUpper.toFixed(3)}] · {item.weight}%
                      </text>
                    </g>
                  );
                })}

                {/* Pooled Diamond Summary */}
                {synthesis.pooledEffectEstimate && (
                  <g>
                    {(() => {
                      const yDiamond = 65 + synthesis.forestPlotEstimates.length * 40 + 20;
                      const xPooled = scaleX(synthesis.pooledEffectEstimate.effectSize);
                      const xPooledL = scaleX(synthesis.pooledEffectEstimate.ciLower);
                      const xPooledU = scaleX(synthesis.pooledEffectEstimate.ciUpper);

                      return (
                        <>
                          <line x1="10" y1={yDiamond - 15} x2="660" y2={yDiamond - 15} stroke="#cbd5e1" strokeWidth="1" />
                          <text x="10" y={yDiamond + 4} className="font-mono font-bold fill-indigo-950 text-xs">
                            Pooled Random Effects
                          </text>

                          {/* Diamond Polygon */}
                          <polygon
                            points={`${xPooledL},${yDiamond} ${xPooled},${yDiamond - 7} ${xPooledU},${yDiamond} ${xPooled},${yDiamond + 7}`}
                            fill="#059669"
                            stroke="#047857"
                            strokeWidth="1.5"
                          />

                          <text x="610" y={yDiamond + 4} textAnchor="end" className="font-mono font-bold fill-emerald-800 text-xs">
                            {synthesis.pooledEffectEstimate.effectSize} [{synthesis.pooledEffectEstimate.ciLower}, {synthesis.pooledEffectEstimate.ciUpper}] (100.0%)
                          </text>
                        </>
                      );
                    })()}
                  </g>
                )}
              </svg>
            </div>
          ) : (
            <div className="p-8 text-center text-xs font-mono text-slate-500 bg-slate-50 rounded-xl">
              Quantitative pooling is not enabled by default. Add a sufficiently homogeneous, extractable outcome subset before performing a meta-analysis or generating a forest plot.
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Key Findings Matrix */}
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
