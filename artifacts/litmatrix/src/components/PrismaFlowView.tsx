'use client';

import React, { useState } from 'react';
import {
  GitPullRequest,
  Download,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  FileCode,
  Layers,
} from 'lucide-react';
import { PrismaRecord, Project } from '../types';
import { calculatePrismaRecord, generatePrismaSvg } from '../services/prismaFlow';

interface PrismaFlowViewProps {
  project: Project;
  onUpdatePrisma: (record: PrismaRecord) => void;
  onNextStage: () => void;
}

export const PrismaFlowView: React.FC<PrismaFlowViewProps> = ({
  project,
  onUpdatePrisma,
  onNextStage,
}) => {
  const [recalculating, setRecalculating] = useState(false);

  const prisma: PrismaRecord = project.prismaRecord || calculatePrismaRecord(project);

  const handleRecalculate = () => {
    setRecalculating(true);
    try {
      const fresh = calculatePrismaRecord(project);
      onUpdatePrisma(fresh);
    } catch (e) {
      console.error('PRISMA calculation failed:', e);
    } finally {
      setRecalculating(false);
    }
  };

  const handleDownloadSvg = () => {
    const svgStr = generatePrismaSvg(prisma);
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PRISMA_2020_Flow_Diagram_${project.id}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold uppercase">
                Stage 7 • PRISMA 2020 Flow Verification
              </span>
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Deterministic Database Counts
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 mt-2">
              PRISMA 2020 Flow Diagram Generator
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Calculates exact stage counts directly from ingestion, deduplication, and screening logs. The vector diagram updates in real-time and exports directly for academic publication.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRecalculate}
              disabled={recalculating}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${recalculating ? 'animate-spin' : ''}`} />
              <span>{recalculating ? 'Calculating...' : 'Recalculate Counts'}</span>
            </button>

            <button
              onClick={handleDownloadSvg}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 text-xs font-semibold rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export SVG Diagram</span>
            </button>

            <button
              onClick={onNextStage}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              <span>Stage 8: Evidence Matrix</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 5 Stage Quantitative Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-800/50 border border-slate-800 rounded-lg p-3">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">1. Identified</span>
            <div className="text-xl font-black text-slate-100 font-mono mt-0.5">{prisma.recordsIdentified}</div>
            <span className="text-[10px] text-slate-400">Scopus/WoS/Scholar</span>
          </div>

          <div className="bg-slate-800/50 border border-slate-800 rounded-lg p-3">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">2. Removed/Dup</span>
            <div className="text-xl font-black text-amber-400 font-mono mt-0.5">{prisma.duplicateRecordsRemoved}</div>
            <span className="text-[10px] text-slate-400">Exact & Fuzzy Dups</span>
          </div>

          <div className="bg-slate-800/50 border border-slate-800 rounded-lg p-3">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">3. Screened</span>
            <div className="text-xl font-black text-sky-400 font-mono mt-0.5">{prisma.recordsScreened}</div>
            <span className="text-[10px] text-slate-400">{prisma.recordsExcluded} Excluded</span>
          </div>

          <div className="bg-slate-800/50 border border-slate-800 rounded-lg p-3">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">4. Assessed</span>
            <div className="text-xl font-black text-purple-400 font-mono mt-0.5">{prisma.reportsAssessedEligibility}</div>
            <span className="text-[10px] text-slate-400">Full Eligibility</span>
          </div>

          <div className="bg-slate-800/50 border border-emerald-500/30 rounded-lg p-3 bg-emerald-950/20">
            <span className="text-[10px] text-emerald-400 uppercase font-bold">5. Included</span>
            <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">{prisma.studiesIncluded}</div>
            <span className="text-[10px] text-emerald-300">Final SLR Corpus</span>
          </div>
        </div>
      </div>

      {/* Interactive Vector Diagram Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <GitPullRequest className="w-4 h-4 text-amber-400" />
            Rendered Vector PRISMA 2020 Flowchart
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Calibrated Timestamp: {new Date(prisma.lastCalculatedAt).toLocaleTimeString()}
          </span>
        </div>

        <div
          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-4 overflow-hidden flex items-center justify-center shadow-inner"
          dangerouslySetInnerHTML={{ __html: generatePrismaSvg(prisma) }}
        />
      </div>
    </div>
  );
};
