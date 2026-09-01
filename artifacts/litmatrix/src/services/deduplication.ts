/**
 * Deterministic Academic Literature Deduplication Engine
 * Implements strict hierarchy:
 * 1. Exact normalized DOI
 * 2. Exact normalized Title
 * 3. Fuzzy title similarity (Dice token & Levenshtein)
 * 4. Author + Year + Journal multi-attribute scoring
 */

import { DuplicateCandidate, Paper } from '../types';

export interface DeduplicationSummary {
  totalRecords: number;
  definiteDuplicates: number; // >= 0.95 or DOI
  possibleDuplicates: number; // 0.80 - 0.949
  uniquePapersCount: number;
  duplicateCandidates: DuplicateCandidate[];
  deduplicatedMasterPapers: Paper[];
}

/**
 * Calculates Token Dice Coefficient for string similarity
 */
export function calculateDiceSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  if (s1 === s2) return 1.0;

  const tokens1 = new Set(s1.split(/\s+/).filter((t) => t.length > 2));
  const tokens2 = new Set(s2.split(/\s+/).filter((t) => t.length > 2));

  if (tokens1.size === 0 || tokens2.size === 0) return 0;

  let intersection = 0;
  tokens1.forEach((t) => {
    if (tokens2.has(t)) intersection++;
  });

  return (2 * intersection) / (tokens1.size + tokens2.size);
}

/**
 * Normalized Levenshtein distance similarity
 */
export function calculateLevenshteinSimilarity(a: string, b: string): number {
  if (a === b) return 1.0;
  if (!a || !b) return 0.0;
  const la = a.length;
  const lb = b.length;
  if (la === 0) return 0.0;
  if (lb === 0) return 0.0;

  const matrix: number[][] = [];
  for (let i = 0; i <= lb; i++) matrix[i] = [i];
  for (let j = 0; j <= la; j++) matrix[0][j] = j;

  for (let i = 1; i <= lb; i++) {
    for (let j = 1; j <= la; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  const distance = matrix[lb][la];
  const maxLen = Math.max(la, lb);
  return Math.max(0, 1 - distance / maxLen);
}

/**
 * Hybrid Title Similarity
 */
export function getTitleSimilarity(t1: string, t2: string): number {
  if (!t1 || !t2) return 0;
  const dice = calculateDiceSimilarity(t1, t2);
  // If dice is very high or title is short, also compute char levenshtein on normalized strings
  if (dice > 0.7) {
    const lev = calculateLevenshteinSimilarity(t1.slice(0, 120), t2.slice(0, 120));
    return dice * 0.6 + lev * 0.4;
  }
  return dice;
}

/**
 * Author list similarity
 */
export function getAuthorSimilarity(authorsA: string[], authorsB: string[]): number {
  if (!authorsA?.length || !authorsB?.length) return 0.5; // neutral if missing
  const lastNamesA = authorsA.map((a) => a.split(/[\s,]+/)[0].toLowerCase()).filter((a) => a.length > 1);
  const lastNamesB = authorsB.map((b) => b.split(/[\s,]+/)[0].toLowerCase()).filter((b) => b.length > 1);

  if (lastNamesA.length === 0 || lastNamesB.length === 0) return 0.5;

  let matches = 0;
  for (const a of lastNamesA) {
    if (lastNamesB.some((b) => b.includes(a) || a.includes(b))) matches++;
  }

  return (2 * matches) / (lastNamesA.length + lastNamesB.length);
}

/**
 * Runs full deterministic deduplication on a list of papers
 */
export function runDeduplication(papers: Paper[], projectId: string): DeduplicationSummary {
  const duplicateCandidates: DuplicateCandidate[] = [];
  const mergedMasterMap = new Map<string, Paper>(); // paperId -> masterPaper
  const removedPaperIds = new Set<string>();

  // Initialize master copy
  papers.forEach((p) => {
    mergedMasterMap.set(p.id, { ...p, sources: [...p.sources] });
  });

  for (let i = 0; i < papers.length; i++) {
    const paperA = papers[i];
    if (removedPaperIds.has(paperA.id)) continue;

    for (let j = i + 1; j < papers.length; j++) {
      const paperB = papers[j];
      if (removedPaperIds.has(paperB.id)) continue;

      let isMatch = false;
      let confidence = 0.0;
      let matchReason = '';

      // 1. Exact normalized DOI match
      if (paperA.normalizedDoi && paperB.normalizedDoi && paperA.normalizedDoi === paperB.normalizedDoi) {
        isMatch = true;
        confidence = 1.0;
        matchReason = `Exact Normalized DOI Match (${paperA.doi})`;
      } 
      // 2. Exact normalized Title match
      else if (paperA.normalizedTitle && paperB.normalizedTitle && paperA.normalizedTitle === paperB.normalizedTitle) {
        isMatch = true;
        confidence = 0.99;
        matchReason = 'Exact Normalized Title Match';
      }
      // 3. High Fuzzy Title similarity
      else {
        const titleSim = getTitleSimilarity(paperA.normalizedTitle, paperB.normalizedTitle);
        const authorSim = getAuthorSimilarity(paperA.authors, paperB.authors);
        const yearMatch = !!(paperA.year && paperB.year && paperA.year === paperB.year);
        const journalSim = paperA.journal && paperB.journal ? calculateDiceSimilarity(paperA.journal, paperB.journal) : 0.5;

        if (titleSim >= 0.95) {
          isMatch = true;
          confidence = titleSim;
          matchReason = `Very Likely Duplicate (Title similarity: ${(titleSim * 100).toFixed(1)}%)`;
        } else if (titleSim >= 0.88 && (authorSim >= 0.6 || yearMatch)) {
          isMatch = true;
          confidence = titleSim * 0.7 + authorSim * 0.2 + (yearMatch ? 0.1 : 0);
          matchReason = `High Probability (Title ${(titleSim * 100).toFixed(1)}%, Author/Year match)`;
        } else if (titleSim >= 0.80) {
          isMatch = true;
          confidence = titleSim * 0.8;
          matchReason = `Possible Duplicate Candidate (Title ${(titleSim * 100).toFixed(1)}%)`;
        }

        if (isMatch) {
          const candidate: DuplicateCandidate = {
            id: `dup_${paperA.id}_${paperB.id}`,
            projectId,
            paperAId: paperA.id,
            paperBId: paperB.id,
            paperA,
            paperB,
            titleSimilarity: titleSim,
            authorSimilarity: authorSim,
            yearMatch,
            journalSimilarity: journalSim,
            confidenceScore: confidence,
            matchReason,
            status: confidence >= 0.95 ? 'CONFIRMED_DUPLICATE' : 'PENDING',
          };

          duplicateCandidates.push(candidate);

          // If highly definite (> 0.95), merge provenance into Paper A and mark Paper B as duplicate
          if (confidence >= 0.95) {
            const master = mergedMasterMap.get(paperA.id)!;
            // Append missing metadata
            if (!master.abstract && paperB.abstract) master.abstract = paperB.abstract;
            if (!master.doi && paperB.doi) {
              master.doi = paperB.doi;
              master.normalizedDoi = paperB.normalizedDoi;
            }
            if (!master.year && paperB.year) master.year = paperB.year;
            if (!master.journal && paperB.journal) master.journal = paperB.journal;
            if (paperB.keywords?.length) {
              const combinedKeywords = Array.from(new Set([...master.keywords, ...paperB.keywords]));
              master.keywords = combinedKeywords;
            }
            // Append source provenance
            paperB.sources.forEach((src) => {
              if (!master.sources.some((s) => s.sourceDatabase === src.sourceDatabase && s.sourceFile === src.sourceFile)) {
                master.sources.push(src);
              }
            });
            removedPaperIds.add(paperB.id);
            mergedMasterMap.delete(paperB.id);
          }
        }
      }
    }
  }

  const definiteDuplicates = duplicateCandidates.filter((c) => c.confidenceScore >= 0.95).length;
  const possibleDuplicates = duplicateCandidates.filter((c) => c.confidenceScore < 0.95).length;
  const deduplicatedMasterPapers = Array.from(mergedMasterMap.values());

  return {
    totalRecords: papers.length,
    definiteDuplicates,
    possibleDuplicates,
    uniquePapersCount: deduplicatedMasterPapers.length,
    duplicateCandidates,
    deduplicatedMasterPapers,
  };
}
