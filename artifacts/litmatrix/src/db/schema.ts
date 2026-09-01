import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  topicDecomposition: text('topic_decomposition', { mode: 'json' }).$type<any>(),
  taxonomy: text('taxonomy', { mode: 'json' }).$type<any>(),
  searchStrings: text('search_strings', { mode: 'json' }).$type<any>(),
  reviewBlueprint: text('review_blueprint', { mode: 'json' }).$type<any>(),
  draftPaper: text('draft_paper'),
  researchQuestion: text('research_question'),
  reviewType: text('review_type'),
  objectives: text('objectives', { mode: 'json' }).$type<string[]>(),
  inclusionCriteria: text('inclusion_criteria', { mode: 'json' }).$type<string[]>(),
  exclusionCriteria: text('exclusion_criteria', { mode: 'json' }).$type<string[]>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const papers = sqliteTable('papers', {
  id: text('id').primaryKey(),
  projectId: text('project_id').references(() => projects.id).notNull(),
  title: text('title').notNull(),
  normalizedTitle: text('normalized_title'),
  authors: text('authors', { mode: 'json' }).$type<string[]>(),
  year: text('year'),
  doi: text('doi'),
  abstract: text('abstract'),
  journal: text('journal'),
  keywords: text('keywords', { mode: 'json' }).$type<string[]>(),
  sources: text('sources', { mode: 'json' }).$type<string[]>(),
  duplicateStatus: text('duplicate_status'), // e.g. "unique", "duplicate", "possible_duplicate"
  masterPaperId: text('master_paper_id'),
});

export const screenings = sqliteTable('screenings', {
  id: text('id').primaryKey(),
  paperId: text('paper_id').references(() => papers.id).notNull(),
  aiDecision: text('ai_decision'), // INCLUDE, EXCLUDE, MAYBE
  aiConfidence: integer('ai_confidence'),
  aiReason: text('ai_reason'),
  humanDecision: text('human_decision'), // INCLUDE, EXCLUDE, MAYBE
  exclusionReason: text('exclusion_reason'),
  reviewedBy: text('reviewed_by'),
  reviewedAt: integer('reviewed_at', { mode: 'timestamp' }),
});

export const evidences = sqliteTable('evidences', {
  id: text('id').primaryKey(),
  paperId: text('paper_id').references(() => papers.id).notNull(),
  field: text('field').notNull(),
  value: text('value'),
  confidence: text('confidence'),
  sourceText: text('source_text'),
});

export const themes = sqliteTable('themes', {
  id: text('id').primaryKey(),
  projectId: text('project_id').references(() => projects.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
});

export const paperThemes = sqliteTable('paper_themes', {
  paperId: text('paper_id').references(() => papers.id).notNull(),
  themeId: text('theme_id').references(() => themes.id).notNull(),
  confidence: text('confidence'),
});

export const researchGaps = sqliteTable('research_gaps', {
  id: text('id').primaryKey(),
  projectId: text('project_id').references(() => projects.id).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  supportingPaperIds: text('supporting_paper_ids', { mode: 'json' }).$type<string[]>(),
  confidence: text('confidence'),
  humanValidated: integer('human_validated', { mode: 'boolean' }).default(false),
});

export const reviewSections = sqliteTable('review_sections', {
  id: text('id').primaryKey(),
  projectId: text('project_id').references(() => projects.id).notNull(),
  title: text('title').notNull(),
  content: text('content'),
  order: integer('order'),
});

export const claims = sqliteTable('claims', {
  id: text('id').primaryKey(),
  reviewSectionId: text('review_section_id').references(() => reviewSections.id).notNull(),
  claimText: text('claim_text').notNull(),
  supportingPaperIds: text('supporting_paper_ids', { mode: 'json' }).$type<string[]>(),
  evidenceStrength: text('evidence_strength'),
  verificationStatus: text('verification_status'),
});
