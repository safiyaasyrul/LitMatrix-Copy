import React, { useState } from "react";
import { AlertCircle, Check, Download, Edit3, FileSpreadsheet, Sparkles, Table } from "lucide-react";
import { ScreeningDecision, SLRProtocol, SLRRecord, StudyCharacteristic } from "../types/slr";
import { callAI, parseJSONLoose } from "../utils/aiClient";

interface StudyCharacteristicsTableProps {
  includedRecords: SLRRecord[];
  characteristics: StudyCharacteristic[];
  onUpdateCharacteristics: (chars: StudyCharacteristic[]) => void;
  screening: Record<string, ScreeningDecision>;
  protocol: SLRProtocol;
  aiConfig: any;
  onNavigateToScreening?: () => void;
}

const JUSTIFICATION_PLACEHOLDER =
  "Acceptance justification not yet generated. Full-text eligibility was not verified.";

const articleInformation = (record: SLRRecord) => {
  const authors = record.authors?.join(", ") || "Author not reported";
  const journal = record.source || "Journal not reported";
  return `${record.title} — ${authors} — ${journal}`;
};

const baseCharacteristic = (record: SLRRecord, existing?: StudyCharacteristic): StudyCharacteristic => ({
  ...(existing || {}),
  recordId: record.id,
  authorYear: existing?.authorYear || `${record.authors?.[0] || "Author"} (${record.year || "Year not reported"})`,
  category: existing?.category || "Included study",
  country: existing?.country || "Not reported",
  sampleSize: existing?.sampleSize || "Not reported",
  population: existing?.population || "Not reported",
  interventionOrFocus: existing?.interventionOrFocus || "Not reported",
  comparator: existing?.comparator || "Not reported",
  primaryOutcome: existing?.primaryOutcome || "Not reported",
  studyDesign: existing?.studyDesign || "Not reported",
  keyFinding: existing?.keyFinding || "Not reported",
  acceptanceJustification: existing?.acceptanceJustification || JUSTIFICATION_PLACEHOLDER,
});

export default function StudyCharacteristicsTable({
  includedRecords,
  characteristics,
  onUpdateCharacteristics,
  screening,
  protocol,
  aiConfig,
  onNavigateToScreening,
}: StudyCharacteristicsTableProps) {
  const [extracting, setExtracting] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const characteristicById = new Map(characteristics.map((item) => [item.recordId, item]));

  const handleAutoExtract = async () => {
    if (includedRecords.length === 0) return;
    setExtracting(true);
    setErrorMessage(null);

    const payload = includedRecords.map((record) => ({
      recordId: record.id,
      title: record.title,
      authors: record.authors,
      year: record.year,
      journal: record.source,
      abstract: (record.abstract || "").slice(0, 1200),
      recordedScreeningRationale: screening[record.id]?.reason || "Not recorded",
    }));

    const prompt = `Generate an academic screening justification for every included record in this systematic review.

Review title: ${protocol.title}
Review scope: population/domain = ${protocol.objectivesPICO.population || "Not specified"}; intervention/focus = ${protocol.objectivesPICO.intervention || "Not specified"}; comparator = ${protocol.objectivesPICO.comparator || "Not specified"}; outcomes = ${protocol.objectivesPICO.outcomes || "Not specified"}; study designs = ${protocol.objectivesPICO.studyDesigns || "Not specified"}
Inclusion criteria: ${(protocol.eligibilityCriteria.inclusion || []).join("; ") || "Not specified"}
Exclusion criteria: ${(protocol.eligibilityCriteria.exclusion || []).join("; ") || "Not specified"}

Evidence rules:
- Use only the supplied title, authors, journal, year, abstract, protocol, and recorded screening rationale.
- Explain the specific evidence that supported acceptance at title/abstract screening.
- Do not invent facts, results, methods, locations, sample sizes, or eligibility details.
- Do not claim full-text retrieval, full-text verification, independent review, adjudication, or final eligibility.
- If the abstract does not support a specific criterion, say that the available citation provides only provisional support.
- End every justification with exactly: "Full-text eligibility was not verified."

Records:
${JSON.stringify(payload)}

Return ONLY a JSON array with one object per record:
[
  {
    "recordId": "exact supplied recordId",
    "acceptanceJustification": "One or two manuscript-ready sentences."
  }
]`;

    try {
      const text = await callAI(
        prompt,
        "You are a systematic-review methodologist writing conservative, evidence-grounded academic screening justifications.",
        aiConfig
      );
      const parsed = parseJSONLoose(text);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("Could not parse the AI response.");
      }

      const parsedById = new Map(parsed.map((item: any) => [item.recordId, item]));
      const updated = includedRecords.map((record) => {
        const existing = characteristicById.get(record.id);
        const aiItem = parsedById.get(record.id);
        if (!aiItem?.acceptanceJustification) {
          throw new Error(`AI response omitted a justification for ${record.id}.`);
        }
        return {
          ...baseCharacteristic(record, existing),
          acceptanceJustification: String(aiItem.acceptanceJustification),
        };
      });
      onUpdateCharacteristics(updated);
    } catch (error: any) {
      setErrorMessage(
        `AI justification could not be generated: ${error.message || "Request failed"}. Existing records were not overwritten.`
      );
    } finally {
      setExtracting(false);
    }
  };

  const updateJustification = (record: SLRRecord, value: string) => {
    const existing = characteristicById.get(record.id);
    const next = baseCharacteristic(record, existing);
    next.acceptanceJustification = value;
    const remaining = characteristics.filter((item) => item.recordId !== record.id);
    onUpdateCharacteristics([...remaining, next]);
  };

  const exportCSV = () => {
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const rows = [
      ["Article Information (Title, Author & Journal)", "Acceptance Status", "Academic Screening Justification"],
      ...includedRecords.map((record) => [
        articleInformation(record),
        "Accepted at title/abstract screening",
        characteristicById.get(record.id)?.acceptanceJustification || JUSTIFICATION_PLACEHOLDER,
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

      <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-mono text-[10px] text-indigo-600 uppercase tracking-wider font-bold">
              Study Characteristics · Table 1
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-0.5">Characteristics of Included Studies Matrix</h2>
            <p className="text-xs text-slate-500 mt-1">
              Article information, acceptance status, and the academic justification recorded for title/abstract screening.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleAutoExtract}
              disabled={extracting || includedRecords.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
              {extracting ? "Generating Justifications..." : "AI Generate Justifications"}
            </button>
            {includedRecords.length > 0 && (
              <button
                onClick={exportCSV}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Export CSV Table
              </button>
            )}
          </div>
        </div>
      </div>

      {includedRecords.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
          <h3 className="text-sm font-bold text-amber-900">No Studies Currently Marked as Included</h3>
          <p className="text-xs text-amber-700 max-w-md mx-auto">
            This table populates from studies accepted during title/abstract screening.
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
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-3.5 font-bold min-w-[360px]">Article Information (Title, Author &amp; Journal)</th>
                  <th className="py-3 px-3 font-bold whitespace-nowrap">Acceptance Status</th>
                  <th className="py-3 px-3 font-bold min-w-[420px]">Academic Screening Justification</th>
                  <th className="py-3 px-3 font-bold text-right">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {includedRecords.map((record) => {
                  const item = characteristicById.get(record.id);
                  const justification = item?.acceptanceJustification || JUSTIFICATION_PLACEHOLDER;
                  const editing = editingRecordId === record.id;
                  return (
                    <tr key={record.id} className="hover:bg-slate-50/60 align-top">
                      <td className="py-3 px-3.5 text-slate-900">
                        <div className="font-semibold leading-snug">{record.title}</div>
                        <div className="mt-1 text-[11px] text-slate-500">
                          {(record.authors || []).join(", ") || "Author not reported"} · {record.source || "Journal not reported"} ·{" "}
                          {record.year || "Year not reported"}
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 font-mono text-[10px] font-semibold text-emerald-800">
                          <Check className="h-3 w-3" />
                          Accepted
                        </span>
                        <div className="mt-1 text-[10px] text-slate-500">Title/abstract screening</div>
                      </td>
                      <td className="py-3 px-3 text-slate-700 leading-relaxed">
                        {editing ? (
                          <textarea
                            value={justification === JUSTIFICATION_PLACEHOLDER ? "" : justification}
                            onChange={(event) => updateJustification(record, event.target.value)}
                            placeholder="Explain the evidence supporting acceptance for this review."
                            rows={5}
                            className="w-full min-w-[380px] rounded border border-slate-300 p-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                        ) : (
                          justification
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setEditingRecordId(editing ? null : record.id)}
                          className={`rounded p-1.5 transition-colors cursor-pointer ${
                            editing ? "bg-emerald-600 text-white" : "text-slate-500 hover:bg-slate-100"
                          }`}
                          title={editing ? "Done" : "Edit justification"}
                        >
                          {editing ? <Check className="h-3.5 w-3.5" /> : <Edit3 className="h-3.5 w-3.5" />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3 text-[11px] text-slate-600">
            <Table className="h-3.5 w-3.5 text-indigo-600" />
            The acceptance status reflects recorded title/abstract screening. Full-text eligibility was not verified.
          </div>
        </div>
      )}
    </div>
  );
}