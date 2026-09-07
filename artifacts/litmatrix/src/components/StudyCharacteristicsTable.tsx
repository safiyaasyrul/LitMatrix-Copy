import React, { useState } from "react";
import { AlertCircle, Check, Copy, FileSpreadsheet, Table, X } from "lucide-react";
import { ScreeningDecision, SLRRecord } from "../types/slr";

interface StudyCharacteristicsTableProps {
  screeningRecords: SLRRecord[];
  onUpdateScreening: (screening: Record<string, ScreeningDecision>) => void;
  screening: Record<string, ScreeningDecision>;
}

const JUSTIFICATION_PLACEHOLDER =
  "No screening justification recorded. Full-text eligibility was not verified.";

const articleInformation = (record: SLRRecord) => {
  const authors = record.authors?.join(", ") || "Author not reported";
  const journal = record.source || "Journal not reported";
  return `${record.title} — ${authors} — ${journal}`;
};

export default function StudyCharacteristicsTable({
  screeningRecords,
  onUpdateScreening,
  screening,
}: StudyCharacteristicsTableProps) {
  const [copied, setCopied] = useState(false);

  const handleSetDecision = (
    recordId: string,
    agreed: boolean,
    exclusionReason?: ScreeningDecision["exclusionReason"]
  ) => {
    const existing = screening[recordId] || {
      score: null,
      reason: "Manual investigator evaluation",
      decision: agreed ? "include" : "exclude",
    };
    onUpdateScreening({
      ...screening,
      [recordId]: {
        ...existing,
        agreed,
        decision: agreed ? "include" : "exclude",
        exclusionReason: agreed
          ? undefined
          : exclusionReason || existing.exclusionReason || "Wrong study design",
      },
    });
  };

  const exportCSV = () => {
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const rows = [
      ["Article Information (Title, Author & Journal)", "Screening Status", "Academic Screening Justification"],
      ...screeningRecords.map((record) => [
        articleInformation(record),
        screening[record.id]?.agreed === true
          ? "Included"
          : screening[record.id]?.agreed === false
          ? "Excluded"
          : "Pending",
        characteristicById.get(record.id)?.acceptanceJustification ||
          screening[record.id]?.reason ||
          JUSTIFICATION_PLACEHOLDER,
      ]),
    ];
    const csv = rows.map((row) => row.map(escape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Table1_Academic_Screening_Justifications.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const copyMarkdown = async () => {
    const lines = [
      "| Article Information (Title, Author & Journal) | Screening Status | Academic Screening Justification |",
      "| --- | --- | --- |",
      ...screeningRecords.map((record) => {
        const justification =
          characteristicById.get(record.id)?.acceptanceJustification ||
          screening[record.id]?.reason ||
          JUSTIFICATION_PLACEHOLDER;
        const status = screening[record.id]?.agreed === true
          ? "INCLUDED"
          : screening[record.id]?.agreed === false
          ? "EXCLUDED"
          : "PENDING";
        return `| ${articleInformation(record).replace(/\|/g, "/")} | ${status} | ${justification.replace(/\|/g, "/")} |`;
      }),
    ];
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div id="study-characteristics-container" className="space-y-6">
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

      <div className="bg-[#050505] border border-slate-500/80 p-5 sm:p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-mono text-[10px] text-amber-300 uppercase tracking-wider font-bold">
              Table 1 · Study Screening Decisions
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-amber-300 mt-0.5">
              Comprehensive Screening Decision Table
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Grouped by article title, author, journal, and the academic reason for inclusion or exclusion.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {screeningRecords.length > 0 && (
              <button
                onClick={copyMarkdown}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold text-slate-200 bg-transparent hover:bg-white/10 border border-slate-500 rounded-md transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-amber-300" />
                {copied ? "Copied Markdown" : "Copy Table (Markdown)"}
              </button>
            )}
            <button
              onClick={handleAutoExtract}
              disabled={extracting || screeningRecords.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-400 rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
              {extracting ? "Generating Justifications..." : "AI Generate Justifications"}
            </button>
            {screeningRecords.length > 0 && (
              <button
                onClick={exportCSV}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-medium text-slate-200 bg-transparent border border-slate-500 hover:bg-white/10 rounded-md cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Export CSV Table
              </button>
            )}
          </div>
        </div>
      </div>

      {screeningRecords.length === 0 ? (
        <div className="bg-[#050505] border border-slate-500/80 p-6 rounded-2xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-amber-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-100">No Records in the Screening Pool</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            This table populates from the first 100 records selected for further screening.
          </p>
          {onNavigateToScreening && (
            <button
              onClick={onNavigateToScreening}
              className="px-4 py-2 text-xs font-mono font-semibold bg-amber-500 hover:bg-amber-400 text-black rounded-md transition-colors cursor-pointer"
            >
              Go to Screening Stage
            </button>
          )}
        </div>
      ) : (
        <div className="bg-[#050505] border border-slate-500/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#111111] border-b border-slate-700 text-slate-300 font-mono text-[10px] uppercase tracking-wide">
                <tr>
                  <th className="py-3 px-3.5 font-bold min-w-[360px]">Article Information (Title, Author &amp; Journal)</th>
                  <th className="py-3 px-3 font-bold whitespace-nowrap">Status</th>
                  <th className="py-3 px-3 font-bold min-w-[420px]">Academic Screening Justification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/90">
                {screeningRecords.map((record) => {
                  const item = characteristicById.get(record.id);
                  const justification =
                    item?.acceptanceJustification ||
                    screening[record.id]?.reason ||
                    JUSTIFICATION_PLACEHOLDER;
                  const editing = editingRecordId === record.id;
                  const decision = screening[record.id];
                  return (
                    <tr key={record.id} className="hover:bg-white/[0.04] align-top">
                      <td className="py-3.5 px-3.5 text-slate-100">
                        <div className="font-bold leading-snug">{record.title}</div>
                        <div className="mt-1 text-[10px] text-slate-400">
                          Authors: {(record.authors || []).join(", ") || "Not reported"} · {record.year || "Year not reported"}
                        </div>
                        <div className="mt-0.5 text-[10px] font-mono font-semibold uppercase text-amber-300">
                          {record.source || "Journal not reported"}
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 font-mono text-[10px] font-semibold uppercase ${
                            screening[record.id]?.agreed === true
                              ? "border-emerald-700/70 bg-emerald-950/70 text-emerald-300"
                              : screening[record.id]?.agreed === false
                              ? "border-rose-700/70 bg-rose-950/70 text-rose-300"
                              : "border-slate-600 bg-slate-800 text-slate-300"
                          }`}
                        >
                          {screening[record.id]?.agreed === true ? (
                            <Check className="h-3 w-3" />
                          ) : null}
                          {screening[record.id]?.agreed === true
                            ? "Included"
                            : screening[record.id]?.agreed === false
                            ? "Excluded"
                            : "Pending"}
                        </span>
                        <div className="mt-1 text-[10px] text-slate-500">Title/abstract</div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <button
                            onClick={() => handleSetDecision(record.id, true)}
                            className={`inline-flex items-center gap-1 rounded border px-2 py-1 font-mono text-[10px] font-semibold ${
                              decision?.agreed === true
                                ? "border-emerald-700 bg-emerald-700 text-white"
                                : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                            }`}
                          >
                            <Check className="h-3 w-3" />
                            Include
                          </button>
                          <button
                            onClick={() => handleSetDecision(record.id, false)}
                            className={`inline-flex items-center gap-1 rounded border px-2 py-1 font-mono text-[10px] font-semibold ${
                              decision?.agreed === false
                                ? "border-rose-700 bg-rose-700 text-white"
                                : "border-rose-300 text-rose-700 hover:bg-rose-50"
                            }`}
                          >
                            <X className="h-3 w-3" />
                            Exclude
                          </button>
                        </div>
                        {decision?.agreed === false && (
                          <select
                            value={decision.exclusionReason || "Wrong study design"}
                            onChange={(event) =>
                              handleSetDecision(
                                record.id,
                                false,
                                event.target.value as ScreeningDecision["exclusionReason"]
                              )
                            }
                            className="mt-2 max-w-[190px] rounded border border-rose-300 bg-white px-1 py-1 text-[10px] text-rose-800"
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
                        )}
                      </td>
                      <td
                        className="py-3 px-3 text-slate-300 leading-relaxed"
                        onDoubleClick={() => setEditingRecordId(editing ? null : record.id)}
                        title="Double-click to edit"
                      >
                        {editing ? (
                          <textarea
                            value={justification === JUSTIFICATION_PLACEHOLDER ? "" : justification}
                            onChange={(event) => updateJustification(record, event.target.value)}
                            placeholder="Explain the evidence supporting inclusion or exclusion for this review."
                            rows={5}
                            className="w-full min-w-[380px] rounded border border-slate-600 bg-[#111111] p-2 text-xs text-slate-100 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                        ) : (
                          justification
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-2 border-t border-slate-700 bg-[#111111] px-4 py-3 text-[11px] text-slate-400">
            <Table className="h-3.5 w-3.5 text-amber-300" />
            Status reflects recorded title/abstract screening. Double-click a justification to edit it. Full-text eligibility was not verified.
          </div>
        </div>
      )}
    </div>
  );
}