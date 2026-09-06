import React, { useMemo, useState } from "react";
import { AlertCircle, Check, Download, FileText, Sparkles } from "lucide-react";
import { SLRProtocol, SLRRecord, AbstractReportingAssessment, ReportingJudgment } from "../types/slr";
import { callAI, parseJSONLoose } from "../utils/aiClient";

interface AbstractReportingSectionProps {
  includedRecords: SLRRecord[];
  assessments: AbstractReportingAssessment[];
  onUpdateAssessments: (items: AbstractReportingAssessment[]) => void;
  aiConfig: any;
  protocol: SLRProtocol;
  onNavigateToScreening?: () => void;
}

const fields: Array<{ key: keyof AbstractReportingAssessment; label: string }> = [
  { key: "studyDesignIdentifiable", label: "Study design identifiable" },
  { key: "datasetSampleDescribed", label: "Dataset / sample described" },
  { key: "outcomeClearlyDefined", label: "Outcome clearly defined" },
  { key: "validationDescribed", label: "Validation described" },
  { key: "comparatorBaselineDescribed", label: "Comparator / baseline described" },
  { key: "externalValidation", label: "External validation" },
  { key: "uncertaintyReported", label: "Uncertainty reported" },
  { key: "realWorldImplementation", label: "Real-world implementation" },
  { key: "directTargetOutcome", label: "Direct target outcome reported" },
];

const firstAuthor = (record: SLRRecord) =>
  record.authors?.[0]?.split(",")[0]?.trim() || "Author";

const yesNoUnclear = (value: unknown): ReportingJudgment =>
  value === "Yes" || value === "No" || value === "Unclear" ? value : "Unclear";

function assessFromAbstract(record: SLRRecord, protocol: SLRProtocol): AbstractReportingAssessment {
  const text = `${record.title}\n${record.abstract || ""}`;
  const has = (pattern: RegExp) => pattern.test(text);
  const target = protocol.objectivesPICO.outcomes || protocol.objectivesPICOC?.outcomes || "";
  const targetPattern = target
    ? new RegExp(target.split(/[,\n;]/).map((part) => part.trim()).filter(Boolean).slice(0, 4).join("|"), "i")
    : /outcome|emission|carbon dioxide|co2|accuracy|performance|effect|result/i;
  const result: AbstractReportingAssessment = {
    recordId: record.id,
    authorYear: `${firstAuthor(record)} (${record.year || "n.d."})`,
    studyDesignIdentifiable: has(/retrospective|prospective|cohort|cross-sectional|randomi[sz]ed|experiment|simulation|case study|survey|qualitative|model/i) ? "Yes" : "Unclear",
    datasetSampleDescribed: has(/\bn\s*=\s*[\d,]+|sample|dataset|participants?|observations?|sites?|cases?/i) ? "Yes" : "Unclear",
    outcomeClearlyDefined: has(/primary outcome|outcome|endpoint|metric|measure|emission|accuracy|sensitivity|specificity|auc|result/i) ? "Yes" : "Unclear",
    validationDescribed: has(/validat|test set|testing set|hold[- ]?out|cross[- ]?validat|replicat|benchmark/i) ? "Yes" : "Unclear",
    comparatorBaselineDescribed: has(/compared with|compared to|baseline|benchmark|control|versus|\bvs\.?\b/i) ? "Yes" : "Unclear",
    externalValidation: has(/external|independent|multi[- ]?site|multi[- ]?center|outside cohort/i) ? "Yes" : "Unclear",
    uncertaintyReported: has(/confidence interval|95% ci|uncertainty|standard error|credible interval|range|interquartile|sensitivity analysis/i) ? "Yes" : "Unclear",
    realWorldImplementation: has(/implemented|implementation|deployed|deployment|operational|practice|real[- ]world|field study/i) ? "Yes" : "Unclear",
    directTargetOutcome: targetPattern.test(text) ? "Yes" : "Unclear",
    abstractReportingCompleteness: "Low",
    evidenceNotes: "Initial abstract-level assessment. “Unclear” means not reported in the available abstract.",
  };
  const definite = fields.filter(({ key }) => result[key] === "Yes").length;
  result.abstractReportingCompleteness = definite >= 7 ? "High" : definite >= 4 ? "Moderate" : "Low";
  return result;
}

export default function AbstractReportingSection({
  includedRecords,
  assessments,
  onUpdateAssessments,
  aiConfig,
  protocol,
  onNavigateToScreening,
}: AbstractReportingSectionProps) {
  const [evaluating, setEvaluating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const assessmentMap = useMemo(() => new Map(assessments.map((item) => [item.recordId, item])), [assessments]);

  const generateAssessments = async () => {
    if (!includedRecords.length) return;
    setEvaluating(true);
    setErrorMessage(null);
    const fallback = includedRecords.map((record) => assessFromAbstract(record, protocol));
    try {
      const prompt = `Assess reporting completeness from citation metadata and abstract text only. Do not assess risk of bias, internal validity, confounding, causal certainty, or study quality. “No” means the abstract explicitly indicates absence; “Unclear” means the item is not reported in the abstract. Return only JSON with an assessments array. Each assessment must contain recordId, studyDesignIdentifiable, datasetSampleDescribed, outcomeClearlyDefined, validationDescribed, comparatorBaselineDescribed, externalValidation, uncertaintyReported, realWorldImplementation, directTargetOutcome, abstractReportingCompleteness, evidenceNotes. Allowed judgments: Yes, No, Unclear. Allowed completeness: High, Moderate, Low.

${includedRecords.map((record) => `recordId: ${record.id}\ntitle: ${record.title}\nabstract: ${record.abstract || "Not reported"}`).join("\n\n")}`;
      const parsed = parseJSONLoose(await callAI(prompt, "You are a cautious evidence-reporting assessor. Never infer facts missing from an abstract.", aiConfig));
      const generated = Array.isArray(parsed?.assessments) ? parsed.assessments : Array.isArray(parsed) ? parsed : [];
      const byId = new Map(fallback.map((item) => [item.recordId, item]));
      generated.forEach((item: any) => {
        if (!byId.has(item.recordId)) return;
        byId.set(item.recordId, {
          ...byId.get(item.recordId)!,
          ...Object.fromEntries(fields.map(({ key }) => [key, key === "abstractReportingCompleteness" ? item[key] : yesNoUnclear(item[key])])),
          abstractReportingCompleteness: item.abstractReportingCompleteness === "High" || item.abstractReportingCompleteness === "Moderate" || item.abstractReportingCompleteness === "Low"
            ? item.abstractReportingCompleteness
            : byId.get(item.recordId)!.abstractReportingCompleteness,
          evidenceNotes: typeof item.evidenceNotes === "string" && item.evidenceNotes.trim()
            ? item.evidenceNotes
            : byId.get(item.recordId)!.evidenceNotes,
        });
      });
      onUpdateAssessments(Array.from(byId.values()));
    } catch (error: any) {
      onUpdateAssessments(fallback);
      setErrorMessage(error?.message || "The abstract-reporting assessment could not be generated. A conservative local draft was created for viewing.");
    } finally {
      setEvaluating(false);
    }
  };

  const updateAssessment = (recordId: string, key: keyof AbstractReportingAssessment, value: string) => {
    onUpdateAssessments(assessments.map((item) => item.recordId === recordId ? { ...item, [key]: value } : item));
  };

  const exportCsv = () => {
    const header = ["Study", ...fields.map((field) => field.label), "Completeness", "Evidence notes"];
    const rows = includedRecords.map((record) => {
      const item = assessmentMap.get(record.id);
      return [item?.authorYear || `${firstAuthor(record)} (${record.year || "n.d."})`, ...fields.map(({ key }) => String(item?.[key] || "Unclear")), item?.abstractReportingCompleteness || "Low", item?.evidenceNotes || ""];
    });
    const csv = [header, ...rows].map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = "abstract_reporting_appraisal.csv";
    a.click();
  };

  return (
    <div className="space-y-6">
      {errorMessage && <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{errorMessage}</span></div>}
      <section className="rounded-xl border border-indigo-100 bg-white p-6 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-indigo-600">PRISMA 2020 Items 11 & 18 · Abstract-level reporting</div>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">Methodological Reporting / Evidence Appraisal</h2>
            <p className="mt-2 max-w-4xl text-xs leading-5 text-slate-600">
              This checklist describes what each included abstract reports. It does not assign risk of bias, certainty, or an overall study-quality judgment. “Not reported in the abstract” is recorded as Unclear, not as high risk.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={generateAssessments} disabled={evaluating || !includedRecords.length} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
              <Sparkles className="h-3.5 w-3.5" />{evaluating ? "Assessing abstracts..." : "Draft reporting checklist"}
            </button>
            <button onClick={exportCsv} disabled={!assessments.length} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              <Download className="h-3.5 w-3.5" />Export CSV
            </button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            ["Included records", includedRecords.length],
            ["Assessed", includedRecords.filter((record) => assessmentMap.has(record.id)).length],
            ["Interpretation", "Reporting only"],
          ].map(([label, value]) => <div key={String(label)} className="rounded-lg border border-slate-200 bg-slate-50 p-3"><div className="font-mono text-[10px] uppercase text-slate-500">{label}</div><div className="mt-1 text-sm font-bold text-slate-900">{value}</div></div>)}
        </div>
      </section>

       {!includedRecords.length && <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-900"><FileText className="mx-auto mb-2 h-7 w-7" />AI-finalized included records are required before appraisal.</div>}
       {includedRecords.length > 0 && !assessments.length && <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">Generate the reporting assessment to view each row against the available abstract.</div>}
      <div className="space-y-3">
        {includedRecords.map((record) => {
          const item = assessmentMap.get(record.id);
          if (!item) return null;
          const editing = editingId === record.id;
          return <section key={record.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><div className="font-mono text-[11px] font-bold text-indigo-700">{item.authorYear}</div><h3 className="mt-1 text-sm font-semibold text-slate-900">{record.title}</h3></div>
               <button onClick={() => setEditingId(editing ? null : record.id)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">{editing ? "Done" : "View details"}</button>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {fields.map(({ key, label }) => <label key={String(key)} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-700"><span>{label}</span>{editing ? <select value={String(item[key])} onChange={(event) => updateAssessment(record.id, key, event.target.value)} className="rounded border border-slate-200 bg-white px-1.5 py-1 text-[11px] font-mono"><option>Yes</option><option>No</option><option>Unclear</option></select> : <span className={`rounded border px-1.5 py-0.5 text-[10px] font-mono font-bold ${item[key] === "Yes" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : item[key] === "No" ? "border-rose-200 bg-rose-50 text-rose-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>{String(item[key])}</span>}</label>)}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs"><span className="font-semibold text-slate-700">Abstract reporting completeness:</span>{editing ? <select value={item.abstractReportingCompleteness} onChange={(event) => updateAssessment(record.id, "abstractReportingCompleteness", event.target.value)} className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-mono"><option>High</option><option>Moderate</option><option>Low</option></select> : <span className="rounded bg-indigo-50 px-2 py-1 font-mono font-bold text-indigo-800">{item.abstractReportingCompleteness}</span>}</div>
            <p className="mt-3 text-xs leading-5 text-slate-500"><strong>Evidence note:</strong> {item.evidenceNotes}</p>
          </section>;
        })}
      </div>
       {onNavigateToScreening && includedRecords.length === 0 && <button onClick={onNavigateToScreening} className="flex items-center gap-2 text-xs font-semibold text-indigo-700 hover:text-indigo-900"><Check className="h-4 w-4" />Return to AI-finalized screening</button>}
    </div>
  );
}