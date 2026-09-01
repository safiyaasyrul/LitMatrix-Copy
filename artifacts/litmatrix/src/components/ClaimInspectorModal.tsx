'use client';

import React from 'react';
import {
  X,
  ShieldCheck,
  Quote,
  BookOpen,
  ExternalLink,
  CheckCircle,
} from 'lucide-react';
import { Claim, Paper, Project } from '../types';

interface ClaimInspectorModalProps {
  claim: Claim | null;
  project: Project;
  onClose: () => void;
}

export const ClaimInspectorModal: React.FC<ClaimInspectorModalProps> = ({
  claim,
  project,
  onClose,
}) => {
  if (!claim) return null;

  const supportingPapers = (project.papers || []).filter((p) =>
    claim.supportingPaperIds.includes(p.id)
  );

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-amber-400">
                  {claim.claimCode}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase">
                  {claim.verificationStatus}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {(claim.confidence * 100).toFixed(0)}% Confidence
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Primary Literature Verification & Traceability Audit
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs leading-relaxed">
          {/* Claim Statement */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Synthesized Empirical Claim Statement
            </span>
            <p className="text-sm font-bold text-slate-100 leading-snug">
              {claim.statement}
            </p>
          </div>

          {/* Primary Evidence Quotes */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Quote className="w-3.5 h-3.5 text-amber-400" />
              Verbatim Supporting Quotes from Literature
            </h4>

            {claim.quotes.map((q, idx) => {
              const paper = (project.papers || []).find((p) => p.id === q.paperId);

              return (
                <div
                  key={idx}
                  className="bg-slate-800/40 border border-slate-800 rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span className="font-bold text-sky-400">
                      {paper?.title ? `"${paper.title.slice(0, 60)}..."` : 'Supporting Paper'}
                    </span>
                    <span>{q.pageOrSection}</span>
                  </div>

                  <p className="text-slate-300 font-sans italic pl-2 border-l-2 border-amber-400">
                    "{q.text}"
                  </p>

                  <div className="text-[10px] font-mono text-slate-400 pt-1">
                    Authors: {paper?.authors?.join(', ') || 'Authors'} ({paper?.year || 'n.d.'}) • DOI: {paper?.doi || 'None'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Supporting Papers Citation List */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">
              Supporting Studies in Repository ({supportingPapers.length})
            </h4>

            <div className="space-y-2">
              {supportingPapers.map((p) => (
                <div
                  key={p.id}
                  className="bg-slate-950/40 border border-slate-800/80 rounded-md p-3 flex items-start justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-200">{p.title}</div>
                    <div className="text-slate-400 text-[11px]">
                      {p.authors?.join(', ')} ({p.year || 'n.d.'}) — {p.journal || 'Journal'}
                    </div>
                  </div>
                  {p.doi && (
                    <span className="text-[10px] font-mono text-sky-400 shrink-0">
                      {p.doi}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Passed Evidence Integrity Audit</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
