'use client';

import React from 'react';
import {
  Bot,
  X,
  Database,
  Cloud,
  CheckCircle2,
  Shield,
  Layers,
  Cpu,
  Server,
  Activity,
} from 'lucide-react';
import { AGENT_PLATFORM_CONFIG } from '../services/agentPlatform';
import { GCS_CONFIG } from '../services/cloudStorage';

interface AgentStatusModalProps {
  onClose: () => void;
}

export const AgentStatusModal: React.FC<AgentStatusModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">
                Google Cloud Agent Platform Runtime
              </h3>
              <p className="text-xs text-slate-400">
                Project: {AGENT_PLATFORM_CONFIG.projectId} • Region: {AGENT_PLATFORM_CONFIG.location}
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
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Agent Fleet */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-400" />
              Specialized SLR Sub-Agents
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Root Orchestrator */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100">ScholarPen</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Online
                  </span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Root Workflow Orchestrator & Deterministic Dispatcher
                </div>
                <div className="text-[10px] font-mono text-slate-400 pt-1">
                  Model: Gemini 2.5 Pro
                </div>
              </div>

              {/* Topic Decomposition Agent */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100">Topic Decomposition Agent</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Online
                  </span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  10-Dimension Structured Research Formulation
                </div>
                <div className="text-[10px] font-mono text-slate-400 pt-1">
                  Model: Gemini 2.5 Flash
                </div>
              </div>

              {/* Taxonomy & Keyword Agent */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100">Taxonomy & Keyword Agent</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Online
                  </span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Multi-Faceted Keyword Expansion & Categorization
                </div>
                <div className="text-[10px] font-mono text-slate-400 pt-1">
                  Model: Gemini 2.5 Flash
                </div>
              </div>

              {/* Search Strategy Agent */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100">Search Strategy Agent</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Online
                  </span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Database-Specific Query Syntax Synthesizer (Scopus/WoS/GS)
                </div>
                <div className="text-[10px] font-mono text-slate-400 pt-1">
                  Model: Gemini 2.5 Pro
                </div>
              </div>
            </div>
          </div>

          {/* Infrastructure Integration */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-2">
              <Server className="w-4 h-4 text-sky-400" />
              Connected Google Cloud Infrastructure
            </h4>

            <div className="space-y-2">
              <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-sky-400 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-200">Cloud SQL (PostgreSQL 16)</div>
                    <div className="text-[11px] font-mono text-slate-400">
                      Instance: scholarpen-db • DB: scholarpen • User: scholarpen-app
                    </div>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                </span>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Cloud className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-200">Google Cloud Storage (GCS)</div>
                    <div className="text-[11px] font-mono text-slate-400">
                      Bucket: {GCS_CONFIG.bucketName}
                    </div>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ingestion Active
                </span>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-200">Application Default Credentials (ADC)</div>
                    <div className="text-[11px] font-mono text-slate-400">
                      OAuth 2.0 Client Tokens & Service Identity
                    </div>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Authenticated
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
