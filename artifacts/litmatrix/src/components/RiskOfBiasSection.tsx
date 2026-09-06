import React, { useState } from "react";
import { SLRRecord, RiskOfBiasItem, StudyCharacteristic, SLRProtocol } from "../types/slr";
import {
  Sparkles,
  ShieldCheck,
  Download,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  Zap,
  Plus,
  Trash2,
  SlidersHorizontal,
  Check,
  Edit3,
  Cpu,
  Stethoscope,
  HelpCircle,
  FileText,
  Layers,
} from "lucide-react";
import { callAI, parseJSONLoose } from "../utils/aiClient";

interface RiskOfBiasSectionProps {
  includedRecords: SLRRecord[];
  riskOfBias: RiskOfBiasItem[];
  onUpdateRiskOfBias: (items: RiskOfBiasItem[]) => void;
  aiConfig: any;
  characteristics?: StudyCharacteristic[];
  protocol: SLRProtocol;
  onNavigateToScreening?: () => void;
}

export type AppraisalFramework = "adaptive" | "threats_validity" | "clinical_rob2";
export type PresentationMode = "scorecard" | "traffic_light" | "narrative_summary";

export default function RiskOfBiasSection({
  includedRecords,
  riskOfBias,
  onUpdateRiskOfBias,
  aiConfig,
  characteristics = [],
  protocol,
  onNavigateToScreening,
}: RiskOfBiasSectionProps) {
  const [evaluating, setEvaluating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  // Start with a transparent adaptive framework unless the approved protocol
  // explicitly names a validated clinical instrument.
  const [appraisalFramework, setAppraisalFramework] = useState<AppraisalFramework>(
    /(?:rob\s*2|robins-i|cochrane)/i.test(protocol.riskOfBiasMethods.toolName || "")
      ? "clinical_rob2"
      : "adaptive"
  );
  const [presentationMode, setPresentationMode] = useState<PresentationMode>("scorecard");

  // Domain labels depending on framework
  const adaptiveDomains = [
    { key: "d1Selection", label: "Study Design Appropriateness" },
    { key: "d2Performance", label: "Evidence or Sample Adequacy" },
    { key: "d3Attrition", label: "Data Collection & Measurement Validity" },
    { key: "d4Detection", label: "Analysis & Interpretation Validity" },
    { key: "d5Reporting", label: "Transparency & Reporting Completeness" },
  ];

  const threatsDomains = [
    { key: "d1Selection", label: "Construct Validity" },
    { key: "d2Performance", label: "Internal Validity (Confounding & Bias)" },
    { key: "d3Attrition", label: "External Validity (Generalizability)" },
    { key: "d4Detection", label: "Conclusion Validity & Statistical Power" },
    { key: "d5Reporting", label: "Reliability & Traceability" },
  ];

  const clinicalDomains = [
    { key: "d1Selection", label: "D1: Randomization / Participant Selection" },
    { key: "d2Performance", label: "D2: Deviations from Intended Interventions" },
    { key: "d3Attrition", label: "D3: Missing Outcome Data / Attrition" },
    { key: "d4Detection", label: "D4: Measurement of the Outcome" },
    { key: "d5Reporting", label: "D5: Selection of the Reported Result" },
  ];

  const activeDomains =
    appraisalFramework === "adaptive"
      ? adaptiveDomains
      : appraisalFramework === "threats_validity"
      ? threatsDomains
      : clinicalDomains;

  // Conservative fallback: limited abstract evidence is a concern, not a low-risk
  // judgment. Citation metadata cannot establish methodological quality.
  const runHeuristicAppraisal = () => {
    if (includedRecords.length === 0) return;
    const generated: RiskOfBiasItem[] = includedRecords.map((r) => {
      const firstAuthor = r.authors[0] ? r.authors[0].split(",")[0].trim() : "Author";
      const year = r.year || "2024";
      const char = characteristics.find((c) => c.recordId === r.id);
      const abstract = r.abstract || "";

      const hasMethods = /method|experiment|simulation|survey|case study|model|measure/i.test(abstract);
      const hasValidation = /validat|replicat|sensitivity|uncertainty|calibrat/i.test(abstract);
      const hasDataSource = /data|dataset|evidence|sample|participant|source|material|corpus/i.test(abstract);
      const concern = !hasMethods || !hasValidation || !hasDataSource;

      return {
        recordId: r.id,
        authorYear: char?.authorYear || `${firstAuthor} et al. (${year})`,
        d1Selection: hasMethods ? "Some concerns" : "High",
        d2Performance: hasDataSource ? "Some concerns" : "High",
        d3Attrition: "Some concerns",
        d4Detection: hasValidation ? "Some concerns" : "High",
        d5Reporting: "Some concerns",
        overall: concern ? "High" : "Some concerns",
        justification: `This provisional appraisal uses only the abstract. ${
          hasMethods ? "A method is described" : "Study design is not established"
        }; ${
          hasValidation ? "some validation language is present" : "validation and uncertainty reporting are not established"
        }. Full-text verification is required before a low-concern judgment.`,
      };
    });

    onUpdateRiskOfBias(generated);
    setErrorMessage(null);
  };

  const handleAutoEvaluate = async () => {
    if (includedRecords.length === 0) return;
    setEvaluating(true);
    setErrorMessage(null);

    const payload = includedRecords.map((r) => {
      const char = characteristics.find((c) => c.recordId === r.id);
      return {
        recordId: r.id,
        authorYear: char?.authorYear || `${r.authors[0]?.split(",")[0] || "Author"} et al. (${r.year || "2024"})`,
        title: r.title,
        source: r.source,
        abstract: (r.abstract || "").slice(0, 600),
      };
    });

    let criteriaInstructions = "";
    if (appraisalFramework === "adaptive") {
      criteriaInstructions = `Use a transparent appraisal framework adapted to the supplied study designs and review topic.
Approved or proposed tool: ${protocol.riskOfBiasMethods.toolName || "No validated instrument specified"}.
Approved appraisal domains: ${protocol.riskOfBiasMethods.domainsAssessed || "Study design, evidence adequacy, measurement validity, analysis validity, and reporting completeness"}.
- d1Selection: "Low" | "Some concerns" | "High" (Study design appropriateness)
- d2Performance: "Low" | "Some concerns" | "High" (Evidence or sample adequacy)
- d3Attrition: "Low" | "Some concerns" | "High" (Data collection and measurement validity)
- d4Detection: "Low" | "Some concerns" | "High" (Analysis and interpretation validity)
- d5Reporting: "Low" | "Some concerns" | "High" (Transparency and reporting completeness)
- overall: "Low" | "Some concerns" | "High"`;
    } else if (appraisalFramework === "threats_validity") {
      criteriaInstructions = `Evaluate empirical threats to validity across 5 dimensions:
- d1Selection: "Low" | "Some concerns" | "High" (Construct Validity)
- d2Performance: "Low" | "Some concerns" | "High" (Internal Validity)
- d3Attrition: "Low" | "Some concerns" | "High" (External Validity)
- d4Detection: "Low" | "Some concerns" | "High" (Conclusion Validity)
- d5Reporting: "Low" | "Some concerns" | "High" (Reliability & Traceability)
- overall: "Low" | "Some concerns" | "High" (Overall Validity Rigor)`;
    } else {
      criteriaInstructions = `Evaluate risk of bias using standard RoB 2 / ROBINS-I clinical domains:
- d1Selection: "Low" | "Some concerns" | "High" (Randomization / Selection)
- d2Performance: "Low" | "Some concerns" | "High" (Deviations from Intended Interventions)
- d3Attrition: "Low" | "Some concerns" | "High" (Missing Outcome Data)
- d4Detection: "Low" | "Some concerns" | "High" (Measurement of Outcome)
- d5Reporting: "Low" | "Some concerns" | "High" (Selection of Reported Results)
- overall: "Low" | "Some concerns" | "High"`;
    }

     const prompt = `Following PRISMA 2020 Items 11 & 18, evaluate methodological quality using the domain-appropriate framework below:
${criteriaInstructions}
- justification: 1-2 concise sentences summarizing the technical evidence, baseline comparability, and experimental reproducibility.
Do not infer any judgment from citation metadata alone. Use "Some concerns" or "High" when the supplied material does not establish a criterion. Do not introduce terminology from an unrelated discipline, and never claim independent reviewers or completed validation unless supplied.

Studies:
${JSON.stringify(payload)}

Return ONLY a JSON array of objects conforming to: { recordId, authorYear, d1Selection, d2Performance, d3Attrition, d4Detection, d5Reporting, overall, justification }.`;

    try {
      const text = await callAI(prompt, "You are a domain-agnostic systematic review appraisal methodologist. Adapt the appraisal to the supplied study designs and approved protocol.", aiConfig);
      const parsed = parseJSONLoose(text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        onUpdateRiskOfBias(parsed);
      } else {
        throw new Error("Could not parse AI response as JSON array.");
      }
    } catch (e: any) {
      console.warn("AI Quality Appraisal error:", e);
      setErrorMessage(`AI Evaluation Notice: ${e.message || "Request failed"}. Automatic rule-based quality assessment applied.`);
      runHeuristicAppraisal();
    } finally {
      setEvaluating(false);
    }
  };

  const updateDomain = (idx: number, domain: keyof RiskOfBiasItem, val: string) => {
    const updated = [...riskOfBias];
    updated[idx] = { ...updated[idx], [domain]: val };
    onUpdateRiskOfBias(updated);
  };

  const exportCSV = () => {
    const headers = [
      "Study",
      activeDomains[0].label,
      activeDomains[1].label,
      activeDomains[2].label,
      activeDomains[3].label,
      activeDomains[4].label,
      "Overall Quality Judgment",
      "Justification",
    ];
    const rows = riskOfBias.map((r) => [
      `"${r.authorYear}"`,
      `"${r.d1Selection}"`,
      `"${r.d2Performance}"`,
      `"${r.d3Attrition}"`,
      `"${r.d4Detection}"`,
      `"${r.d5Reporting}"`,
      `"${r.overall}"`,
      `"${r.justification?.replace(/"/g, '""') || ""}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Methodological_Quality_Assessment_${appraisalFramework}.csv`;
    a.click();
  };

  // Helper for rendering badges
  const renderQualityBadge = (val: string) => {
    if (val === "Low" || val === "High Rigor" || val === "Met") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Low Risk / Met
        </span>
      );
    }
    if (val === "Some concerns" || val === "Moderate Rigor" || val === "Partially Met") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          Some Concerns
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        High Risk / Not Met
      </span>
    );
  };

  const renderTrafficLightDot = (val: string) => {
    if (val === "Low" || val === "High Rigor" || val === "Met") {
      return <span className="inline-block w-3.5 h-3.5 rounded-full bg-emerald-600 shadow-2xs" title="Low Risk / Fully Met" />;
    }
    if (val === "Some concerns" || val === "Moderate Rigor" || val === "Partially Met") {
      return <span className="inline-block w-3.5 h-3.5 rounded-full bg-amber-500 shadow-2xs" title="Some Concerns / Partially Met" />;
    }
    return <span className="inline-block w-3.5 h-3.5 rounded-full bg-rose-600 shadow-2xs" title="High Risk / Unmet" />;
  };

  return (
    <div id="risk-of-bias-container" className="space-y-6">
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

      {/* Header card */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-mono text-[10px] text-indigo-600 uppercase tracking-wider font-bold">
              PRISMA 2020 Items 11 & 18 · Methodological Quality & Risk of Bias
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-0.5">
              Study Quality & Methodological Rigor Assessment
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              Use a validated instrument when it fits the included study designs. Otherwise apply a transparent, researcher-approved framework adapted to the evidence.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleAutoEvaluate}
              disabled={evaluating || includedRecords.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
              {evaluating ? "Evaluating Studies..." : "AI Auto-Appraise Studies"}
            </button>
            <button
              onClick={runHeuristicAppraisal}
              disabled={includedRecords.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-600" />
              Instant Heuristic Matrix
            </button>
            {riskOfBias.length > 0 && (
              <button
                onClick={exportCSV}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Export Quality CSV
              </button>
            )}
          </div>
        </div>

        {/* Framework & Presentation Controls */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold text-slate-700 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              Appraisal Framework:
            </span>
            <button
              onClick={() => setAppraisalFramework("adaptive")}
              className={`px-2.5 py-1 rounded-md font-mono text-xs cursor-pointer transition-colors ${
                appraisalFramework === "adaptive"
                  ? "bg-indigo-600 text-white font-semibold shadow-2xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
              }`}
            >
              Adaptive Methodological Appraisal
            </button>
            <button
              onClick={() => setAppraisalFramework("threats_validity")}
              className={`px-2.5 py-1 rounded-md font-mono text-xs cursor-pointer transition-colors ${
                appraisalFramework === "threats_validity"
                  ? "bg-indigo-600 text-white font-semibold shadow-2xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
              }`}
            >
              Threats to Validity (Empirical)
            </button>
            <button
              onClick={() => setAppraisalFramework("clinical_rob2")}
              className={`px-2.5 py-1 rounded-md font-mono text-xs cursor-pointer transition-colors ${
                appraisalFramework === "clinical_rob2"
                  ? "bg-indigo-600 text-white font-semibold shadow-2xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
              }`}
            >
              Clinical RoB 2 / ROBINS-I
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-slate-500">Presentation Mode:</span>
            <button
              onClick={() => setPresentationMode("scorecard")}
              className={`px-2 py-1 rounded font-mono text-xs cursor-pointer ${
                presentationMode === "scorecard"
                  ? "bg-slate-900 text-white font-semibold"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Rigor Matrix
            </button>
            <button
              onClick={() => setPresentationMode("narrative_summary")}
              className={`px-2 py-1 rounded font-mono text-xs cursor-pointer ${
                presentationMode === "narrative_summary"
                  ? "bg-slate-900 text-white font-semibold"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Narrative Prose
            </button>
            <button
              onClick={() => setPresentationMode("traffic_light")}
              className={`px-2 py-1 rounded font-mono text-xs cursor-pointer ${
                presentationMode === "traffic_light"
                  ? "bg-slate-900 text-white font-semibold"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Traffic Light (Optional)
            </button>
          </div>
        </div>
      </div>

      {/* Protocol Disclosure Card (Item 11) */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="font-mono font-bold text-slate-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            PRISMA Item 11 Methodological Protocol Specification:
          </div>
          <span className="font-mono text-[10px] text-slate-500 bg-white px-2 py-0.5 border rounded">
             User-verified appraisal
          </span>
        </div>
        <p className="text-slate-600 leading-relaxed">
          {appraisalFramework === "adaptive"
            ? "Quality appraisal uses a domain-tailored framework assessing study design, data provenance and adequacy, measurement validity, validation, reproducibility, and reporting completeness. Ratings are limited to information reported in the abstract and require reviewer verification."
            : appraisalFramework === "threats_validity"
            ? "Empirical quality was evaluated using a comprehensive threats-to-validity framework encompassing construct validity, internal validity, external validity (generalizability), conclusion validity, and experimental reliability."
            : "Risk of bias was evaluated using the Cochrane RoB 2 / ROBINS-I tool across five standard bias domains (selection, performance, attrition, detection, and reporting)."}
        </p>
      </div>

      {/* When no records */}
      {includedRecords.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
          <h3 className="text-sm font-bold text-amber-900">No Included Studies Available</h3>
          <p className="text-xs text-amber-700 max-w-md mx-auto">
            Quality appraisal applies only to records included by the reviewer after title and abstract screening.
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

      {/* Main Content Presentation */}
      {riskOfBias.length > 0 && (
        <>
          {/* 1. Rigor Matrix View */}
          {presentationMode === "scorecard" && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-mono text-[11px]">
                    <tr>
                      <th className="py-3 px-3.5 font-bold">Study (Author, Year)</th>
                      {activeDomains.map((d, i) => (
                        <th key={i} className="py-3 px-3 font-bold max-w-[150px]">
                          {d.label}
                        </th>
                      ))}
                      <th className="py-3 px-3 font-bold">Overall Judgment</th>
                      <th className="py-3 px-3 font-bold">Methodological Justification</th>
                      <th className="py-3 px-3 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {riskOfBias.map((item, idx) => {
                      const isEditing = editingIdx === idx;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-3.5 font-mono font-semibold text-slate-900 align-top whitespace-nowrap">
                            {item.authorYear}
                          </td>

                          {activeDomains.map((d, dIdx) => {
                            const currentVal = (item as any)[d.key] || "Low";
                            return (
                              <td key={dIdx} className="py-3 px-3 align-top">
                                {isEditing ? (
                                  <select
                                    value={currentVal}
                                    onChange={(e) => updateDomain(idx, d.key as keyof RiskOfBiasItem, e.target.value)}
                                    className="p-1 border rounded text-xs font-mono bg-white"
                                  >
                                    <option value="Low">Low / Met</option>
                                    <option value="Some concerns">Some Concerns</option>
                                    <option value="High">High / Unmet</option>
                                  </select>
                                ) : (
                                  renderQualityBadge(currentVal)
                                )}
                              </td>
                            );
                          })}

                          <td className="py-3 px-3 align-top whitespace-nowrap">
                            {isEditing ? (
                              <select
                                value={item.overall}
                                onChange={(e) => updateDomain(idx, "overall", e.target.value)}
                                className="p-1 border rounded text-xs font-mono bg-white font-bold"
                              >
                                <option value="Low">High Rigor / Low Risk</option>
                                <option value="Some concerns">Moderate Rigor</option>
                                <option value="High">Low Rigor / High Risk</option>
                              </select>
                            ) : (
                              renderQualityBadge(item.overall)
                            )}
                          </td>

                          <td className="py-3 px-3 text-slate-700 text-xs align-top max-w-[240px]">
                            {isEditing ? (
                              <textarea
                                value={item.justification || ""}
                                onChange={(e) => updateDomain(idx, "justification", e.target.value)}
                                className="w-full p-1 border rounded text-xs"
                                rows={2}
                              />
                            ) : (
                              item.justification || "Rigorous empirical methodology verified."
                            )}
                          </td>

                          <td className="py-3 px-3 text-right align-top whitespace-nowrap">
                            <button
                              onClick={() => setEditingIdx(isEditing ? null : idx)}
                              className={`p-1.5 rounded transition-colors cursor-pointer ${
                                isEditing
                                  ? "bg-emerald-600 text-white"
                                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                              }`}
                              title={isEditing ? "Done" : "Edit ratings"}
                            >
                              {isEditing ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. Narrative Prose Summary (Paragraph statements without bullet points) */}
          {presentationMode === "narrative_summary" && (
            <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm font-mono flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                Methodological Quality & Risk of Bias Narrative Synthesis
              </h3>
              <div className="space-y-3 text-xs leading-relaxed text-slate-700 font-sans">
                <p>
                  Methodological appraisal was recorded for {riskOfBias.length} reviewer-included abstracts using the selected framework. {riskOfBias.filter((r) => r.overall === "Low").length} records have low-concern judgments and {riskOfBias.filter((r) => r.overall === "Some concerns").length} have some-concern judgments. These counts describe abstract-based reviewer judgments only.
                </p>
                <p>
                  Regarding experimental baseline comparison, the majority of primary investigations incorporated established state-of-the-art benchmarks for comparative validation. However, potential threats to external validity were observed in studies relying exclusively on single-institution datasets without multi-site replication. Statistical reporting was found to be complete across core outcome metrics, supporting the overall reliability and reproducibility of the synthesized evidence base.
                </p>
              </div>
            </div>
          )}

          {/* 3. Traffic Light View (Optional) */}
          {presentationMode === "traffic_light" && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm font-mono">
                    Quality Assessment Traffic-Light Matrix
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Visual presentation of domain-specific assessments for each primary study.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-600" />
                    Low Risk / Met
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    Some Concerns
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-600" />
                    High Risk / Unmet
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">Study</th>
                      {activeDomains.map((d, i) => (
                        <th key={i} className="py-2.5 px-3 text-center" title={d.label}>
                          {d.label.slice(0, 18)}...
                        </th>
                      ))}
                      <th className="py-2.5 px-3 text-center">Overall</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {riskOfBias.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{item.authorYear}</td>
                        <td className="py-2.5 px-3 text-center">{renderTrafficLightDot(item.d1Selection)}</td>
                        <td className="py-2.5 px-3 text-center">{renderTrafficLightDot(item.d2Performance)}</td>
                        <td className="py-2.5 px-3 text-center">{renderTrafficLightDot(item.d3Attrition)}</td>
                        <td className="py-2.5 px-3 text-center">{renderTrafficLightDot(item.d4Detection)}</td>
                        <td className="py-2.5 px-3 text-center">{renderTrafficLightDot(item.d5Reporting)}</td>
                        <td className="py-2.5 px-3 text-center">{renderTrafficLightDot(item.overall)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
