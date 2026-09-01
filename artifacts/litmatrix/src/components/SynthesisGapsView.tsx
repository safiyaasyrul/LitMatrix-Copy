'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  ArrowRight,
  Plus,
  Tag,
  AlertCircle,
  TrendingUp,
  Bookmark,
  CheckCircle,
} from 'lucide-react';
import { Project, ResearchGap, Theme } from '../types';
import { generateThematicClusters, generateResearchGaps } from '../services/synthesis';

interface SynthesisGapsViewProps {
  project: Project;
  onUpdateThemes: (themes: Theme[]) => void;
  onUpdateGaps: (gaps: ResearchGap[]) => void;
  onNextStage: () => void;
}

export const SynthesisGapsView: React.FC<SynthesisGapsViewProps> = ({
  project,
  onUpdateThemes,
  onUpdateGaps,
  onNextStage,
}) => {
  const includedPapers = (project.papers || []).filter((p) => {
    const dec = project.screeningDecisions?.[p.id];
    return dec?.humanDecision === 'INCLUDE' || (dec?.humanDecision === 'PENDING' && dec?.aiDecision === 'INCLUDE');
  });

  const themes: Theme[] = project.themes?.length
    ? project.themes
    : generateThematicClusters(includedPapers, project.id);

  const gaps: ResearchGap[] = project.researchGaps?.length
    ? project.researchGaps
    : generateResearchGaps(project);

  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(themes[0]?.id || null);

  const activeTheme = themes.find((t) => t.id === selectedThemeId) || themes[0];

  const handleRegenerate = () => {
    const newThemes = generateThematicClusters(includedPapers, project.id);
    const newGaps = generateResearchGaps(project);
    onUpdateThemes(newThemes);
    onUpdateGaps(newGaps);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-mono font-bold uppercase">
                Stage 9 • Thematic Synthesis & Gap Taxonomy
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Cross-Study Meta Synthesis
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 mt-2">
              Thematic Clustering & Empirical Research Gaps
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Synthesizes patterns of convergence and divergence across included studies. Categorizes explicit research gaps across Empirical, Methodological, Technological, and Theoretical dimensions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRegenerate}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 text-xs font-semibold rounded-lg transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Re-Cluster Literature</span>
            </button>

            <button
              onClick={onNextStage}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              <span>Stage 10: Manuscript Draft</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Theme Selector Tabs */}
        <div className="flex gap-2 mt-6 pt-4 border-t border-slate-800 overflow-x-auto no-scrollbar">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setSelectedThemeId(theme.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                selectedThemeId === theme.id
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: theme.colorTag || '#f59e0b' }}
              />
              <span>{theme.name}</span>
              <span className="text-[10px] font-mono opacity-80">
                ({theme.paperIds.length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Theme Deep-Dive Card */}
      {activeTheme && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-amber-400" />
                {activeTheme.name}
              </h3>
              <p className="text-xs text-slate-300 mt-1">{activeTheme.description}</p>
            </div>
            <span className="px-3 py-1 bg-slate-800 text-slate-300 font-mono text-xs rounded-md border border-slate-700">
              {activeTheme.paperIds.length} Studies Mapped
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-4 space-y-2">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                Key Concepts
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeTheme.keyConcepts?.map((k, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-slate-900 text-slate-200 rounded text-xs font-mono"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-4 space-y-2">
              <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider block">
                Research Trends
              </span>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {activeTheme.researchTrends}
              </p>
            </div>

            <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-4 space-y-2">
              <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block">
                Documented Bottlenecks
              </span>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {activeTheme.limitations}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Structured Research Gaps Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            Synthesized Research Gaps Taxonomy ({gaps.length})
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Derived directly from evidence matrix limitations
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gaps.map((gap) => (
            <div
              key={gap.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-bold text-slate-100">
                  {gap.title}
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded ${
                      gap.priority === 'HIGH'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {gap.priority} Priority
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 rounded">
                    {gap.category}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {gap.description}
              </p>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Evidence Grounding:</span>
                <span className="text-sky-400">
                  {gap.evidenceRef?.length || 0} Empirical Studies Supporting
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
