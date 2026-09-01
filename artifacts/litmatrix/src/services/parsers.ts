/**
 * High-Accuracy Deterministic Academic Literature Parsers
 * Supports: RIS, CSV (Scopus & WoS), BibTeX, NBIB (PubMed), and Plain Text
 */

import { Paper, PaperSource } from '../types';

export interface ParseResult {
  papers: Paper[];
  rawCount: number;
  validCount: number;
  errors: string[];
  sourceDatabase: 'Scopus' | 'Web of Science' | 'Google Scholar' | 'PubMed' | 'Other';
  fileName: string;
}

/**
 * Normalizes DOI strings for deterministic matching
 */
export function normalizeDoi(doi?: string): string | undefined {
  if (!doi) return undefined;
  return doi
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .replace(/^doi:\s*/i, '')
    .replace(/[,\s]+$/, '');
}

/**
 * Normalizes title for exact and fuzzy matching
 */
export function normalizeTitle(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes Journal name
 */
export function normalizeJournal(journal?: string): string | undefined {
  if (!journal) return undefined;
  return journal
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Robust RIS Format Parser
 */
export function parseRis(
  content: string,
  projectId: string,
  sourceDatabase: 'Scopus' | 'Web of Science' | 'Google Scholar' | 'Other' = 'Scopus',
  fileName: string = 'import.ris'
): ParseResult {
  const errors: string[] = [];
  const rawRecords = content.split(/\n\s*ER\s*-(?:-)?\s*\n|\r\n\s*ER\s*-(?:-)?\s*\r\n|\n\s*ER\s*-/gi);
  const parsedPapers: Paper[] = [];

  for (let i = 0; i < rawRecords.length; i++) {
    const raw = rawRecords[i].trim();
    if (!raw) continue;

    const lines = raw.split(/\r?\n/);
    const tags: Record<string, string[]> = {};
    let currentTag = '';

    for (const line of lines) {
      // RIS tag format: "XX  - value" or "XX - value"
      const match = line.match(/^([A-Z0-9]{2})\s*-\s*(.*)$/);
      if (match) {
        currentTag = match[1].toUpperCase();
        const val = match[2].trim();
        if (!tags[currentTag]) tags[currentTag] = [];
        if (val) tags[currentTag].push(val);
      } else if (currentTag && line.trim()) {
        // Multi-line continuation
        const lastIdx = tags[currentTag].length - 1;
        if (lastIdx >= 0) {
          tags[currentTag][lastIdx] += ' ' + line.trim();
        }
      }
    }

    // Extract core fields
    const title = tags['TI']?.[0] || tags['T1']?.[0] || tags['CT']?.[0] || '';
    if (!title) {
      // Skip empty or comment blocks
      continue;
    }

    const authors = tags['AU'] || tags['A1'] || tags['A2'] || tags['A3'] || [];
    const abstract = tags['AB']?.[0] || tags['N2']?.[0] || '';
    
    // Year extraction
    let year: number | undefined;
    const yearStr = tags['PY']?.[0] || tags['Y1']?.[0];
    if (yearStr) {
      const yearMatch = yearStr.match(/\b(19\d\d|20\d\d)\b/);
      if (yearMatch) year = parseInt(yearMatch[1], 10);
    }

    const doi = tags['DO']?.[0] || tags['DI']?.[0];
    const journal = tags['JO']?.[0] || tags['JF']?.[0] || tags['JA']?.[0] || tags['T2']?.[0];
    const keywords = tags['KW'] || [];
    const volume = tags['VL']?.[0];
    const issue = tags['IS']?.[0];
    const startPage = tags['SP']?.[0];
    const endPage = tags['EP']?.[0];
    const issn = tags['SN']?.[0];
    const url = tags['UR']?.[0] || tags['L1']?.[0] || tags['L2']?.[0];
    const language = tags['LA']?.[0] || 'en';
    const publisher = tags['PB']?.[0];
    const docType = tags['TY']?.[0] || 'JOUR';

    const paperId = `paper_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();

    const source: PaperSource = {
      id: `src_${Math.random().toString(36).substring(2, 9)}`,
      paperId,
      sourceDatabase,
      sourceFile: fileName,
      originalRecord: tags,
      importedAt: now,
    };

    const paper: Paper = {
      id: paperId,
      projectId,
      title: title.trim(),
      normalizedTitle: normalizeTitle(title),
      authors: authors.map((a) => a.trim()).filter(Boolean),
      abstract: abstract.trim(),
      year,
      doi: doi?.trim(),
      normalizedDoi: normalizeDoi(doi),
      journal: journal?.trim(),
      normalizedJournal: normalizeJournal(journal),
      keywords: keywords.map((k) => k.trim()).filter(Boolean),
      volume: volume?.trim(),
      issue: issue?.trim(),
      startPage: startPage?.trim(),
      endPage: endPage?.trim(),
      issn: issn?.trim(),
      url: url?.trim(),
      language: language?.trim(),
      documentType: mapRisType(docType),
      publisher: publisher?.trim(),
      isMasterRecord: true,
      sources: [source],
      createdAt: now,
      updatedAt: now,
    };

    parsedPapers.push(paper);
  }

  return {
    papers: parsedPapers,
    rawCount: rawRecords.length,
    validCount: parsedPapers.length,
    errors,
    sourceDatabase,
    fileName,
  };
}

/**
 * Robust CSV Parser (Scopus, Web of Science, etc.)
 */
export function parseCsv(
  content: string,
  projectId: string,
  sourceDatabase: 'Scopus' | 'Web of Science' | 'Google Scholar' | 'Other' = 'Scopus',
  fileName: string = 'import.csv'
): ParseResult {
  const errors: string[] = [];
  const parsedPapers: Paper[] = [];

  const rows = parseCsvRows(content);
  if (rows.length < 2) {
    return { papers: [], rawCount: 0, validCount: 0, errors: ['CSV file must have headers and at least 1 record.'], sourceDatabase, fileName };
  }

  const headers = rows[0].map((h) => h.trim().toLowerCase());

  // Detect index map for common headers
  const getCol = (possibleNames: string[]) => {
    for (const name of possibleNames) {
      const idx = headers.findIndex((h) => h === name.toLowerCase() || h.includes(name.toLowerCase()));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const titleIdx = getCol(['title', 'article title', 'document title', 'item title']);
  const authorIdx = getCol(['authors', 'author(s)', 'author full names', 'creator']);
  const abstractIdx = getCol(['abstract', 'description', 'abstract note']);
  const yearIdx = getCol(['year', 'publication year', 'pub year', 'date']);
  const doiIdx = getCol(['doi', 'digital object identifier', 'doi link']);
  const journalIdx = getCol(['source title', 'journal', 'publication name', 'book title', 'source']);
  const keywordsIdx = getCol(['author keywords', 'keywords', 'indexed keywords', 'mesh terms']);
  const volumeIdx = getCol(['volume', 'vol']);
  const issueIdx = getCol(['issue', 'no']);
  const startPageIdx = getCol(['page start', 'start page', 'beginning page']);
  const endPageIdx = getCol(['page end', 'end page', 'ending page']);
  const pagesIdx = getCol(['pages', 'page count']);
  const issnIdx = getCol(['issn', 'eissn']);
  const urlIdx = getCol(['url', 'link', 'doi url']);
  const docTypeIdx = getCol(['document type', 'publication type', 'item type', 'type']);
  const publisherIdx = getCol(['publisher']);
  const languageIdx = getCol(['language', 'original language']);

  if (titleIdx === -1) {
    return { papers: [], rawCount: rows.length - 1, validCount: 0, errors: ['Could not find a Title column in CSV.'], sourceDatabase, fileName };
  }

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const title = row[titleIdx]?.trim();
    if (!title) continue;

    const rawAuthors = authorIdx !== -1 ? row[authorIdx] || '' : '';
    const authors = rawAuthors
      .split(/;\s*|\s*,\s*(?=[A-Z][a-z]+)/)
      .map((a) => a.trim())
      .filter((a) => a.length > 0 && a !== ',');

    const abstract = abstractIdx !== -1 ? row[abstractIdx]?.trim() || '' : '';
    
    let year: number | undefined;
    if (yearIdx !== -1 && row[yearIdx]) {
      const match = row[yearIdx].match(/\b(19\d\d|20\d\d)\b/);
      if (match) year = parseInt(match[1], 10);
    }

    const doi = doiIdx !== -1 ? row[doiIdx]?.trim() : undefined;
    const journal = journalIdx !== -1 ? row[journalIdx]?.trim() : undefined;
    
    const rawKeywords = keywordsIdx !== -1 ? row[keywordsIdx] || '' : '';
    const keywords = rawKeywords
      .split(/;\s*|\s*,\s*/)
      .map((k) => k.trim())
      .filter(Boolean);

    let startPage = startPageIdx !== -1 ? row[startPageIdx]?.trim() : undefined;
    let endPage = endPageIdx !== -1 ? row[endPageIdx]?.trim() : undefined;
    if (!startPage && pagesIdx !== -1 && row[pagesIdx]) {
      const pageSplit = row[pagesIdx].split(/[-–—]/);
      if (pageSplit.length === 2) {
        startPage = pageSplit[0].trim();
        endPage = pageSplit[1].trim();
      } else {
        startPage = row[pagesIdx].trim();
      }
    }

    const paperId = `paper_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();

    const source: PaperSource = {
      id: `src_${Math.random().toString(36).substring(2, 9)}`,
      paperId,
      sourceDatabase,
      sourceFile: fileName,
      originalRecord: { row, headers },
      importedAt: now,
    };

    parsedPapers.push({
      id: paperId,
      projectId,
      title,
      normalizedTitle: normalizeTitle(title),
      authors,
      abstract,
      year,
      doi,
      normalizedDoi: normalizeDoi(doi),
      journal,
      normalizedJournal: normalizeJournal(journal),
      keywords,
      volume: volumeIdx !== -1 ? row[volumeIdx]?.trim() : undefined,
      issue: issueIdx !== -1 ? row[issueIdx]?.trim() : undefined,
      startPage,
      endPage,
      issn: issnIdx !== -1 ? row[issnIdx]?.trim() : undefined,
      url: urlIdx !== -1 ? row[urlIdx]?.trim() : undefined,
      language: languageIdx !== -1 ? row[languageIdx]?.trim() || 'en' : 'en',
      documentType: docTypeIdx !== -1 ? row[docTypeIdx]?.trim() || 'Journal Article' : 'Journal Article',
      publisher: publisherIdx !== -1 ? row[publisherIdx]?.trim() : undefined,
      isMasterRecord: true,
      sources: [source],
      createdAt: now,
      updatedAt: now,
    });
  }

  return {
    papers: parsedPapers,
    rawCount: rows.length - 1,
    validCount: parsedPapers.length,
    errors,
    sourceDatabase,
    fileName,
  };
}

/**
 * Robust BibTeX Parser
 */
export function parseBibtex(
  content: string,
  projectId: string,
  sourceDatabase: 'Scopus' | 'Web of Science' | 'Google Scholar' | 'Other' = 'Other',
  fileName: string = 'import.bib'
): ParseResult {
  const errors: string[] = [];
  const parsedPapers: Paper[] = [];

  // Match @type{citekey, ...}
  const entryRegex = /@([a-zA-Z]+)\s*\{\s*([^,]+),([^@]*)/g;
  let match;
  let rawCount = 0;

  while ((match = entryRegex.exec(content)) !== null) {
    rawCount++;
    const docType = match[1].toLowerCase();
    const body = match[3];

    const fields: Record<string, string> = {};
    const fieldRegex = /([a-zA-Z0-9_-]+)\s*=\s*(?:\{([^}]*)\}|"([^"]*)"|([0-9]+))/g;
    let fieldMatch;

    while ((fieldMatch = fieldRegex.exec(body)) !== null) {
      const key = fieldMatch[1].toLowerCase();
      const val = fieldMatch[2] || fieldMatch[3] || fieldMatch[4] || '';
      fields[key] = val.replace(/[\n\r]+/g, ' ').replace(/\s+/g, ' ').trim();
    }

    const title = fields['title'] || fields['booktitle'] || '';
    if (!title) continue;

    const rawAuthors = fields['author'] || fields['editor'] || '';
    const authors = rawAuthors
      .split(/\band\b/i)
      .map((a) => a.trim().replace(/^\{+|\}+$/g, ''))
      .filter(Boolean);

    let year: number | undefined;
    if (fields['year']) {
      const yearParsed = parseInt(fields['year'].replace(/\D/g, ''), 10);
      if (!isNaN(yearParsed)) year = yearParsed;
    }

    const abstract = fields['abstract'] || fields['note'] || '';
    const doi = fields['doi'];
    const journal = fields['journal'] || fields['journaltitle'] || fields['booktitle'];
    const keywords = (fields['keywords'] || fields['keyword'] || '')
      .split(/[,;]/)
      .map((k) => k.trim())
      .filter(Boolean);

    const paperId = `paper_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();

    const source: PaperSource = {
      id: `src_${Math.random().toString(36).substring(2, 9)}`,
      paperId,
      sourceDatabase,
      sourceFile: fileName,
      originalRecord: fields,
      importedAt: now,
    };

    parsedPapers.push({
      id: paperId,
      projectId,
      title: title.replace(/^\{+|\}+$/g, ''),
      normalizedTitle: normalizeTitle(title),
      authors,
      abstract,
      year,
      doi,
      normalizedDoi: normalizeDoi(doi),
      journal,
      normalizedJournal: normalizeJournal(journal),
      keywords,
      volume: fields['volume'],
      issue: fields['number'] || fields['issue'],
      startPage: fields['pages']?.split(/[-–]/)[0]?.trim(),
      endPage: fields['pages']?.split(/[-–]/)[1]?.trim(),
      issn: fields['issn'] || fields['isbn'],
      url: fields['url'],
      language: fields['language'] || 'en',
      documentType: mapBibtexType(docType),
      publisher: fields['publisher'],
      isMasterRecord: true,
      sources: [source],
      createdAt: now,
      updatedAt: now,
    });
  }

  return {
    papers: parsedPapers,
    rawCount,
    validCount: parsedPapers.length,
    errors,
    sourceDatabase,
    fileName,
  };
}

/**
 * NBIB / PubMed Parser
 */
export function parseNbib(
  content: string,
  projectId: string,
  sourceDatabase: 'PubMed' | 'Other' = 'PubMed',
  fileName: string = 'import.nbib'
): ParseResult {
  const errors: string[] = [];
  const parsedPapers: Paper[] = [];
  const entries = content.split(/\nPMID-|\r\nPMID-/i);

  for (let i = 0; i < entries.length; i++) {
    const raw = (i === 0 ? entries[i] : 'PMID- ' + entries[i]).trim();
    if (!raw) continue;

    const lines = raw.split(/\r?\n/);
    const tags: Record<string, string[]> = {};
    let currentTag = '';

    for (const line of lines) {
      const match = line.match(/^([A-Z]{2,4})\s*-\s*(.*)$/);
      if (match) {
        currentTag = match[1].toUpperCase();
        const val = match[2].trim();
        if (!tags[currentTag]) tags[currentTag] = [];
        if (val) tags[currentTag].push(val);
      } else if (currentTag && line.startsWith('      ')) {
        const lastIdx = tags[currentTag].length - 1;
        if (lastIdx >= 0) {
          tags[currentTag][lastIdx] += ' ' + line.trim();
        }
      }
    }

    const title = tags['TI']?.[0] || tags['BTI']?.[0];
    if (!title) continue;

    const authors = tags['FAU'] || tags['AU'] || [];
    const abstract = tags['AB']?.join(' ') || '';
    
    let year: number | undefined;
    const dp = tags['DP']?.[0];
    if (dp) {
      const match = dp.match(/\b(19\d\d|20\d\d)\b/);
      if (match) year = parseInt(match[1], 10);
    }

    let doi: string | undefined;
    const aids = tags['AID'] || tags['LID'] || [];
    for (const aid of aids) {
      if (aid.includes('[doi]')) {
        doi = aid.replace(/\[doi\]/i, '').trim();
      }
    }

    const journal = tags['JT']?.[0] || tags['TA']?.[0];
    const keywords = tags['OT'] || tags['MH'] || [];

    const paperId = `paper_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();

    const source: PaperSource = {
      id: `src_${Math.random().toString(36).substring(2, 9)}`,
      paperId,
      sourceDatabase,
      sourceFile: fileName,
      originalRecord: tags,
      importedAt: now,
    };

    parsedPapers.push({
      id: paperId,
      projectId,
      title: title.trim(),
      normalizedTitle: normalizeTitle(title),
      authors: authors.map((a) => a.trim()),
      abstract: abstract.trim(),
      year,
      doi,
      normalizedDoi: normalizeDoi(doi),
      journal,
      normalizedJournal: normalizeJournal(journal),
      keywords: keywords.map((k) => k.replace(/^\*/, '').trim()),
      volume: tags['VI']?.[0],
      issue: tags['IP']?.[0],
      startPage: tags['PG']?.[0],
      language: tags['LA']?.[0] || 'en',
      documentType: tags['PT']?.[0] || 'Journal Article',
      isMasterRecord: true,
      sources: [source],
      createdAt: now,
      updatedAt: now,
    });
  }

  return {
    papers: parsedPapers,
    rawCount: entries.length,
    validCount: parsedPapers.length,
    errors,
    sourceDatabase,
    fileName,
  };
}

/**
 * Unified Parser Dispatcher for RIS, CSV, BibTeX, NBIB, and Plain Text
 */
export function parseLiteratureContent(
  content: string,
  format: 'RIS' | 'CSV' | 'BibTeX' | 'NBIB' | 'TXT',
  fileName: string,
  sourceDatabase: 'Scopus' | 'Web of Science' | 'Google Scholar' | 'Other' = 'Scopus',
  projectId: string = 'proj_default'
): ParseResult {
  switch (format) {
    case 'RIS':
      return parseRis(content, projectId, sourceDatabase, fileName);
    case 'CSV':
      return parseCsv(content, projectId, sourceDatabase, fileName);
    case 'BibTeX':
      return parseBibtex(content, projectId, sourceDatabase, fileName);
    case 'NBIB':
      return parseNbib(content, projectId, sourceDatabase === 'Other' ? 'Other' : 'PubMed', fileName);
    case 'TXT':
    default:
      // Check if it has RIS tags (TY  -)
      if (content.includes('TY  -') || content.includes('ER  -')) {
        return parseRis(content, projectId, sourceDatabase, fileName);
      }
      return parseBibtex(content, projectId, sourceDatabase, fileName);
  }
}

// Helpers
function mapRisType(type: string): string {
  switch (type.toUpperCase()) {
    case 'JOUR': return 'Journal Article';
    case 'CONF': return 'Conference Paper';
    case 'BOOK': return 'Book';
    case 'CHAP': return 'Book Chapter';
    case 'RPRT': return 'Report';
    case 'REV': return 'Review Article';
    case 'THES': return 'Thesis / Dissertation';
    default: return 'Journal Article';
  }
}

function mapBibtexType(type: string): string {
  switch (type.toLowerCase()) {
    case 'article': return 'Journal Article';
    case 'inproceedings':
    case 'conference': return 'Conference Paper';
    case 'book': return 'Book';
    case 'incollection':
    case 'inbook': return 'Book Chapter';
    case 'techreport': return 'Technical Report';
    case 'phdthesis':
    case 'mastersthesis': return 'Thesis / Dissertation';
    default: return 'Journal Article';
  }
}

function parseCsvRows(text: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let field = '';

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (c === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push(field);
      field = '';
    } else if ((c === '\n' || c === '\r') && !inQuotes) {
      if (c === '\r' && next === '\n') {
        i++;
      }
      row.push(field);
      field = '';
      if (row.length > 0 && row.some((f) => f.trim().length > 0)) {
        result.push(row);
      }
      row = [];
    } else {
      field += c;
    }
  }

  if (field || row.length > 0) {
    row.push(field);
    result.push(row);
  }

  return result;
}
