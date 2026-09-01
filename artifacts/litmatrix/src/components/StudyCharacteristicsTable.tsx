import React, { useState } from "react";
import { SLRRecord, StudyCharacteristic } from "../types/slr";
import {
  Sparkles,
  Download,
  Edit3,
  Table,
  FileSpreadsheet,
  Plus,
  Trash2,
  AlertCircle,
  Zap,
  Check,
  Filter,
  SlidersHorizontal,
  Layers,
  CheckSquare,
  Square,
} from "lucide-react";
import { callAI, parseJSONLoose } from "../utils/aiClient";

interface StudyCharacteristicsTableProps {
  includedRecords: SLRRecord[];
  characteristics: StudyCharacteristic[];
  onUpdateCharacteristics: (chars: StudyCharacteristic[]) => void;
  aiConfig: any;
  onNavigateToScreening?: () => void;
}

export type TableColumnKey =
  | "category"
  | "country"
  | "sampleSize"
  | "population"
  | "interventionOrFocus"
  | "comparator"
  | "primaryOutcome"
  | "studyDesign"
  | "keyFinding";

export default function StudyCharacteristicsTable({
  includedRecords,
  characteristics,
  onUpdateCharacteristics,
  aiConfig,
  onNavigateToScreening,
}: StudyCharacteristicsTableProps) {
  const [extracting, setExtracting] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [groupByCategory, setGroupByCategory] = useState(true);

  // Column visibility state: default to standard categorized draft structure
  const [visibleColumns, setVisibleColumns] = useState<Record<TableColumnKey, boolean>>({
    category: true,
    country: false,
    sampleSize: false,
    population: false,
    interventionOrFocus: true,
    comparator: true,
    primaryOutcome: true,
    studyDesign: true,
    keyFinding: true,
  });

  const [showColumnPicker, setShowColumnPicker] = useState(false);

  // Table Schema Presets
  const applyPreset = (preset: "standard" | "extended" | "all") => {
    if (preset === "standard") {
      setVisibleColumns({
        category: true,
        country: false,
        sampleSize: false,
        population: false,
        interventionOrFocus: true,
        comparator: true,
        primaryOutcome: true,
        studyDesign: true,
        keyFinding: true,
      });
      setGroupByCategory(true);
    } else if (preset === "extended") {
      setVisibleColumns({
        category: true,
        country: true,
        sampleSize: true,
        population: true,
        interventionOrFocus: true,
        comparator: true,
        primaryOutcome: true,
        studyDesign: true,
        keyFinding: true,
      });
      setGroupByCategory(true);
    } else {
      setVisibleColumns({
        category: true,
        country: true,
        sampleSize: true,
        population: true,
        interventionOrFocus: true,
        comparator: true,
        primaryOutcome: true,
        studyDesign: true,
        keyFinding: true,
      });
    }
  };

  const toggleColumn = (key: TableColumnKey) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Heuristic rule-based fallback extractor adapted for engineering & diverse domains
  const runHeuristicExtraction = () => {
    if (includedRecords.length === 0) return;
    const generated: StudyCharacteristic[] = includedRecords.map((r, idx) => {
      const firstAuthor = r.authors[0] ? r.authors[0].split(",")[0].trim() : "Author";
      const year = r.year || "2024";
      const abstract = r.abstract || "";
      const title = r.title || "";

      // Derive category/paradigm from title/abstract
      let cat = "Machine Learning & Architectural Design";
      if (/edge|iot|embedded|hardware|fpga|sensor/i.test(title + abstract)) {
        cat = "Edge & Embedded Computing Systems";
      } else if (/cloud|distributed|microservice|cluster|kubernetes/i.test(title + abstract)) {
        cat = "Cloud & Distributed Architectures";
      } else if (/deep learning|neural|transformer|llm|vision|bert/i.test(title + abstract)) {
        cat = "Deep Learning & Generative Models";
      } else if (/security|privacy|blockchain|cryptograph|vulnerability/i.test(title + abstract)) {
        cat = "Security, Privacy & Blockchain";
      } else if (/optimization|algorithm|heuristic|scheduling/i.test(title + abstract)) {
        cat = "Optimization & Algorithmic Frameworks";
      } else if (idx % 2 === 0) {
        cat = "Predictive & Empirical Architecture";
      }

      // Regex heuristics for sample size / dataset scale (if present)
      const nMatch = abstract.match(/(?:n\s*=\s*|sample\s*of\s*|cohort\s*of\s*|dataset\s*of\s*|instances\s*=\s*)([0-9,]+)/i);
      const sampleSize = nMatch ? `N = ${nMatch[1]}` : "Standard Benchmark Dataset";

      // Metric extraction heuristic
      const metricMatch = abstract.match(/(?:AUC(?:-ROC)?|Accuracy|F1-score|latency|throughput|precision|recall|loss)\s*(?:of|=|:)?\s*([0-9.]+%?)/i);
      const primaryOutcome = metricMatch ? `${metricMatch[0]}` : "Empirical Performance Benchmark";

      return {
        recordId: r.id,
        authorYear: `${firstAuthor} et al. (${year})`,
        category: cat,
        country: "International",
        sampleSize,
        population: "Benchmark Evaluation Target",
        interventionOrFocus: title.length > 65 ? title.slice(0, 65) + "..." : title,
        comparator: "Standard Baseline Framework",
        primaryOutcome,
        studyDesign: "Empirical Experimental Evaluation",
        keyFinding: abstract.slice(0, 160) || title,
      };
    });

    onUpdateCharacteristics(generated);
    setErrorMessage(null);
  };

  const handleAutoExtract = async () => {
    if (includedRecords.length === 0) return;
    setExtracting(true);
    setErrorMessage(null);

    const payload = includedRecords.map((r) => ({
      recordId: r.id,
      title: r.title,
      authors: r.authors,
      year: r.year,
      source: r.source,
      abstract: (r.abstract || "").slice(0, 600),
    }));

    const prompt = `Following PRISMA 2020 Item 17 (Study Characteristics), extract structured domain characteristics for each included study from their abstracts.
Group or categorize studies by their primary category, architecture, or technological paradigm.

Fields to extract:
1. recordId: exact string from recordId
2. authorYear: e.g. "Chen et al. (2023)"
3. category: Main thematic/technical category (e.g. "Deep Learning Architectures", "Edge & Distributed Systems", "Optimization Algorithms")
4. country: e.g. "United States" or "Not reported"
5. sampleSize: e.g. "Benchmark dataset (100k samples)" or "N/A"
6. population: Target application area, system environment, or dataset benchmark
7. interventionOrFocus: Core proposed algorithm, framework, or technology
8. comparator: Baseline method or comparison benchmark
9. primaryOutcome: Primary evaluation outcome or metric (e.g., "Accuracy 94.2%, Latency 12ms", "AUC-ROC 0.89")
10. studyDesign: e.g. "Experimental benchmark evaluation", "Empirical case study"
11. keyFinding: Concise synthesis of the main empirical finding and outcome advantage.

Studies:
${JSON.stringify(payload)}

Return ONLY a JSON array of objects conforming to the fields above, matching each recordId.`;

    try {
      const text = await callAI(prompt, "You are a senior data extraction specialist for systematic reviews.", aiConfig);
      const parsed = parseJSONLoose(text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        onUpdateCharacteristics(parsed);
      } else {
        throw new Error("Could not parse AI response as JSON array.");
      }
    } catch (e: any) {
      console.warn("AI extraction error:", e);
      setErrorMessage(`AI Extraction Notice: ${e.message || "Request failed"}. Automatic rule-based extraction was applied as a fallback.`);
      runHeuristicExtraction();
    } finally {
      setExtracting(false);
    }
  };

  const handleUpdateRow = (idx: number, field: keyof StudyCharacteristic, val: string) => {
    const updated = [...characteristics];
    updated[idx] = { ...updated[idx], [field]: val };
    onUpdateCharacteristics(updated);
  };

  const handleAddRow = () => {
    const newRow: StudyCharacteristic = {
      recordId: `custom-${Date.now()}`,
      authorYear: "New Author (2024)",
      category: "Methodological Architecture",
      country: "Not reported",
      sampleSize: "N/A",
      population: "Target Application Benchmark",
      interventionOrFocus: "Proposed Framework / Technique",
      comparator: "Standard Baseline",
      primaryOutcome: "Primary Evaluation Metric",
      studyDesign: "Empirical Evaluation",
      keyFinding: "Key technical finding summary",
    };
    onUpdateCharacteristics([...characteristics, newRow]);
  };

  const handleDeleteRow = (idx: number) => {
    const updated = characteristics.filter((_, i) => i !== idx);
    onUpdateCharacteristics(updated);
  };

  const exportCSV = () => {
    const cols = (Object.keys(visibleColumns) as TableColumnKey[]).filter((k) => visibleColumns[k]);
    const headers = ["Study (Author, Year)", ...cols.map((k) => {
      if (k === "category") return "Category / Theme";
      if (k === "country") return "Country";
      if (k === "sampleSize") return "Sample / Dataset Size";
      if (k === "population") return "Domain / Target Population";
      if (k === "interventionOrFocus") return "Intervention / Technology";
      if (k === "comparator") return "Comparator / Baseline";
      if (k === "primaryOutcome") return "Primary Outcome Metric";
      if (k === "studyDesign") return "Study Design / Evaluation Type";
      if (k === "keyFinding") return "Key Finding";
      return k;
    })];

    const rows = characteristics.map((c) => {
      const rowVals = [
        `"${c.authorYear}"`,
        ...cols.map((k) => `"${(c[k] || "")?.replace(/"/g, '""')}"`),
      ];
      return rowVals.join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "Table1_Study_Characteristics.csv";
    a.click();
  };

  // Grouping logic for Table 1
  const categoriesMap = new Map<string, { characteristic: StudyCharacteristic; originalIdx: number }[]>();
  characteristics.forEach((c, idx) => {
    const cat = c.category || "General Empirical Studies";
    if (!categoriesMap.has(cat)) {
      categoriesMap.set(cat, []);
    }
    categoriesMap.get(cat)!.push({ characteristic: c, originalIdx: idx });
  });

  const columnLabels: Record<TableColumnKey, string> = {
    category: "Category / Paradigm",
    country: "Country",
    sampleSize: "Sample / Dataset Size",
    population: "Domain / Population",
    interventionOrFocus: "Intervention / Technology",
    comparator: "Comparator / Baseline",
    primaryOutcome: "Primary Outcome Metric",
    studyDesign: "Study Design",
    keyFinding: "Key Finding",
  };

  return (
    <div id="study-characteristics-container" className="space-y-6">
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
              Study Characteristics · Table 1
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-0.5">
              Characteristics of Included Studies Matrix
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Construct Table 1 tailored to your review domain. Group by categories or paradigms, and customize or drop inapplicable columns such as country or sample size.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleAutoExtract}
              disabled={extracting || includedRecords.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
              {extracting ? "Extracting Data..." : "AI Auto-Extract Characteristics"}
            </button>
            <button
              onClick={runHeuristicExtraction}
              disabled={includedRecords.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-600" />
              Instant Heuristic Matrix
            </button>
            <button
              onClick={handleAddRow}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Row
            </button>
            {characteristics.length > 0 && (
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

        {/* Controls Toolbar: Presets, Grouping Toggle, and Column Picker */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold text-slate-600 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
              Table Schema Presets:
            </span>
            <button
              onClick={() => applyPreset("standard")}
              className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-md font-mono font-medium cursor-pointer"
              title="Standard draft structure: Category, Technology, Benchmark, Metric, Design & Findings"
            >
              Draft Structure
            </button>
            <button
              onClick={() => applyPreset("extended")}
              className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 rounded-md font-mono cursor-pointer"
              title="Includes dataset sample and geographical attributes"
            >
              Extended Details
            </button>
            <button
              onClick={() => applyPreset("all")}
              className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 rounded-md font-mono cursor-pointer"
            >
              All Columns
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setGroupByCategory(!groupByCategory)}
              className={`flex items-center gap-1.5 px-3 py-1 font-mono rounded-md border transition-colors cursor-pointer ${
                groupByCategory
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              {groupByCategory ? "Categorized Grouping: ON" : "Categorized Grouping: OFF"}
            </button>

            <button
              onClick={() => setShowColumnPicker(!showColumnPicker)}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md font-mono border border-slate-200 cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5 text-indigo-600" />
              Customize Columns ({Object.values(visibleColumns).filter(Boolean).length})
            </button>
          </div>
        </div>

        {/* Expandable Column Picker Dropdown */}
        {showColumnPicker && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="font-mono text-xs font-bold text-slate-700">
              Select Visible Columns for Table 1:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {(Object.keys(columnLabels) as TableColumnKey[]).map((key) => {
                const isChecked = visibleColumns[key];
                return (
                  <button
                    key={key}
                    onClick={() => toggleColumn(key)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-mono transition-all text-left cursor-pointer ${
                      isChecked
                        ? "bg-white border-indigo-300 text-indigo-950 font-semibold shadow-2xs"
                        : "bg-slate-100/70 border-slate-200 text-slate-400 hover:bg-slate-100"
                    }`}
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className="truncate">{columnLabels[key]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* When no included records are found */}
      {includedRecords.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
          <h3 className="text-sm font-bold text-amber-900">No Studies Currently Marked as Included</h3>
          <p className="text-xs text-amber-700 max-w-md mx-auto">
            Table 1 populates from studies included during Title/Abstract Screening.
          </p>
          {onNavigateToScreening && (
            <button
              onClick={onNavigateToScreening}
              className="px-4 py-2 text-xs font-mono font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors cursor-pointer"
            >
              Go to Title/Abstract Screening Stage
            </button>
          )}
        </div>
      )}

      {/* Table Container */}
      {characteristics.length === 0 && includedRecords.length > 0 ? (
        <div className="bg-white border border-slate-200 p-12 text-center rounded-xl space-y-4 shadow-xs">
          <Table className="w-10 h-10 text-slate-300 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800">Characteristics Table Not Yet Populated</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              You have {includedRecords.length} included studies ready for extraction. Click below to populate Table 1.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleAutoExtract}
              disabled={extracting}
              className="px-4 py-2 text-xs font-mono font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer"
            >
              {extracting ? "Extracting..." : "Auto-Extract with AI"}
            </button>
            <button
              onClick={runHeuristicExtraction}
              className="px-4 py-2 text-xs font-mono font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Instant Heuristic Populate
            </button>
          </div>
        </div>
      ) : characteristics.length > 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-3.5 font-bold">Study (Author, Year)</th>
                  {visibleColumns.category && !groupByCategory && (
                    <th className="py-3 px-3 font-bold">Category / Paradigm</th>
                  )}
                  {visibleColumns.country && <th className="py-3 px-3 font-bold">Country</th>}
                  {visibleColumns.sampleSize && <th className="py-3 px-3 font-bold">Sample / Dataset</th>}
                  {visibleColumns.population && <th className="py-3 px-3 font-bold">Target Domain / Population</th>}
                  {visibleColumns.interventionOrFocus && (
                    <th className="py-3 px-3 font-bold">Intervention / Technology</th>
                  )}
                  {visibleColumns.comparator && <th className="py-3 px-3 font-bold">Comparator / Baseline</th>}
                  {visibleColumns.primaryOutcome && <th className="py-3 px-3 font-bold">Primary Outcome / Metric</th>}
                  {visibleColumns.studyDesign && <th className="py-3 px-3 font-bold">Study Design</th>}
                  {visibleColumns.keyFinding && <th className="py-3 px-3 font-bold">Key Finding</th>}
                  <th className="py-3 px-3 font-bold text-right">Actions</th>
                </tr>
              </thead>

              {/* Categorized Grouping Mode */}
              {groupByCategory ? (
                Array.from(categoriesMap.entries()).map(([categoryTitle, groupItems], gIdx) => (
                  <tbody key={gIdx} className="divide-y divide-slate-100 border-b border-slate-200">
                    {/* Category Header Row */}
                    <tr className="bg-indigo-50/70">
                      <td
                        colSpan={
                          1 +
                          Object.values(visibleColumns).filter(Boolean).length -
                          (visibleColumns.category ? 1 : 0) +
                          1
                        }
                        className="py-2.5 px-4 font-mono font-bold text-indigo-950 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-600" />
                            Category {gIdx + 1}: {categoryTitle}
                          </span>
                          <span className="text-[10px] font-normal bg-white border border-indigo-200 px-2 py-0.5 rounded-full text-indigo-800">
                            {groupItems.length} {groupItems.length === 1 ? "study" : "studies"}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Studies in this category */}
                    {groupItems.map(({ characteristic: c, originalIdx: idx }) => {
                      const isEditing = editingIndex === idx;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-3.5 font-mono font-semibold text-slate-900 align-top">
                            {isEditing ? (
                              <input
                                type="text"
                                value={c.authorYear}
                                onChange={(e) => handleUpdateRow(idx, "authorYear", e.target.value)}
                                className="w-full p-1 border rounded text-xs font-mono"
                              />
                            ) : (
                              c.authorYear
                            )}
                          </td>

                          {visibleColumns.country && (
                            <td className="py-3 px-3 text-slate-700 align-top">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={c.country || ""}
                                  onChange={(e) => handleUpdateRow(idx, "country", e.target.value)}
                                  className="w-full p-1 border rounded text-xs"
                                />
                              ) : (
                                c.country || "Not reported"
                              )}
                            </td>
                          )}

                          {visibleColumns.sampleSize && (
                            <td className="py-3 px-3 font-mono text-slate-700 align-top">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={c.sampleSize || ""}
                                  onChange={(e) => handleUpdateRow(idx, "sampleSize", e.target.value)}
                                  className="w-full p-1 border rounded text-xs font-mono"
                                />
                              ) : (
                                c.sampleSize || "N/A"
                              )}
                            </td>
                          )}

                          {visibleColumns.population && (
                            <td className="py-3 px-3 text-slate-700 align-top max-w-[160px]">
                              {isEditing ? (
                                <textarea
                                  value={c.population || ""}
                                  onChange={(e) => handleUpdateRow(idx, "population", e.target.value)}
                                  className="w-full p-1 border rounded text-xs"
                                  rows={2}
                                />
                              ) : (
                                c.population || "-"
                              )}
                            </td>
                          )}

                          {visibleColumns.interventionOrFocus && (
                            <td className="py-3 px-3 font-mono font-semibold text-indigo-700 align-top max-w-[180px]">
                              {isEditing ? (
                                <textarea
                                  value={c.interventionOrFocus}
                                  onChange={(e) => handleUpdateRow(idx, "interventionOrFocus", e.target.value)}
                                  className="w-full p-1 border rounded text-xs font-mono"
                                  rows={2}
                                />
                              ) : (
                                c.interventionOrFocus
                              )}
                            </td>
                          )}

                          {visibleColumns.comparator && (
                            <td className="py-3 px-3 text-slate-600 align-top max-w-[140px]">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={c.comparator || ""}
                                  onChange={(e) => handleUpdateRow(idx, "comparator", e.target.value)}
                                  className="w-full p-1 border rounded text-xs"
                                />
                              ) : (
                                c.comparator || "-"
                              )}
                            </td>
                          )}

                          {visibleColumns.primaryOutcome && (
                            <td className="py-3 px-3 font-mono font-bold text-emerald-800 align-top max-w-[160px]">
                              {isEditing ? (
                                <textarea
                                  value={c.primaryOutcome}
                                  onChange={(e) => handleUpdateRow(idx, "primaryOutcome", e.target.value)}
                                  className="w-full p-1 border rounded text-xs font-mono"
                                  rows={2}
                                />
                              ) : (
                                c.primaryOutcome
                              )}
                            </td>
                          )}

                          {visibleColumns.studyDesign && (
                            <td className="py-3 px-3 text-slate-600 align-top">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={c.studyDesign || ""}
                                  onChange={(e) => handleUpdateRow(idx, "studyDesign", e.target.value)}
                                  className="w-full p-1 border rounded text-xs"
                                />
                              ) : (
                                c.studyDesign || "Empirical Study"
                              )}
                            </td>
                          )}

                          {visibleColumns.keyFinding && (
                            <td className="py-3 px-3 text-slate-700 italic align-top max-w-[200px]">
                              {isEditing ? (
                                <textarea
                                  value={c.keyFinding}
                                  onChange={(e) => handleUpdateRow(idx, "keyFinding", e.target.value)}
                                  className="w-full p-1 border rounded text-xs"
                                  rows={2}
                                />
                              ) : (
                                `"${c.keyFinding}"`
                              )}
                            </td>
                          )}

                          <td className="py-3 px-3 text-right align-top whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setEditingIndex(isEditing ? null : idx)}
                                className={`p-1.5 rounded transition-colors cursor-pointer ${
                                  isEditing
                                    ? "bg-emerald-600 text-white"
                                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                                }`}
                                title={isEditing ? "Done" : "Edit row"}
                              >
                                {isEditing ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => handleDeleteRow(idx)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                title="Delete row"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                ))
              ) : (
                /* Flat Mode */
                <tbody className="divide-y divide-slate-100">
                  {characteristics.map((c, idx) => {
                    const isEditing = editingIndex === idx;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-3.5 font-mono font-semibold text-slate-900 align-top">
                          {isEditing ? (
                            <input
                              type="text"
                              value={c.authorYear}
                              onChange={(e) => handleUpdateRow(idx, "authorYear", e.target.value)}
                              className="w-full p-1 border rounded text-xs font-mono"
                            />
                          ) : (
                            c.authorYear
                          )}
                        </td>

                        {visibleColumns.category && (
                          <td className="py-3 px-3 font-mono text-xs text-indigo-900 align-top">
                            {isEditing ? (
                              <input
                                type="text"
                                value={c.category || ""}
                                onChange={(e) => handleUpdateRow(idx, "category", e.target.value)}
                                className="w-full p-1 border rounded text-xs font-mono"
                              />
                            ) : (
                              c.category || "General Empirical"
                            )}
                          </td>
                        )}

                        {visibleColumns.country && (
                          <td className="py-3 px-3 text-slate-700 align-top">
                            {isEditing ? (
                              <input
                                type="text"
                                value={c.country || ""}
                                onChange={(e) => handleUpdateRow(idx, "country", e.target.value)}
                                className="w-full p-1 border rounded text-xs"
                              />
                            ) : (
                              c.country || "Not reported"
                            )}
                          </td>
                        )}

                        {visibleColumns.sampleSize && (
                          <td className="py-3 px-3 font-mono text-slate-700 align-top">
                            {isEditing ? (
                              <input
                                type="text"
                                value={c.sampleSize || ""}
                                onChange={(e) => handleUpdateRow(idx, "sampleSize", e.target.value)}
                                className="w-full p-1 border rounded text-xs font-mono"
                              />
                            ) : (
                              c.sampleSize || "N/A"
                            )}
                          </td>
                        )}

                        {visibleColumns.population && (
                          <td className="py-3 px-3 text-slate-700 align-top max-w-[160px]">
                            {isEditing ? (
                              <textarea
                                value={c.population || ""}
                                onChange={(e) => handleUpdateRow(idx, "population", e.target.value)}
                                className="w-full p-1 border rounded text-xs"
                                rows={2}
                              />
                            ) : (
                              c.population || "-"
                            )}
                          </td>
                        )}

                        {visibleColumns.interventionOrFocus && (
                          <td className="py-3 px-3 font-mono font-semibold text-indigo-700 align-top max-w-[180px]">
                            {isEditing ? (
                              <textarea
                                value={c.interventionOrFocus}
                                onChange={(e) => handleUpdateRow(idx, "interventionOrFocus", e.target.value)}
                                className="w-full p-1 border rounded text-xs font-mono"
                                rows={2}
                              />
                            ) : (
                              c.interventionOrFocus
                            )}
                          </td>
                        )}

                        {visibleColumns.comparator && (
                          <td className="py-3 px-3 text-slate-600 align-top max-w-[140px]">
                            {isEditing ? (
                              <input
                                type="text"
                                value={c.comparator || ""}
                                onChange={(e) => handleUpdateRow(idx, "comparator", e.target.value)}
                                className="w-full p-1 border rounded text-xs"
                              />
                            ) : (
                              c.comparator || "-"
                            )}
                          </td>
                        )}

                        {visibleColumns.primaryOutcome && (
                          <td className="py-3 px-3 font-mono font-bold text-emerald-800 align-top max-w-[160px]">
                            {isEditing ? (
                              <textarea
                                value={c.primaryOutcome}
                                onChange={(e) => handleUpdateRow(idx, "primaryOutcome", e.target.value)}
                                className="w-full p-1 border rounded text-xs font-mono"
                                rows={2}
                              />
                            ) : (
                              c.primaryOutcome
                            )}
                          </td>
                        )}

                        {visibleColumns.studyDesign && (
                          <td className="py-3 px-3 text-slate-600 align-top">
                            {isEditing ? (
                              <input
                                type="text"
                                value={c.studyDesign || ""}
                                onChange={(e) => handleUpdateRow(idx, "studyDesign", e.target.value)}
                                className="w-full p-1 border rounded text-xs"
                              />
                            ) : (
                              c.studyDesign || "Empirical Study"
                            )}
                          </td>
                        )}

                        {visibleColumns.keyFinding && (
                          <td className="py-3 px-3 text-slate-700 italic align-top max-w-[200px]">
                            {isEditing ? (
                              <textarea
                                value={c.keyFinding}
                                onChange={(e) => handleUpdateRow(idx, "keyFinding", e.target.value)}
                                className="w-full p-1 border rounded text-xs"
                                rows={2}
                              />
                            ) : (
                              `"${c.keyFinding}"`
                            )}
                          </td>
                        )}

                        <td className="py-3 px-3 text-right align-top whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setEditingIndex(isEditing ? null : idx)}
                              className={`p-1.5 rounded transition-colors cursor-pointer ${
                                isEditing
                                  ? "bg-emerald-600 text-white"
                                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                              }`}
                              title={isEditing ? "Done" : "Edit row"}
                            >
                              {isEditing ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => handleDeleteRow(idx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Delete row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              )}
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
