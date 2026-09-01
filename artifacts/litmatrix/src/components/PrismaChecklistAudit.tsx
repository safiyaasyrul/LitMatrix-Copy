import React, { useState } from "react";
import { PrismaChecklistItem, PrismaSChecklistItem, RosesChecklistItem } from "../types/slr";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  ExternalLink,
  Filter,
  FileSpreadsheet,
  FileText,
  Check,
  Layers,
  Search,
  BookOpen,
  Compass,
  Leaf,
  ShieldCheck,
  Info,
} from "lucide-react";

interface PrismaChecklistAuditProps {
  checklist: PrismaChecklistItem[];
  onUpdateItem: (itemNumber: string, updates: Partial<PrismaChecklistItem>) => void;
  prismaSChecklist: PrismaSChecklistItem[];
  onUpdatePrismaSItem: (itemNumber: string, updates: Partial<PrismaSChecklistItem>) => void;
  rosesChecklist: RosesChecklistItem[];
  onUpdateRosesItem: (itemNumber: string, updates: Partial<RosesChecklistItem>) => void;
  onNavigateStage?: (stageIndex: number) => void;
}

type ChecklistLayer = "PRISMA_2020" | "PRISMA_S" | "ROSES";

export default function PrismaChecklistAudit({
  checklist,
  onUpdateItem,
  prismaSChecklist,
  onUpdatePrismaSItem,
  rosesChecklist,
  onUpdateRosesItem,
  onNavigateStage,
}: PrismaChecklistAuditProps) {
  const [activeLayer, setActiveLayer] = useState<ChecklistLayer>("PRISMA_2020");
  const [sectionFilter, setSectionFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [copied, setCopied] = useState(false);

  // Statistics for PRISMA 2020
  const prismaReported = checklist.filter((c) => c.status === "Reported").length;
  const prismaPartial = checklist.filter((c) => c.status === "Partially reported").length;
  const prismaNotReported = checklist.filter((c) => c.status === "Not reported").length;
  const prismaTotal = checklist.filter((c) => c.status !== "Not applicable").length;
  const prismaScore = Math.round((prismaReported / (prismaTotal || 1)) * 100);

  // Statistics for PRISMA-S
  const prismaSReported = prismaSChecklist.filter((c) => c.status === "Reported").length;
  const prismaSPartial = prismaSChecklist.filter((c) => c.status === "Partially reported").length;
  const prismaSNotReported = prismaSChecklist.filter((c) => c.status === "Not reported").length;
  const prismaSTotal = prismaSChecklist.filter((c) => c.status !== "Not applicable").length;
  const prismaSScore = Math.round((prismaSReported / (prismaSTotal || 1)) * 100);

  // Statistics for ROSES
  const rosesReported = rosesChecklist.filter((c) => c.status === "Reported").length;
  const rosesPartial = rosesChecklist.filter((c) => c.status === "Partially reported").length;
  const rosesNotReported = rosesChecklist.filter((c) => c.status === "Not reported").length;
  const rosesTotal = rosesChecklist.filter((c) => c.status !== "Not applicable").length;
  const rosesScore = Math.round((rosesReported / (rosesTotal || 1)) * 100);

  // Filtered PRISMA 2020 items
  const filteredPrisma = checklist.filter((item) => {
    if (sectionFilter !== "ALL" && item.section !== sectionFilter) return false;
    if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        item.itemNumber.toLowerCase().includes(q) ||
        item.topic.toLowerCase().includes(q) ||
        item.checklistDescription.toLowerCase().includes(q) ||
        item.locationInReview.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filtered PRISMA-S items
  const filteredPrismaS = prismaSChecklist.filter((item) => {
    if (sectionFilter !== "ALL" && item.domain !== sectionFilter) return false;
    if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        item.itemNumber.toLowerCase().includes(q) ||
        item.topic.toLowerCase().includes(q) ||
        item.checklistDescription.toLowerCase().includes(q) ||
        item.locationInReview.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filtered ROSES items
  const filteredRoses = rosesChecklist.filter((item) => {
    if (sectionFilter !== "ALL" && item.section !== sectionFilter) return false;
    if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        item.itemNumber.toLowerCase().includes(q) ||
        item.topic.toLowerCase().includes(q) ||
        item.checklistDescription.toLowerCase().includes(q) ||
        item.rosesEmphasis.toLowerCase().includes(q) ||
        item.locationInReview.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStageIndex = (mapping: string): number => {
    if (mapping.includes("Stage 01")) return 0;
    if (mapping.includes("Stage 02")) return 1;
    if (mapping.includes("Stage 03")) return 2;
    if (mapping.includes("Stage 04")) return 3;
    if (mapping.includes("Stage 05")) return 4;
    if (mapping.includes("Stage 06")) return 5;
    if (mapping.includes("Stage 07")) return 6;
    if (mapping.includes("Stage 08")) return 7;
    if (mapping.includes("Stage 09")) return 8;
    if (mapping.includes("Stage 10")) return 9;
    if (mapping.includes("Stage 11")) return 10;
    return 11;
  };

  const exportMarkdown = () => {
    let md = "";
    if (activeLayer === "PRISMA_2020") {
      md = "# PRISMA 2020 Checklist Compliance Audit\n\n";
      md += `**Overall Compliance:** ${prismaScore}% (${prismaReported}/${prismaTotal} Items Reported)\n\n`;
      md += "| Section | Item # | Topic | PRISMA 2020 Checklist Item | Location in Manuscript | Status | Notes |\n";
      md += "| --- | --- | --- | --- | --- | --- | --- |\n";
      checklist.forEach((item) => {
        md += `| ${item.section} | ${item.itemNumber} | ${item.topic} | ${item.checklistDescription.replace(/\|/g, "/")} | ${item.locationInReview.replace(/\|/g, "/")} | ${item.status} | ${item.userNotes.replace(/\|/g, "/")} |\n`;
      });
    } else if (activeLayer === "PRISMA_S") {
      md = "# PRISMA-S (Literature Search Reporting) Checklist Compliance Audit\n\n";
      md += `**Search Compliance:** ${prismaSScore}% (${prismaSReported}/${prismaSTotal} Items Reported)\n\n`;
      md += "| Domain | Item # | Topic | PRISMA-S Item Description | Location in Search Strategy | Status | Notes |\n";
      md += "| --- | --- | --- | --- | --- | --- | --- |\n";
      prismaSChecklist.forEach((item) => {
        md += `| ${item.domain} | ${item.itemNumber} | ${item.topic} | ${item.checklistDescription.replace(/\|/g, "/")} | ${item.locationInReview.replace(/\|/g, "/")} | ${item.status} | ${item.userNotes.replace(/\|/g, "/")} |\n`;
      });
    } else {
      md = "# ROSES (Environmental & Sustainability Syntheses) Checklist Audit\n\n";
      md += `**ROSES Compliance:** ${rosesScore}% (${rosesReported}/${rosesTotal} Items Reported)\n\n`;
      md += "| Section | Item # | Topic | ROSES Item Description | Emphasis | Location in Manuscript | Status | Notes |\n";
      md += "| --- | --- | --- | --- | --- | --- | --- | --- |\n";
      rosesChecklist.forEach((item) => {
        md += `| ${item.section} | ${item.itemNumber} | ${item.topic} | ${item.checklistDescription.replace(/\|/g, "/")} | ${item.rosesEmphasis} | ${item.locationInReview.replace(/\|/g, "/")} | ${item.status} | ${item.userNotes.replace(/\|/g, "/")} |\n`;
      });
    }

    const blob = new Blob([md], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${activeLayer}_Checklist_Report.md`;
    a.click();
  };

  const exportCSV = () => {
    let csvContent = "";
    if (activeLayer === "PRISMA_2020") {
      const headers = ["Section", "Item Number", "Topic", "Checklist Description", "Location in Manuscript", "Status", "User Notes"];
      const rows = checklist.map((i) => [
        `"${i.section}"`,
        `"${i.itemNumber}"`,
        `"${i.topic}"`,
        `"${i.checklistDescription.replace(/"/g, '""')}"`,
        `"${i.locationInReview.replace(/"/g, '""')}"`,
        `"${i.status}"`,
        `"${i.userNotes.replace(/"/g, '""')}"`,
      ]);
      csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    } else if (activeLayer === "PRISMA_S") {
      const headers = ["Domain", "Item Number", "Topic", "PRISMA-S Description", "Location in Search Strategy", "Status", "User Notes"];
      const rows = prismaSChecklist.map((i) => [
        `"${i.domain}"`,
        `"${i.itemNumber}"`,
        `"${i.topic}"`,
        `"${i.checklistDescription.replace(/"/g, '""')}"`,
        `"${i.locationInReview.replace(/"/g, '""')}"`,
        `"${i.status}"`,
        `"${i.userNotes.replace(/"/g, '""')}"`,
      ]);
      csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    } else {
      const headers = ["Section", "Item Number", "Topic", "ROSES Description", "Emphasis", "Location in Manuscript", "Status", "User Notes"];
      const rows = rosesChecklist.map((i) => [
        `"${i.section}"`,
        `"${i.itemNumber}"`,
        `"${i.topic}"`,
        `"${i.checklistDescription.replace(/"/g, '""')}"`,
        `"${i.rosesEmphasis.replace(/"/g, '""')}"`,
        `"${i.locationInReview.replace(/"/g, '""')}"`,
        `"${i.status}"`,
        `"${i.userNotes.replace(/"/g, '""')}"`,
      ]);
      csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${activeLayer}_Checklist_Table.csv`;
    a.click();
  };

  const copyChecklist = () => {
    let text = "";
    if (activeLayer === "PRISMA_2020") {
      text = "PRISMA 2020 Checklist Audit Summary (27 Items)\n\n";
      checklist.forEach((c) => {
        text += `[Item ${c.itemNumber}] ${c.topic} (${c.section}): ${c.status}\n`;
        text += `Description: ${c.checklistDescription}\n`;
        text += `Location: ${c.locationInReview} | Notes: ${c.userNotes}\n\n`;
      });
    } else if (activeLayer === "PRISMA_S") {
      text = "PRISMA-S Literature Search Audit Summary (16 Items)\n\n";
      prismaSChecklist.forEach((c) => {
        text += `[Item ${c.itemNumber}] ${c.topic} (${c.domain}): ${c.status}\n`;
        text += `Description: ${c.checklistDescription}\n`;
        text += `Location: ${c.locationInReview} | Notes: ${c.userNotes}\n\n`;
      });
    } else {
      text = "ROSES Environmental & Sustainability Synthesis Audit Summary\n\n";
      rosesChecklist.forEach((c) => {
        text += `[Item ${c.itemNumber}] ${c.topic} (${c.section}) [Emphasis: ${c.rosesEmphasis}]: ${c.status}\n`;
        text += `Description: ${c.checklistDescription}\n`;
        text += `Location: ${c.locationInReview} | Notes: ${c.userNotes}\n\n`;
      });
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="prisma-checklist-audit-container" className="space-y-6">
      {/* 3-Layer Conceptual Framework Banner */}
      <div className="bg-indigo-950 text-white p-5 rounded-2xl shadow-sm border border-indigo-800">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[11px] font-semibold border border-indigo-400/30">
              <Layers className="w-3.5 h-3.5" />
              Layered Systematic Review Reporting Framework
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Layered Reporting Standards Audit Suite
            </h2>
            <p className="text-xs text-indigo-200 leading-relaxed">
              Systematic evidence syntheses utilize specialized reporting layers depending on scope and discipline:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2">
              <div className="bg-indigo-900/60 border border-indigo-700/50 p-2.5 rounded-xl">
                <div className="font-mono text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  PRISMA 2020 (27 Items)
                </div>
                <div className="text-[11px] text-indigo-200 mt-0.5">
                  How to report the <strong>entire review</strong> across 7 manuscript sections.
                </div>
              </div>
              <div className="bg-indigo-900/60 border border-indigo-700/50 p-2.5 rounded-xl">
                <div className="font-mono text-[11px] font-bold text-sky-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  PRISMA-S (16 Items)
                </div>
                <div className="text-[11px] text-indigo-200 mt-0.5">
                  How to report the <strong>literature search</strong> & reproducibility across 4 domains.
                </div>
              </div>
              <div className="bg-indigo-900/60 border border-indigo-700/50 p-2.5 rounded-xl">
                <div className="font-mono text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  ROSES (16 Items)
                </div>
                <div className="text-[11px] text-indigo-200 mt-0.5">
                  How to report <strong>environmental & sustainability</strong> syntheses and policy evidence.
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <div className="text-right">
              <span className="font-mono text-[10px] uppercase text-indigo-300 font-bold">Active Layer Compliance</span>
              <div className="text-2xl font-bold font-mono text-white mt-0.5">
                {activeLayer === "PRISMA_2020" ? `${prismaScore}%` : activeLayer === "PRISMA_S" ? `${prismaSScore}%` : `${rosesScore}%`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Layer Selection Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          onClick={() => {
            setActiveLayer("PRISMA_2020");
            setSectionFilter("ALL");
          }}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            activeLayer === "PRISMA_2020"
              ? "bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs"
              : "bg-slate-50 border-slate-200 hover:bg-white text-slate-700"
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                Layer 1: Entire Review
              </span>
              <span className="font-mono text-xs font-bold text-indigo-600">{prismaScore}%</span>
            </div>
            <div className="font-bold text-slate-900 mt-2 text-sm">PRISMA 2020 (27 Items)</div>
            <p className="text-xs text-slate-500 mt-1">
              Main 27-item reporting checklist organized across 7 manuscript sections.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>{prismaReported}/{prismaTotal} Reported</span>
            <span className="text-emerald-600 font-medium">Items 1–27</span>
          </div>
        </button>

        <button
          onClick={() => {
            setActiveLayer("PRISMA_S");
            setSectionFilter("ALL");
          }}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            activeLayer === "PRISMA_S"
              ? "bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs"
              : "bg-slate-50 border-slate-200 hover:bg-white text-slate-700"
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">
                Layer 2: Search Reporting
              </span>
              <span className="font-mono text-xs font-bold text-indigo-600">{prismaSScore}%</span>
            </div>
            <div className="font-bold text-slate-900 mt-2 text-sm">PRISMA-S (16 Items)</div>
            <p className="text-xs text-slate-500 mt-1">
              Literature search reporting across 4 domains (Sources, Methods, Records, Reproducibility).
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>{prismaSReported}/{prismaSTotal} Reported</span>
            <span className="text-sky-600 font-medium">4 Search Domains</span>
          </div>
        </button>

        <button
          onClick={() => {
            setActiveLayer("ROSES");
            setSectionFilter("ALL");
          }}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            activeLayer === "ROSES"
              ? "bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs"
              : "bg-slate-50 border-slate-200 hover:bg-white text-slate-700"
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                Layer 3: Environmental Syntheses
              </span>
              <span className="font-mono text-xs font-bold text-indigo-600">{rosesScore}%</span>
            </div>
            <div className="font-bold text-slate-900 mt-2 text-sm">ROSES Guidelines</div>
            <p className="text-xs text-slate-500 mt-1">
              Reporting standards for environmental management, sustainability & policy evidence.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>{rosesReported}/{rosesTotal} Reported</span>
            <span className="text-emerald-600 font-medium">Environmental Context</span>
          </div>
        </button>
      </div>

      {/* Layer Details & Export Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] text-indigo-600 uppercase tracking-wider font-bold">
              {activeLayer === "PRISMA_2020"
                ? "PRISMA 2020 27-Item Statement Verification"
                : activeLayer === "PRISMA_S"
                ? "PRISMA-S 16-Item Search Audit"
                : "ROSES Environmental & Sustainability Synthesis Standard"}
            </div>
            <h3 className="text-xl font-bold text-slate-900 mt-1">
              {activeLayer === "PRISMA_2020" && "PRISMA 2020 Checklist Audit (Full Review)"}
              {activeLayer === "PRISMA_S" && "PRISMA-S Literature Search Audit (Search Strings & Sources)"}
              {activeLayer === "ROSES" && "ROSES Checklist Audit (Environmental & Policy Synthesis)"}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              {activeLayer === "PRISMA_2020" &&
                "27 items organized into 7 sections: Title (1), Abstract (2), Introduction (3–4), Methods (5–15), Results (16–22), Discussion (23a–d), Other Information (24–27)."}
              {activeLayer === "PRISMA_S" &&
                "16 items organized across 4 domains: Information Sources (1–6), Search Methods (7–10), Managing Records (13–15), and Reproducibility (11–12, 16)."}
              {activeLayer === "ROSES" &&
                "Specific reporting standards emphasizing Environmental context, Policy relevance, Stakeholder implications, Evidence mapping, and Quality appraisal across diverse study designs."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <button
              onClick={exportMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              Export Markdown
            </button>
            <button
              onClick={copyChecklist}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy Summary"}
            </button>
          </div>
        </div>

        {/* Progress Bar for Active Layer */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-900">
                {activeLayer === "PRISMA_2020" ? prismaScore : activeLayer === "PRISMA_S" ? prismaSScore : rosesScore}% Compliance Score
              </span>
              <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                {activeLayer === "PRISMA_2020" ? prismaReported : activeLayer === "PRISMA_S" ? prismaSReported : rosesReported} Reported
              </span>
              {(activeLayer === "PRISMA_2020" ? prismaPartial : activeLayer === "PRISMA_S" ? prismaSPartial : rosesPartial) > 0 && (
                <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                  {activeLayer === "PRISMA_2020" ? prismaPartial : activeLayer === "PRISMA_S" ? prismaSPartial : rosesPartial} Partial
                </span>
              )}
              {(activeLayer === "PRISMA_2020" ? prismaNotReported : activeLayer === "PRISMA_S" ? prismaSNotReported : rosesNotReported) > 0 && (
                <span className="text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                  {activeLayer === "PRISMA_2020" ? prismaNotReported : activeLayer === "PRISMA_S" ? prismaSNotReported : rosesNotReported} Missing
                </span>
              )}
            </div>
            <span className="text-slate-500">
              {activeLayer === "PRISMA_2020" ? `${prismaReported} / ${prismaTotal}` : activeLayer === "PRISMA_S" ? `${prismaSReported} / ${prismaSTotal}` : `${rosesReported} / ${rosesTotal}`} items
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
            <div
              style={{
                width: `${
                  activeLayer === "PRISMA_2020"
                    ? (prismaReported / prismaTotal) * 100
                    : activeLayer === "PRISMA_S"
                    ? (prismaSReported / prismaSTotal) * 100
                    : (rosesReported / rosesTotal) * 100
                }%`,
              }}
              className="bg-emerald-600 h-full transition-all"
              title="Reported"
            />
            <div
              style={{
                width: `${
                  activeLayer === "PRISMA_2020"
                    ? (prismaPartial / prismaTotal) * 100
                    : activeLayer === "PRISMA_S"
                    ? (prismaSPartial / prismaSTotal) * 100
                    : (rosesPartial / rosesTotal) * 100
                }%`,
              }}
              className="bg-amber-500 h-full transition-all"
              title="Partially reported"
            />
            <div
              style={{
                width: `${
                  activeLayer === "PRISMA_2020"
                    ? (prismaNotReported / prismaTotal) * 100
                    : activeLayer === "PRISMA_S"
                    ? (prismaSNotReported / prismaSTotal) * 100
                    : (rosesNotReported / rosesTotal) * 100
                }%`,
              }}
              className="bg-rose-500 h-full transition-all"
              title="Not reported"
            />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-indigo-600 mr-1" />
            <span className="text-xs font-mono font-semibold text-slate-700 mr-1">
              {activeLayer === "PRISMA_S" ? "Domain:" : "Section:"}
            </span>

            {activeLayer === "PRISMA_2020" && (
              <>
                {["ALL", "METHODS", "RESULTS", "DISCUSSION", "INTRODUCTION", "TITLE", "ABSTRACT", "OTHER"].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setSectionFilter(sec)}
                    className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
                      sectionFilter === sec
                        ? "bg-slate-900 text-white font-semibold shadow-2xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
                    }`}
                  >
                    {sec === "METHODS"
                      ? "Methods (5-15)"
                      : sec === "RESULTS"
                      ? "Results (16-22)"
                      : sec === "DISCUSSION"
                      ? "Discussion (23)"
                      : sec === "OTHER"
                      ? "Other (24-27)"
                      : sec}
                  </button>
                ))}
              </>
            )}

            {activeLayer === "PRISMA_S" && (
              <>
                {["ALL", "INFORMATION_SOURCES", "SEARCH_METHODS", "MANAGING_RECORDS", "REPRODUCIBILITY"].map((dom) => (
                  <button
                    key={dom}
                    onClick={() => setSectionFilter(dom)}
                    className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
                      sectionFilter === dom
                        ? "bg-slate-900 text-white font-semibold shadow-2xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
                    }`}
                  >
                    {dom === "INFORMATION_SOURCES"
                      ? "Sources (1-6)"
                      : dom === "SEARCH_METHODS"
                      ? "Methods (7-10)"
                      : dom === "MANAGING_RECORDS"
                      ? "Records (13-15)"
                      : dom === "REPRODUCIBILITY"
                      ? "Reproducibility (11-12, 16)"
                      : dom}
                  </button>
                ))}
              </>
            )}

            {activeLayer === "ROSES" && (
              <>
                {["ALL", "TITLE", "ABSTRACT", "INTRODUCTION", "METHODS", "RESULTS", "DISCUSSION", "FUNDING"].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setSectionFilter(sec)}
                    className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
                      sectionFilter === sec
                        ? "bg-slate-900 text-white font-semibold shadow-2xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
                    }`}
                  >
                    {sec}
                  </button>
                ))}
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-slate-700">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-mono py-1 px-2 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="Reported">Reported</option>
              <option value="Partially reported">Partially reported</option>
              <option value="Not reported">Not reported</option>
              <option value="Not applicable">Not applicable</option>
            </select>
          </div>
        </div>

        <div>
          <input
            type="text"
            placeholder={
              activeLayer === "PRISMA_2020"
                ? "Search PRISMA 2020 items by number, keyword, or description (e.g. '13a', 'risk of bias', 'eligibility')..."
                : activeLayer === "PRISMA_S"
                ? "Search PRISMA-S items by keyword, source, or method (e.g. 'controlled vocabulary', 'deduplication', 'PRESS')..."
                : "Search ROSES items by keyword or emphasis (e.g. 'evidence mapping', 'policy relevance', 'critical appraisal')..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs font-mono p-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Layer 1: PRISMA 2020 Table */}
      {activeLayer === "PRISMA_2020" && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs font-sans">
              <thead>
                <tr className="bg-slate-900 text-slate-200 font-mono text-[11px]">
                  <th className="py-3 px-3 w-16">Item #</th>
                  <th className="py-3 px-3 w-28">Section</th>
                  <th className="py-3 px-3 w-48">Topic</th>
                  <th className="py-3 px-4 min-w-[280px]">PRISMA 2020 Checklist Description</th>
                  <th className="py-3 px-3 w-48">Location in Manuscript</th>
                  <th className="py-3 px-3 w-36">Status</th>
                  <th className="py-3 px-3 w-44">User Notes & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPrisma.map((item) => (
                  <tr key={item.itemNumber} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 text-xs">
                      #{item.itemNumber}
                    </td>
                    <td className="py-3 px-3 font-mono text-[10px]">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold">
                        {item.section}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {item.topic}
                    </td>
                    <td className="py-3 px-4 text-slate-600 leading-relaxed">
                      {item.checklistDescription}
                      <div className="mt-1.5 text-[11px] font-mono text-indigo-600 flex items-center gap-1">
                        <span>Mapped Stage:</span>
                        <button
                          onClick={() => onNavigateStage && onNavigateStage(getStageIndex(item.appStageMapping))}
                          className="hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          {item.appStageMapping}
                          <ExternalLink className="w-2.5 h-2.5 inline" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        value={item.locationInReview}
                        onChange={(e) => onUpdateItem(item.itemNumber, { locationInReview: e.target.value })}
                        className="w-full text-xs font-mono p-1.5 border border-slate-200 rounded bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="e.g. Methods 2.3"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={item.status}
                        onChange={(e) => onUpdateItem(item.itemNumber, { status: e.target.value as any })}
                        className={`w-full text-xs font-mono py-1 px-2 rounded-lg border font-semibold cursor-pointer ${
                          item.status === "Reported"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                            : item.status === "Partially reported"
                            ? "bg-amber-50 text-amber-800 border-amber-300"
                            : item.status === "Not reported"
                            ? "bg-rose-50 text-rose-800 border-rose-300"
                            : "bg-slate-100 text-slate-600 border-slate-300"
                        }`}
                      >
                        <option value="Reported">Reported</option>
                        <option value="Partially reported">Partially reported</option>
                        <option value="Not reported">Not reported</option>
                        <option value="Not applicable">Not applicable</option>
                      </select>
                    </td>
                    <td className="py-3 px-3 space-y-1.5">
                      <input
                        type="text"
                        value={item.userNotes}
                        onChange={(e) => onUpdateItem(item.itemNumber, { userNotes: e.target.value })}
                        className="w-full text-[11px] font-sans p-1.5 border border-slate-200 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="Audit notes..."
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Layer 2: PRISMA-S Table */}
      {activeLayer === "PRISMA_S" && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs font-sans">
              <thead>
                <tr className="bg-slate-900 text-slate-200 font-mono text-[11px]">
                  <th className="py-3 px-3 w-16">Item #</th>
                  <th className="py-3 px-3 w-36">Domain</th>
                  <th className="py-3 px-3 w-48">Topic</th>
                  <th className="py-3 px-4 min-w-[280px]">PRISMA-S Search Checklist Description</th>
                  <th className="py-3 px-3 w-48">Location in Search Strategy</th>
                  <th className="py-3 px-3 w-36">Status</th>
                  <th className="py-3 px-3 w-44">Audit Notes & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPrismaS.map((item) => (
                  <tr key={item.itemNumber} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 text-xs">
                      #{item.itemNumber}
                    </td>
                    <td className="py-3 px-3 font-mono text-[10px]">
                      <span className="px-2 py-0.5 bg-sky-50 text-sky-800 rounded font-semibold border border-sky-200">
                        {item.domain.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {item.topic}
                    </td>
                    <td className="py-3 px-4 text-slate-600 leading-relaxed">
                      {item.checklistDescription}
                      <div className="mt-1.5 text-[11px] font-mono text-sky-700 flex items-center gap-1">
                        <span>Workbench Stage:</span>
                        <button
                          onClick={() => onNavigateStage && onNavigateStage(getStageIndex(item.appStageMapping))}
                          className="hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          {item.appStageMapping}
                          <ExternalLink className="w-2.5 h-2.5 inline" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        value={item.locationInReview}
                        onChange={(e) => onUpdatePrismaSItem(item.itemNumber, { locationInReview: e.target.value })}
                        className="w-full text-xs font-mono p-1.5 border border-slate-200 rounded bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="e.g. Methods 2.3 & Appx"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={item.status}
                        onChange={(e) => onUpdatePrismaSItem(item.itemNumber, { status: e.target.value as any })}
                        className={`w-full text-xs font-mono py-1 px-2 rounded-lg border font-semibold cursor-pointer ${
                          item.status === "Reported"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                            : item.status === "Partially reported"
                            ? "bg-amber-50 text-amber-800 border-amber-300"
                            : item.status === "Not reported"
                            ? "bg-rose-50 text-rose-800 border-rose-300"
                            : "bg-slate-100 text-slate-600 border-slate-300"
                        }`}
                      >
                        <option value="Reported">Reported</option>
                        <option value="Partially reported">Partially reported</option>
                        <option value="Not reported">Not reported</option>
                        <option value="Not applicable">Not applicable</option>
                      </select>
                    </td>
                    <td className="py-3 px-3 space-y-1.5">
                      <input
                        type="text"
                        value={item.userNotes}
                        onChange={(e) => onUpdatePrismaSItem(item.itemNumber, { userNotes: e.target.value })}
                        className="w-full text-[11px] font-sans p-1.5 border border-slate-200 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="Search audit notes..."
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Layer 3: ROSES Table */}
      {activeLayer === "ROSES" && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs font-sans">
              <thead>
                <tr className="bg-slate-900 text-slate-200 font-mono text-[11px]">
                  <th className="py-3 px-3 w-16">Item #</th>
                  <th className="py-3 px-3 w-28">Section</th>
                  <th className="py-3 px-3 w-44">Topic</th>
                  <th className="py-3 px-4 min-w-[260px]">ROSES Reporting Standard Description</th>
                  <th className="py-3 px-3 w-40">ROSES Key Emphasis</th>
                  <th className="py-3 px-3 w-40">Location in Review</th>
                  <th className="py-3 px-3 w-36">Status</th>
                  <th className="py-3 px-3 w-40">Audit Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRoses.map((item) => (
                  <tr key={item.itemNumber} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 text-xs">
                      #{item.itemNumber}
                    </td>
                    <td className="py-3 px-3 font-mono text-[10px]">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-semibold border border-emerald-200">
                        {item.section}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {item.topic}
                    </td>
                    <td className="py-3 px-4 text-slate-600 leading-relaxed">
                      {item.checklistDescription}
                      <div className="mt-1.5 text-[11px] font-mono text-emerald-700 flex items-center gap-1">
                        <span>Workbench Stage:</span>
                        <button
                          onClick={() => onNavigateStage && onNavigateStage(getStageIndex(item.appStageMapping))}
                          className="hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          {item.appStageMapping}
                          <ExternalLink className="w-2.5 h-2.5 inline" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-1 bg-emerald-50 text-emerald-900 font-mono text-[10px] rounded border border-emerald-200 font-semibold">
                        {item.rosesEmphasis}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        value={item.locationInReview}
                        onChange={(e) => onUpdateRosesItem(item.itemNumber, { locationInReview: e.target.value })}
                        className="w-full text-xs font-mono p-1.5 border border-slate-200 rounded bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="e.g. Methods 2.7"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={item.status}
                        onChange={(e) => onUpdateRosesItem(item.itemNumber, { status: e.target.value as any })}
                        className={`w-full text-xs font-mono py-1 px-2 rounded-lg border font-semibold cursor-pointer ${
                          item.status === "Reported"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                            : item.status === "Partially reported"
                            ? "bg-amber-50 text-amber-800 border-amber-300"
                            : item.status === "Not reported"
                            ? "bg-rose-50 text-rose-800 border-rose-300"
                            : "bg-slate-100 text-slate-600 border-slate-300"
                        }`}
                      >
                        <option value="Reported">Reported</option>
                        <option value="Partially reported">Partially reported</option>
                        <option value="Not reported">Not reported</option>
                        <option value="Not applicable">Not applicable</option>
                      </select>
                    </td>
                    <td className="py-3 px-3 space-y-1.5">
                      <input
                        type="text"
                        value={item.userNotes}
                        onChange={(e) => onUpdateRosesItem(item.itemNumber, { userNotes: e.target.value })}
                        className="w-full text-[11px] font-sans p-1.5 border border-slate-200 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="ROSES notes..."
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
