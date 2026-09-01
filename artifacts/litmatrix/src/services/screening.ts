/**
 * Academic Literature Abstract Screening Service
 * Evaluates papers against researcher's Inclusion and Exclusion Criteria.
 * Computes decision (INCLUDE, EXCLUDE, MAYBE) with confidence, rationale, and extracted text evidence.
 */

import { Paper, ScreeningCriteria, ScreeningDecision } from '../types';

export function evaluatePaperScreening(
  paper: Paper,
  criteria: ScreeningCriteria,
  researchTopic: string = ''
): ScreeningDecision {
  const title = (paper.title || '').toLowerCase();
  const abstract = (paper.abstract || '').toLowerCase();
  const keywords = (paper.keywords || []).map((k) => k.toLowerCase());
  const fullText = `${title} ${abstract} ${keywords.join(' ')}`;

  const inclusionKeywords = criteria.inclusionCriteria.flatMap((c) =>
    c.toLowerCase().split(/[,;]/).map((w) => w.trim()).filter((w) => w.length > 2)
  );
  const exclusionKeywords = criteria.exclusionCriteria.flatMap((c) =>
    c.toLowerCase().split(/[,;]/).map((w) => w.trim()).filter((w) => w.length > 2)
  );

  let inclusionScore = 0;
  let matchedInclusion: string[] = [];
  inclusionKeywords.forEach((kw) => {
    if (fullText.includes(kw)) {
      inclusionScore += 1;
      matchedInclusion.push(kw);
    }
  });

  let exclusionScore = 0;
  let matchedExclusion: string[] = [];
  exclusionKeywords.forEach((kw) => {
    if (fullText.includes(kw)) {
      exclusionScore += 2;
      matchedExclusion.push(kw);
    }
  });

  // Extract supporting snippet
  let supportingText = '';
  if (paper.abstract) {
    const sentences = paper.abstract.split(/\.\s+/);
    const relevantSentence = sentences.find((s) =>
      matchedInclusion.some((kw) => s.toLowerCase().includes(kw))
    );
    supportingText = relevantSentence ? relevantSentence.trim() + '.' : sentences[0]?.trim() || '';
  }

  let aiDecision: 'INCLUDE' | 'EXCLUDE' | 'MAYBE' = 'MAYBE';
  let confidence = 0.75;
  let aiReason = '';
  let potentialConcerns: string | undefined = '';

  if (exclusionScore > 0 && matchedExclusion.length >= 2) {
    aiDecision = 'EXCLUDE';
    confidence = Math.min(0.95, 0.8 + matchedExclusion.length * 0.05);
    aiReason = `Matches explicit exclusion criteria: ${matchedExclusion.slice(0, 3).join(', ')}`;
    potentialConcerns = 'High probability of off-target domain or invalid study design.';
  } else if (matchedInclusion.length >= 3 && exclusionScore === 0) {
    aiDecision = 'INCLUDE';
    confidence = Math.min(0.96, 0.75 + matchedInclusion.length * 0.04);
    aiReason = `Strong alignment with research criteria on: ${matchedInclusion.slice(0, 4).join(', ')}`;
    potentialConcerns = !paper.abstract ? 'Full-text retrieval recommended (no abstract provided).' : '';
  } else if (matchedInclusion.length >= 1 && exclusionScore === 0) {
    aiDecision = 'INCLUDE';
    confidence = 0.82;
    aiReason = `Relevant concept terms identified: ${matchedInclusion.join(', ')}`;
  } else if (matchedExclusion.length === 1) {
    aiDecision = 'MAYBE';
    confidence = 0.65;
    aiReason = `Ambiguous relevance; contains potential exclusion term (${matchedExclusion[0]}) alongside research terms.`;
    potentialConcerns = 'Manual inspection required to verify study scope and intervention.';
  } else {
    aiDecision = 'MAYBE';
    confidence = 0.60;
    aiReason = 'Insufficient clear keyword overlap in abstract. Needs full-text or researcher assessment.';
    potentialConcerns = 'Unclear whether methodology addresses the primary research question.';
  }

  return {
    id: `screen_${paper.id}`,
    paperId: paper.id,
    aiDecision,
    confidence,
    aiReason,
    supportingText,
    potentialConcerns,
    humanDecision: 'PENDING',
    isOverridden: false,
  };
}

/**
 * Runs batch screening on all master papers
 */
export function runBatchScreening(
  papers: Paper[],
  criteria: ScreeningCriteria,
  topicTitle: string = '',
  existingDecisions: Record<string, ScreeningDecision> = {}
): Record<string, ScreeningDecision> {
  const updatedDecisions: Record<string, ScreeningDecision> = { ...existingDecisions };

  papers.forEach((paper) => {
    // Preserve human decision if already made, only re-evaluate AI recommendation
    const existing = existingDecisions[paper.id];
    const newEval = evaluatePaperScreening(paper, criteria, topicTitle);

    if (existing && existing.humanDecision !== 'PENDING') {
      updatedDecisions[paper.id] = {
        ...newEval,
        humanDecision: existing.humanDecision,
        isOverridden: existing.isOverridden,
        exclusionReason: existing.exclusionReason,
        reviewerNotes: existing.reviewerNotes,
        reviewedAt: existing.reviewedAt,
      };
    } else {
      updatedDecisions[paper.id] = newEval;
    }
  });

  return updatedDecisions;
}
