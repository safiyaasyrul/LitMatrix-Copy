'use client';

import React from 'react';
import {
  FileText,
  Split,
  Tag,
  Search,
  UploadCloud,
  CopyX,
  CheckSquare,
  GitPullRequest,
  TableProperties,
  Sparkles,
  Award,
} from 'lucide-react';

export interface StageInfo {
  index: number;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

export const SLR_STAGES: StageInfo[] = [
  {
    index: 0,
    label: '0. Project Overview',
    shortLabel: 'Overview',
    icon: FileText,
    description: 'Protocol, objectives, team roles and metadata',
  },
  {
    index: 1,
    label: '1. Topic Decomposition',
    shortLabel: 'Decomposition',
    icon: Split,
    description: '10-dimension structured research scope breakdown',
  },
  {
    index: 2,
    label: '2. Taxonomy & Keywords',
    shortLabel: 'Taxonomy',
    icon: Tag,
    description: 'Domain concepts, AI models & outcome taxonomy',
  },
  {
    index: 3,
    label: '3. Search Strategy',
    shortLabel: 'Search Strategy',
    icon: Search,
    description: 'Calibrated Scopus, WoS & Scholar query strings',
  },
  {
    index: 4,
    label: '4. Literature Import',
    shortLabel: 'Import',
    icon: UploadCloud,
    description: 'Deterministic RIS, CSV, BibTeX & NBIB ingestion',
  },
  {
    index: 5,
    label: '5. Deduplication',
    shortLabel: 'Deduplication',
    icon: CopyX,
    description: 'Exact DOI, Title & Fuzzy Token deduplication',
  },
  {
    index: 6,
    label: '6. Abstract Screening',
    shortLabel: 'Screening',
    icon: CheckSquare,
    description: 'Criteria evaluation & decision override logs',
  },
  {
    index: 7,
    label: '7. PRISMA 2020 Flow',
    shortLabel: 'PRISMA Flow',
    icon: GitPullRequest,
    description: 'Deterministic count audit & live SVG diagram',
  },
  {
    index: 8,
    label: '8. Evidence Matrix',
    shortLabel: 'Evidence Matrix',
    icon: TableProperties,
    description: '14-dimension structured data extraction table',
  },
  {
    index: 9,
    label: '9. Thematic & Gaps',
    shortLabel: 'Thematic Synthesis',
    icon: Sparkles,
    description: 'Cluster analysis, trends and unaddressed research gaps',
  },
  {
    index: 10,
    label: '10. Manuscript & Claims',
    shortLabel: 'Manuscript',
    icon: Award,
    description: 'PRISMA 8-section manuscript with traceable claim audit',
  },
];

interface StageNavigatorProps {
  currentStage: number;
  onSelectStage: (stageIndex: number) => void;
  maxCompletedStage?: number;
}

export const StageNavigator: React.FC<StageNavigatorProps> = ({
  currentStage,
  onSelectStage,
  maxCompletedStage = 10,
}) => {
  return (
    <nav aria-label="Systematic Literature Review Workflow Stages" className="bg-slate-900/90 border-b border-slate-800 sticky top-16 z-30 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 overflow-x-auto py-2.5 no-scrollbar scroll-smooth">
          {SLR_STAGES.map((stage) => {
            const Icon = stage.icon;
            const isActive = currentStage === stage.index;
            const isCompleted = stage.index <= maxCompletedStage && stage.index !== currentStage;

            return (
              <button
                key={stage.index}
                onClick={() => onSelectStage(stage.index)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 shrink-0 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold scale-[1.02]'
                    : isCompleted
                    ? 'bg-slate-800/80 text-slate-200 hover:bg-slate-800 hover:text-white border border-slate-700/60'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-300'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : isCompleted ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{stage.shortLabel}</span>
                {isCompleted && !isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
