import React, { useRef } from "react";
import { Download, Layers } from "lucide-react";

interface PrismaCounts {
  uploaded?: number;
  afterDedup?: number;
  duplicatesRemoved?: number;
  screened?: number;
  screenedExcluded?: number;
  included?: number;
  databaseBreakdown?: Record<string, number>;
}

interface PrismaDiagramProps {
  counts: PrismaCounts;
}

const countLabel = (value: number | undefined) => `(n = ${value ?? 0})`;

export default function PrismaDiagram({ counts }: PrismaDiagramProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const uploaded = counts.uploaded ?? 0;
  const afterDedup = counts.afterDedup ?? 0;
  const screened = counts.screened ?? afterDedup;
  const included = counts.included ?? 0;
  const screenedExcluded = counts.screenedExcluded ?? Math.max(0, screened - included);
  const databaseEntries = Object.entries(counts.databaseBreakdown || {}).filter(([, count]) => count > 0);
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
      canvas.width = 1400;
      canvas.height = 1080;
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

  const databaseRows: Array<[string, number]> = databaseEntries.length > 0
    ? databaseEntries
    : [["Other databases", Math.max(0, afterDedup)]];
  const databaseRowHeight = 34;
  const databaseBoxHeight = 56 + databaseRows.length * databaseRowHeight;
  const duplicateY = 110 + databaseBoxHeight + 38;
  const screeningY = duplicateY + 110;
  const excludedY = screeningY + 108;
  const inclusionY = excludedY + 108;
  const diagramHeight = inclusionY + 170;

  return (
    <div id="prisma-diagram-container" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50/70 border border-slate-200 rounded-xl">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span className="font-mono text-xs font-semibold text-slate-800 uppercase tracking-wider">
            PRISMA 2020 Statement Compliance · Item 16a
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
          <svg ref={svgRef} viewBox={`0 0 960 ${diagramHeight}`} className="w-full min-w-[720px] h-auto" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <defs>
              <marker id="prisma-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#334155" />
              </marker>
              <filter id="prisma-card-shadow" x="-3%" y="-3%" width="106%" height="110%">
                <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#0F172A" floodOpacity="0.06" />
              </filter>
            </defs>

            <rect x="0" y="0" width="960" height="54" fill="#F8FAFC" rx="6" />
            <text x="24" y="34" fontWeight="700" fontSize="20" fill="#0F172A">PRISMA 2020 Flow Diagram</text>
            <text x="760" y="32" fontFamily="JetBrains Mono" fontSize="11" fill="#4F46E5" fontWeight="600">ITEM 16a</text>

            <rect x="24" y="76" width="180" height="28" rx="4" fill="#0F172A" />
            <text x="36" y="95" fontFamily="JetBrains Mono" fontWeight="600" fontSize="11" fill="#FFFFFF" letterSpacing="0.08em">IDENTIFICATION</text>
            <rect x="24" y="110" width="912" height={databaseBoxHeight} rx="8" fill="#FFFFFF" stroke="#CBD5E1" filter="url(#prisma-card-shadow)" />
            <text x="44" y="140" fontWeight="700" fontSize="14" fill="#0F172A">Records identified</text>
            {databaseRows.map(([source, count], index) => (
              <g key={source}>
                <text x="58" y={172 + index * databaseRowHeight} fontSize="13" fill="#334155">{source}</text>
                <text x="440" y={172 + index * databaseRowHeight} fontFamily="JetBrains Mono" fontSize="13" fill="#475569">{countLabel(count)}</text>
              </g>
            ))}

            <line x1="480" y1={duplicateY - 24} x2="480" y2={duplicateY} stroke="#64748B" strokeWidth="1.5" markerEnd="url(#prisma-arrow)" />
            <rect x="184" y={duplicateY} width="592" height="70" rx="8" fill="#FFFFFF" stroke="#CBD5E1" filter="url(#prisma-card-shadow)" />
            <text x="480" y={duplicateY + 29} textAnchor="middle" fontWeight="700" fontSize="14" fill="#0F172A">Duplicate records removed</text>
            <text x="480" y={duplicateY + 52} textAnchor="middle" fontFamily="JetBrains Mono" fontSize="13" fill="#475569">{countLabel(counts.duplicatesRemoved)}</text>

            <line x1="480" y1={duplicateY + 70} x2="480" y2={screeningY} stroke="#64748B" strokeWidth="1.5" markerEnd="url(#prisma-arrow)" />
            <rect x="24" y={screeningY} width="180" height="28" rx="4" fill="#4F46E5" />
            <text x="36" y={screeningY + 19} fontFamily="JetBrains Mono" fontWeight="600" fontSize="11" fill="#FFFFFF" letterSpacing="0.08em">SCREENING</text>
            <rect x="184" y={screeningY + 38} width="592" height="70" rx="8" fill="#FFFFFF" stroke="#CBD5E1" filter="url(#prisma-card-shadow)" />
            <text x="480" y={screeningY + 67} textAnchor="middle" fontWeight="700" fontSize="14" fill="#0F172A">Records screened</text>
            <text x="480" y={screeningY + 90} textAnchor="middle" fontFamily="JetBrains Mono" fontSize="12" fill="#475569">title + abstract + metadata · {countLabel(screened)}</text>

            <line x1="480" y1={screeningY + 108} x2="480" y2={excludedY} stroke="#64748B" strokeWidth="1.5" markerEnd="url(#prisma-arrow)" />
            <rect x="184" y={excludedY} width="592" height="70" rx="8" fill="#FEF2F2" stroke="#F87171" filter="url(#prisma-card-shadow)" />
            <text x="480" y={excludedY + 29} textAnchor="middle" fontWeight="700" fontSize="14" fill="#B91C1C">Records excluded</text>
            <text x="480" y={excludedY + 52} textAnchor="middle" fontFamily="JetBrains Mono" fontSize="13" fill="#991B1B">{countLabel(screenedExcluded)}</text>

            <line x1="480" y1={excludedY + 70} x2="480" y2={inclusionY} stroke="#64748B" strokeWidth="1.5" markerEnd="url(#prisma-arrow)" />
            <rect x="24" y={inclusionY} width="150" height="28" rx="4" fill="#059669" />
            <text x="36" y={inclusionY + 19} fontFamily="JetBrains Mono" fontWeight="600" fontSize="11" fill="#FFFFFF" letterSpacing="0.08em">INCLUSION</text>
            <rect x="184" y={inclusionY + 38} width="592" height="70" rx="8" fill="#ECFDF5" stroke="#10B981" strokeWidth="1.5" filter="url(#prisma-card-shadow)" />
            <text x="480" y={inclusionY + 67} textAnchor="middle" fontWeight="700" fontSize="14" fill="#065F46">Records included</text>
            <text x="480" y={inclusionY + 90} textAnchor="middle" fontFamily="JetBrains Mono" fontSize="12" fill="#047857">title/abstract/metadata evidence base · {countLabel(included)}</text>
          </svg>
        </div>
      )}
    </div>
  );
}