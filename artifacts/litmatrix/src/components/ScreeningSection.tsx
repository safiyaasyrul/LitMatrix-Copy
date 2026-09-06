import React, { useState, useMemo, useRef } from "react";
import { SLRRecord, ScreeningDecision, SLRProtocol } from "../types/slr";
import {
  Sparkles,
  Check,
  X,
  Filter,
  Search,
  FileX,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { callAI, parseJSONLoose } from "../utils/aiClient";

interface ScreeningSectionProps {
  records: SLRRecord[];
  screening: Record<string, ScreeningDecision>;
  onUpdateScreening: (screening: Record<string, ScreeningDecision>) => void;
  protocol: SLRProtocol;
  aiConfig: any;
}

type ScreeningCriterionKey = keyof NonNullable<ScreeningDecision["criteriaAnswers"]>;
type AIRecommendation = NonNullable<ScreeningDecision["recommendation"]>;

const getRecommendationLabel = (recommendation: AIRecommendation) =>
  recommendation === "include" ? "Accept" : recommendation === "exclude" ? "Exclude" : "Maybe / Unclear";

export default function ScreeningSection({
  records,
  screening,
  onUpdateScreening,
  protocol,
  aiConfig,
}: ScreeningSectionProps) {
  const [runningScreening, setRunningScreening] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<"all" | "included" | "excluded" | "pending">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const screeningRunRef = useRef(false);

  const screeningQuestions = useMemo<Array<{ key: ScreeningCriterionKey; label: string; criterion: string }>>(
    () => {
      const approvedCriteria = [
        ...protocol.eligibilityCriteria.inclusion.map((criterion) => `Include: ${criterion}`),
        ...protocol.eligibilityCriteria.exclusion.map((criterion) => `Exclude: ${criterion}`),
      ].join(" ");
      const studyTypeGuidance =
        protocol.objectivesPICOC.studyDesigns ||
        protocol.objectivesPICO.studyDesigns ||
        protocol.objectivesPEO.studyDesigns ||
        "not specified";

      return [
        {
          key: "populationContext",
          label: "Q1 — Population / context",
          criterion: `Does the record satisfy the approved population, system, setting, or context requirements? Apply these approved criteria: ${approvedCriteria}`,
        },
        {
          key: "phenomenon",
          label: "Q2 — Phenomenon",
          criterion: `Does the record address the approved phenomenon, intervention, exposure, technology, or method? Apply these approved criteria: ${approvedCriteria}`,
        },
        {
          key: "researchContribution",
          label: "Q3 — Research contribution",
          criterion:
            "Does the study investigate a method, technology, strategy, model, intervention, or analytical approach relevant to the review objective, as required by the approved criteria?",
        },
        {
          key: "studyType",
          label: "Q4 — Study type",
          criterion: `Is this an eligible primary research study? Approved study-type guidance: ${studyTypeGuidance}. Also apply the approved inclusion and exclusion criteria.`,
        },
        {
          key: "requiredEvidence",
          label: "Q5 — Required evidence",
          criterion:
            "Does the record provide sufficient information to determine eligibility? Do not infer missing details from the title or citation metadata; unresolved evidence is Unclear.",
        },
      ];
    },
    [protocol]
  );

  const includedCount = records.filter((r) => screening[r.id]?.agreed === true).length;
  const excludedCount = records.filter((r) => screening[r.id]?.agreed === false).length;
  const pendingCount = records.filter((r) => screening[r.id]?.agreed === undefined).length;
  // AI-assisted screening
  const runAIScreening = async () => {
    // State updates are asynchronous; the ref prevents two rapid clicks from
    // creating overlapping OpenRouter batches before the button disables.
    if (records.length === 0 || screeningRunRef.current) return;
    screeningRunRef.current = true;
    setRunningScreening(true);
    setProgress(0);
    setErrorMessage(null);

    const batchSize = 3;
    const totalBatches = Math.ceil(records.length / batchSize);
    const nextScreening = { ...screening };
    const failedRecordIds = new Set<string>();
    let generatedCount = 0;

    try {
      const screenBatch = async (batch: SLRRecord[]): Promise<void> => {
        const payload = batch.map((r) => ({
          id: r.id,
          title: r.title,
          abstract: (r.abstract || "").slice(0, 500),
        }));
        const batchIds = new Set(batch.map((record) => record.id));

        const prompt = `Systematic Review Protocol Title: "${protocol.title}"
Approved inclusion criteria:
${protocol.eligibilityCriteria.inclusion.map((criterion, index) => `${index + 1}. ${criterion}`).join("\n")}
Approved exclusion criteria:
${protocol.eligibilityCriteria.exclusion.map((criterion, index) => `${index + 1}. ${criterion}`).join("\n")}

Turn the approved criteria into the following screening questions. For each question, answer only "Yes", "No", or "Unclear". Use "Unclear" whenever the title and abstract do not provide enough evidence. Never use keyword overlap as an eligibility rule, and never infer full-text facts from citation metadata.
${screeningQuestions.map((question) => `${question.label}: ${question.criterion}`).join("\n")}

Apply this recommendation rule: accept when Q1 OR Q2 is Yes AND Q3 is Yes AND Q4 is Yes. If Q1/Q2/Q3/Q4 is unresolved, or if Q5 is anything other than Yes, recommend Maybe / Unclear. Exclude only when Q1 and Q2 are both No, or Q3 or Q4 is No. AI recommendations remain pending for reviewer confirmation.

Keep each reason to no more than 25 words. Do not repeat the title, abstract, criteria, or question text. Use an exclusion reason only when supported: "Secondary literature / Review paper" | "Out of scope / Criteria not met" | "Wrong population / context" | "Wrong phenomenon / contribution" | "Wrong study design" | "Insufficient evidence in record" | "Duplicate / non-original" | "Language barrier" | "Other".

Studies:
${JSON.stringify(payload)}

Return ONLY a complete JSON array with exactly one object per supplied id:
[
  {
    "id": "...",
    "score": 90,
    "reason": "Maximum 25 words.",
    "criteriaAnswers": {
      "populationContext": "Yes",
      "phenomenon": "Unclear",
      "researchContribution": "Yes",
      "studyType": "Yes",
      "requiredEvidence": "No"
    },
    "recommendation": "maybe",
    "exclusionReason": "Wrong population / context"
  }
]`;

        try {
          const text = await callAI(
            prompt,
            "You are a systematic review screening methodologist. Apply only the supplied eligibility criteria, distinguish No from Unclear, and return compact valid JSON.",
            aiConfig,
            batch.length === 1 ? 2400 : 1800
          );
          const parsed = parseJSONLoose(text);
          const returnedIds = new Set<string>();

          if (Array.isArray(parsed)) {
            parsed.forEach((p: any) => {
              if (!p || typeof p.id !== "string" || !batchIds.has(p.id) || returnedIds.has(p.id)) return;
              returnedIds.add(p.id);
              const rawAnswers = p.criteriaAnswers || {};
              const normalizeAnswer = (value: unknown): "Yes" | "No" | "Unclear" =>
                value === "Yes" || value === "No" ? value : "Unclear";
              const answers = {
                populationContext: normalizeAnswer(rawAnswers.populationContext),
                phenomenon: normalizeAnswer(rawAnswers.phenomenon),
                researchContribution: normalizeAnswer(rawAnswers.researchContribution),
                studyType: normalizeAnswer(rawAnswers.studyType),
                requiredEvidence: normalizeAnswer(rawAnswers.requiredEvidence),
              };
              const q1OrQ2Yes =
                answers.populationContext === "Yes" || answers.phenomenon === "Yes";
              const coreCriteriaAccepted =
                q1OrQ2Yes &&
                answers.researchContribution === "Yes" &&
                answers.studyType === "Yes";
              const coreCriteriaExcluded =
                (answers.populationContext === "No" && answers.phenomenon === "No") ||
                answers.researchContribution === "No" ||
                answers.studyType === "No";
              const recommendation: AIRecommendation = coreCriteriaExcluded
                ? "exclude"
                : coreCriteriaAccepted && answers.requiredEvidence === "Yes"
                ? "include"
                : "maybe";
              const finalScore = typeof p.score === "number" ? Math.max(0, Math.min(100, p.score)) : null;

              nextScreening[p.id] = {
                score: finalScore,
                reason: p.reason || "AI screening suggestion based on the approved eligibility criteria.",
                recommendation,
                decision: recommendation === "exclude" ? "exclude" : "include",
                agreed: undefined,
                criteriaAnswers: answers,
                exclusionReason: recommendation === "exclude" ? p.exclusionReason || "Criteria not met" : undefined,
              };
              generatedCount += 1;
            });
          }

          const missingRecords = batch.filter((record) => !returnedIds.has(record.id));
          if (missingRecords.length === 0) return;
          if (batch.length > 1) {
            for (const record of missingRecords) await screenBatch([record]);
          } else {
            failedRecordIds.add(batch[0].id);
          }
        } catch (err: any) {
          console.warn("AI screening batch error:", err);
          if (batch.length > 1) {
            const midpoint = Math.ceil(batch.length / 2);
            await screenBatch(batch.slice(0, midpoint));
            await screenBatch(batch.slice(midpoint));
          } else {
            failedRecordIds.add(batch[0].id);
          }
        }
      };

      for (let b = 0; b < totalBatches; b++) {
        const batch = records.slice(b * batchSize, (b + 1) * batchSize);
        await screenBatch(batch);

        setProgress(Math.round(((b + 1) / totalBatches) * 100));
        onUpdateScreening({ ...nextScreening });
      }

      if (failedRecordIds.size > 0) {
        setErrorMessage(
          generatedCount > 0
            ? `AI generated ${generatedCount} recommendation${generatedCount === 1 ? "" : "s"}. ${failedRecordIds.size} record${failedRecordIds.size === 1 ? "" : "s"} remain pending because the provider could not return complete JSON; retry screening to process them.`
            : `The AI provider could not return a complete screening response. All ${failedRecordIds.size} record${failedRecordIds.size === 1 ? "" : "s"} remain pending; try again or select another model.`
        );
      }
    } finally {
      screeningRunRef.current = false;
      setRunningScreening(false);
    }
  };

  const handleSetDecision = (id: string, agree: boolean, reason?: ScreeningDecision["exclusionReason"]) => {
    const existing = screening[id] || { score: null, reason: "Manual investigator evaluation", decision: agree ? "include" : "exclude" };
    onUpdateScreening({
      ...screening,
      [id]: {
        ...existing,
        agreed: agree,
        decision: agree ? "include" : "exclude",
        exclusionReason: !agree ? reason || existing.exclusionReason || "Wrong study design" : undefined,
      },
    });
  };

  const filteredRecords = records.filter((r) => {
    const dec = screening[r.id];

    if (activeTab === "included" && dec?.agreed !== true) return false;
    if (activeTab === "excluded" && dec?.agreed !== false) return false;
    if (activeTab === "pending" && dec?.agreed !== undefined) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        r.authors.some((a) => a.toLowerCase().includes(q)) ||
        (r.abstract || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

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
              PRISMA 2020 Items 8, 16a & 16b · Eligibility Criteria Screening
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-0.5">
              Study Selection & Eligibility Criteria Screening
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Screen records by asking explicit questions derived from the approved inclusion, exclusion, and study-type criteria. AI suggestions remain pending until the reviewer confirms them.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={runAIScreening}
              disabled={runningScreening || records.length === 0}
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

        <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs text-indigo-950">
          <div className="font-mono font-bold">Screening questions generated from approved eligibility criteria</div>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
            {screeningQuestions.map((question) => (
              <div key={question.key} className="bg-white/80 border border-indigo-100 rounded-lg p-2">
                <div className="font-mono text-[11px] font-bold">{question.label}</div>
                <div className="text-[11px] text-indigo-800 mt-0.5">{question.criterion}</div>
                <div className="text-[10px] font-mono text-slate-500 mt-1">Answer: Yes / No / Unclear</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick bulk actions */}
        {Object.keys(screening).length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50/80 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-slate-600">
                AI outputs are suggestions only. Confirm each record manually.
              </span>
            </div>

            <div className="font-mono text-xs text-slate-800 flex items-center gap-3">
              <span className="text-emerald-700 font-semibold">{includedCount} Included</span>
              <span className="text-rose-700 font-semibold">{excludedCount} Excluded</span>
              <span className="text-slate-500">{pendingCount} Pending</span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs and Search */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { key: "all", label: `All Records (${records.length})` },
              { key: "included", label: `Included (${includedCount})` },
              { key: "excluded", label: `Excluded (${excludedCount})` },
              { key: "pending", label: `Pending (${pendingCount})` },
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

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search in title or authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs font-mono pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Records List */}
      <div className="space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="bg-white border border-slate-200 p-8 text-center rounded-xl text-xs font-mono text-slate-500">
            No records matching current tab or search filter.
          </div>
        ) : (
          filteredRecords.map((r) => {
            const s = screening[r.id];
            const isIncluded = s?.agreed === true;
            const isExcluded = s?.agreed === false;
            const isExpanded = expandedId === r.id;

            return (
              <div
                key={r.id}
                className={`border rounded-xl p-5 transition-all shadow-xs ${
                  isIncluded
                    ? "bg-emerald-50/20 border-emerald-300"
                    : isExcluded
                    ? "bg-rose-50/20 border-rose-200"
                    : "bg-white border-slate-200"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-[280px]">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      {s?.score !== undefined && s.score !== null && (
                        <span
                          className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${
                            s.score >= 80
                              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                              : "bg-rose-50 border-rose-200 text-rose-800"
                          }`}
                        >
                          {s.score}% Eligibility Summary
                        </span>
                      )}
                      {s?.recommendation && s.agreed === undefined && (
                        <span
                          className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${
                            s.recommendation === "include"
                              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                              : s.recommendation === "exclude"
                              ? "bg-rose-50 border-rose-200 text-rose-800"
                              : "bg-amber-50 border-amber-200 text-amber-800"
                          }`}
                        >
                          AI recommendation: {getRecommendationLabel(s.recommendation)}
                        </span>
                      )}
                      <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                        {r.databaseSource || "Database"}
                      </span>
                      {r.year && (
                        <span className="font-mono text-[10px] text-slate-500">
                          Year: {r.year}
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-base text-slate-900 leading-snug">
                      {r.title}
                    </h3>
                    <div className="text-xs text-slate-500 font-sans mt-0.5">
                      {(r.authors || []).join(", ")} · <em>{r.source || "Journal Source"}</em>
                    </div>

                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSetDecision(r.id, true)}
                      className={`flex items-center gap-1 px-3 py-1.5 text-xs font-mono rounded-lg transition-all cursor-pointer shadow-2xs ${
                        isIncluded
                          ? "bg-emerald-700 text-white font-bold"
                          : "bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      Include
                    </button>
                    <button
                      onClick={() => handleSetDecision(r.id, false)}
                      className={`flex items-center gap-1 px-3 py-1.5 text-xs font-mono rounded-lg transition-all cursor-pointer shadow-2xs ${
                        isExcluded
                          ? "bg-rose-700 text-white font-bold"
                          : "bg-white border border-rose-300 text-rose-700 hover:bg-rose-50"
                      }`}
                    >
                      <X className="w-3.5 h-3.5" />
                      Exclude
                    </button>
                  </div>
                </div>

                {/* AI Justification & Exclusion Reason selector */}
                {s && (
                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs font-sans space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="font-mono text-[11px] font-bold text-indigo-700 shrink-0">
                        AI Reasoning:
                      </span>
                      <span className="text-slate-700">{s.reason}</span>
                    </div>

                    {s.criteriaAnswers && (
                      <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 p-3 space-y-2">
                        <div className="font-mono text-[11px] font-bold text-indigo-800">
                          Eligibility criteria answers
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {screeningQuestions.map((question) => {
                            const answer = s.criteriaAnswers?.[question.key] || "Unclear";
                            const answerClass =
                              answer === "Yes"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : answer === "No"
                                ? "bg-rose-50 text-rose-800 border-rose-200"
                                : "bg-amber-50 text-amber-800 border-amber-200";
                            return (
                              <div
                                key={question.key}
                                className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-md px-2.5 py-2"
                              >
                                <span className="text-[11px] text-slate-700">{question.label}</span>
                                <span className={`text-[10px] font-mono font-bold border rounded px-1.5 py-0.5 ${answerClass}`}>
                                  {answer}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {isExcluded && (
                      <div className="flex flex-wrap items-center gap-2 p-2.5 bg-rose-50/50 border border-rose-200 rounded-lg">
                        <span className="font-mono text-[11px] font-bold text-rose-800 shrink-0">
                          PRISMA Item 16b Exclusion Reason:
                        </span>
                        <select
                          value={s.exclusionReason || "Wrong study design"}
                          onChange={(e) => handleSetDecision(r.id, false, e.target.value as any)}
                          className="text-xs font-mono p-1 border border-rose-300 rounded bg-white text-rose-800 font-semibold"
                        >
                          <option value="Secondary literature / Review paper">Secondary literature / Review paper</option>
                          <option value="Out of scope / Criteria not met">Out of scope / Criteria not met</option>
                          <option value="Wrong population">Wrong population</option>
                          <option value="Wrong population / context">Wrong population / context</option>
                          <option value="Wrong intervention / exposure">Wrong intervention / exposure</option>
                          <option value="Wrong phenomenon / contribution">Wrong phenomenon / contribution</option>
                          <option value="Wrong comparator">Wrong comparator</option>
                          <option value="Wrong outcome">Wrong outcome</option>
                          <option value="Wrong study design">Wrong study design</option>
                          <option value="Insufficient evidence in record">Insufficient evidence in record</option>
                          <option value="Not accessible / full text unavailable">Not accessible / full text unavailable</option>
                          <option value="Duplicate / non-original">Duplicate / non-original</option>
                          <option value="Language barrier">Language barrier</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Abstract Accordion */}
                {r.abstract && (
                  <div className="mt-2.5">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : r.id)}
                      className="text-[11px] font-mono text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {isExpanded ? "Hide Abstract" : "View Full Abstract"}
                    </button>
                    {isExpanded && (
                      <p className="mt-2 text-xs text-slate-700 bg-slate-50/80 p-3.5 rounded-lg leading-relaxed border border-slate-200">
                        {r.abstract}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
