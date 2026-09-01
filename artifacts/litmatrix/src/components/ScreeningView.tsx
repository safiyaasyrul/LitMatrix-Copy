'use client';

import React, { useState } from 'react';
import {
  CheckSquare,
  Bot,
  Check,
  X,
  HelpCircle,
  RotateCcw,
  ArrowRight,
  RefreshCw,
  Filter,
  AlertCircle,
  FileText,
  Quote,
} from 'lucide-react';
import { Paper, Project, ScreeningCriteria, ScreeningDecision } from '../types';
import { runBatchScreening } from '../services/screening';

interface ScreeningViewProps {
  project: Project;
  onUpdateScreeningDecisions: (decisions: Record<string, ScreeningDecision>) => void;
  onUpdateCriteria: (criteria: ScreeningCriteria) => void;
  onNextStage: () => void;
}

export const ScreeningView: React.FC<ScreeningViewProps> = ({
  project,
  onUpdateScreeningDecisions,
  onUpdateCriteria,
  onNextStage,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'INCLUDE' | 'EXCLUDE' | 'MAYBE' | 'PENDING'>('ALL');
  const [runningBatch, setRunningBatch] = useState(false);
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);
  const [exclusionReasonModalPaperId, setExclusionReasonModalPaperId] = useState<string | null>(null);

  const defaultCriteria: ScreeningCriteria = {
    id: `crit_${project.id}`,
    projectId: project.id,
    inclusionCriteria: [
      'Peer-reviewed publications evaluating computational or machine learning models for fuel or emission prediction',
      'Reporting quantitative empirical metrics (RMSE, MAE, R², F1-score)',
      'Utilizing vessel telemetry, AIS trajectories, or sensor datasets',
      'Published in English between 2018 and present',
    ],
    exclusionCriteria: [
      'Purely macroeconomic, trade policy, or maritime law papers without predictive algorithms',
      'Non-maritime transportation domains (automotive, rail, aviation)',
      'Non-empirical conceptual white papers lacking validation data',
      'Duplicate records or unverified abstracts',
    ],
    exclusionReasons: [
      'Wrong population / domain (non-maritime)',
      'Wrong context (purely legal/economic policy)',
      'Wrong study type (editorial / non-empirical)',
      'Lack of quantitative validation metrics',
      'Outside date range (< 2018)',
      'Duplicate record',
    ],
  };

  const criteria = project.screeningCriteria || defaultCriteria;
  const decisions = project.screeningDecisions || {};
  const masterPapers = (project.papers || []).filter((p) => p.isMasterRecord);

  const handleDecision = (paperId: string, choice: 'INCLUDE' | 'EXCLUDE' | 'MAYBE', reason?: string) => {
    const existing = decisions[paperId] || {
      id: `screen_${paperId}`,
      paperId,
      aiDecision: 'MAYBE',
      confidence: 0.8,
      aiReason: 'Manual researcher evaluation',
    };

    const isOverridden = existing.aiDecision && existing.aiDecision !== choice;

    const updated: Record<string, ScreeningDecision> = {
      ...decisions,
      [paperId]: {
        ...existing,
        humanDecision: choice,
        isOverridden,
        exclusionReason: choice === 'EXCLUDE' ? reason || 'Not meeting inclusion criteria' : undefined,
        reviewedAt: new Date().toISOString(),
      },
    };

    onUpdateScreeningDecisions(updated);
    setExclusionReasonModalPaperId(null);
  };

  const handleUndo = (paperId: string) => {
    const existing = decisions[paperId];
    if (!existing) return;

    const updated: Record<string, ScreeningDecision> = {
      ...decisions,
      [paperId]: {
        ...existing,
        humanDecision: 'PENDING',
        isOverridden: false,
        exclusionReason: undefined,
      },
    };
    onUpdateScreeningDecisions(updated);
  };

  const handleRunBatchScreening = () => {
    setRunningBatch(true);
    try {
      const results = runBatchScreening(masterPapers, criteria, project.title, decisions);
      onUpdateScreeningDecisions(results);
    } catch (e) {
      console.error('Batch screening failed:', e);
    } finally {
      setRunningBatch(false);
    }
  };

  // Filtered papers
  const filteredPapers = masterPapers.filter((p) => {
    const dec = decisions[p.id];
    const outcome = dec?.humanDecision !== 'PENDING' ? dec?.humanDecision : dec?.aiDecision;
    if (filter === 'ALL') return true;
    if (filter === 'PENDING') return !dec || dec.humanDecision === 'PENDING';
    return outcome === filter;
  });

  const countIncluded = masterPapers.filter((p) => {
    const d = decisions[p.id];
    return d?.humanDecision === 'INCLUDE' || (d?.humanDecision === 'PENDING' && d?.aiDecision === 'INCLUDE');
  }).length;

  const countExcluded = masterPapers.filter((p) => {
    const d = decisions[p.id];
    return d?.humanDecision === 'EXCLUDE' || (d?.humanDecision === 'PENDING' && d?.aiDecision === 'EXCLUDE');
  }).length;

  const countMaybe = masterPapers.filter((p) => {
    const d = decisions[p.id];
    return d?.humanDecision === 'MAYBE' || (d?.humanDecision === 'PENDING' && d?.aiDecision === 'MAYBE');
  }).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-mono font-bold uppercase">
                Stage 6 • Title & Abstract Screening
              </span>
              <span className="text-xs text-slate-400 font-mono">
                PRISMA 2020 Eligibility Protocol
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 mt-2">
              AI-Assisted Screening with Researcher Override Authority
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Assesses papers against Inclusion and Exclusion criteria. The screening engine extracts supporting snippets and flags potential methodological caveats while maintaining an auditable decision trail.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunBatchScreening}
              disabled={runningBatch || masterPapers.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 text-xs font-semibold rounded-lg transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${runningBatch ? 'animate-spin' : ''}`} />
              <span>{runningBatch ? 'Evaluating Abstracts...' : 'Run Batch Screening'}</span>
            </button>

            <button
              onClick={onNextStage}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              <span>Stage 7: PRISMA Flow</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Screening Metrics Bar & Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-1">
            {(['ALL', 'INCLUDE', 'EXCLUDE', 'MAYBE', 'PENDING'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filter === tab
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab === 'ALL' && `All (${masterPapers.length})`}
                {tab === 'INCLUDE' && `Included (${countIncluded})`}
                {tab === 'EXCLUDE' && `Excluded (${countExcluded})`}
                {tab === 'MAYBE' && `Maybe (${countMaybe})`}
                {tab === 'PENDING' && 'Pending Review'}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-400 font-mono">
            {countIncluded} of {masterPapers.length} eligible for synthesis matrix
          </div>
        </div>
      </div>

      {/* Criteria Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-emerald-500/20 rounded-xl p-4 space-y-2">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <Check className="w-4 h-4" /> Inclusion Criteria
          </span>
          <ul className="space-y-1 text-xs text-slate-300">
            {criteria.inclusionCriteria.map((c, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-emerald-400">•</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-slate-900 border border-rose-500/20 rounded-xl p-4 space-y-2">
          <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <X className="w-4 h-4" /> Exclusion Criteria
          </span>
          <ul className="space-y-1 text-xs text-slate-300">
            {criteria.exclusionCriteria.map((c, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-rose-400">•</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Papers Screening Feed */}
      <div className="space-y-4">
        {filteredPapers.map((paper) => {
          const dec = decisions[paper.id];
          const hasHuman = dec && dec.humanDecision !== 'PENDING';
          const currentDecision = hasHuman ? dec.humanDecision : dec?.aiDecision || 'PENDING';

          return (
            <div
              key={paper.id}
              className={`bg-slate-900 border rounded-xl p-5 space-y-4 transition-all ${
                currentDecision === 'INCLUDE'
                  ? 'border-emerald-500/40 bg-emerald-950/[0.04]'
                  : currentDecision === 'EXCLUDE'
                  ? 'border-rose-500/40 bg-rose-950/[0.04]'
                  : 'border-slate-800'
              }`}
            >
              {/* Paper Title & Metadata */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                      {paper.year || 'n.d.'}
                    </span>
                    <span className="text-xs text-slate-400 font-medium truncate max-w-md">
                      {paper.journal || 'Journal'}
                    </span>
                    {paper.doi && (
                      <span className="text-[11px] font-mono text-sky-400 truncate max-w-[200px]">
                        DOI: {paper.doi}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-100 leading-snug">
                    {paper.title}
                  </h3>
                  <div className="text-xs text-slate-400">
                    {paper.authors?.join(', ') || 'No authors listed'}
                  </div>
                </div>

                {/* Decision Badge */}
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-bold uppercase font-mono ${
                      currentDecision === 'INCLUDE'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : currentDecision === 'EXCLUDE'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {currentDecision}
                  </span>
                  {dec?.isOverridden && (
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-mono uppercase font-bold">
                      Overridden
                    </span>
                  )}
                </div>
              </div>

              {/* Abstract */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3.5 text-xs text-slate-300 leading-relaxed font-sans">
                {paper.abstract || 'No abstract text provided in imported metadata.'}
              </div>

              {/* AI Recommendation & Supporting Rationale */}
              {dec && (
                <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <Bot className="w-4 h-4 text-sky-400" />
                      AI Screening Assessment:
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      Confidence: {(dec.confidence * 100).toFixed(0)}%
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">{dec.aiReason}</p>

                  {dec.supportingText && (
                    <div className="flex items-start gap-2 bg-slate-900/80 p-2.5 rounded border border-slate-800 text-[11px] text-amber-200/90 font-mono">
                      <Quote className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{dec.supportingText}</span>
                    </div>
                  )}

                  {dec.potentialConcerns && (
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-400/90 font-mono">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Note: {dec.potentialConcerns}</span>
                    </div>
                  )}

                  {dec.exclusionReason && (
                    <div className="text-[11px] font-mono text-rose-300 bg-rose-950/40 px-2.5 py-1 rounded border border-rose-800/60">
                      Exclusion Reason: {dec.exclusionReason}
                    </div>
                  )}
                </div>
              )}

              {/* Human Decision Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
                <span className="text-xs text-slate-400 font-mono">
                  {hasHuman ? 'Researcher Decision Applied' : 'Awaiting Reviewer Action:'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDecision(paper.id, 'INCLUDE')}
                    className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                      currentDecision === 'INCLUDE'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 hover:bg-slate-700 text-emerald-400'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" /> Include
                  </button>

                  <button
                    onClick={() => setExclusionReasonModalPaperId(paper.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                      currentDecision === 'EXCLUDE'
                        ? 'bg-rose-500 text-slate-950'
                        : 'bg-slate-800 hover:bg-slate-700 text-rose-400'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" /> Exclude...
                  </button>

                  <button
                    onClick={() => handleDecision(paper.id, 'MAYBE')}
                    className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                      currentDecision === 'MAYBE'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 hover:bg-slate-700 text-amber-400'
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" /> Maybe
                  </button>

                  {hasHuman && (
                    <button
                      onClick={() => handleUndo(paper.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                      title="Undo Decision"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Exclusion Reason Modal */}
      {exclusionReasonModalPaperId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-100">
              Select Exclusion Reason
            </h3>
            <p className="text-xs text-slate-300">
              PRISMA 2020 requires reporting categorized exclusion reasons for all excluded reports.
            </p>

            <div className="space-y-2">
              {criteria.exclusionReasons.map((reason, idx) => (
                <button
                  key={idx}
                  onClick={() => handleDecision(exclusionReasonModalPaperId, 'EXCLUDE', reason)}
                  className="w-full text-left px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                >
                  {reason}
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setExclusionReasonModalPaperId(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
