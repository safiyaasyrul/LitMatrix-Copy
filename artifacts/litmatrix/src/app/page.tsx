'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { StageNavigator } from '../components/StageNavigator';
import { ProjectOverview } from '../components/ProjectOverview';
import { TopicDecompositionView } from '../components/TopicDecompositionView';
import { TaxonomyView } from '../components/TaxonomyView';
import { SearchStrategyView } from '../components/SearchStrategyView';
import { LiteratureImportView } from '../components/LiteratureImportView';
import { DeduplicationView } from '../components/DeduplicationView';
import { ScreeningView } from '../components/ScreeningView';
import { PrismaFlowView } from '../components/PrismaFlowView';
import { EvidenceMatrixView } from '../components/EvidenceMatrixView';
import { SynthesisGapsView } from '../components/SynthesisGapsView';
import { ManuscriptView } from '../components/ManuscriptView';
import { ClaimInspectorModal } from '../components/ClaimInspectorModal';
import { AuditLogModal } from '../components/AuditLogModal';
import { AgentStatusModal } from '../components/AgentStatusModal';

import {
  Claim,
  DuplicateCandidate,
  EvidenceRecord,
  ImportFileRecord,
  ManuscriptSection,
  Paper,
  PrismaRecord,
  Project,
  ResearchGap,
  ScreeningCriteria,
  ScreeningDecision,
  TaxonomyCategory,
  Theme,
  TopicDecomposition,
} from '../types';
import {
  loadProjects,
  saveProject,
  saveProjects,
  createNewProject,
  logAuditEvent,
} from '../services/storage';
import { calculatePrismaRecord } from '../services/prismaFlow';

export default function ScholarPenApp() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [activeStage, setActiveStage] = useState<number>(0);

  // Modals state
  const [inspectedClaim, setInspectedClaim] = useState<Claim | null>(null);
  const [showAuditLogs, setShowAuditLogs] = useState<boolean>(false);
  const [showAgentStatus, setShowAgentStatus] = useState<boolean>(false);

  // Load from local storage on mount
  useEffect(() => {
    const loaded = loadProjects();
    setProjects(loaded);
    if (loaded.length > 0) {
      setActiveProjectId(loaded[0].id);
      setActiveStage(loaded[0].currentStage || 0);
    }
  }, []);

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];

  const updateActiveProject = (updated: Project) => {
    const nextList = projects.map((p) => (p.id === updated.id ? updated : p));
    setProjects(nextList);
    saveProject(updated);
  };

  const handleStageSelect = (stageNum: number) => {
    setActiveStage(stageNum);
    if (activeProject) {
      const updated = { ...activeProject, currentStage: stageNum };
      updateActiveProject(updated);
    }
  };

  const handleCreateNewProject = (title: string, description: string) => {
    const newProj = createNewProject(title, description);
    const nextList = [newProj, ...projects];
    setProjects(nextList);
    setActiveProjectId(newProj.id);
    setActiveStage(1);
    saveProjects(nextList);
  };

  if (!activeProject) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono text-xs">
        Initializing ScholarPen SLR Platform...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30">
      {/* Top Header Navigation */}
      <Navbar
        projects={projects}
        activeProject={activeProject}
        onSelectProject={(projectId) => {
          const project = projects.find((item) => item.id === projectId);
          setActiveProjectId(projectId);
          setActiveStage(project?.currentStage || 0);
        }}
        onCreateProject={handleCreateNewProject}
        onOpenAuditLogs={() => setShowAuditLogs(true)}
        onOpenAgentStatus={() => setShowAgentStatus(true)}
      />

      {/* Main App Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* SLR 10-Stage Workflow Navigator */}
        <StageNavigator
          currentStage={activeStage}
          onSelectStage={handleStageSelect}
        />

        {/* View Switcher by Stage */}
        <main className="transition-opacity duration-200">
          {activeStage === 0 && (
            <ProjectOverview
              project={activeProject}
              onUpdateProject={(updates) =>
                updateActiveProject({
                  ...activeProject,
                  ...updates,
                  updatedAt: updates.updatedAt || new Date().toISOString(),
                })
              }
              onNextStage={() => handleStageSelect(1)}
            />
          )}

          {activeStage === 1 && (
            <TopicDecompositionView
              project={activeProject}
              onUpdateDecomposition={(decomp: TopicDecomposition) => {
                const updated: Project = {
                  ...activeProject,
                  topicDecomposition: decomp,
                  updatedAt: new Date().toISOString(),
                };
                updateActiveProject(updated);
                logAuditEvent(
                  activeProject.id,
                  'TOPIC_DECOMPOSITION_APPROVED',
                  'TopicDecomposition',
                  decomp.id,
                  'Updated 10-dimension research scope decomposition.',
                  decomp.modelUsed,
                  decomp.isApproved
                );
              }}
              onNextStage={() => handleStageSelect(2)}
            />
          )}

          {activeStage === 2 && (
            <TaxonomyView
              project={activeProject}
              onUpdateTaxonomy={(categories: TaxonomyCategory[]) => {
                const updated: Project = {
                  ...activeProject,
                  taxonomyCategories: categories,
                  updatedAt: new Date().toISOString(),
                };
                updateActiveProject(updated);
                logAuditEvent(
                  activeProject.id,
                  'TAXONOMY_UPDATED',
                  'TaxonomyCategory',
                  `tax_${activeProject.id}`,
                  `Updated search keyword taxonomy with ${categories.length} facets.`,
                  'Taxonomy & Keyword Agent'
                );
              }}
              onNextStage={() => handleStageSelect(3)}
            />
          )}

          {activeStage === 3 && (
            <SearchStrategyView
              project={activeProject}
              onUpdateSearchStrategies={(strategies) => {
                const updated: Project = {
                  ...activeProject,
                  searchStrategies: strategies,
                  updatedAt: new Date().toISOString(),
                };
                updateActiveProject(updated);
                logAuditEvent(
                  activeProject.id,
                  'SEARCH_STRATEGY_GENERATED',
                  'SearchStrategy',
                  `strat_${activeProject.id}`,
                  `Calibrated search query strings across ${strategies.length} academic databases.`,
                  'Search Strategy Agent'
                );
              }}
              onNextStage={() => handleStageSelect(4)}
            />
          )}

          {activeStage === 4 && (
            <LiteratureImportView
              project={activeProject}
              onAddPapers={(newPapers: Paper[], fileRecord: ImportFileRecord) => {
                const currentPapers = activeProject.papers || [];
                const mergedPapers = [...currentPapers, ...newPapers];
                const updatedFiles = [...(activeProject.importedFiles || []), fileRecord];

                const updated: Project = {
                  ...activeProject,
                  papers: mergedPapers,
                  importedFiles: updatedFiles,
                  updatedAt: new Date().toISOString(),
                };

                // Automatically update PRISMA counts
                updated.prismaRecord = calculatePrismaRecord(updated);

                updateActiveProject(updated);
                logAuditEvent(
                  activeProject.id,
                  'LITERATURE_IMPORTED',
                  'ImportFile',
                  fileRecord.id,
                  `Imported ${fileRecord.recordCount} papers from ${fileRecord.fileName} (${fileRecord.sourceDatabase}).`
                );
              }}
              onNextStage={() => handleStageSelect(5)}
            />
          )}

          {activeStage === 5 && (
            <DeduplicationView
              project={activeProject}
              onUpdateDeduplication={(
                candidates: DuplicateCandidate[],
                masterPapers: Paper[]
              ) => {
                const updated: Project = {
                  ...activeProject,
                  duplicateCandidates: candidates,
                  updatedAt: new Date().toISOString(),
                };

                // Update master flags on paper items
                const masterIds = new Set(masterPapers.map((p) => p.id));
                updated.papers = (activeProject.papers || []).map((p) => ({
                  ...p,
                  isMasterRecord: masterIds.has(p.id),
                }));

                updated.prismaRecord = calculatePrismaRecord(updated);
                updateActiveProject(updated);
                logAuditEvent(
                  activeProject.id,
                  'DEDUPLICATION_EXECUTED',
                  'DuplicateCandidate',
                  `dedup_${activeProject.id}`,
                  `Evaluated ${candidates.length} duplicate pairs across multi-tier deterministic engine.`
                );
              }}
              onNextStage={() => handleStageSelect(6)}
            />
          )}

          {activeStage === 6 && (
            <ScreeningView
              project={activeProject}
              onUpdateScreeningDecisions={(decisions: Record<string, ScreeningDecision>) => {
                const updated: Project = {
                  ...activeProject,
                  screeningDecisions: decisions,
                  updatedAt: new Date().toISOString(),
                };
                updated.prismaRecord = calculatePrismaRecord(updated);
                updateActiveProject(updated);
                logAuditEvent(
                  activeProject.id,
                  'SCREENING_DECISION_UPDATED',
                  'ScreeningDecision',
                  `screen_${activeProject.id}`,
                  `Screened ${Object.keys(decisions).length} candidate papers against inclusion criteria.`
                );
              }}
              onUpdateCriteria={(criteria: ScreeningCriteria) => {
                const updated: Project = {
                  ...activeProject,
                  screeningCriteria: criteria,
                  updatedAt: new Date().toISOString(),
                };
                updateActiveProject(updated);
              }}
              onNextStage={() => handleStageSelect(7)}
            />
          )}

          {activeStage === 7 && (
            <PrismaFlowView
              project={activeProject}
              onUpdatePrisma={(record: PrismaRecord) => {
                const updated: Project = {
                  ...activeProject,
                  prismaRecord: record,
                  updatedAt: new Date().toISOString(),
                };
                updateActiveProject(updated);
              }}
              onNextStage={() => handleStageSelect(8)}
            />
          )}

          {activeStage === 8 && (
            <EvidenceMatrixView
              project={activeProject}
              onUpdateEvidenceRecords={(records: Record<string, EvidenceRecord>) => {
                const updated: Project = {
                  ...activeProject,
                  evidenceRecords: records,
                  updatedAt: new Date().toISOString(),
                };
                updateActiveProject(updated);
                logAuditEvent(
                  activeProject.id,
                  'EVIDENCE_MATRIX_EXTRACTED',
                  'EvidenceRecord',
                  `ev_${activeProject.id}`,
                  `Updated 14-dimension evidence matrix across included studies.`
                );
              }}
              onNextStage={() => handleStageSelect(9)}
            />
          )}

          {activeStage === 9 && (
            <SynthesisGapsView
              project={activeProject}
              onUpdateThemes={(themes: Theme[]) => {
                const updated: Project = {
                  ...activeProject,
                  themes,
                  updatedAt: new Date().toISOString(),
                };
                updateActiveProject(updated);
              }}
              onUpdateGaps={(gaps: ResearchGap[]) => {
                const updated: Project = {
                  ...activeProject,
                  researchGaps: gaps,
                  updatedAt: new Date().toISOString(),
                };
                updateActiveProject(updated);
              }}
              onNextStage={() => handleStageSelect(10)}
            />
          )}

          {activeStage === 10 && (
            <ManuscriptView
              project={activeProject}
              onUpdateManuscript={(sections: ManuscriptSection[], claims: Claim[]) => {
                const updated: Project = {
                  ...activeProject,
                  manuscriptSections: sections,
                  claims,
                  updatedAt: new Date().toISOString(),
                };
                updateActiveProject(updated);
                logAuditEvent(
                  activeProject.id,
                  'MANUSCRIPT_GENERATED',
                  'ManuscriptSection',
                  `ms_${activeProject.id}`,
                  `Synthesized 8-section PRISMA review manuscript with claim traceability.`
                );
              }}
              onInspectClaim={(claim: Claim) => setInspectedClaim(claim)}
            />
          )}
        </main>
      </div>

      {/* Global Inspector Modals */}
      <ClaimInspectorModal
        claim={inspectedClaim}
        project={activeProject}
        onClose={() => setInspectedClaim(null)}
      />

      {showAuditLogs && (
        <AuditLogModal
          project={activeProject}
          onClose={() => setShowAuditLogs(false)}
        />
      )}

      {showAgentStatus && (
        <AgentStatusModal onClose={() => setShowAgentStatus(false)} />
      )}
    </div>
  );
}
