import React, { useState } from "react";
import { DiscussionSections, SLRProtocol, SynthesisResult, SLRRecord, StudyCharacteristic } from "../types/slr";
import { Sparkles, BookOpen, Download, Copy, Check, AlertCircle, Zap, Layers, Quote } from "lucide-react";
import { callAI, parseJSONLoose } from "../utils/aiClient";

interface DiscussionSectionProps {
  discussion: DiscussionSections;
  onUpdateDiscussion: (disc: DiscussionSections) => void;
  protocol: SLRProtocol;
  synthesis: SynthesisResult;
  includedRecords?: SLRRecord[];
  characteristics?: StudyCharacteristic[];
  aiConfig: any;
}

export default function DiscussionSection({
  discussion,
  onUpdateDiscussion,
  protocol,
  synthesis,
  includedRecords = [],
  characteristics = [],
  aiConfig,
}: DiscussionSectionProps) {
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const synthesisReady =
    synthesis.status === "finalized" &&
    Boolean(synthesis.descriptiveSynthesis?.overview) &&
    (synthesis.clusters?.length || 0) > 0 &&
    (synthesis.rqFindings?.length || 0) > 0 &&
    Boolean(synthesis.crossStudySynthesis) &&
    (synthesis.researchGaps?.length || 0) > 0 &&
    (synthesis.futureResearchAgenda?.length || 0) > 0;

  // Conservative discussion fallback interprets only the finalized synthesis.
  const runHeuristicDiscussion = () => {
    const topic = protocol.title || "the investigated domain";
    const crossStudy = synthesis.crossStudySynthesis;
    if (!crossStudy) return;
    const rqInterpretation = (synthesis.rqFindings || [])
      .map((finding) => `${finding.rqId} indicates ${finding.synthesizedAnswer}`)
      .join(" ");

    const generated: DiscussionSections = {
      item23aGeneralInterpretation: `The finalized synthesis for ${topic} identifies the following overall pattern: ${crossStudy.overallPatterns} Considered by research question, ${rqInterpretation} This section interprets the synthesized pattern rather than repeating individual study findings.`,
      item23bLimitationsOfEvidence: `The principal contradictions and evidence limitations are ${crossStudy.contradictions} The main gaps are ${crossStudy.evidenceGaps}`,
      item23cLimitationsOfReviewProcess: `Interpretation is limited to the recorded search, screening, extraction, appraisal, and synthesis procedures. Independent duplicate review, broader search coverage, and other unrecorded procedures are not inferred.`,
      item23dImplications: crossStudy.implications,
    };

    onUpdateDiscussion(generated);
    setErrorMessage(null);
  };

  const handleGenerateDiscussion = async () => {
    setGenerating(true);
    setErrorMessage(null);

    if (!synthesisReady) return;

    const prompt = `Draft a cautious 4-part academic Discussion grounded only in the finalized RQ-based and cross-study synthesis.

Review Title: "${protocol.title}"
Review Type: "${protocol.reviewType}"
Framework: "${protocol.formulationFramework || "PICOC"}"
Final RQ-based Results:
${JSON.stringify(synthesis.rqFindings || [])}

Final Cross-study Synthesis:
${JSON.stringify(synthesis.crossStudySynthesis)}

STRICT WRITING RULES:
1. WRITE IN CONTINUOUS COHESIVE PARAGRAPHS AND STATEMENTS ONLY. DO NOT USE ANY BULLET POINTS, LISTS, OR DASHES (-).
2. Write in strictly third-person objective academic voice. NEVER use first-person pronouns (DO NOT use "we", "our", "us", "in our review", "we found").
3. DO NOT use dashes or hyphens as punctuation dividers. Use standard sentence structure with commas, semicolons, and parentheses.
4. DO NOT mention "PRISMA Item", "PRISMA", "Item 23a", etc. Use natural academic discourse.
5. Results already state what the studies found. Discussion must explain what the cross-study pattern means, why contradictions may matter, how the findings relate to each research question, and what implications follow cautiously.
6. Do not repeat a sequence of individual-study findings and do not regenerate Results from citation records.
7. Never invent or infer pooled effects, confidence intervals, significance, reviewer activity, full-text assessment, search coverage, validation, or findings absent from the supplied synthesis.

Structure the response into 4 distinct sections:
1. item23aGeneralInterpretation: Principal findings and interpretation by research question, followed by the meaning of the combined pattern.
2. item23bLimitationsOfEvidence: Contradictions and limitations within the included evidence.
3. item23cLimitationsOfReviewProcess: Objective appraisal of systematic review process limitations (e.g., database coverage, exclusion of secondary review papers to prioritize primary evidence, language boundaries).
4. item23dImplications: Cautious implications for practice and future research appropriate to the review topic.

Return ONLY a JSON object:
{
  "item23aGeneralInterpretation": "...",
  "item23bLimitationsOfEvidence": "...",
  "item23cLimitationsOfReviewProcess": "...",
  "item23dImplications": "..."
}`;

    try {
      const text = await callAI(prompt, "You are a senior academic journal editor and systematic review methodology expert.", aiConfig);
      const parsed = parseJSONLoose(text);
      if (parsed && parsed.item23aGeneralInterpretation) {
        onUpdateDiscussion({
          item23aGeneralInterpretation: parsed.item23aGeneralInterpretation || discussion.item23aGeneralInterpretation,
          item23bLimitationsOfEvidence: parsed.item23bLimitationsOfEvidence || discussion.item23bLimitationsOfEvidence,
          item23cLimitationsOfReviewProcess: parsed.item23cLimitationsOfReviewProcess || discussion.item23cLimitationsOfReviewProcess,
          item23dImplications: parsed.item23dImplications || discussion.item23dImplications,
        });
      } else {
        throw new Error("Could not parse AI response as valid discussion object.");
      }
    } catch (e: any) {
      console.warn("AI Discussion error:", e);
      setErrorMessage(`AI Generation Notice: ${e.message || "Request failed"}. Automatic structured discussion draft applied.`);
      runHeuristicDiscussion();
    } finally {
      setGenerating(false);
    }
  };

  const copyFullDiscussion = () => {
    const text = `## Discussion\n\n### 1. Principal Findings and Contextual Interpretation\n${discussion.item23aGeneralInterpretation}\n\n### 2. Methodological Strengths and Limitations of Included Evidence\n${discussion.item23bLimitationsOfEvidence}\n\n### 3. Limitations of Systematic Review Methodology\n${discussion.item23cLimitationsOfReviewProcess}\n\n### 4. Practical Implications and Future Research Directions\n${discussion.item23dImplications}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updatePart = (field: keyof DiscussionSections, val: string) => {
    onUpdateDiscussion({
      ...discussion,
      [field]: val,
    });
  };

  return (
    <div id="discussion-section-container" className="space-y-6">
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
              Evidence Synthesis & Critical Evaluation
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-0.5">
              Structured Academic Discussion
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Interprets what the finalized RQ-based pattern means. Results state what studies found; Discussion explains the meaning, limitations, and implications.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleGenerateDiscussion}
              disabled={generating || !synthesisReady}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
              {generating ? "Drafting Discussion..." : "AI Generate Discussion (from Final Synthesis)"}
            </button>
            <button
              onClick={runHeuristicDiscussion}
              disabled={!synthesisReady}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 rounded-lg shadow-2xs cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-600" />
              Instant Structured Draft
            </button>
            <button
              onClick={copyFullDiscussion}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy Discussion"}
            </button>
          </div>
        </div>

        {/* Included Study Evidence Preview */}
        {characteristics.length > 0 && (
          <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600 flex-wrap">
            <span className="font-semibold text-slate-800 flex items-center gap-1">
              <Quote className="w-3.5 h-3.5 text-indigo-600" />
              Synthesized Records ({characteristics.length} studies):
            </span>
            {characteristics.slice(0, 4).map((c, i) => (
              <span key={i} className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-[11px] font-mono text-slate-800">
                {c.authorYear}
              </span>
            ))}
            {characteristics.length > 4 && (
              <span className="text-[11px] text-slate-500 font-mono">
                +{characteristics.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* 4 Editable Sections */}
      <div className="space-y-4">
        {/* 1. General Interpretation */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-mono text-xs font-bold text-slate-900 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700">
                1
              </span>
              <span>Principal Findings and Contextual Interpretation</span>
            </div>
          </div>
          <textarea
            value={discussion.item23aGeneralInterpretation}
            onChange={(e) => updatePart("item23aGeneralInterpretation", e.target.value)}
            rows={5}
            placeholder="Provide a general interpretation of the results in the context of other evidence..."
            className="w-full text-xs sm:text-sm font-sans p-3.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 leading-relaxed text-slate-800"
          />
        </div>

        {/* 2. Limitations of Evidence */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-mono text-xs font-bold text-slate-900 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800">
                2
              </span>
              <span>Methodological Strengths and Limitations of Included Evidence</span>
            </div>
          </div>
          <textarea
            value={discussion.item23bLimitationsOfEvidence}
            onChange={(e) => updatePart("item23bLimitationsOfEvidence", e.target.value)}
            rows={5}
            placeholder="Discuss limitations of the included primary evidence (risk of bias, heterogeneity, retrospective designs)..."
            className="w-full text-xs sm:text-sm font-sans p-3.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 leading-relaxed text-slate-800"
          />
        </div>

        {/* 3. Limitations of Review Process */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-mono text-xs font-bold text-slate-900 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-800">
                3
              </span>
              <span>Limitations of Systematic Review Methodology</span>
            </div>
          </div>
          <textarea
            value={discussion.item23cLimitationsOfReviewProcess}
            onChange={(e) => updatePart("item23cLimitationsOfReviewProcess", e.target.value)}
            rows={5}
            placeholder="Discuss limitations of the review processes used (e.g. databases searched, languages, screening criteria)..."
            className="w-full text-xs sm:text-sm font-sans p-3.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 leading-relaxed text-slate-800"
          />
        </div>

        {/* 4. Implications */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-mono text-xs font-bold text-slate-900 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800">
                4
              </span>
              <span>Research and Practice Implications</span>
            </div>
          </div>
          <textarea
            value={discussion.item23dImplications}
            onChange={(e) => updatePart("item23dImplications", e.target.value)}
            rows={5}
            placeholder="Discuss cautious implications for research, practice, policy, design, or future studies as appropriate to the review topic..."
            className="w-full text-xs sm:text-sm font-sans p-3.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed text-slate-800"
          />
        </div>
      </div>
    </div>
  );
}
