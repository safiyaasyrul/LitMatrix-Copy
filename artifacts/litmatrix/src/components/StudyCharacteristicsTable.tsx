import React, { useState } from "react";
import { AlertCircle, Copy, FileSpreadsheet, Table } from "lucide-react";
import { ScreeningDecision, SLRRecord } from "../types/slr";

interface StudyCharacteristicsTableProps {
  screeningRecords: SLRRecord[];
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
  screening,
}: StudyCharacteristicsTableProps) {
  const [copied, setCopied] = useState(false);

  const exportCSV = () => {
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const rows = [
      ["Article Information (Title, Author & Journal)", "Screening Status", "Academic Screening Justification"],
      ...screeningRecords.map((record) => [
        articleInformation(record),
        "Included",
        screening[record.id]?.reason || JUSTIFICATION_PLACEHOLDER,
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
        const justification = screening[record.id]?.reason || JUSTIFICATION_PLACEHOLDER;
        return `| ${articleInformation(record).replace(/\|/g, "/")} | INCLUDED | ${justification.replace(/\|/g, "/")} |`;
      }),
    ];
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div id="study-characteristics-container" className="space-y-6">
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
              Included papers grouped by article title, author, journal, and the academic screening justification.
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
            <h3 className="text-sm font-bold text-slate-100">No Included Records Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
              Run AI screening to identify included records and populate their academic justifications.
          </p>
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
                  const justification = screening[record.id]?.reason || JUSTIFICATION_PLACEHOLDER;
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
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-700/70 bg-emerald-950/70 px-2 py-1 font-mono text-[10px] font-semibold uppercase text-emerald-300">
                          Included
                        </span>
                        <div className="mt-1 text-[10px] text-slate-500">Title/abstract</div>
                      </td>
                      <td className="py-3 px-3 text-slate-300 leading-relaxed">
                        {justification}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-2 border-t border-slate-700 bg-[#111111] px-4 py-3 text-[11px] text-slate-400">
            <Table className="h-3.5 w-3.5 text-amber-300" />
            Included status and justification come directly from the recorded title/abstract screening decision. Full-text eligibility was not verified.
          </div>
        </div>
      )}
    </div>
  );
}