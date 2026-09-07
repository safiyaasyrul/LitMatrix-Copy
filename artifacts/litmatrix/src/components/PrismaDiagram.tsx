import React, { useRef } from "react";
import { Download, Layers } from "lucide-react";

interface PrismaCounts {
  uploaded?: number;
  afterDedup?: number;
  identifiedDb?: number;
  identifiedOther?: number;
  duplicatesRemoved?: number;
  screened?: number;
  screenedExcluded?: number;
  soughtRetrieval?: number;
  notRetrieved?: number;
  assessed?: number;
  assessedExcluded?: number;
  exclusionReasonsBreakdown?: Record<string, number>;
  included?: number;
  fullTextAssessmentRecorded?: boolean;
}

interface PrismaDiagramProps {
  counts: PrismaCounts;
}

const countLabel = (value: number | undefined, tracked = true) =>
  tracked ? `(n = ${value ?? 0})` : "Not recorded";

export default function PrismaDiagram({ counts }: PrismaDiagramProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const uploaded = counts.uploaded ?? counts.identifiedDb ?? 0;
  const afterDedup = counts.afterDedup ?? counts.screened ?? 0;
  const screened = counts.screened ?? afterDedup;
  const included = counts.included ?? 0;
  const screenedExcluded = counts.screenedExcluded ?? Math.max(0, screened - included);
  const identifiedOther = counts.identifiedOther ?? 0;
  const fullTextTracked = counts.fullTextAssessmentRecorded === true;
  const exclusionEntries = Object.entries(counts.exclusionReasonsBreakdown || {});
  const exclusionSummary = exclusionEntries.length > 0
    ? exclusionEntries.slice(0, 2).map(([reason, count]) => `${reason}: n = ${count}`).join(" · ")
    : "Screening exclusions";
  const hasRecords = uploaded > 0 || afterDedup > 0 || screened > 0 || included > 0;

  const downloadSVG = () => {
    if (!svgRef.current) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svgRef.current)], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "PRISMA_2020_Flow_Diagram.svg";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const downloadPNG = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const image = new Image();
    const url = URL.createObjectURL(new Blob([svgData], { type: "image/svg+xml;charset=utf-8" }));
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1600;
      canvas.height = 920;
      const context = canvas.getContext("2d");
      if (context) {
        context.fillStyle = "#FFFFFF";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const anchor = document.createElement("a");
        anchor.href = canvas.toDataURL("image/png");
        anchor.download = "PRISMA_2020_Flow_Diagram.png";
        anchor.click();
      }
      URL.revokeObjectURL(url);
    };
    image.src = url;
  };

  return (
    <div id="prisma-diagram-container" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50/70 border border-slate-200 rounded-xl">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span className="font-mono text-xs font-semibold text-slate-800 uppercase tracking-wider">
            PRISMA 2020 Statement Compliance · Item 16a Flow Diagram
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={downloadSVG} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer">
            <Download className="w-3.5 h-3.5" /> Download SVG
          </button>
          <button onClick={downloadPNG} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer">
            <Download className="w-3.5 h-3.5" /> Export PNG
          </button>
        </div>
      </div>

      {!hasRecords ? (
        <div className="border border-amber-200 bg-amber-50 p-6 rounded-xl text-center">
          <p className="font-mono text-sm font-semibold text-amber-900">PRISMA counts will appear after records are imported.</p>
          <p className="text-xs text-amber-800 mt-1">No zero-count flow is presented before the review library has data.</p>
        </div>
      ) : (
        <div className="border border-slate-200 bg-white p-4 sm:p-6 rounded-xl shadow-xs overflow-x-auto">
          <svg ref={svgRef} viewBox="0 0 960 790" className="w-full min-w-[780px] h-auto" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <defs>
              <marker id="prisma-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#334155" />
              </marker>
              <filter id="prisma-card-shadow" x="-3%" y="-3%" width="106%" height="110%">
                <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#0F172A" floodOpacity="0.06" />
              </filter>
            </defs>
            <rect x="0" y="0" width="960" height="42" fill="#F8FAFC" rx="6" />
            <text x="24" y="27" fontWeight="700" fontSize="18" fill="#0F172A">PRISMA 2020 Flow Diagram for Systematic Reviews</text>
            <text x="760" y="26" fontFamily="JetBrains Mono" fontSize="11" fill="#4F46E5" fontWeight="600">ITEM 16a</text>

            <rect x="20" y="60" width="150" height="26" rx="4" fill="#0F172A" />
            <text x="28" y="77" fontFamily="JetBrains Mono" fontWeight="600" fontSize="11" fill="#FFFFFF">IDENTIFICATION</text>
            <rect x="20" y="96" width="370" height="66" rx="8" fill="#FFFFFF" stroke="#CBD5E1" filter="url(#prisma-card-shadow)" />
            <text x="34" y="121" fontWeight="600" fontSize="13" fill="#0F172A">Records identified from databases</text>
            <text x="34" y="144" fontFamily="JetBrains Mono" fontSize="12" fill="#475569">{countLabel(uploaded)}</text>
            <rect x="420" y="96" width="370" height="66" rx="8" fill="#FFFFFF" stroke="#CBD5E1" filter="url(#prisma-card-shadow)" />
            <text x="434" y="121" fontWeight="600" fontSize="13" fill="#0F172A">Records from other sources</text>
            <text x="434" y="144" fontFamily="JetBrains Mono" fontSize="12" fill="#475569">{countLabel(identifiedOther)}</text>
            <line x1="205" y1="162" x2="205" y2="198" stroke="#64748B" strokeWidth="1.4" markerEnd="url(#prisma-arrow)" />
            <line x1="605" y1="162" x2="300" y2="198" stroke="#64748B" strokeWidth="1.4" markerEnd="url(#prisma-arrow)" />

            <rect x="20" y="198" width="110" height="26" rx="4" fill="#4F46E5" />
            <text x="29" y="216" fontFamily="JetBrains Mono" fontWeight="600" fontSize="11" fill="#FFFFFF">SCREENING</text>
            <rect x="20" y="236" width="370" height="66" rx="8" fill="#FFFFFF" stroke="#CBD5E1" filter="url(#prisma-card-shadow)" />
            <text x="34" y="261" fontWeight="600" fontSize="13" fill="#0F172A">Records after duplicates removed</text>
            <text x="34" y="284" fontFamily="JetBrains Mono" fontSize="12" fill="#475569">{countLabel(afterDedup)} · Removed: {counts.duplicatesRemoved ?? 0}</text>
            <line x1="205" y1="302" x2="205" y2="338" stroke="#64748B" strokeWidth="1.4" markerEnd="url(#prisma-arrow)" />
            <rect x="20" y="338" width="370" height="66" rx="8" fill="#FFFFFF" stroke="#CBD5E1" filter="url(#prisma-card-shadow)" />
            <text x="34" y="363" fontWeight="600" fontSize="13" fill="#0F172A">Records screened</text>
            <text x="34" y="386" fontFamily="JetBrains Mono" fontSize="12" fill="#475569">{countLabel(screened)}</text>
            <line x1="390" y1="371" x2="450" y2="371" stroke="#64748B" strokeWidth="1.4" markerEnd="url(#prisma-arrow)" />
            <rect x="450" y="338" width="440" height="66" rx="8" fill="#FEF2F2" stroke="#F87171" filter="url(#prisma-card-shadow)" />
            <text x="464" y="363" fontWeight="600" fontSize="13" fill="#B91C1C">Records excluded at screening</text>
            <text x="464" y="386" fontFamily="JetBrains Mono" fontSize="11" fill="#991B1B">{countLabel(screenedExcluded)} · {exclusionSummary}</text>

            <rect x="20" y="440" width="160" height="26" rx="4" fill="#4F46E5" />
            <text x="29" y="458" fontFamily="JetBrains Mono" fontWeight="600" fontSize="11" fill="#FFFFFF">ELIGIBILITY</text>
            <line x1="205" y1="404" x2="205" y2="480" stroke="#64748B" strokeWidth="1.4" markerEnd="url(#prisma-arrow)" />
            <rect x="20" y="480" width="370" height="66" rx="8" fill="#FFFFFF" stroke="#CBD5E1" filter="url(#prisma-card-shadow)" />
            <text x="34" y="505" fontWeight="600" fontSize="13" fill="#0F172A">Reports sought for retrieval</text>
            <text x="34" y="528" fontFamily="JetBrains Mono" fontSize="12" fill="#475569">{countLabel(counts.soughtRetrieval, fullTextTracked)}</text>
            <line x1="390" y1="513" x2="450" y2="513" stroke="#64748B" strokeWidth="1.4" markerEnd="url(#prisma-arrow)" />
            <rect x="450" y="480" width="440" height="66" rx="8" fill="#FEF2F2" stroke="#F87171" filter="url(#prisma-card-shadow)" />
            <text x="464" y="505" fontWeight="600" fontSize="13" fill="#B91C1C">Reports not retrieved</text>
            <text x="464" y="528" fontFamily="JetBrains Mono" fontSize="12" fill="#991B1B">{countLabel(counts.notRetrieved, fullTextTracked)}</text>
            <line x1="205" y1="546" x2="205" y2="580" stroke="#64748B" strokeWidth="1.4" markerEnd="url(#prisma-arrow)" />
            <rect x="20" y="580" width="370" height="66" rx="8" fill="#FFFFFF" stroke="#CBD5E1" filter="url(#prisma-card-shadow)" />
            <text x="34" y="605" fontWeight="600" fontSize="13" fill="#0F172A">Reports assessed for eligibility</text>
            <text x="34" y="628" fontFamily="JetBrains Mono" fontSize="12" fill="#475569">{countLabel(counts.assessed, fullTextTracked)}</text>
            <line x1="390" y1="613" x2="450" y2="613" stroke="#64748B" strokeWidth="1.4" markerEnd="url(#prisma-arrow)" />
            <rect x="450" y="580" width="440" height="66" rx="8" fill="#FEF2F2" stroke="#F87171" filter="url(#prisma-card-shadow)" />
            <text x="464" y="605" fontWeight="600" fontSize="13" fill="#B91C1C">Reports excluded after eligibility assessment</text>
            <text x="464" y="628" fontFamily="JetBrains Mono" fontSize="12" fill="#991B1B">{countLabel(counts.assessedExcluded, fullTextTracked)}</text>

            <line x1="205" y1="646" x2="205" y2="680" stroke="#64748B" strokeWidth="1.4" markerEnd="url(#prisma-arrow)" />
            <rect x="20" y="680" width="160" height="26" rx="4" fill="#059669" />
            <text x="30" y="698" fontFamily="JetBrains Mono" fontWeight="600" fontSize="11" fill="#FFFFFF">INCLUDED</text>
            <rect x="20" y="720" width="370" height="48" rx="8" fill="#ECFDF5" stroke="#10B981" strokeWidth="1.5" filter="url(#prisma-card-shadow)" />
            <text x="34" y="750" fontWeight="700" fontSize="14" fill="#065F46">Records included in review and synthesis: {countLabel(included)} </text>
          </svg>
          {!fullTextTracked && (
            <p className="text-[11px] text-slate-500 mt-3">Full-text retrieval and eligibility fields are shown as “Not recorded” because this workflow tracks imported-record screening, not full-text assessment.</p>
          )}
        </div>
      )}
    </div>
  );
}