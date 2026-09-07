import React, { useState, useRef } from "react";
import { SLRRecord, ScreeningDecision, SLRProtocol } from "../types/slr";
import {
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { callAI, parseJSONLoose } from "../utils/aiClient";
import StudyCharacteristicsTable from "./StudyCharacteristicsTable";

interface ScreeningSectionProps {
  records: SLRRecord[];
  screening: Record<string, ScreeningDecision>;
  onUpdateScreening: (screening: Record<string, ScreeningDecision>) => void;
  protocol: SLRProtocol;
  aiConfig: any;
}

export default function ScreeningSection({
  records,
  screening,
  onUpdateScreening,
  protocol,
  aiConfig,
}: ScreeningSectionProps) {
  const [runningScreening, setRunningScreening] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const screeningRunRef = useRef(false);
  const screeningPool = records.slice(0, 100);

  const includedCount = screeningPool.filter((r) => screening[r.id]?.agreed === true).length;
  const excludedCount = screeningPool.filter((r) => screening[r.id]?.agreed === false).length;
  const pendingCount = screeningPool.filter((r) => screening[r.id]?.agreed === undefined).length;

  // AI-assisted screening
  const runAIScreening = async () => {
    // State updates are asynchronous; the ref prevents two rapid clicks from
    // creating overlapping OpenRouter batches before the button disables.
    if (screeningPool.length === 0 || screeningRunRef.current) return;
    screeningRunRef.current = true;
    setRunningScreening(true);
    setProgress(0);
    setErrorMessage(null);

    const batchSize = 4;
    const totalBatches = Math.ceil(screeningPool.length / batchSize);
    const nextScreening = { ...screening };

    try {
      for (let b = 0; b < totalBatches; b++) {
        const batch = screeningPool.slice(b * batchSize, (b + 1) * batchSize);
        const payload = batch.map((r) => ({
          id: r.id,
          title: r.title,
          abstract: (r.abstract || "").slice(0, 500),
        }));

        const prompt = `Systematic Review Protocol Title: "${protocol.title}"
Inclusion Criteria: ${protocol.eligibilityCriteria.inclusion.join("; ")}
Exclusion Criteria: ${protocol.eligibilityCriteria.exclusion.join("; ")}

Review the following studies using the supplied title, abstract, and protocol criteria. Do not infer eligibility from keyword overlap or a numeric title-match threshold.
Calculate an overall eligibility score (0-100) and concise justification:
If score < 80, choose exclusion reason: "Secondary literature / Review paper" | "Out of scope / Keyword mismatch" | "Wrong population" | "Wrong intervention / exposure" | "Wrong comparator" | "Wrong outcome" | "Wrong study design" | "Not accessible / full text unavailable" | "Duplicate / non-original" | "Language barrier" | "Other".

Studies:
${JSON.stringify(payload)}

Return ONLY a JSON array:
[
  {
    "id": "...",
    "score": 90,
    "reason": "...",
    "exclusionReason": "Wrong population" (optional)
  }
]`;

        try {
          const text = await callAI(
            prompt,
            "You are a medical librarian and PRISMA screening methodologist.",
            aiConfig,
            1200
          );
          const parsed = parseJSONLoose(text);
          if (Array.isArray(parsed)) {
            parsed.forEach((p: any) => {
              const finalScore = p.score ?? null;
              const isInclude = finalScore !== null && finalScore >= (protocol.selectionProcess.screeningThreshold || 80);

              nextScreening[p.id] = {
                score: finalScore,
                reason: p.reason || (isInclude ? "Meets PICO criteria and keyword match" : "Does not meet criteria"),
                decision: isInclude ? "include" : "exclude",
                agreed: isInclude,
                exclusionReason: !isInclude ? p.exclusionReason || "Wrong study design" : undefined,
              };
            });
          }
        } catch (err: any) {
          console.warn("AI screening batch error:", err);
          if (!errorMessage) {
            setErrorMessage(`AI screening could not complete this batch: ${err.message || "Request failed"}. Records remain pending for manual review.`);
          }
        }

        setProgress(Math.round(((b + 1) / totalBatches) * 100));
        onUpdateScreening({ ...nextScreening });
      }
    } finally {
      screeningRunRef.current = false;
      setRunningScreening(false);
    }
  };

  return (
    <div id="screening-section-container" className="space-y-6">
      {/* Error / Notice message */}
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
               PRISMA 2020 Items 8, 16a & 16b · Investigator Screening
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-0.5">
              Study Selection & Screening Review
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select up to 100 records for further screening against the documented protocol criteria. Table 1 below records why each selected record was included or excluded.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={runAIScreening}
              disabled={runningScreening || screeningPool.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
              {runningScreening ? `Screening (${progress}%)...` : "AI Screen Records"}
            </button>
          </div>
        </div>

        {/* Progress bar if running */}
        {runningScreening && (
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
            <div style={{ width: `${progress}%` }} className="bg-indigo-600 h-full transition-all duration-300" />
          </div>
        )}

        {records.length > 100 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
            <strong>Screening pool limited to 100 records.</strong>{" "}
            {records.length - 100} additional records remain outside further screening until the pool is changed.
          </div>
        )}

        {Object.keys(screening).length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50/80 border border-slate-200 rounded-xl">
            <div className="font-mono text-xs text-slate-800 flex items-center gap-3">
              <span className="text-emerald-700 font-semibold">{includedCount} Included</span>
              <span className="text-rose-700 font-semibold">{excludedCount} Excluded</span>
              <span className="text-slate-500">{pendingCount} Pending</span>
            </div>
          </div>
        )}
      </div>

      <StudyCharacteristicsTable
        screeningRecords={screeningPool}
        onUpdateScreening={onUpdateScreening}
        screening={screening}
      />
    </div>
  );
}
