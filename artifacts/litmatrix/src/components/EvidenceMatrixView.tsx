'use client';

import React, { useState } from 'react';
import {
  TableProperties,
  Download,
  Filter,
  ArrowRight,
  Edit3,
  Save,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { EvidenceRecord, Paper, Project } from '../types';
import { extractEvidenceFromPaper } from '../services/synthesis';

interface EvidenceMatrixViewProps {
  project: Project;
  onUpdateEvidenceRecords: (records: Record<string, EvidenceRecord>) => void;
  onNextStage: () => void;
}

export const EvidenceMatrixView: React.FC<EvidenceMatrixViewProps> = ({
  project,
  onUpdateEvidenceRecords,
  onNextStage,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<EvidenceRecord>>({});

  const includedPapers = (project.papers || []).filter((p) => {
    const dec = project.screeningDecisions?.[p.id];
    return dec?.humanDecision === 'INCLUDE' || (dec?.humanDecision === 'PENDING' && dec?.aiDecision === 'INCLUDE');
  });

  // Ensure all included papers have evidence records
  const evidenceRecords = { ...project.evidenceRecords };
  includedPapers.forEach((p) => {
    if (!evidenceRecords[p.id]) {
      evidenceRecords[p.id] = extractEvidenceFromPaper(p);
    }
  });

  const handleStartEdit = (record: EvidenceRecord) => {
    setEditingId(record.id);
    setEditForm({ ...record });
  };

  const handleSaveEdit = (paperId: string) => {
    const updated = {
      ...evidenceRecords,
      [paperId]: {
        ...evidenceRecords[paperId],
        ...editForm,
      },
    };
    onUpdateEvidenceRecords(updated);
    setEditingId(null);
  };

  const handleExportCsv = () => {
    const headers = [
      'Paper Title',
      'Authors',
      'Year',
      'Objective',
      'Method',
      'Technology',
      'Dataset',
      'Outcome',
      'Key Findings',
      'Limitations',
      'Research Gap',
      'Theme',
      'DOI',
    ];

    const rows = includedPapers.map((p) => {
      const ev = evidenceRecords[p.id];
      return [
        `"${p.title.replace(/"/g, '""')}"`,
        `"${(p.authors || []).join('; ').replace(/"/g, '""')}"`,
        p.year || '',
        `"${(ev?.objective || '').replace(/"/g, '""')}"`,
        `"${(ev?.method || '').replace(/"/g, '""')}"`,
        `"${(ev?.technology || '').replace(/"/g, '""')}"`,
        `"${(ev?.dataset || '').replace(/"/g, '""')}"`,
        `"${(ev?.outcome || '').replace(/"/g, '""')}"`,
        `"${(ev?.keyFindings || '').replace(/"/g, '""')}"`,
        `"${(ev?.limitations || '').replace(/"/g, '""')}"`,
        `"${(ev?.researchGap || '').replace(/"/g, '""')}"`,
        `"${(ev?.themeName || '').replace(/"/g, '""')}"`,
        p.doi || '',
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ScholarPen_Evidence_Matrix_${project.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredPapers = includedPapers.filter((p) => {
    const ev = evidenceRecords[p.id];
    const text = `${p.title} ${p.authors?.join(' ')} ${ev?.method} ${ev?.technology} ${ev?.outcome}`.toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-mono font-bold uppercase">
                Stage 8 • Evidence Extraction Matrix
              </span>
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                No Hallucinated Parameters
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 mt-2">
              14-Dimension Structured Synthesis Matrix
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Synthesizes objective, research context, population/object, method, technology, datasets, variables, outcomes, key findings, and limitations across all {includedPapers.length} included empirical studies.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 text-xs font-semibold rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV Matrix</span>
            </button>

            <button
              onClick={onNextStage}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              <span>Stage 9: Thematic & Gaps</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search & Filter bar */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search across methods, technologies, variables..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>

          <span className="text-xs text-slate-400 font-mono">
            Displaying {filteredPapers.length} of {includedPapers.length} Included Studies
          </span>
        </div>
      </div>

      {/* Main Evidence Extraction Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[680px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950 text-slate-300 font-mono uppercase text-[10px] sticky top-0 z-20 border-b border-slate-800">
              <tr>
                <th className="py-3 px-3 min-w-[220px] bg-slate-950">Study & Citation</th>
                <th className="py-3 px-3 min-w-[200px] bg-slate-950">Objective & Context</th>
                <th className="py-3 px-3 min-w-[180px] bg-slate-950">Method & Technology</th>
                <th className="py-3 px-3 min-w-[180px] bg-slate-950">Dataset & Variables</th>
                <th className="py-3 px-3 min-w-[220px] bg-slate-950">Outcome & Key Findings</th>
                <th className="py-3 px-3 min-w-[180px] bg-slate-950">Limitations & Gap</th>
                <th className="py-3 px-3 min-w-[80px] bg-slate-950 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {filteredPapers.map((paper) => {
                const ev = evidenceRecords[paper.id] || extractEvidenceFromPaper(paper);
                const isEditingThis = editingId === ev.id;

                return (
                  <tr key={paper.id} className="hover:bg-slate-800/30 transition-colors align-top">
                    {/* Paper info */}
                    <td className="py-3 px-3 space-y-1">
                      <div className="font-bold text-slate-100 leading-snug">
                        {paper.title}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {paper.authors?.slice(0, 2).join(', ')}{(paper.authors?.length || 0) > 2 ? ' et al.' : ''} ({paper.year || 'n.d.'})
                      </div>
                      <div className="text-[10px] font-mono text-sky-400 truncate max-w-[180px]">
                        {paper.doi ? `DOI: ${paper.doi}` : paper.journal || 'Journal'}
                      </div>
                    </td>

                    {/* Objective & Context */}
                    <td className="py-3 px-3 space-y-1">
                      {isEditingThis ? (
                        <textarea
                          value={editForm.objective || ''}
                          onChange={(e) => setEditForm({ ...editForm, objective: e.target.value })}
                          rows={3}
                          className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs"
                        />
                      ) : (
                        <div>
                          <p className="text-slate-300 leading-relaxed font-sans">{ev.objective}</p>
                          <div className="text-[10px] text-slate-400 font-mono mt-1">Context: {ev.researchContext}</div>
                        </div>
                      )}
                    </td>

                    {/* Method & Tech */}
                    <td className="py-3 px-3 space-y-1">
                      {isEditingThis ? (
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={editForm.technology || ''}
                            onChange={(e) => setEditForm({ ...editForm, technology: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-xs"
                          />
                          <textarea
                            value={editForm.method || ''}
                            onChange={(e) => setEditForm({ ...editForm, method: e.target.value })}
                            rows={2}
                            className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-xs"
                          />
                        </div>
                      ) : (
                        <div>
                          <span className="inline-block px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-mono font-bold">
                            {ev.technology}
                          </span>
                          <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{ev.method}</p>
                        </div>
                      )}
                    </td>

                    {/* Dataset & Variables */}
                    <td className="py-3 px-3 space-y-1">
                      <div className="text-slate-300 font-mono text-[11px]">{ev.dataset}</div>
                      <div className="text-[10px] text-slate-400">{ev.variables}</div>
                    </td>

                    {/* Outcome & Key Findings */}
                    <td className="py-3 px-3 space-y-1">
                      {isEditingThis ? (
                        <textarea
                          value={editForm.outcome || ''}
                          onChange={(e) => setEditForm({ ...editForm, outcome: e.target.value })}
                          rows={3}
                          className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs"
                        />
                      ) : (
                        <p className="text-slate-300 leading-relaxed font-sans">{ev.outcome}</p>
                      )}
                    </td>

                    {/* Limitations & Gaps */}
                    <td className="py-3 px-3 space-y-1">
                      <p className="text-[11px] text-slate-400 leading-relaxed">{ev.limitations}</p>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      {isEditingThis ? (
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleSaveEdit(paper.id)}
                            className="px-2 py-1 bg-amber-500 text-slate-950 font-bold text-[10px] rounded"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2 py-1 bg-slate-800 text-slate-400 text-[10px] rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEdit(ev)}
                          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded"
                          title="Edit Row"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
