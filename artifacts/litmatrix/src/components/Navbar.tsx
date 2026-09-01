'use client';

import React from 'react';
import {
  BookOpen,
  Database,
  Cloud,
  History,
  Bot,
  Plus,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { Project } from '../types';

interface NavbarProps {
  projects: Project[];
  activeProject: Project;
  onSelectProject: (projectId: string) => void;
  onNewProject?: () => void;
  onCreateProject?: (title: string, description: string) => void;
  onOpenAuditLogs: () => void;
  onOpenAgentStatus: () => void;
  currentStepIndex?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onNewProject,
  onCreateProject,
  onOpenAuditLogs,
  onOpenAgentStatus,
  currentStepIndex,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-xl shadow-inner">
              <BookOpen className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white">
                  Scholar<span className="text-amber-400">Pen</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  SLR Platform
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono hidden sm:block">
                PRISMA 2020 Systematic Literature Review Suite
              </p>
            </div>
          </div>

          {/* Project Switcher */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                aria-label="Active Research Project"
                value={activeProject.id}
                onChange={(e) => onSelectProject(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 pr-8 appearance-none focus:outline-none focus:ring-1 focus:ring-amber-400 font-medium max-w-[200px] sm:max-w-[280px] truncate"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            <button
              onClick={() => {
                if (onNewProject) {
                  onNewProject();
                } else if (onCreateProject) {
                  const title = window.prompt('Enter Systematic Literature Review Title:');
                  if (title && title.trim()) {
                    onCreateProject(title.trim(), 'Systematic Literature Review');
                  }
                }
              }}
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 rounded-lg transition-colors"
              title="New SLR Project"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Infrastructure & Action Badges */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Cloud SQL badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 border border-slate-700 rounded-md text-[11px] text-slate-300 font-mono">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>scholarpen-db</span>
            </div>

            {/* GCS Bucket badge */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 border border-slate-700 rounded-md text-[11px] text-slate-300 font-mono">
              <Cloud className="w-3.5 h-3.5 text-sky-400" />
              <span>GCS Literature Bucket</span>
            </div>

            {/* Agent Platform Status Button */}
            <button
              onClick={onOpenAgentStatus}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-700/50 rounded-lg text-xs font-semibold text-indigo-300 transition-colors"
            >
              <Bot className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline">Agents: 4 Connected</span>
            </button>

            {/* Audit Logs Button */}
            <button
              onClick={onOpenAuditLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 transition-colors"
            >
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Audit Trail</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
