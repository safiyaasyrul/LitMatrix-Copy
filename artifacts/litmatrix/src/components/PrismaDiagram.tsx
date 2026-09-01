import React, { useRef } from "react";
import { Download, RefreshCw, Layers } from "lucide-react";

interface PrismaCounts {
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
}

interface PrismaDiagramProps {
  counts: PrismaCounts;
  onUpdateCounts?: (counts: PrismaCounts) => void;
}

export default function PrismaDiagram({ counts }: PrismaDiagramProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const {
    identifiedDb = 0,
    identifiedOther = 0,
    duplicatesRemoved = 0,
    screened = 0,
    screenedExcluded = 0,
    soughtRetrieval = 0,
    notRetrieved = 0,
    assessed = 0,
    assessedExcluded = 0,
    exclusionReasonsBreakdown = {},
    included = 0,
  } = counts;

  const downloadSVG = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "PRISMA_2020_Flow_Diagram.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPNG = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement("canvas");
    canvas.width = 1900;
    canvas.height = 1350;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.crossOrigin = "anonymous";
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pngUrl = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = "PRISMA_2020_Flow_Diagram.png";
        a.click();
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const exclusionLines = Object.entries(exclusionReasonsBreakdown).length > 0
    ? Object.entries(exclusionReasonsBreakdown).map(([r, c]) => `• ${r}: n = ${c}`)
    : ["• Scope / Ineligible: n = " + assessedExcluded];

  return (
    <div id="prisma-diagram-container" className="space-y-4">
      {/* Top action header */}
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
          <button
            id="download-prisma-svg-btn"
            onClick={downloadSVG}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download SVG
          </button>
          <button
            id="download-prisma-png-btn"
            onClick={downloadPNG}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export High-Res PNG
          </button>
        </div>
      </div>

      {/* SVG Diagram Canvas */}
      <div className="border border-slate-200 bg-white p-4 sm:p-6 rounded-xl shadow-xs overflow-x-auto">
        <svg
          ref={svgRef}
          viewBox="0 0 960 680"
          className="w-full min-w-[780px] h-auto"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          <defs>
            <marker id="prisma-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#334155" />
            </marker>
            <filter id="card-shadow" x="-3%" y="-3%" width="106%" height="110%">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#0F172A" floodOpacity="0.06" />
            </filter>
          </defs>

          {/* Background header banner */}
          <rect x="0" y="0" width="960" height="42" fill="#F8FAFC" rx="6" />
          <text x="24" y="27" fontFamily="Plus Jakarta Sans" fontWeight="700" fontSize="18" fill="#0F172A">
            PRISMA 2020 Flow Diagram for Systematic Reviews
          </text>
          <text x="740" y="26" fontFamily="JetBrains Mono" fontSize="11" fill="#4F46E5" fontWeight="600">
            PRISMA 2020 ITEM 16a
          </text>

          {/* Phase 1: IDENTIFICATION */}
          <g>
            <rect x="20" y="58" width="130" height="26" rx="4" fill="#0F172A" />
            <text x="28" y="75" fontFamily="JetBrains Mono" fontWeight="600" fontSize="11" fill="#FFFFFF" letterSpacing="0.08em">
              IDENTIFICATION
            </text>

            {/* Box 1a: Databases */}
            <rect x="20" y="94" width="290" height="68" rx="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" filter="url(#card-shadow)" />
            <text x="32" y="116" fontFamily="Plus Jakarta Sans" fontWeight="600" fontSize="12" fill="#0F172A">
              Records identified from databases:
            </text>
            <text x="32" y="134" fontFamily="JetBrains Mono" fontSize="11" fill="#475569">
              Scopus, WoS, PubMed (n = {identifiedDb})
            </text>

            {/* Box 1b: Other sources */}
            <rect x="330" y="94" width="280" height="68" rx="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" filter="url(#card-shadow)" />
            <text x="342" y="116" fontFamily="Plus Jakarta Sans" fontWeight="600" fontSize="12" fill="#0F172A">
              Records from other sources:
            </text>
            <text x="342" y="134" fontFamily="JetBrains Mono" fontSize="11" fill="#475569">
              Registers, Scholar, citations (n = {identifiedOther})
            </text>

            {/* Arrow connecting to deduplication */}
            <line x1="165" y1="162" x2="165" y2="195" stroke="#64748B" strokeWidth="1.3" markerEnd="url(#prisma-arrow)" />
            <line x1="470" y1="162" x2="250" y2="195" stroke="#64748B" strokeWidth="1.3" markerEnd="url(#prisma-arrow)" />
          </g>

          {/* Phase 2: SCREENING & DEDUPLICATION */}
          <g>
            <rect x="20" y="198" width="110" height="24" rx="4" fill="#4F46E5" />
            <text x="28" y="214" fontFamily="JetBrains Mono" fontWeight="600" fontSize="11" fill="#FFFFFF" letterSpacing="0.08em">
              SCREENING
            </text>

            {/* Deduplicated records */}
            <rect x="20" y="230" width="340" height="60" rx="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" filter="url(#card-shadow)" />
            <text x="32" y="252" fontFamily="Plus Jakarta Sans" fontWeight="600" fontSize="12" fill="#0F172A">
              Records after duplicates removed:
            </text>
            <text x="32" y="270" fontFamily="JetBrains Mono" fontSize="11" fill="#475569">
              (n = {screened}) · Duplicates removed (n = {duplicatesRemoved})
            </text>

            {/* Arrow down to title/abstract screening */}
            <line x1="190" y1="290" x2="190" y2="320" stroke="#64748B" strokeWidth="1.3" markerEnd="url(#prisma-arrow)" />

            {/* Title / abstract screened */}
            <rect x="20" y="320" width="340" height="58" rx="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" filter="url(#card-shadow)" />
            <text x="32" y="342" fontFamily="Plus Jakarta Sans" fontWeight="600" fontSize="12" fill="#0F172A">
              Records screened (title & abstract):
            </text>
            <text x="32" y="360" fontFamily="JetBrains Mono" fontSize="11" fill="#475569">
              (n = {screened})
            </text>

            {/* Arrow right to excluded records */}
            <line x1="360" y1="349" x2="440" y2="349" stroke="#64748B" strokeWidth="1.3" markerEnd="url(#prisma-arrow)" />

            {/* Excluded records box */}
            <rect x="440" y="320" width="310" height="58" rx="8" fill="#FEF2F2" stroke="#F87171" strokeWidth="1.2" filter="url(#card-shadow)" />
            <text x="452" y="342" fontFamily="Plus Jakarta Sans" fontWeight="600" fontSize="12" fill="#B91C1C">
              Records excluded (Title/Abstract):
            </text>
            <text x="452" y="360" fontFamily="JetBrains Mono" fontSize="11" fill="#991B1B">
              (n = {screenedExcluded}) · Irrelevant topic / non-matching
            </text>
          </g>

          {/* Phase 3: ELIGIBILITY & FULL-TEXT */}
          <g>
            {/* Arrow down to retrieval */}
            <line x1="190" y1="378" x2="190" y2="410" stroke="#64748B" strokeWidth="1.3" markerEnd="url(#prisma-arrow)" />

            <rect x="20" y="405" width="110" height="24" rx="4" fill="#4F46E5" />
            <text x="28" y="421" fontFamily="JetBrains Mono" fontWeight="600" fontSize="11" fill="#FFFFFF" letterSpacing="0.08em">
              ELIGIBILITY
            </text>

            {/* Reports sought for retrieval */}
            <rect x="20" y="436" width="340" height="56" rx="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" filter="url(#card-shadow)" />
            <text x="32" y="458" fontFamily="Plus Jakarta Sans" fontWeight="600" fontSize="12" fill="#0F172A">
              Reports sought for retrieval:
            </text>
            <text x="32" y="476" fontFamily="JetBrains Mono" fontSize="11" fill="#475569">
              (n = {soughtRetrieval})
            </text>

            {/* Arrow right to not retrieved */}
            <line x1="360" y1="464" x2="440" y2="464" stroke="#64748B" strokeWidth="1.3" markerEnd="url(#prisma-arrow)" />
            <rect x="440" y="436" width="310" height="56" rx="8" fill="#FEF2F2" stroke="#F87171" strokeWidth="1.2" filter="url(#card-shadow)" />
            <text x="452" y="458" fontFamily="Plus Jakarta Sans" fontWeight="600" fontSize="12" fill="#B91C1C">
              Reports not retrieved:
            </text>
            <text x="452" y="476" fontFamily="JetBrains Mono" fontSize="11" fill="#991B1B">
              (n = {notRetrieved}) · Paywalled or unobtainable
            </text>

            {/* Arrow down to assessed full-text */}
            <line x1="190" y1="492" x2="190" y2="520" stroke="#64748B" strokeWidth="1.3" markerEnd="url(#prisma-arrow)" />

            <rect x="20" y="520" width="340" height="58" rx="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" filter="url(#card-shadow)" />
            <text x="32" y="542" fontFamily="Plus Jakarta Sans" fontWeight="600" fontSize="12" fill="#0F172A">
              Reports assessed for eligibility (Full-Text):
            </text>
            <text x="32" y="560" fontFamily="JetBrains Mono" fontSize="11" fill="#475569">
              (n = {assessed})
            </text>

            {/* Arrow right to full text excluded with reasons */}
            <line x1="360" y1="549" x2="440" y2="549" stroke="#64748B" strokeWidth="1.3" markerEnd="url(#prisma-arrow)" />

            <rect x="440" y="515" width="480" height="74" rx="8" fill="#FEF2F2" stroke="#F87171" strokeWidth="1.2" filter="url(#card-shadow)" />
            <text x="452" y="535" fontFamily="Plus Jakarta Sans" fontWeight="600" fontSize="12" fill="#B91C1C">
              Reports excluded (Full-Text with reasons, Item 16b):
            </text>
            <text x="452" y="552" fontFamily="JetBrains Mono" fontSize="10.5" fill="#991B1B">
              Total excluded (n = {assessedExcluded})
            </text>
            {exclusionLines.slice(0, 2).map((l, i) => (
              <text key={i} x="452" y={568 + i * 14} fontFamily="JetBrains Mono" fontSize="9.5" fill="#7F1D1D">
                {l.length > 60 ? l.slice(0, 58) + "…" : l}
              </text>
            ))}
          </g>

          {/* Phase 4: INCLUDED */}
          <g>
            {/* Arrow down to included */}
            <line x1="190" y1="578" x2="190" y2="612" stroke="#64748B" strokeWidth="1.3" markerEnd="url(#prisma-arrow)" />

            <rect x="20" y="605" width="110" height="24" rx="4" fill="#059669" />
            <text x="30" y="621" fontFamily="JetBrains Mono" fontWeight="600" fontSize="11" fill="#FFFFFF" letterSpacing="0.08em">
              INCLUDED
            </text>

            <rect x="20" y="632" width="410" height="42" rx="8" fill="#ECFDF5" stroke="#10B981" strokeWidth="1.5" filter="url(#card-shadow)" />
            <text x="32" y="652" fontFamily="Plus Jakarta Sans" fontWeight="700" fontSize="13" fill="#065F46">
              Studies included in review & synthesis:
            </text>
            <text x="32" y="666" fontFamily="JetBrains Mono" fontWeight="600" fontSize="12" fill="#047857">
              (n = {included} studies)
            </text>
          </g>
        </svg>
      </div>

      {/* Summary audit cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="font-mono text-[11px] text-slate-500 uppercase tracking-wider">Identified</div>
          <div className="font-mono text-xl font-bold text-slate-900 mt-0.5">{identifiedDb + identifiedOther}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Records from {identifiedDb > 0 ? "databases" : "search"}</div>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="font-mono text-[11px] text-slate-500 uppercase tracking-wider">Screened</div>
          <div className="font-mono text-xl font-bold text-slate-900 mt-0.5">{screened}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{duplicatesRemoved} duplicates removed</div>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="font-mono text-[11px] text-slate-500 uppercase tracking-wider">Excluded</div>
          <div className="font-mono text-xl font-bold text-rose-600 mt-0.5">{screenedExcluded + assessedExcluded}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Categorized by reasons</div>
        </div>
        <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl shadow-2xs">
          <div className="font-mono text-[11px] text-emerald-800 uppercase tracking-wider font-semibold">Included in SLR</div>
          <div className="font-mono text-xl font-bold text-emerald-700 mt-0.5">{included}</div>
          <div className="text-[11px] text-emerald-700 mt-0.5">Ready for synthesis & SoF</div>
        </div>
      </div>
    </div>
  );
}
