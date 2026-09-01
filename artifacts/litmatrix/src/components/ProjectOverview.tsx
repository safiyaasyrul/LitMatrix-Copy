'use client';

import React, { useState } from 'react';
import {
  FileText,
  Calendar,
  CheckCircle,
  Database,
  ArrowRight,
  Plus,
  Trash2,
  Save,
  Play,
  Layers,
} from 'lucide-react';
import { Project } from '../types';

interface ProjectOverviewProps {
  project: Project;
  onUpdateProject: (updated: Partial<Project>) => void;
  onNextStage: () => void;
}

export const ProjectOverview: React.FC<ProjectOverviewProps> = ({
  project,
  onUpdateProject,
  onNextStage,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description || '');
  const [researcher, setResearcher] = useState(project.researcher || 'Dr. Nur Diyana');

  const papersCount = project.papers?.length || 0;
  const masterCount = project.papers?.filter((p) => p.isMasterRecord).length || 0;
  const screenedCount = Object.keys(project.screeningDecisions || {}).length;
  const includedCount = Object.values(project.screeningDecisions || {}).filter(
    (d: any) => d.humanDecision === 'INCLUDE' || (d.humanDecision === 'PENDING' && d.aiDecision === 'INCLUDE')
  ).length;

  const handleSave = () => {
    onUpdateProject({
      title,
      description,
      researcher,
      updatedAt: new Date().toISOString(),
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Academic Protocol Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-mono font-bold uppercase">
                Systematic Review Protocol
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Updated {new Date(project.updatedAt).toLocaleDateString()}
              </span>
            </div>

            {isEditing ? (
              <div className="space-y-3 pt-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 text-lg font-bold focus:ring-1 focus:ring-amber-400 focus:outline-none"
                  placeholder="Review Title..."
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-300 text-sm focus:ring-1 focus:ring-amber-400 focus:outline-none"
                  placeholder="Review Scope and Protocol Summary..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Changes
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight leading-snug">
                  {project.title}
                </h1>
                <p className="text-sm text-slate-300 mt-2 leading-relaxed max-w-4xl">
                  {project.description || 'No detailed scope entered.'}
                </p>
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                  <span>
                    <strong className="text-slate-200">Principal Investigator:</strong> {project.researcher}
                  </span>
                  <span>•</span>
                  <span>
                    <strong className="text-slate-200">Review Standard:</strong> PRISMA 2020 Statement
                  </span>
                </div>
              </div>
            )}
          </div>

          {!isEditing && (
            <div className="flex flex-col gap-2 shrink-0">
              <button
                onClick={() => setIsEditing(true)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 transition-colors"
              >
                Edit Protocol
              </button>
              <button
                onClick={onNextStage}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow-sm transition-colors"
              >
                <span>Stage 1: Topic Decomposition</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Real-time Project Progress Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-800/50 border border-slate-800 rounded-lg p-3.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Identified Records</span>
            <div className="text-2xl font-black text-slate-100 mt-1 font-mono">{papersCount}</div>
            <span className="text-[11px] text-slate-400">Multi-source database logs</span>
          </div>

          <div className="bg-slate-800/50 border border-slate-800 rounded-lg p-3.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Master Unique</span>
            <div className="text-2xl font-black text-amber-400 mt-1 font-mono">{masterCount}</div>
            <span className="text-[11px] text-slate-400">Post-deduplication corpus</span>
          </div>

          <div className="bg-slate-800/50 border border-slate-800 rounded-lg p-3.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Screened Records</span>
            <div className="text-2xl font-black text-sky-400 mt-1 font-mono">{screenedCount}</div>
            <span className="text-[11px] text-slate-400">{includedCount} Included in matrix</span>
          </div>

          <div className="bg-slate-800/50 border border-slate-800 rounded-lg p-3.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Synthesis Themes</span>
            <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">{project.themes?.length || 0}</div>
            <span className="text-[11px] text-slate-400">Thematic clusters mapped</span>
          </div>
        </div>
      </div>

      {/* Systematic Workflow Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm">
            <div className="w-7 h-7 rounded-md bg-amber-500/10 flex items-center justify-center">
              <span className="font-mono text-xs">1-3</span>
            </div>
            <span>Formulation & Strategy</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Deconstructs the research question across 10 structured conceptual dimensions, extracts multifaceted taxonomy keywords, and produces calibrated boolean query strings for Scopus, Web of Science, and Google Scholar.
          </p>
          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              Agent-Assisted + Human Approval
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2.5 text-sky-400 font-bold text-sm">
            <div className="w-7 h-7 rounded-md bg-sky-500/10 flex items-center justify-center">
              <span className="font-mono text-xs">4-7</span>
            </div>
            <span>Extraction & PRISMA</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Imports raw RIS, CSV, BibTeX, and NBIB files into Google Cloud Storage. Runs deterministic deduplication (DOI, Title, Dice Token similarity) and generates live PRISMA 2020 diagrams calculated from database records.
          </p>
          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded">
              <Database className="w-3.5 h-3.5 text-sky-400" />
              Non-destructive Provenance
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm">
            <div className="w-7 h-7 rounded-md bg-emerald-500/10 flex items-center justify-center">
              <span className="font-mono text-xs">8-10</span>
            </div>
            <span>Synthesis & Manuscript</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Extracts 14-field evidence matrices, clusters papers into thematic groups, identifies critical research gaps, and drafts complete 8-section manuscripts with auditable claim traceability ([CLAIM-001]) and multi-format exports.
          </p>
          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              Zero Citation Fabrication
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
