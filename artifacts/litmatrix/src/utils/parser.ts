import { SLRRecord } from "../types/slr";

/**
 * Normalizes DOI string by removing prefixes (https://doi.org/, doi:, etc.), trimming, and lowercasing.
 */
export function normalizeDOI(doi?: string): string {
  if (!doi) return "";
  return doi
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/doi\.org\//i, "")
    .replace(/^https?:\/\/dx\.doi\.org\//i, "")
    .replace(/^doi:\s*/i, "")
    .replace(/[#?].*$/, "")
    .trim();
}

/**
 * Normalizes title string for high-precision duplicate detection across Scopus, Web of Science, PubMed, etc.
 * Strips punctuation, HTML entities, excess whitespaces, subtitles, and diacritics.
 */
export function normalizeTitle(t: string): string {
  if (!t) return "";
  return (t || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/&amp;/g, "and")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "")
    .replace(/&#39;/g, "")
    .replace(/[\u0300-\u036f]/g, "") // remove accent marks
    .replace(/[^\w\s]/g, " ") // replace punctuation with space
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Clean text from formatting or brackets
 */
function cleanText(text: string): string {
  if (!text) return "";
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\\&/g, "&")
    .replace(/\\_/g, "_")
    .replace(/[{}]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Auto-detect database origin based on file name and raw text contents
 */
export function detectDatabase(
  filename: string = "",
  content: string = ""
): "Scopus" | "Web of Science" | "PubMed" | "Google Scholar" | "IEEE Xplore" | "Cochrane" | "Other" {
  const lowerFile = filename.toLowerCase();
  const sample = content.slice(0, 4000).toLowerCase();

  // Web of Science indicators
  if (
    lowerFile.includes("savedrecs") ||
    lowerFile.includes("wos") ||
    lowerFile.includes("web_of_science") ||
    lowerFile.includes("webofscience") ||
    lowerFile.includes("clarivate") ||
    sample.includes("clarivate analytics") ||
    sample.includes("web of science") ||
    sample.includes("isi export format") ||
    sample.includes("ut wos:") ||
    sample.includes("ut (unique wos id)") ||
    (sample.includes("pt j") && sample.includes("\ner")) ||
    (sample.includes("pt b") && sample.includes("\ner")) ||
    (sample.includes("pt c") && sample.includes("\ner")) ||
    (sample.includes("pt s") && sample.includes("\ner"))
  ) {
    return "Web of Science";
  }

  // Scopus indicators
  if (
    lowerFile.includes("scopus") ||
    sample.includes("scopus") ||
    sample.includes("2-s2.0-") ||
    sample.includes("www.scopus.com") ||
    sample.includes("eid,title,authors")
  ) {
    return "Scopus";
  }

  // PubMed / Medline indicators
  if (
    lowerFile.includes("pubmed") ||
    lowerFile.includes("medline") ||
    lowerFile.includes("nbib") ||
    sample.includes("pmid-") ||
    sample.includes("pmid: ") ||
    sample.includes("pubmed.ncbi.nlm.nih.gov")
  ) {
    return "PubMed";
  }

  // IEEE Xplore indicators
  if (
    lowerFile.includes("ieee") ||
    sample.includes("ieee xplore") ||
    sample.includes("ieee.org") ||
    sample.includes("ieee transactions") ||
    sample.includes("10.1109/")
  ) {
    return "IEEE Xplore";
  }

  // Cochrane indicators
  if (
    lowerFile.includes("cochrane") ||
    sample.includes("cochrane database") ||
    sample.includes("cdsr")
  ) {
    return "Cochrane";
  }

  // Google Scholar indicators
  if (
    lowerFile.includes("scholar") ||
    lowerFile.includes("citations") ||
    sample.includes("scholar.google")
  ) {
    return "Google Scholar";
  }

  return "Other";
}

/**
 * Parser for Web of Science Plain Text Export (savedrecs.txt / .ciw / .txt)
 * Handles standard WoS tags: PT, AU, AF, TI, SO, AB, PY, DI, ER, etc. with indented multi-line values.
 */
export function parseWoSPlainText(text: string, defaultSource: string = "Web of Science"): SLRRecord[] {
  const records: SLRRecord[] = [];
  const lines = text.split(/\r?\n/);
  
  let currentRecord: Partial<SLRRecord> | null = null;
  let currentTag = "";
  let fullAuthors: string[] = [];
  let shortAuthors: string[] = [];
  let titleParts: string[] = [];
  let abstractParts: string[] = [];
  let sourceParts: string[] = [];

  const commitCurrentRecord = () => {
    if (!currentRecord) return;
    const title = cleanText(titleParts.join(" "));
    if (title) {
      const finalAuthors = fullAuthors.length > 0 ? fullAuthors : shortAuthors;
      records.push({
        id: `wos-${Date.now()}-${records.length}-${Math.random().toString(36).slice(2, 7)}`,
        title,
        authors: finalAuthors.length > 0 ? finalAuthors : ["Unknown authors"],
        year: currentRecord.year || "",
        abstract: cleanText(abstractParts.join(" ")),
        source: cleanText(sourceParts.join(" ")),
        doi: currentRecord.doi ? normalizeDOI(currentRecord.doi) : undefined,
        databaseSource: defaultSource,
        databaseSources: [defaultSource],
      });
    }
    currentRecord = null;
    currentTag = "";
    fullAuthors = [];
    shortAuthors = [];
    titleParts = [];
    abstractParts = [];
    sourceParts = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) continue;

    // Check for End of Record
    if (trimmed === "ER" || trimmed.startsWith("ER ")) {
      commitCurrentRecord();
      continue;
    }

    // Check for End of File
    if (trimmed === "EF" || trimmed.startsWith("EF ")) {
      commitCurrentRecord();
      break;
    }

    // Check if line starts with a 2-letter uppercase tag + space (e.g. "PT ", "TI ", "AU ")
    const tagMatch = rawLine.match(/^([A-Z0-9]{2})\s(.*)$/);
    if (tagMatch) {
      const tag = tagMatch[1];
      const val = tagMatch[2].trim();
      currentTag = tag;

      if (!currentRecord) {
        currentRecord = {};
      }

      if (tag === "TI") {
        if (val) titleParts.push(val);
      } else if (tag === "AU") {
        if (val) shortAuthors.push(val);
      } else if (tag === "AF") {
        if (val) fullAuthors.push(val);
      } else if (tag === "SO") {
        if (val) sourceParts.push(val);
      } else if (tag === "AB") {
        if (val) abstractParts.push(val);
      } else if (tag === "PY") {
        const yearM = val.match(/\d{4}/);
        if (yearM && currentRecord) currentRecord.year = yearM[0];
      } else if (tag === "DI") {
        if (currentRecord) currentRecord.doi = val;
      }
    } else if (currentRecord && currentTag) {
      // Continuation line (indented with whitespace or without 2-letter tag)
      if (currentTag === "TI") {
        titleParts.push(trimmed);
      } else if (currentTag === "AU") {
        shortAuthors.push(trimmed);
      } else if (currentTag === "AF") {
        fullAuthors.push(trimmed);
      } else if (currentTag === "SO") {
        sourceParts.push(trimmed);
      } else if (currentTag === "AB") {
        abstractParts.push(trimmed);
      }
    }
  }

  // Commit trailing record if file ended without ER
  commitCurrentRecord();

  return records;
}

/**
 * Parser for Tab-delimited files (WoS Tab-delimited savedrecs.txt / savedrecs.tsv / .csv)
 */
export function parseWoSTabDelimited(text: string, defaultSource: string = "Web of Science"): SLRRecord[] {
  const records: SLRRecord[] = [];
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return records;

  const headerLine = lines[0];
  const headers = headerLine.split("\t").map((h) => h.trim().toUpperCase());

  // Find column indices
  const getCol = (possibleNames: string[]) => {
    for (const name of possibleNames) {
      const idx = headers.findIndex((h) => h === name.toUpperCase() || h.includes(name.toUpperCase()));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const titleIdx = getCol(["TI", "TITLE", "ARTICLE TITLE"]);
  const authorsIdx = getCol(["AF", "AU", "AUTHORS", "AUTHOR FULL NAMES"]);
  const yearIdx = getCol(["PY", "PUBLICATION YEAR", "YEAR"]);
  const sourceIdx = getCol(["SO", "SOURCE TITLE", "JOURNAL", "SOURCE"]);
  const abstractIdx = getCol(["AB", "ABSTRACT", "DESCRIPTION"]);
  const doiIdx = getCol(["DI", "DOI", "DOI LINK"]);

  if (titleIdx === -1) return records;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split("\t");
    if (cols.length <= titleIdx) continue;

    const title = cleanText(cols[titleIdx] || "");
    if (!title) continue;

    const rawAuthors = authorsIdx !== -1 ? cols[authorsIdx] || "" : "";
    const authors = rawAuthors
      ? rawAuthors.split(/;\s*|\n| and /).map((a) => cleanText(a)).filter(Boolean)
      : ["Unknown authors"];

    const rawYear = yearIdx !== -1 ? cols[yearIdx] || "" : "";
    const yearMatch = rawYear.match(/\d{4}/);
    const year = yearMatch ? yearMatch[0] : "";

    const source = sourceIdx !== -1 ? cleanText(cols[sourceIdx] || "") : "";
    const abstract = abstractIdx !== -1 ? cleanText(cols[abstractIdx] || "") : "";
    const rawDoi = doiIdx !== -1 ? cols[doiIdx] || "" : "";

    records.push({
      id: `wos-tsv-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
      title,
      authors: authors.length > 0 ? authors : ["Unknown authors"],
      year,
      abstract,
      source,
      doi: rawDoi ? normalizeDOI(rawDoi) : undefined,
      databaseSource: defaultSource,
      databaseSources: [defaultSource],
    });
  }

  return records;
}

/**
 * Robust CSV parser supporting quotes, newlines in quotes, escaped quotes (Scopus CSV, WoS CSV, PubMed CSV)
 */
export function parseCSV(text: string, defaultSource: string = "Scopus"): SLRRecord[] {
  const records: SLRRecord[] = [];
  
  // Tokenize CSV into rows and fields
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentField += '"';
          i++;
        } else {
          // End of quote
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        currentRow.push(currentField);
        currentField = "";
      } else if (char === "\n" || char === "\r") {
        if (char === "\r" && nextChar === "\n") i++;
        currentRow.push(currentField);
        currentField = "";
        if (currentRow.some((f) => f.trim().length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
      } else {
        currentField += char;
      }
    }
  }
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some((f) => f.trim().length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length < 2) return records;

  const headers = rows[0].map((h) => h.trim().toLowerCase());

  const findCol = (candidates: string[]) => {
    for (const c of candidates) {
      const idx = headers.findIndex((h) => h === c.toLowerCase() || h.includes(c.toLowerCase()));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const titleIdx = findCol(["article title", "title", "document title", "ti"]);
  const authorsIdx = findCol(["authors", "author(s)", "author full names", "first author", "au", "af"]);
  const yearIdx = findCol(["year", "publication year", "date", "py"]);
  const sourceIdx = findCol(["source title", "journal/book", "journal", "publication title", "source", "so"]);
  const abstractIdx = findCol(["abstract", "abstract note", "description", "ab"]);
  const doiIdx = findCol(["doi", "doi link", "digital object identifier", "di"]);

  if (titleIdx === -1) return records;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length <= titleIdx) continue;

    const title = cleanText(row[titleIdx] || "");
    if (!title) continue;

    const rawAuthors = authorsIdx !== -1 ? row[authorsIdx] || "" : "";
    const authors = rawAuthors
      ? rawAuthors.split(/;\s*|\n| and /).map((a) => cleanText(a)).filter(Boolean)
      : ["Unknown authors"];

    const rawYear = yearIdx !== -1 ? row[yearIdx] || "" : "";
    const yearMatch = rawYear.match(/\d{4}/);
    const year = yearMatch ? yearMatch[0] : "";

    const source = sourceIdx !== -1 ? cleanText(row[sourceIdx] || "") : "";
    const abstract = abstractIdx !== -1 ? cleanText(row[abstractIdx] || "") : "";
    const rawDoi = doiIdx !== -1 ? row[doiIdx] || "" : "";

    records.push({
      id: `csv-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
      title,
      authors: authors.length > 0 ? authors : ["Unknown authors"],
      year,
      abstract,
      source,
      doi: rawDoi ? normalizeDOI(rawDoi) : undefined,
      databaseSource: defaultSource,
      databaseSources: [defaultSource],
    });
  }

  return records;
}

/**
 * Enhanced RIS Parser supporting multi-line abstracts and titles with tag variations
 */
export function parseRIS(text: string, defaultSource: string = "Scopus"): SLRRecord[] {
  const records: SLRRecord[] = [];
  
  // Split into record blocks on TY  - or TY - or between ER  -
  const blocks = text.split(/\r?\n(?=TY\s*-\s*)/gi).filter((b) => b.trim());

  blocks.forEach((block, idx) => {
    const lines = block.split(/\r?\n/);
    const rec: SLRRecord = {
      id: `ris-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
      authors: [],
      title: "",
      year: "",
      abstract: "",
      source: "",
      databaseSource: defaultSource,
      databaseSources: [defaultSource],
    };

    let currentTag = "";
    const titleLines: string[] = [];
    const abstractLines: string[] = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const m = line.match(/^([A-Z0-9]{2})\s*-\s*(.*)$/);
      if (m) {
        const tag = m[1].toUpperCase();
        const val = m[2].trim();
        currentTag = tag;

        if (tag === "TI" || tag === "T1" || tag === "CT" || tag === "BT") {
          if (val) titleLines.push(val);
        } else if (tag === "AU" || tag === "A1" || tag === "A2" || tag === "FAU") {
          if (val) rec.authors.push(cleanText(val));
        } else if (tag === "PY" || tag === "Y1" || tag === "DA" || tag === "DP") {
          const yearMatch = val.match(/\d{4}/);
          if (yearMatch && !rec.year) rec.year = yearMatch[0];
        } else if (tag === "AB" || tag === "N2") {
          if (val) abstractLines.push(val);
        } else if (tag === "JO" || tag === "JF" || tag === "T2" || tag === "JA" || tag === "SO") {
          if (!rec.source) rec.source = cleanText(val);
        } else if (tag === "DO" || tag === "DI") {
          if (!rec.doi) rec.doi = normalizeDOI(val);
        }
      } else if (currentTag) {
        // Continuation line for previous tag
        if (currentTag === "TI" || currentTag === "T1") {
          titleLines.push(trimmed);
        } else if (currentTag === "AB" || currentTag === "N2") {
          abstractLines.push(trimmed);
        } else if (currentTag === "AU" || currentTag === "A1") {
          rec.authors.push(cleanText(trimmed));
        }
      }
    });

    rec.title = cleanText(titleLines.join(" "));
    rec.abstract = cleanText(abstractLines.join(" "));

    if (rec.authors.length === 0) {
      rec.authors = ["Unknown authors"];
    }

    if (rec.title) {
      records.push(rec);
    }
  });

  return records;
}

/**
 * Enhanced BibTeX parser
 */
export function parseBibTeX(text: string, defaultSource: string = "Web of Science"): SLRRecord[] {
  const records: SLRRecord[] = [];
  const entries = text.split(/@\w+\s*\{/g).slice(1);

  entries.forEach((entry, idx) => {
    const rec: SLRRecord = {
      id: `bib-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
      authors: [],
      title: "",
      year: "",
      abstract: "",
      source: "",
      databaseSource: defaultSource,
      databaseSources: [defaultSource],
    };

    const grab = (field: string) => {
      // Matches field = {value} or field = "value"
      const regex = new RegExp(`\\b${field}\\s*=\\s*[{"]([\\s\\S]*?)[}"]\\s*(?:,|\\n|\\r|$)`, "i");
      const m = entry.match(regex);
      return m ? cleanText(m[1]) : "";
    };

    rec.title = grab("title");
    const yr = grab("year");
    const yrMatch = yr.match(/\d{4}/);
    rec.year = yrMatch ? yrMatch[0] : yr;
    rec.abstract = grab("abstract");
    rec.source = grab("journal") || grab("booktitle") || grab("publisher");
    const rawDoi = grab("doi");
    if (rawDoi) rec.doi = normalizeDOI(rawDoi);

    const authorStr = grab("author");
    if (authorStr) {
      rec.authors = authorStr
        .split(/\s+and\s+/i)
        .map((a) => cleanText(a))
        .filter(Boolean);
    }
    if (rec.authors.length === 0) {
      rec.authors = ["Unknown authors"];
    }

    if (rec.title) records.push(rec);
  });

  return records;
}

/**
 * PubMed MEDLINE / NBIB parser
 */
export function parsePubMedMedline(text: string, defaultSource: string = "PubMed"): SLRRecord[] {
  const records: SLRRecord[] = [];
  const blocks = text.split(/\r?\n(?=PMID-\s*)/gi).filter((b) => b.trim());

  blocks.forEach((block, idx) => {
    const lines = block.split(/\r?\n/);
    const rec: SLRRecord = {
      id: `pubmed-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
      authors: [],
      title: "",
      year: "",
      abstract: "",
      source: "",
      databaseSource: defaultSource,
      databaseSources: [defaultSource],
    };

    let currentTag = "";
    const titleLines: string[] = [];
    const abstractLines: string[] = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const m = line.match(/^([A-Z0-9]{2,4})\s*-\s*(.*)$/);
      if (m) {
        const tag = m[1].toUpperCase();
        const val = m[2].trim();
        currentTag = tag;

        if (tag === "TI") {
          titleLines.push(val);
        } else if (tag === "FAU" || tag === "AU") {
          rec.authors.push(cleanText(val));
        } else if (tag === "DP") {
          const yrM = val.match(/\d{4}/);
          if (yrM) rec.year = yrM[0];
        } else if (tag === "AB") {
          abstractLines.push(val);
        } else if (tag === "JT" || tag === "TA") {
          if (!rec.source) rec.source = cleanText(val);
        } else if (tag === "LID" || tag === "AID") {
          if (val.includes("[doi]")) {
            rec.doi = normalizeDOI(val.replace(/\[doi\].*$/, ""));
          }
        }
      } else if (currentTag) {
        if (currentTag === "TI") titleLines.push(trimmed);
        else if (currentTag === "AB") abstractLines.push(trimmed);
      }
    });

    rec.title = cleanText(titleLines.join(" "));
    rec.abstract = cleanText(abstractLines.join(" "));

    if (rec.authors.length === 0) rec.authors = ["Unknown authors"];
    if (rec.title) records.push(rec);
  });

  return records;
}

/**
 * Universal upload parser for all academic citation exports (WoS, Scopus, PubMed, IEEE, Cochrane, Scholar)
 */
export function parseUpload(
  filename: string,
  text: string,
  userSelectedDb?: "Scopus" | "Web of Science" | "PubMed" | "Google Scholar" | "IEEE Xplore" | "Cochrane" | "Other"
): SLRRecord[] {
  // Step 1: Detect database origin from file or content
  const detectedDb = detectDatabase(filename, text);
  // Prefer detected database if confident, otherwise use user selection
  const db = detectedDb !== "Other" ? detectedDb : userSelectedDb || "Scopus";

  const lowerName = filename.toLowerCase();
  const trimmed = text.trim();

  // 1. BibTeX format
  if (lowerName.endsWith(".bib") || lowerName.endsWith(".bibtex") || trimmed.startsWith("@")) {
    const recs = parseBibTeX(text, db);
    if (recs.length > 0) return recs;
  }

  // 2. Web of Science Plain Text (savedrecs.txt / .ciw / .txt)
  if (
    trimmed.includes("FN Clarivate") ||
    trimmed.includes("FN ISI") ||
    trimmed.includes("VR 1.0") ||
    /^PT\s+[A-Z]/m.test(text) ||
    /(\r?\n|^)PT\s+/m.test(text)
  ) {
    const recs = parseWoSPlainText(text, db);
    if (recs.length > 0) return recs;
  }

  // 3. Tab-delimited (WoS savedrecs.tsv / savedrecs.txt with tabs)
  if (
    (lowerName.endsWith(".tsv") || lowerName.endsWith(".txt") || lowerName.endsWith(".csv")) &&
    text.includes("\t") &&
    (/\b(TI|Title|Article Title)\b/i.test(text.slice(0, 1000)))
  ) {
    const recs = parseWoSTabDelimited(text, db);
    if (recs.length > 0) return recs;
  }

  // 4. PubMed MEDLINE / NBIB
  if (trimmed.startsWith("PMID-") || lowerName.endsWith(".nbib") || lowerName.endsWith(".medline")) {
    const recs = parsePubMedMedline(text, db);
    if (recs.length > 0) return recs;
  }

  // 5. RIS format (Scopus, WoS, IEEE, Cochrane, etc.)
  if (
    lowerName.endsWith(".ris") ||
    lowerName.endsWith(".ciw") ||
    trimmed.includes("TY  - ") ||
    trimmed.includes("TY - ")
  ) {
    const recs = parseRIS(text, db);
    if (recs.length > 0) return recs;
  }

  // 6. CSV format (Scopus CSV, WoS CSV, PubMed CSV)
  if (lowerName.endsWith(".csv") || (text.includes(",") && /\b(Title|Authors|Article Title)\b/i.test(text.slice(0, 500)))) {
    const recs = parseCSV(text, db);
    if (recs.length > 0) return recs;
  }

  // 7. Fallback trial: try RIS -> WoS Plain Text -> WoS Tab -> BibTeX -> CSV
  const trialRis = parseRIS(text, db);
  if (trialRis.length > 0) return trialRis;

  const trialWoS = parseWoSPlainText(text, db);
  if (trialWoS.length > 0) return trialWoS;

  const trialTab = parseWoSTabDelimited(text, db);
  if (trialTab.length > 0) return trialTab;

  const trialBib = parseBibTeX(text, db);
  if (trialBib.length > 0) return trialBib;

  const trialCsv = parseCSV(text, db);
  if (trialCsv.length > 0) return trialCsv;

  return [];
}

export interface DedupeResult {
  kept: SLRRecord[];
  removed: number;
  mergedCount: number;
  crossDatabaseMatches: number;
  byDatabase: Record<string, number>;
}

/**
 * Intelligent Multi-Database Deduplication Engine (PRISMA 2020 Item 16a)
 * Deduplicates across Scopus, Web of Science, PubMed, etc. by exact DOI and normalized title.
 * Automatically merges source database provenance (e.g. "Scopus, Web of Science")
 * and retains the most complete metadata (longest abstract, verified DOI, full author list).
 */
export function dedupeRecords(records: SLRRecord[]): DedupeResult {
  const groups: SLRRecord[][] = [];
  const doiIndex = new Map<string, number>(); // normalized DOI -> group index
  const titleIndex = new Map<string, number>(); // normalized Title -> group index

  records.forEach((r) => {
    const normDOI = normalizeDOI(r.doi);
    const normTitle = normalizeTitle(r.title);

    let matchGroupIdx = -1;

    // 1. Check exact clean DOI match
    if (normDOI && doiIndex.has(normDOI)) {
      matchGroupIdx = doiIndex.get(normDOI)!;
    }
    // 2. Check exact normalized title match
    else if (normTitle && titleIndex.has(normTitle)) {
      matchGroupIdx = titleIndex.get(normTitle)!;
    }

    if (matchGroupIdx !== -1) {
      // Add to existing group
      groups[matchGroupIdx].push(r);
      // Associate new keys if present
      if (normDOI) doiIndex.set(normDOI, matchGroupIdx);
      if (normTitle) titleIndex.set(normTitle, matchGroupIdx);
    } else {
      // Create new group
      const newIdx = groups.length;
      groups.push([r]);
      if (normDOI) doiIndex.set(normDOI, newIdx);
      if (normTitle) titleIndex.set(normTitle, newIdx);
    }
  });

  const kept: SLRRecord[] = [];
  let removed = 0;
  let mergedCount = 0;
  let crossDatabaseMatches = 0;

  groups.forEach((group) => {
    if (group.length === 1) {
      kept.push(group[0]);
    } else {
      removed += group.length - 1;
      mergedCount++;

      // Collect all distinct database sources
      const allDbs = new Set<string>();
      group.forEach((item) => {
        if (item.databaseSources && item.databaseSources.length > 0) {
          item.databaseSources.forEach((db) => allDbs.add(db));
        } else if (item.databaseSource) {
          item.databaseSource.split(",").forEach((db) => allDbs.add(db.trim()));
        }
      });

      if (allDbs.size > 1) {
        crossDatabaseMatches++;
      }

      // Pick the best record (longest abstract, most complete title/authors)
      const best = group.reduce((a, b) => ((b.abstract || "").length > (a.abstract || "").length ? b : a));

      // Synthesize best metadata from all instances in the group
      const allAuthors = group.reduce<string[]>(
        (acc, curr) => ((curr.authors || []).length > acc.length ? curr.authors : acc),
        best.authors || []
      );
      const bestDOI = group.find((g) => g.doi && g.doi.trim())?.doi || best.doi;
      const bestSource = group.find((g) => g.source && g.source.trim())?.source || best.source;
      const bestYear = group.find((g) => g.year && g.year.trim())?.year || best.year;

      const mergedDbString = Array.from(allDbs).join(", ") || best.databaseSource || "Scopus";
      const mergedDbArray = Array.from(allDbs);

      kept.push({
        ...best,
        authors: allAuthors,
        doi: bestDOI,
        source: bestSource,
        year: bestYear,
        databaseSource: mergedDbString,
        databaseSources: mergedDbArray,
      });
    }
  });

  // Calculate distribution
  const byDatabase: Record<string, number> = {};
  kept.forEach((r) => {
    const db = r.databaseSource || "Other";
    byDatabase[db] = (byDatabase[db] || 0) + 1;
  });

  return {
    kept,
    removed,
    mergedCount,
    crossDatabaseMatches,
    byDatabase,
  };
}

export function exportRecordsToCSV(records: SLRRecord[]): string {
  const headers = ["ID", "Title", "Authors", "Year", "Journal / Source", "Database Sources", "DOI", "Abstract"];
  const rows = records.map((r) => [
    `"${r.id}"`,
    `"${(r.title || "").replace(/"/g, '""')}"`,
    `"${(r.authors || []).join("; ").replace(/"/g, '""')}"`,
    `"${r.year || ""}"`,
    `"${(r.source || "").replace(/"/g, '""')}"`,
    `"${(r.databaseSource || "").replace(/"/g, '""')}"`,
    `"${r.doi || ""}"`,
    `"${(r.abstract || "").replace(/"/g, '""')}"`,
  ]);
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function exportRecordsToRIS(records: SLRRecord[]): string {
  return records
    .map((r) => {
      let ris = "TY  - JOUR\n";
      ris += `TI  - ${r.title}\n`;
      (r.authors || []).forEach((a) => {
        ris += `AU  - ${a}\n`;
      });
      if (r.year) ris += `PY  - ${r.year}\n`;
      if (r.source) ris += `JO  - ${r.source}\n`;
      if (r.abstract) ris += `AB  - ${r.abstract}\n`;
      if (r.doi) ris += `DO  - ${r.doi}\n`;
      ris += "ER  - \n";
      return ris;
    })
    .join("\n");
}
