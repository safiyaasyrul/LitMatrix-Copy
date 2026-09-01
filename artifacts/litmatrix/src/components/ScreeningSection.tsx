import React, { useState, useMemo } from "react";
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
  Target,
  Percent,
  CheckCheck,
  AlertCircle,
  Zap,
} from "lucide-react";
import { callAI, parseJSONLoose } from "../utils/aiClient";

interface ScreeningSectionProps {
  records: SLRRecord[];
  screening: Record<string, ScreeningDecision>;
  onUpdateScreening: (screening: Record<string, ScreeningDecision>) => void;
  protocol: SLRProtocol;
  aiConfig: any;
}

// Stop words to ignore during title keyword extraction
const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "of", "in", "for", "on", "with", "to", "at", "by", "from",
  "is", "are", "was", "were", "be", "been", "that", "this", "these", "those", "using", "based",
  "via", "into", "as", "such", "an", "its", "study", "studies", "review", "systematic", "meta-analysis"
]);

export default function ScreeningSection({
  records,
  screening,
  onUpdateScreening,
  protocol,
  aiConfig,
}: ScreeningSectionProps) {
  const [runningScreening, setRunningScreening] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<"all" | "fiftyPlus" | "included" | "excluded" | "pending">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Extract core keywords from protocol PICO & title
  const targetKeywords = useMemo(() => {
    const textPool = [
      protocol.title,
      protocol.objectivesPICO.population,
      protocol.objectivesPICO.intervention,
      protocol.objectivesPICO.comparator,
      protocol.objectivesPICO.outcomes,
      ...(protocol.eligibilityCriteria.inclusion || []),
    ].join(" ").toLowerCase();

    const words = textPool
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

    // Unique keywords
    return Array.from(new Set(words));
  }, [protocol]);

  // Compute keyword match for each record title
  const recordKeywordStats = useMemo(() => {
    const map: Record<string, { matchCount: number; percentage: number; matchedWords: string[] }> = {};

    records.forEach((r) => {
      const titleLower = r.title.toLowerCase();
      const titleWords = titleLower
        .replace(/[^a-z0-9\s-]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

      const titleWordsSet = new Set(titleWords);
      const matched: string[] = [];

      targetKeywords.forEach((kw) => {
        if (titleLower.includes(kw) || titleWordsSet.has(kw)) {
          matched.push(kw);
        }
      });

      // Calculate percentage against total non-stop words in title (capped at 100)
      const denominator = Math.max(1, titleWords.length);
      const rawPct = Math.round((matched.length / denominator) * 100);
      const percentage = Math.min(100, Math.max(0, rawPct));

      map[r.id] = {
        matchCount: matched.length,
        percentage,
        matchedWords: matched.slice(0, 6),
      };
    });

    return map;
  }, [records, targetKeywords]);

  const includedCount = records.filter((r) => screening[r.id]?.agreed === true).length;
  const excludedCount = records.filter((r) => screening[r.id]?.agreed === false).length;
  const pendingCount = records.filter((r) => screening[r.id]?.agreed === undefined).length;
  const fiftyPlusCount = records.filter((r) => (recordKeywordStats[r.id]?.percentage || 0) >= 50).length;

  // Rule-based heuristic screener (offline / fast fallback)
  const runRuleBasedScreening = () => {
    const nextScreening = { ...screening };
    records.forEach((r) => {
      const stat = recordKeywordStats[r.id];
      const pct = stat?.percentage || 0;
      const isInclude = pct >= 50;
      const matchedStr = stat?.matchedWords.join(", ") || "keywords";

      nextScreening[r.id] = {
        score: Math.min(95, Math.max(30, pct + 25)),
        reason: isInclude
          ? `≥50% title keyword match (${pct}%): Identified relevant PICO terms [${matchedStr}].`
          : `<50% title keyword match (${pct}%): Insufficient protocol keyword alignment in title.`,
        decision: isInclude ? "include" : "exclude",
        agreed: isInclude,
        exclusionReason: !isInclude ? "Wrong intervention / exposure" : undefined,
      };
    });
    onUpdateScreening(nextScreening);
    setErrorMessage(null);
  };

  // AI-assisted screening
  const runAIScreening = async () => {
    if (records.length === 0) return;
    setRunningScreening(true);
    setProgress(0);
    setErrorMessage(null);

    const batchSize = 4;
    const totalBatches = Math.ceil(records.length / batchSize);
    const nextScreening = { ...screening };

    try {
      for (let b = 0; b < totalBatches; b++) {
        const batch = records.slice(b * batchSize, (b + 1) * batchSize);
        const payload = batch.map((r) => ({
          id: r.id,
          title: r.title,
          abstract: (r.abstract || "").slice(0, 500),
          titleKeywordMatchPct: recordKeywordStats[r.id]?.percentage || 0,
          matchedKeywords: recordKeywordStats[r.id]?.matchedWords || [],
        }));

        const prompt = `Systematic Review Protocol Title: "${protocol.title}"
Inclusion Criteria: ${protocol.eligibilityCriteria.inclusion.join("; ")}
Exclusion Criteria: ${protocol.eligibilityCriteria.exclusion.join("; ")}

Review the following studies. Note that records with ≥50% keyword match in title should strongly favor inclusion.
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
            aiConfig
          );
          const parsed = parseJSONLoose(text);
          if (Array.isArray(parsed)) {
            parsed.forEach((p: any) => {
              const kwPct = recordKeywordStats[p.id]?.percentage || 0;
              // If title match >= 50%, strongly preserve high relevance
              const finalScore = kwPct >= 50 ? Math.max(p.score || 85, 80) : (p.score ?? 50);
              const isInclude = finalScore >= (protocol.selectionProcess.screeningThreshold || 80);

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
          // Apply intelligent keyword fallback for this batch so progress is never lost
          batch.forEach((r) => {
            const stat = recordKeywordStats[r.id];
            const isInclude = (stat?.percentage || 0) >= 50;
            if (!nextScreening[r.id] || nextScreening[r.id].agreed === undefined) {
              nextScreening[r.id] = {
                score: isInclude ? 88 : 45,
                reason: isInclude
                  ? `Heuristic 50%+ Title Match (${stat?.percentage}%): ${stat?.matchedWords.join(", ")}`
                  : `Low title keyword overlap (${stat?.percentage}%)`,
                decision: isInclude ? "include" : "exclude",
                agreed: isInclude,
                exclusionReason: !isInclude ? "Wrong intervention / exposure" : undefined,
              };
            }
          });
          if (!errorMessage) {
            setErrorMessage(`AI provider notice: ${err.message || "Quota limit"}. Automatically applied keyword match heuristics.`);
          }
        }

        setProgress(Math.round(((b + 1) / totalBatches) * 100));
        onUpdateScreening({ ...nextScreening });
      }
    } finally {
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

  // Bulk include all >=50% keyword match
  const handleBulkIncludeFiftyPlus = () => {
    const next = { ...screening };
    records.forEach((r) => {
      const pct = recordKeywordStats[r.id]?.percentage || 0;
      if (pct >= 50) {
        next[r.id] = {
          score: Math.max(next[r.id]?.score || 85, 80),
          reason: `Included via ≥50% Title Keyword Match (${pct}% match)`,
          decision: "include",
          agreed: true,
        };
      }
    });
    onUpdateScreening(next);
  };

  const handleBulkIncludeHigh = () => {
    const next = { ...screening };
    records.forEach((r) => {
      if ((next[r.id]?.score || 0) >= 80) {
        next[r.id] = { ...next[r.id], agreed: true };
      }
    });
    onUpdateScreening(next);
  };

  const handleBulkExcludeLow = () => {
    const next = { ...screening };
    records.forEach((r) => {
      if ((next[r.id]?.score || 0) < 80) {
        next[r.id] = {
          ...next[r.id],
          agreed: false,
          exclusionReason: next[r.id]?.exclusionReason || "Wrong study design",
        };
      }
    });
    onUpdateScreening(next);
  };

  const filteredRecords = records.filter((r) => {
    const dec = screening[r.id];
    const kwStat = recordKeywordStats[r.id];

    if (activeTab === "fiftyPlus" && (kwStat?.percentage || 0) < 50) return false;
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
              PRISMA 2020 Items 8, 16a & 16b · Automated Title Matching
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-0.5">
              Study Selection & Title Keyword Matcher
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Screen records against protocol PICO criteria. Titles with <strong>≥50% keyword overlap</strong> are highlighted for high-priority inclusion.
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
            <button
              onClick={runRuleBasedScreening}
              disabled={records.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs cursor-pointer"
              title="Fast deterministic title match without API calls"
            >
              <Target className="w-3.5 h-3.5 text-indigo-600" />
              Instant 50% Match Triage
            </button>
          </div>
        </div>

        {/* Progress bar if running */}
        {runningScreening && (
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
            <div style={{ width: `${progress}%` }} className="bg-indigo-600 h-full transition-all duration-300" />
          </div>
        )}

        {/* 50% Title Match Highlight Banner */}
        <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-mono font-bold text-xs">
              50%
            </div>
            <div>
              <span className="font-mono font-bold text-indigo-950">
                {fiftyPlusCount} / {records.length} records have ≥50% Title Keyword Match
              </span>
              <div className="text-[11px] text-indigo-800 font-sans">
                Target keywords: <span className="font-mono text-indigo-900">{targetKeywords.slice(0, 8).join(", ")}...</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkIncludeFiftyPlus}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Include All ≥50% Matches ({fiftyPlusCount})
            </button>
          </div>
        </div>

        {/* Quick bulk actions */}
        {Object.keys(screening).length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50/80 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleBulkIncludeHigh}
                className="px-2.5 py-1 text-xs font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer shadow-2xs"
              >
                Include All ≥80% Score
              </button>
              <button
                onClick={handleBulkExcludeLow}
                className="px-2.5 py-1 text-xs font-mono text-rose-800 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer shadow-2xs"
              >
                Exclude All &lt;80% Score
              </button>
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
              { key: "fiftyPlus", label: `≥50% Keyword Match (${fiftyPlusCount})` },
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
            const kwStat = recordKeywordStats[r.id];
            const isFiftyPlus = (kwStat?.percentage || 0) >= 50;
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
                    : isFiftyPlus
                    ? "bg-indigo-50/20 border-indigo-300 ring-1 ring-indigo-500/10"
                    : "bg-white border-slate-200"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-[280px]">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      {/* Keyword percentage badge */}
                      <span
                        className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                          isFiftyPlus
                            ? "bg-indigo-600 text-white border-indigo-700"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                        title={`Matched keywords: ${kwStat?.matchedWords.join(", ") || "none"}`}
                      >
                        <Percent className="w-3 h-3" />
                        {kwStat?.percentage || 0}% Title Match
                        {isFiftyPlus && " (≥50%)"}
                      </span>

                      {s?.score !== undefined && s.score !== null && (
                        <span
                          className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${
                            s.score >= 80
                              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                              : "bg-rose-50 border-rose-200 text-rose-800"
                          }`}
                        >
                          {s.score}% PICO Match
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

                    {/* Matched Keywords Tags */}
                    {kwStat && kwStat.matchedWords.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span className="text-[10px] font-mono text-slate-400">Keywords:</span>
                        {kwStat.matchedWords.map((kw, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-mono px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-200"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
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
                          <option value="Out of scope / Keyword mismatch">Out of scope / Keyword mismatch</option>
                          <option value="Wrong population">Wrong population</option>
                          <option value="Wrong intervention / exposure">Wrong intervention / exposure</option>
                          <option value="Wrong comparator">Wrong comparator</option>
                          <option value="Wrong outcome">Wrong outcome</option>
                          <option value="Wrong study design">Wrong study design</option>
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
