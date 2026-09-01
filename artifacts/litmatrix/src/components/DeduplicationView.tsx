'use client';

import React, { useState } from 'react';
import {
  CopyX,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  GitMerge,
  ShieldCheck,
  Check,
  X,
  Layers,
} from 'lucide-react';
import { DuplicateCandidate, Paper, Project } from '../types';
import { runDeduplication } from '../services/deduplication';

interface DeduplicationViewProps {
  project: Project;
  onUpdateDeduplication: (
    candidates: DuplicateCandidate[],
    masterPapers: Paper[]
  ) => void;
  onNextStage: () => void;
}

export const DeduplicationView: React.FC<DeduplicationViewProps> = ({
  project,
  onUpdateDeduplication,
  onNextStage,
}) => {
  const [running, setRunning] = useState(false);
  const [activeCandidateId, setActiveCandidateId] = useState<string | null>(null);

  const papers = project.papers || [];
  const candidates = project.duplicateCandidates || [];
  const masterPapers = papers.filter((p) => p.isMasterRecord);

  const confirmedDuplicates = candidates.filter((c) => c.status === 'CONFIRMED_DUPLICATE').length;
  const pendingReview = candidates.filter((c) => c.status === 'PENDING').length;

  const handleRunDeduplication = () => {
    setRunning(true);
    try {
      const summary = runDeduplication(papers, project.id);
      onUpdateDeduplication(summary.duplicateCandidates, summary.deduplicatedMasterPapers);
    } catch (e) {
      console.error('Deduplication failed:', e);
    } finally {
      setRunning(false);
    }
  };

  const handleConfirmDuplicate = (candidateId: string) => {
    const updatedCandidates = candidates.map((c) =>
      c.id === candidateId ? { ...c, status: 'CONFIRMED_DUPLICATE' as const, reviewedAt: new Date().toISOString() } : c
    );
    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate) return;

    // Update master paper copies
    const updatedPapers = papers.map((p) => {
      if (p.id === candidate.paperBId) {
        return { ...p, isMasterRecord: false };
      }
      return p;
    });

    onUpdateDeduplication(updatedCandidates, updatedPapers.filter((p) => p.isMasterRecord));
  };

  const handleMarkDistinct = (candidateId: string) => {
    const updatedCandidates = candidates.map((c) =>
      c.id === candidateId ? { ...c, status: 'CONFIRMED_DISTINCT' as const, reviewedAt: new Date().toISOString() } : c
    );
    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate) return;

    const updatedPapers = papers.map((p) => {
      if (p.id === candidate.paperBId) {
        return { ...p, isMasterRecord: true };
      }
      return p;
    });

    onUpdateDeduplication(updatedCandidates, updatedPapers.filter((p) => p.isMasterRecord));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-mono font-bold uppercase">
                Stage 5 • Deterministic Deduplication
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Hierarchy: Exact DOI &rarr; Exact Title &rarr; Fuzzy Dice/Levenshtein
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 mt-2">
              Multi-Tier Literature Deduplication Engine
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Maintains full provenance without destructive deletion. When duplicates are confirmed, metadata fields (DOI, abstract, keywords) and source database origins merge into the master record.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunDeduplication}
              disabled={running || papers.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 text-xs font-semibold rounded-lg transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
              <span>{running ? 'Comparing Records...' : 'Execute Deduplication'}</span>
            </button>

            <button
              onClick={onNextStage}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              <span>Stage 6: Abstract Screening</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Deduplication Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-800/50 border border-slate-800 rounded-lg p-3">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Records</span>
            <div className="text-xl font-black text-slate-100 font-mono mt-0.5">{papers.length}</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-800 rounded-lg p-3">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Unique Master Records</span>
            <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">{masterPapers.length}</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-800 rounded-lg p-3">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Confirmed Duplicates</span>
            <div className="text-xl font-black text-amber-400 font-mono mt-0.5">{confirmedDuplicates}</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-800 rounded-lg p-3">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Pending Review</span>
            <div className="text-xl font-black text-sky-400 font-mono mt-0.5">{pendingReview}</div>
          </div>
        </div>
      </div>

      {/* Duplicate Candidates List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <GitMerge className="w-4 h-4 text-amber-400" />
          Duplicate Detection Candidates ({candidates.length})
        </h3>

        {candidates.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-400">
            No duplicate candidates detected. Run the deduplication engine above to evaluate pairs across exact DOI and title similarities.
          </div>
        ) : (
          <div className="space-y-4">
            {candidates.map((candidate) => (
              <div
                key={candidate.id}
                className={`bg-slate-900 border rounded-xl p-5 space-y-4 transition-all ${
                  candidate.status === 'CONFIRMED_DUPLICATE'
                    ? 'border-amber-500/40 bg-amber-500/[0.02]'
                    : candidate.status === 'CONFIRMED_DISTINCT'
                    ? 'border-slate-800 opacity-60'
                    : 'border-sky-500/40'
                }`}
              >
                {/* Match Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {candidate.matchReason}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-300">
                      Score: {(candidate.confidenceScore * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded font-mono ${
                        candidate.status === 'CONFIRMED_DUPLICATE'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : candidate.status === 'CONFIRMED_DISTINCT'
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      }`}
                    >
                      {candidate.status}
                    </span>

                    {candidate.status === 'PENDING' && (
                      <div className="flex gap-1.5 ml-2">
                        <button
                          onClick={() => handleConfirmDuplicate(candidate.id)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded transition-colors"
                        >
                          <Check className="w-3 h-3" /> Merge as Duplicate
                        </button>
                        <button
                          onClick={() => handleMarkDistinct(candidate.id)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded transition-colors"
                        >
                          <X className="w-3 h-3" /> Keep Separate
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Side-by-Side Comparison Box */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Record A (Master Candidate) */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-400 uppercase">
                        Record A (Retained Master)
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                        {candidate.paperA?.sources?.[0]?.sourceDatabase || 'Database'}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-100">
                      {candidate.paperA?.title}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {candidate.paperA?.authors?.join(', ') || 'No authors'}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      DOI: {candidate.paperA?.doi || 'None'} • Year: {candidate.paperA?.year || 'n.d.'}
                    </div>
                  </div>

                  {/* Record B (Duplicate Candidate) */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-sky-400 uppercase">
                        Record B (Merged In)
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                        {candidate.paperB?.sources?.[0]?.sourceDatabase || 'Database'}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-100">
                      {candidate.paperB?.title}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {candidate.paperB?.authors?.join(', ') || 'No authors'}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      DOI: {candidate.paperB?.doi || 'None'} • Year: {candidate.paperB?.year || 'n.d.'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
