/**
 * Durable State Persistence & Seed Project Data Store
 * Persists all projects, papers, screening decisions, and manuscripts locally in the browser
 * with instant sync, audit logging, and seed datasets.
 */

import { Project, AuditLog } from '../types';
import { calculatePrismaRecord } from './prismaFlow';
import { generateThematicClusters, extractEvidenceFromPaper, generateResearchGaps } from './synthesis';
import { generateFullManuscript } from './manuscript';

const STORAGE_KEY = 'scholarpen_projects_v2';
const ACTIVE_PROJECT_KEY = 'scholarpen_active_project_id';

export function getSamplePapers(projectId: string) {
  return [
    {
      id: `${projectId}_p1`,
      projectId,
      title: 'A hybrid physics-informed deep learning model for vessel fuel consumption prediction under fluctuating sea conditions',
      normalizedTitle: 'a hybrid physics informed deep learning model for vessel fuel consumption prediction under fluctuating sea conditions',
      authors: ['Wang, J.', 'Zhang, L.', 'Liu, H.', 'Petersen, E.'],
      abstract: 'Predicting vessel fuel consumption accurately is paramount for maritime decarbonization. We propose a physics-informed neural network (PINN) architecture combining hydrodynamic resistance equations with Long Short-Term Memory (LSTM) cells. Experimental evaluation on 18 months of high-frequency telemetry data from a 14,000 TEU container ship shows a 21.4% reduction in RMSE compared to pure data-driven baselines. The model preserves hydrodynamic boundary conditions even during extreme weather conditions.',
      year: 2024,
      doi: '10.1016/j.oceaneng.2024.116890',
      normalizedDoi: '10.1016/j.oceaneng.2024.116890',
      journal: 'Ocean Engineering',
      normalizedJournal: 'ocean engineering',
      keywords: ['Physics-informed neural network', 'Fuel consumption', 'Maritime decarbonization', 'Container ship', 'LSTM'],
      volume: '298',
      issue: '2',
      startPage: '116890',
      documentType: 'Journal Article',
      isMasterRecord: true,
      sources: [
        {
          id: 'src_1',
          paperId: `${projectId}_p1`,
          sourceDatabase: 'Scopus' as const,
          sourceFile: 'scopus_export_maritime.ris',
          importedAt: '2026-08-18T10:00:00Z',
        },
        {
          id: 'src_1b',
          paperId: `${projectId}_p1`,
          sourceDatabase: 'Web of Science' as const,
          sourceFile: 'wos_literature.csv',
          importedAt: '2026-08-18T10:05:00Z',
        },
      ],
      createdAt: '2026-08-18T10:00:00Z',
      updatedAt: '2026-08-18T10:00:00Z',
    },
    {
      id: `${projectId}_p2`,
      projectId,
      title: 'A Hybrid Physics-Informed Deep Learning Model for Vessel Fuel Consumption Prediction Under Fluctuating Sea Conditions',
      normalizedTitle: 'a hybrid physics informed deep learning model for vessel fuel consumption prediction under fluctuating sea conditions',
      authors: ['Wang, Jian', 'Zhang, Lei', 'Liu, Hong'],
      abstract: 'Predicting vessel fuel consumption is critical for decarbonization. We propose a hybrid physics-guided neural network for container ship operations.',
      year: 2024,
      doi: '10.1016/j.oceaneng.2024.116890',
      normalizedDoi: '10.1016/j.oceaneng.2024.116890',
      journal: 'Ocean Engineering',
      normalizedJournal: 'ocean engineering',
      keywords: ['Fuel consumption', 'PINN', 'Container ship'],
      documentType: 'Journal Article',
      isMasterRecord: false,
      sources: [
        {
          id: 'src_2',
          paperId: `${projectId}_p2`,
          sourceDatabase: 'Google Scholar' as const,
          sourceFile: 'scholar_citations.bib',
          importedAt: '2026-08-18T10:10:00Z',
        },
      ],
      createdAt: '2026-08-18T10:10:00Z',
      updatedAt: '2026-08-18T10:10:00Z',
    },
    {
      id: `${projectId}_p3`,
      projectId,
      title: 'Real-time greenhouse gas emission estimation and voyage speed profiling using automated identification system data and gradient boosting',
      normalizedTitle: 'real time greenhouse gas emission estimation and voyage speed profiling using automated identification system data and gradient boosting',
      authors: ['Alvarez, M.', 'Karlsson, T.', 'Dupont, C.'],
      abstract: 'Maritime transport contributes significantly to global greenhouse gas (GHG) emissions. This study introduces an automated pipeline utilizing global Automatic Identification System (AIS) trajectories and XGBoost ensembles to forecast CO2 emission intensity across European feeder routes. Results indicate an R2 of 0.93 across 4,200 voyages.',
      year: 2023,
      doi: '10.1016/j.trd.2023.103772',
      normalizedDoi: '10.1016/j.trd.2023.103772',
      journal: 'Transportation Research Part D: Transport and Environment',
      normalizedJournal: 'transportation research part d transport and environment',
      keywords: ['AIS telemetry', 'Greenhouse gas emissions', 'XGBoost', 'Voyage speed profiling', 'Decarbonization'],
      volume: '119',
      startPage: '103772',
      documentType: 'Journal Article',
      isMasterRecord: true,
      sources: [
        {
          id: 'src_3',
          paperId: `${projectId}_p3`,
          sourceDatabase: 'Scopus' as const,
          sourceFile: 'scopus_export_maritime.ris',
          importedAt: '2026-08-18T10:00:00Z',
        },
      ],
      createdAt: '2026-08-18T10:00:00Z',
      updatedAt: '2026-08-18T10:00:00Z',
    },
    {
      id: `${projectId}_p4`,
      projectId,
      title: 'Digital twins for ocean-going vessels: Framework, edge computing architecture, and operational emission monitoring',
      normalizedTitle: 'digital twins for ocean going vessels framework edge computing architecture and operational emission monitoring',
      authors: ['Chen, Y.', 'Smith, R.', 'Nakamura, K.'],
      abstract: 'Digital twin technology offers continuous mirroring of ship engine status and environmental conditions. We develop an edge computing framework deployed onboard a bulk carrier that processes 50Hz sensor streams to calculate Carbon Intensity Indicator (CII) in real-time. The edge implementation reduced transmission bandwidth by 92% while maintaining prediction precision.',
      year: 2024,
      doi: '10.1016/j.aei.2024.102450',
      normalizedDoi: '10.1016/j.aei.2024.102450',
      journal: 'Advanced Engineering Informatics',
      normalizedJournal: 'advanced engineering informatics',
      keywords: ['Digital Twin', 'Edge computing', 'CII calculation', 'Sensor telemetry', 'Bulk carrier'],
      volume: '60',
      startPage: '102450',
      documentType: 'Journal Article',
      isMasterRecord: true,
      sources: [
        {
          id: 'src_4',
          paperId: `${projectId}_p4`,
          sourceDatabase: 'Web of Science' as const,
          sourceFile: 'wos_literature.csv',
          importedAt: '2026-08-18T10:05:00Z',
        },
      ],
      createdAt: '2026-08-18T10:05:00Z',
      updatedAt: '2026-08-18T10:05:00Z',
    },
    {
      id: `${projectId}_p5`,
      projectId,
      title: 'A comparative benchmark of machine learning algorithms for ship propulsion power prediction',
      normalizedTitle: 'a comparative benchmark of machine learning algorithms for ship propulsion power prediction',
      authors: ['Hansen, B.', 'Olsen, S.', 'Kristiansen, M.'],
      abstract: 'Benchmarking random forests, support vector machines, and artificial neural networks on full-scale noon-report and continuous logging data. Findings illustrate that high-frequency sensor data yields 14% higher predictive stability over traditional manual noon reports.',
      year: 2022,
      doi: '10.1080/20464177.2022.2089100',
      normalizedDoi: '10.1080/20464177.2022.2089100',
      journal: 'Journal of Marine Engineering & Technology',
      normalizedJournal: 'journal of marine engineering technology',
      keywords: ['Benchmarking', 'Ship propulsion', 'Sensor data', 'Random forest', 'Neural network'],
      volume: '21',
      issue: '4',
      startPage: '210',
      endPage: '224',
      documentType: 'Journal Article',
      isMasterRecord: true,
      sources: [
        {
          id: 'src_5',
          paperId: `${projectId}_p5`,
          sourceDatabase: 'Scopus' as const,
          sourceFile: 'scopus_export_maritime.ris',
          importedAt: '2026-08-18T10:00:00Z',
        },
      ],
      createdAt: '2026-08-18T10:00:00Z',
      updatedAt: '2026-08-18T10:00:00Z',
    },
    {
      id: `${projectId}_p6`,
      projectId,
      title: 'Macroeconomic impact of EU Emission Trading System on Mediterranean trade routes',
      normalizedTitle: 'macroeconomic impact of eu emission trading system on mediterranean trade routes',
      authors: ['Rossi, G.', 'Ferrari, A.'],
      abstract: 'An econometric assessment of freight rates and port competitiveness under newly introduced maritime carbon taxation frameworks.',
      year: 2023,
      doi: '10.1016/j.marpol.2023.105612',
      normalizedDoi: '10.1016/j.marpol.2023.105612',
      journal: 'Marine Policy',
      normalizedJournal: 'marine policy',
      keywords: ['EU ETS', 'Carbon tax', 'Maritime economics', 'Trade policy'],
      documentType: 'Journal Article',
      isMasterRecord: true,
      sources: [
        {
          id: 'src_6',
          paperId: `${projectId}_p6`,
          sourceDatabase: 'Scopus' as const,
          sourceFile: 'scopus_export_maritime.ris',
          importedAt: '2026-08-18T10:00:00Z',
        },
      ],
      createdAt: '2026-08-18T10:00:00Z',
      updatedAt: '2026-08-18T10:00:00Z',
    },
    {
      id: `${projectId}_p7`,
      projectId,
      title: 'Deep reinforcement learning for weather routing and voyage trajectory optimization under carbon intensity constraints',
      normalizedTitle: 'deep reinforcement learning for weather routing and voyage trajectory optimization under carbon intensity constraints',
      authors: ['Park, S.', 'Kim, D.', 'Lee, J.'],
      abstract: 'Dynamic weather routing is essential for maritime fuel minimization. We present a deep Q-learning and proximal policy optimization (PPO) agent that navigates complex ocean wave fields while maintaining strict arrival windows. The agent achieved a 9.6% fuel reduction across North Pacific passages.',
      year: 2024,
      doi: '10.1016/j.ress.2024.109981',
      normalizedDoi: '10.1016/j.ress.2024.109981',
      journal: 'Reliability Engineering & System Safety',
      normalizedJournal: 'reliability engineering system safety',
      keywords: ['Reinforcement learning', 'Weather routing', 'Fuel optimization', 'PPO agent', 'North Pacific'],
      volume: '245',
      startPage: '109981',
      documentType: 'Journal Article',
      isMasterRecord: true,
      sources: [
        {
          id: 'src_7',
          paperId: `${projectId}_p7`,
          sourceDatabase: 'Scopus' as const,
          sourceFile: 'scopus_export_maritime.ris',
          importedAt: '2026-08-18T10:00:00Z',
        },
      ],
      createdAt: '2026-08-18T10:00:00Z',
      updatedAt: '2026-08-18T10:00:00Z',
    },
  ];
}

export function createInitialSeedProjects(): Project[] {
  const p1Id = 'proj_maritime_ai_slr';
  const papers = getSamplePapers(p1Id);
  const now = new Date().toISOString();

  // Create duplicate candidate for p1 and p2
  const duplicateCandidates = [
    {
      id: 'dup_p1_p2',
      projectId: p1Id,
      paperAId: `${p1Id}_p1`,
      paperBId: `${p1Id}_p2`,
      paperA: papers[0],
      paperB: papers[1],
      titleSimilarity: 0.99,
      authorSimilarity: 0.90,
      yearMatch: true,
      journalSimilarity: 1.0,
      confidenceScore: 1.0,
      matchReason: 'Exact Normalized DOI Match (10.1016/j.oceaneng.2024.116890)',
      status: 'CONFIRMED_DUPLICATE' as const,
      reviewedAt: now,
    },
  ];

  const screeningCriteria = {
    id: `crit_${p1Id}`,
    projectId: p1Id,
    inclusionCriteria: [
      'Peer-reviewed studies developing or validating computational, machine learning, or AI models for vessel fuel or emission prediction',
      'Reporting quantitative empirical performance metrics (e.g. RMSE, MAE, R², fuel savings %)',
      'Utilizing vessel sensor telemetry, AIS data, or hydrodynamic model datasets',
      'Published in English from 2018 to present',
    ],
    exclusionCriteria: [
      'Purely economic, legal, or geopolitical policy discussions without quantitative modeling',
      'Non-maritime transport applications (e.g. automotive, aviation)',
      'Review articles or editorial comments lacking primary empirical data',
      'Duplicate publications or unverified white papers',
    ],
    exclusionReasons: [
      'Wrong population / domain (non-maritime)',
      'Wrong context (purely legal/economic policy)',
      'Wrong study type (editorial / non-empirical)',
      'Lack of quantitative validation metrics',
      'Outside date range (< 2018)',
      'Duplicate record',
    ],
  };

  const screeningDecisions: Record<string, any> = {
    [`${p1Id}_p1`]: {
      id: `screen_${p1Id}_p1`,
      paperId: `${p1Id}_p1`,
      aiDecision: 'INCLUDE',
      confidence: 0.98,
      aiReason: 'Direct development of hybrid PINN and LSTM for container vessel fuel consumption prediction with empirical validation.',
      supportingText: 'We propose a physics-informed neural network (PINN) architecture combining hydrodynamic resistance equations with Long Short-Term Memory (LSTM) cells. Experimental evaluation on 18 months of telemetry data shows a 21.4% reduction in RMSE.',
      humanDecision: 'INCLUDE',
      isOverridden: false,
    },
    [`${p1Id}_p3`]: {
      id: `screen_${p1Id}_p3`,
      paperId: `${p1Id}_p3`,
      aiDecision: 'INCLUDE',
      confidence: 0.94,
      aiReason: 'Applies XGBoost and AIS telemetry to forecast maritime GHG emissions with quantitative R² evaluation.',
      supportingText: 'Results indicate an R2 of 0.93 across 4,200 voyages.',
      humanDecision: 'INCLUDE',
      isOverridden: false,
    },
    [`${p1Id}_p4`]: {
      id: `screen_${p1Id}_p4`,
      paperId: `${p1Id}_p4`,
      aiDecision: 'INCLUDE',
      confidence: 0.95,
      aiReason: 'Evaluates edge computing and digital twin telemetry for real-time CII and operational emission monitoring.',
      supportingText: 'The edge implementation reduced transmission bandwidth by 92% while maintaining prediction precision.',
      humanDecision: 'INCLUDE',
      isOverridden: false,
    },
    [`${p1Id}_p5`]: {
      id: `screen_${p1Id}_p5`,
      paperId: `${p1Id}_p5`,
      aiDecision: 'INCLUDE',
      confidence: 0.91,
      aiReason: 'Empirical benchmark comparing Random Forest, SVM, and ANN for ship propulsion power.',
      supportingText: 'Findings illustrate that high-frequency sensor data yields 14% higher predictive stability over traditional manual noon reports.',
      humanDecision: 'INCLUDE',
      isOverridden: false,
    },
    [`${p1Id}_p6`]: {
      id: `screen_${p1Id}_p6`,
      paperId: `${p1Id}_p6`,
      aiDecision: 'EXCLUDE',
      confidence: 0.92,
      aiReason: 'Focuses on macroeconomic and econometric trade policy rather than computational modeling algorithms.',
      supportingText: 'An econometric assessment of freight rates and port competitiveness under newly introduced maritime carbon taxation frameworks.',
      humanDecision: 'EXCLUDE',
      isOverridden: false,
      exclusionReason: 'Wrong context (purely legal/economic policy)',
    },
    [`${p1Id}_p7`]: {
      id: `screen_${p1Id}_p7`,
      paperId: `${p1Id}_p7`,
      aiDecision: 'INCLUDE',
      confidence: 0.96,
      aiReason: 'Deep reinforcement learning for weather routing and voyage fuel optimization under CII constraints.',
      supportingText: 'The agent achieved a 9.6% fuel reduction across North Pacific passages.',
      humanDecision: 'INCLUDE',
      isOverridden: false,
    },
  };

  const includedMasterPapers = papers.filter((p) => p.isMasterRecord && screeningDecisions[p.id]?.humanDecision === 'INCLUDE');
  const themes = generateThematicClusters(includedMasterPapers, p1Id);
  const researchGaps = generateResearchGaps({ papers } as any);

  const evidenceRecords: Record<string, any> = {};
  includedMasterPapers.forEach((p) => {
    evidenceRecords[p.id] = extractEvidenceFromPaper(p, 'Deep Learning & Sequence Modeling');
  });

  const auditLogs: AuditLog[] = [
    {
      id: 'log_1',
      projectId: p1Id,
      timestamp: '2026-08-18T10:00:00Z',
      action: 'PROJECT_CREATED',
      entityType: 'Project',
      entityId: p1Id,
      researcherApproval: true,
      details: 'Project initialized for Systematic Literature Review on Maritime AI.',
    },
    {
      id: 'log_2',
      projectId: p1Id,
      timestamp: '2026-08-18T10:05:00Z',
      action: 'TOPIC_DECOMPOSITION_APPROVED',
      entityType: 'TopicDecomposition',
      modelUsed: 'Topic Decomposition Agent',
      researcherApproval: true,
      details: 'Researcher approved 10-dimension structured topic decomposition.',
    },
    {
      id: 'log_3',
      projectId: p1Id,
      timestamp: '2026-08-18T10:15:00Z',
      action: 'DEDUPLICATION_EXECUTED',
      entityType: 'Paper',
      modelUsed: 'Deterministic Deduplication Engine',
      researcherApproval: true,
      details: 'Deduplication executed: 1 confirmed duplicate merged with full provenance.',
    },
  ];

  const project1: Project = {
    id: p1Id,
    title: 'AI-Driven Predictive Modeling for Maritime Greenhouse Gas Emissions and Fuel Consumption: A Systematic Literature Review',
    description: 'A comprehensive PRISMA 2020 systematic review synthesizing machine learning, physics-informed neural networks, and digital twin telemetry across commercial shipping operations.',
    researcher: 'Dr. Nur Diyana (Lead Reviewer)',
    status: 'COMPLETED',
    currentStep: 10,
    createdAt: '2026-08-18T09:30:00Z',
    updatedAt: now,
    papers,
    duplicateCandidates,
    screeningCriteria,
    screeningDecisions,
    evidenceRecords,
    themes,
    researchGaps,
    manuscriptSections: [],
    claims: [],
    auditLogs,
  };

  // Generate PRISMA calculations & Manuscript for project 1
  project1.prismaRecord = calculatePrismaRecord(project1);
  const manuscriptResult = generateFullManuscript(project1);
  project1.manuscriptSections = manuscriptResult.sections;
  project1.claims = manuscriptResult.claims;

  // Project 2: Blank / Clinical AI SLR
  const p2Id = 'proj_clinical_vision_slr';
  const project2: Project = {
    id: p2Id,
    title: 'Transformer Architectures and Vision-Language Models in Clinical Diagnostic Decision Support: An SLR',
    description: 'Systematic investigation of multimodal medical foundation models, diagnostic accuracy, and clinician trust factors.',
    researcher: 'Dr. Nur Diyana',
    status: 'SEARCHING',
    currentStep: 4,
    createdAt: '2026-08-18T11:00:00Z',
    updatedAt: now,
    papers: [],
    duplicateCandidates: [],
    screeningDecisions: {},
    evidenceRecords: {},
    themes: [],
    researchGaps: [],
    manuscriptSections: [],
    claims: [],
    auditLogs: [
      {
        id: 'log_p2_1',
        projectId: p2Id,
        timestamp: '2026-08-18T11:00:00Z',
        action: 'PROJECT_CREATED',
        entityType: 'Project',
        entityId: p2Id,
        researcherApproval: true,
        details: 'Project initialized for Clinical Vision-Language Models SLR.',
      },
    ],
  };

  return [project1, project2];
}

export function loadProjects(): Project[] {
  if (typeof window === 'undefined') return createInitialSeedProjects();
  
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = createInitialSeedProjects();
      saveProjects(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const initial = createInitialSeedProjects();
      saveProjects(initial);
      return initial;
    }
    return parsed;
  } catch (e) {
    console.error('Failed to load projects from storage:', e);
    return createInitialSeedProjects();
  }
}

export function saveProjects(projects: Project[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error('Failed to save projects to storage:', e);
  }
}

export function saveProject(project: Project): void {
  const currentList = loadProjects();
  const exists = currentList.some((p) => p.id === project.id);
  const updatedList = exists
    ? currentList.map((p) => (p.id === project.id ? project : p))
    : [project, ...currentList];
  saveProjects(updatedList);
}

export function createNewProject(title: string, description?: string): Project {
  const newId = `proj_${Date.now()}`;
  const now = new Date().toISOString();

  const newProject: Project = {
    id: newId,
    title,
    description: description || 'Systematic Literature Review on ' + title,
    researcher: 'Lead Investigator',
    status: 'DRAFT',
    currentStep: 1,
    currentStage: 1,
    createdAt: now,
    updatedAt: now,
    importedFiles: [],
    papers: [],
    duplicateCandidates: [],
    screeningDecisions: {},
    evidenceRecords: {},
    themes: [],
    researchGaps: [],
    manuscriptSections: [],
    claims: [],
    auditLogs: [
      {
        id: `log_${Date.now()}`,
        projectId: newId,
        timestamp: now,
        action: 'PROJECT_CREATED',
        entityType: 'Project',
        entityId: newId,
        researcherApproval: true,
        details: `Project "${title}" initialized.`,
      },
    ],
  };

  return newProject;
}

export function logAuditEvent(
  projectId: string,
  action: string,
  entityType: string,
  entityId?: string,
  details?: string,
  modelUsed?: string,
  researcherApproval: boolean = true
): void {
  const projects = loadProjects();
  const proj = projects.find((p) => p.id === projectId);
  if (!proj) return;

  const newLog: AuditLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    projectId,
    action,
    entityType,
    entityId,
    details: details || `Performed ${action} on ${entityType}`,
    modelUsed,
    researcherApproval,
    timestamp: new Date().toISOString(),
  };

  const updatedLogs = [newLog, ...(proj.auditLogs || [])];
  const updatedProj = { ...proj, auditLogs: updatedLogs, updatedAt: new Date().toISOString() };
  saveProject(updatedProj);
}

export function getActiveProjectId(): string {

  if (typeof window === 'undefined') return 'proj_maritime_ai_slr';
  return localStorage.getItem(ACTIVE_PROJECT_KEY) || 'proj_maritime_ai_slr';
}

export function setActiveProjectId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_PROJECT_KEY, id);
}
