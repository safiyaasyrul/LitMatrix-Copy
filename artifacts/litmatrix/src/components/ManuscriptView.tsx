'use client';

import React, { useState } from 'react';
import {
  Award,
  Download,
  FileCode,
  FileText,
  CheckCircle,
  ShieldCheck,
  Edit3,
  Save,
  Layers,
  ChevronRight,
  ExternalLink,
  Quote,
  Sparkles,
} from 'lucide-react';
import { Claim, ManuscriptSection, Paper, Project } from '../types';
import {
  exportToBibtex,
  exportToLatex,
  exportToMarkdown,
  generateFullManuscript,
} from '../services/manuscript';

interface ManuscriptViewProps {
  project: Project;
  onUpdateManuscript: (sections: ManuscriptSection[], claims: Claim[]) => void;
  onInspectClaim: (claim: Claim) => void;
}

export const ManuscriptView: React.FC<ManuscriptViewProps> = ({
  project,
  onUpdateManuscript,
  onInspectClaim,
}) => {
  // Ensure manuscript exists
  const manuscriptData =
    project.manuscriptSections?.length && project.claims?.length
      ? { sections: project.manuscriptSections, claims: project.claims }
      : generateFullManuscript(project);

  const [sections, setSections] = useState<ManuscriptSection[]>(manuscriptData.sections);
  const [claims, setClaims] = useState<Claim[]>(manuscriptData.claims);
  const [activeSectionId, setActiveSectionId] = useState<string>(sections[0]?.id || 'sec_title_abstract');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [exportFormat, setExportFormat] = useState<'MARKDOWN' | 'LATEX' | 'BIBTEX' | null>(null);

  const activeSection = sections.find((s) => s.id === activeSectionId) || sections[0];

  const handleStartEdit = () => {
    setEditContent(activeSection.content);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    const updated = sections.map((s) =>
      s.id === activeSection.id ? { ...s, content: editContent, updatedAt: new Date().toISOString() } : s
    );
    setSections(updated);
    onUpdateManuscript(updated, claims);
    setIsEditing(false);
  };

  const handleRegenerate = () => {
    const fresh = generateFullManuscript(project);
    setSections(fresh.sections);
    setClaims(fresh.claims);
    onUpdateManuscript(fresh.sections, fresh.claims);
  };

  const handleDownload = (type: 'MARKDOWN' | 'LATEX' | 'BIBTEX') => {
    let content = '';
    let filename = '';
    let mime = 'text/plain';

    if (type === 'MARKDOWN') {
      content = exportToMarkdown(sections);
      filename = `ScholarPen_Review_Manuscript_${project.id}.md`;
    } else if (type === 'LATEX') {
      content = exportToLatex(sections);
      filename = `ScholarPen_Review_Manuscript_${project.id}.tex`;
    } else if (type === 'BIBTEX') {
      content = exportToBibtex(project.papers || []);
      filename = `ScholarPen_References_${project.id}.bib`;
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-mono font-bold uppercase">
                Stage 10 • PRISMA Review Manuscript & Claim Verification
              </span>
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                100% Traceable Evidence Claims
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 mt-2">
              Academic Systematic Literature Review Manuscript
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Complete 8-section academic review paper structured according to journal submission standards. Every generated claim includes an auditable traceability tag linking to primary source quotes.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleRegenerate}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 text-xs font-semibold rounded-lg transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Re-Synthesize Manuscript</span>
            </button>

            <button
              onClick={() => handleDownload('MARKDOWN')}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Markdown (.md)</span>
            </button>

            <button
              onClick={() => handleDownload('LATEX')}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
            >
              <FileCode className="w-3.5 h-3.5 text-emerald-400" />
              <span>LaTeX (.tex)</span>
            </button>

            <button
              onClick={() => handleDownload('BIBTEX')}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>BibTeX (.bib)</span>
            </button>
          </div>
        </div>

        {/* Claim Verification Badges */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">
            Verified Claims in Manuscript:
          </span>
          {claims.map((claim) => (
            <button
              key={claim.id}
              onClick={() => onInspectClaim(claim)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold transition-colors"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>{claim.claimCode}</span>
              <span className="text-[10px] text-slate-400">({claim.supportingPaperIds.length} papers)</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Manuscript Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Section Table of Contents */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 h-fit">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 block mb-3">
            Manuscript Structure
          </span>

          <nav aria-label="Manuscript Sections" className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSectionId(section.id);
                  setIsEditing(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-between ${
                  activeSectionId === section.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="truncate">{section.title}</span>
                <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${activeSectionId === section.id ? 'text-slate-950' : 'text-slate-500'}`} />
              </button>
            ))}
          </nav>
        </div>

        {/* Right 3 Columns: Active Section Content Viewer / Editor */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-100">
              {activeSection.title}
            </h3>

            <div>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-lg transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Changes
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 bg-slate-800 text-slate-400 text-xs rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleStartEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Edit Section</span>
                </button>
              )}
            </div>
          </div>

          {isEditing ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={22}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-4 font-mono text-xs text-slate-200 leading-relaxed focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          ) : (
            <div className="prose prose-invert max-w-none text-slate-200 text-xs leading-relaxed space-y-4 font-sans">
              {activeSection.content.split('\n\n').map((paragraph, idx) => {
                // Check if paragraph is heading
                if (paragraph.startsWith('# ')) {
                  return (
                    <h1 key={idx} className="text-xl font-black text-slate-100 border-b border-slate-800 pb-2">
                      {paragraph.replace('# ', '')}
                    </h1>
                  );
                }
                if (paragraph.startsWith('## ')) {
                  return (
                    <h2 key={idx} className="text-base font-bold text-amber-400 pt-2">
                      {paragraph.replace('## ', '')}
                    </h2>
                  );
                }
                if (paragraph.startsWith('### ')) {
                  return (
                    <h3 key={idx} className="text-sm font-bold text-slate-200">
                      {paragraph.replace('### ', '')}
                    </h3>
                  );
                }

                // Render paragraph with clickable claim badges
                const parts = paragraph.split(/(\[CLAIM-\d+\])/g);
                return (
                  <p key={idx} className="text-slate-300 text-xs leading-relaxed">
                    {parts.map((part, pIdx) => {
                      const match = part.match(/\[(CLAIM-\d+)\]/);
                      if (match) {
                        const code = match[1];
                        const claimObj = claims.find((c) => c.claimCode === code);
                        return (
                          <button
                            key={pIdx}
                            onClick={() => claimObj && onInspectClaim(claimObj)}
                            className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-mono font-bold hover:bg-amber-500/30 transition-colors"
                            title="Click to inspect primary literature evidence and quotes"
                          >
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            <span>{part}</span>
                          </button>
                        );
                      }
                      return <span key={pIdx}>{part}</span>;
                    })}
                  </p>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
