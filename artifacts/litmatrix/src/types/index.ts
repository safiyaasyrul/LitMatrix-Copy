/**
 * ScholarPen SLR AI Platform - Core Domain Types
 * Fully aligned with PostgreSQL / Prisma Database Schema
 */

export type ProjectStatus = 'DRAFT' | 'SEARCHING' | 'SCREENING' | 'SYNTHESIS' | 'DRAFTING' | 'COMPLETED';

export type EvidenceStatus = 'Explicitly stated' | 'Strongly inferred' | 'Weakly inferred' | 'Not specified';

export type ScreeningOutcome = 'INCLUDE' | 'EXCLUDE' | 'MAYBE' | 'PENDING';

export type DuplicateStatus = 'PENDING' | 'CONFIRMED_DUPLICATE' | 'DISTINCT' | 'CONFIRMED_DISTINCT' | 'REVIEW_LATER';

export interface StructuredDecompositionItem {
  id: string;
  categoryKey: string; // e.g. "fieldOfStudy", "problemStatement"
  categoryLabel: string;
  value: string;
  confidence: number; // 0.0 - 1.0
  evidenceStatus: EvidenceStatus;
  notes?: string;
}

export interface TopicDecomposition {
  id: string;
  projectId: string;
  fieldOfStudy: string;
  problemStatement: string;
  contextSetting: string;
  objectOfStudy: string;
  phenomenonOutcome: string;
  technologiesMethods: string;
  reviewMethodology: string;
  geographicScope: string;
  temporalScope: string;
  keyResearchConcepts: string[];
  items: StructuredDecompositionItem[];
  isApproved: boolean;
  approvedAt?: string;
  modelUsed?: string;
}

export interface TaxonomyKeyword {
  id: string;
  term: string;
  type: 'CORE' | 'SYNONYM' | 'RELATED' | 'ABBREVIATION' | 'WILDCARD' | 'PHRASE' | 'TECHNICAL' | 'AMBIGUOUS';
  isSelected: boolean;
  notes?: string;
}

export interface TaxonomyConcept {
  id: string;
  name: string;
  keywords: TaxonomyKeyword[];
}

export interface TaxonomyCategory {
  id: string;
  name: string;
  orderIndex: number;
  concepts: TaxonomyConcept[];
}

export interface SearchStrategy {
  id: string;
  projectId: string;
  database: 'Scopus' | 'Web of Science' | 'Google Scholar' | 'PubMed' | 'IEEE Xplore' | 'Other';
  searchString: string;
  conceptGroups: {
    conceptName: string;
    booleanOperator: 'AND' | 'OR' | 'NOT';
    terms: string[];
  }[];
  booleanLogic: string;
  filters: {
    publicationTypes: string[];
    languages: string[];
    yearRange: { start: number; end: number };
    subjectAreas: string[];
  };
  rationale: string;
  expectedRecall: string;
  expectedPrecision: string;
  version: number;
  notes?: string;
  searchHistory?: {
    date: string;
    searchString: string;
    resultCountEstimate?: number;
    notes?: string;
  }[];
}

export interface PaperSource {
  id: string;
  paperId: string;
  sourceDatabase: 'Scopus' | 'Web of Science' | 'Google Scholar' | 'PubMed' | 'Other';
  sourceFile: string;
  originalRecord?: Record<string, unknown>;
  importedAt: string;
}

export interface Paper {
  id: string;
  projectId: string;
  title: string;
  normalizedTitle: string;
  authors: string[];
  abstract: string;
  year?: number;
  doi?: string;
  normalizedDoi?: string;
  journal?: string;
  normalizedJournal?: string;
  keywords: string[];
  volume?: string;
  issue?: string;
  startPage?: string;
  endPage?: string;
  issn?: string;
  url?: string;
  language?: string;
  documentType?: string; // Journal Article, Review Article, Conference Paper, Book Chapter, etc.
  publisher?: string;
  
  isMasterRecord: boolean;
  masterPaperId?: string;
  
  sources: PaperSource[];
  createdAt: string;
  updatedAt: string;
}

export interface DuplicateCandidate {
  id: string;
  projectId: string;
  paperAId: string;
  paperBId: string;
  paperA?: Paper;
  paperB?: Paper;
  titleSimilarity: number; // 0.0 - 1.0
  authorSimilarity: number;
  yearMatch: boolean;
  journalSimilarity: number;
  semanticSimilarity?: number;
  confidenceScore: number;
  matchReason: string;
  status: DuplicateStatus;
  reviewerNotes?: string;
  reviewedAt?: string;
}

export interface ScreeningCriteria {
  id: string;
  projectId: string;
  inclusionCriteria: string[];
  exclusionCriteria: string[];
  exclusionReasons: string[];
}

export interface ScreeningDecision {
  id: string;
  paperId: string;
  aiDecision: ScreeningOutcome;
  confidence: number;
  aiReason: string;
  supportingText?: string;
  potentialConcerns?: string;
  
  humanDecision: ScreeningOutcome;
  isOverridden: boolean;
  exclusionReason?: string;
  reviewerNotes?: string;
  reviewedAt?: string;
}

export interface EvidenceRecord {
  id: string;
  projectId: string;
  paperId: string;
  objective: string;
  researchContext: string;
  populationObject: string;
  method: string;
  technology: string;
  dataset: string;
  variables: string;
  outcome: string;
  keyFindings: string;
  limitations: string;
  researchGap: string;
  themeName: string;
  isExtracted: boolean;
  doi?: string;
  source?: string;
}

export interface Theme {
  id: string;
  projectId: string;
  name: string;
  description: string;
  paperIds: string[];
  keyConcepts: string[];
  methods: string[];
  outcomes: string[];
  researchTrends: string;
  limitations: string;
  colorTag: string;
}

export interface ResearchGap {
  id: string;
  projectId: string;
  title: string;
  description: string;
  category: 'Methodological' | 'Empirical' | 'Theoretical' | 'Technological' | 'Contextual';
  evidenceRef: string[]; // Paper IDs
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface PrismaRecord {
  id: string;
  projectId: string;
  recordsIdentified: number;
  recordsFromScopus: number;
  recordsFromWoS: number;
  recordsFromGoogleScholar: number;
  recordsFromOther: number;
  duplicateRecordsRemoved: number;
  recordsRemovedBeforeScreen: number;
  recordsScreened: number;
  recordsExcluded: number;
  reportsSoughtForRetrieval: number;
  reportsNotRetrieved: number;
  reportsAssessedEligibility: number;
  reportsExcludedWithReasons: Record<string, number>;
  studiesIncluded: number;
  lastCalculatedAt: string;
}

export interface ManuscriptSection {
  id: string;
  projectId: string;
  sectionKey: 'TITLE_ABSTRACT' | 'INTRO' | 'METHODOLOGY' | 'RESULTS' | 'SYNTHESIS' | 'DISCUSSION' | 'GAPS' | 'FUTURE' | 'CONCLUSION' | 'REFERENCES';
  title: string;
  content: string;
  version: number;
  orderIndex: number;
  updatedAt: string;
}

export interface Claim {
  id: string;
  claimCode: string; // e.g. "CLAIM-001"
  statement: string;
  confidence: number;
  verificationStatus: 'VERIFIED' | 'NEEDS_CHECK' | 'REVISED';
  supportingPaperIds: string[];
  quotes: {
    paperId: string;
    text: string;
    pageOrSection?: string;
  }[];
}

export interface AuditLog {
  id: string;
  projectId?: string;
  timestamp: string;
  action: string;
  entityType: string;
  entityId?: string;
  modelUsed?: string;
  promptIdentifier?: string;
  inputVersion?: string;
  researcherApproval: boolean;
  researcherEdits?: string;
  details: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  researcher: string;
  status: ProjectStatus;
  currentStep: number;
  currentStage?: number;
  createdAt: string;
  updatedAt: string;
  
  topicDecomposition?: TopicDecomposition;
  taxonomyCategories?: TaxonomyCategory[];
  searchStrategies?: SearchStrategy[];
  importedFiles?: ImportFileRecord[];
  papers: Paper[];
  duplicateCandidates: DuplicateCandidate[];
  screeningCriteria?: ScreeningCriteria;
  screeningDecisions: Record<string, ScreeningDecision>;
  evidenceRecords: Record<string, EvidenceRecord>;
  themes: Theme[];
  researchGaps: ResearchGap[];
  prismaRecord?: PrismaRecord;
  manuscriptSections: ManuscriptSection[];
  claims: Claim[];
  auditLogs: AuditLog[];
}

export interface ImportFileRecord {
  id: string;
  fileName: string;
  fileFormat: 'RIS' | 'CSV' | 'BibTeX' | 'NBIB' | 'TXT';
  sourceDatabase: 'Scopus' | 'Web of Science' | 'Google Scholar' | 'Other';
  gcsUri: string;
  recordCount: number;
  uploadedAt: string;
  fileSizeBytes?: number;
}
