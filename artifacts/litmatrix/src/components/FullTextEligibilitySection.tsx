import React from "react";
import { AlertCircle, CheckCircle2, FileSearch, XCircle } from "lucide-react";
import { SLRRecord } from "../types/slr";

interface FullTextEligibilitySectionProps {
  records: SLRRecord[];
  onUpdateRecords: (records: SLRRecord[]) => void;
}

const retrievalOptions: Array<{
  value: NonNullable<SLRRecord["fullTextStatus"]>;
  label: string;
}> = [
  { value: "not_sought", label: "Not sought" },
  { value: "sought", label: "Sought" },
  { value: "retrieved", label: "Retrieved" },
  { value: "not_retrieved", label: "Not retrieved" },
];

const eligibilityOptions: Array<{
  value: NonNullable<SLRRecord["fullTextEligibility"]>;
  label: string;
}> = [
  { value: "not_assessed", label: "Not assessed" },
  { value: "eligible", label: "Eligible — include study" },
  { value: "ineligible", label: "Ineligible — exclude study" },
  { value: "unclear", label: "Unclear — needs review" },
];

export default function FullTextEligibilitySection({
  records,
  onUpdateRecords,
}: FullTextEligibilitySectionProps) {
  const updateRecord = (id: string, updates: Partial<SLRRecord>) => {
    onUpdateRecords(records.map((record) => (record.id === id ? { ...record, ...updates } : record)));
  };

  const retrieved = records.filter((record) => record.fullTextStatus === "retrieved").length;
  const eligible = records.filter((record) => record.fullTextEligibility === "eligible").length;
  const ineligible = records.filter((record) => record.fullTextEligibility === "ineligible").length;
  const unresolved = records.filter(
    (record) =>
      record.fullTextEligibility === "unclear" ||
      (record.fullTextStatus === "retrieved" &&
        (!record.fullTextEligibility || record.fullTextEligibility === "not_assessed"))
  ).length;

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-4">
        <div>
          <div className="font-mono text-[10px] text-indigo-600 uppercase tracking-wider font-bold">
            PRISMA 2020 Item 16a · Full-text eligibility
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-0.5">Full-Text Retrieval & Eligibility</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            These records were retained after title and abstract screening. A record becomes an included study only after its full text is retrieved, assessed against the approved criteria, and marked eligible by the reviewer.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ["Retained", records.length, "text-slate-900"],
            ["Retrieved", retrieved, "text-indigo-700"],
            ["Eligible studies", eligible, "text-emerald-700"],
            ["Unresolved", unresolved, "text-amber-700"],
          ].map(([label, value, color]) => (
            <div key={String(label)} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="font-mono text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
              <div className={`font-mono text-xl font-bold ${color}`}>{value}</div>
            </div>
          ))}
        </div>

        {ineligible > 0 && (
          <div className="text-xs text-rose-700 font-mono">{ineligible} full-text report(s) marked ineligible.</div>
        )}
      </div>

      {records.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl text-center">
          <AlertCircle className="w-7 h-7 text-amber-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-amber-900">No records retained for full-text assessment</h3>
          <p className="text-xs text-amber-700 mt-1">Confirm title and abstract screening decisions first.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => {
            const retrievalStatus = record.fullTextStatus || "not_sought";
            const eligibilityStatus = record.fullTextEligibility || "not_assessed";
            const isEligible = eligibilityStatus === "eligible";
            const isIneligible = eligibilityStatus === "ineligible";

            return (
              <div
                key={record.id}
                className={`bg-white border rounded-xl p-5 shadow-xs ${
                  isEligible
                    ? "border-emerald-300"
                    : isIneligible
                    ? "border-rose-300"
                    : "border-slate-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  {isEligible ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : isIneligible ? (
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  ) : (
                    <FileSearch className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-slate-900">{record.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {(record.authors || []).join(", ")}{record.year ? ` · ${record.year}` : ""}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                      <label className="space-y-1">
                        <span className="text-[11px] font-mono font-bold text-slate-700">Full-text retrieval</span>
                        <select
                          value={retrievalStatus}
                          onChange={(event) => {
                            const nextStatus = event.target.value as NonNullable<SLRRecord["fullTextStatus"]>;
                            updateRecord(record.id, {
                              fullTextStatus: nextStatus,
                              ...(nextStatus !== "retrieved"
                                ? { fullTextEligibility: "not_assessed" as const }
                                : {}),
                            });
                          }}
                          className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-white"
                        >
                          {retrievalOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </label>

                      <label className="space-y-1">
                        <span className="text-[11px] font-mono font-bold text-slate-700">Full-text eligibility</span>
                        <select
                          value={eligibilityStatus}
                          disabled={retrievalStatus !== "retrieved"}
                          onChange={(event) =>
                            updateRecord(record.id, {
                              fullTextEligibility: event.target.value as NonNullable<SLRRecord["fullTextEligibility"]>,
                            })
                          }
                          className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-white disabled:bg-slate-100 disabled:text-slate-400"
                        >
                          {eligibilityOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </label>
                    </div>

                    {isIneligible && (
                      <label className="block space-y-1 mt-3">
                        <span className="text-[11px] font-mono font-bold text-rose-800">
                          Full-text exclusion reason
                        </span>
                        <input
                          value={record.fullTextExclusionReason || ""}
                          onChange={(event) =>
                            updateRecord(record.id, { fullTextExclusionReason: event.target.value })
                          }
                          placeholder="State the approved eligibility criterion that was not met"
                          className="w-full p-2 text-xs border border-rose-200 rounded-lg bg-rose-50/30"
                        />
                      </label>
                    )}

                    <label className="block space-y-1 mt-3">
                      <span className="text-[11px] font-mono font-bold text-slate-700">Reviewer notes</span>
                      <textarea
                        rows={2}
                        value={record.fullTextNotes || ""}
                        onChange={(event) => updateRecord(record.id, { fullTextNotes: event.target.value })}
                        placeholder="Record only information verified from the full text"
                        className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}