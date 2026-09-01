'use client';

import React, { useState } from 'react';
import {
  History,
  X,
  Download,
  Filter,
  CheckCircle,
  Clock,
  Layers,
  Database,
} from 'lucide-react';
import { AuditLog, Project } from '../types';

interface AuditLogModalProps {
  project: Project;
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({
  project,
  onClose,
}) => {
  const [filterAction, setFilterAction] = useState<string>('ALL');

  const logs: AuditLog[] = project.auditLogs || [];

  const handleExportLogs = () => {
    const jsonStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ScholarPen_Audit_Logs_${project.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter((l) => {
    if (filterAction === 'ALL') return true;
    return l.action === filterAction;
  });

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">
                Systematic Audit Trail & Decision Logs
              </h3>
              <p className="text-xs text-slate-400">
                PRISMA 2020 Compliance • Transparent Review History
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 text-xs font-bold rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON Log</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Filter by Event:</span>
            <select
              aria-label="Filter Audit Logs by Event"
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-md px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-amber-400"
            >
              <option value="ALL">All Events ({logs.length})</option>
              <option value="PROJECT_CREATED">Project Created</option>
              <option value="TOPIC_DECOMPOSITION_APPROVED">Topic Decomposition</option>
              <option value="DEDUPLICATION_EXECUTED">Deduplication Executed</option>
              <option value="SCREENING_DECISION_UPDATED">Screening Decisions</option>
              <option value="MANUSCRIPT_GENERATED">Manuscript Generated</option>
            </select>
          </div>

          <span className="text-slate-400 font-mono text-[11px]">
            {filteredLogs.length} audit entries registered
          </span>
        </div>

        {/* Logs List */}
        <div className="p-6 space-y-3 overflow-y-auto flex-1 text-xs">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              No audit logs match current filter.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="bg-slate-950/60 border border-slate-800 rounded-lg p-3.5 space-y-1.5 font-mono"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    {log.action}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>

                <div className="text-slate-200 font-sans text-xs pt-1">
                  {log.details}
                </div>

                <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                  <span>Entity: {log.entityType}</span>
                  {log.modelUsed && <span>Agent/Model: {log.modelUsed}</span>}
                  {log.researcherApproval && (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Researcher Approved
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
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
