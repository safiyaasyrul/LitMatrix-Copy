export interface RISRecord {
  type?: string;
  authors: string[];
  title?: string;
  abstract?: string;
  year?: string;
  doi?: string;
  journal?: string;
  keywords: string[];
  volume?: string;
  issue?: string;
  pages?: string;
  language?: string;
  url?: string;
  documentType?: string;
}

export function parseRIS(content: string): RISRecord[] {
  const records: RISRecord[] = [];
  const lines = content.split(/\r?\n/);
  
  let currentRecord: RISRecord | null = null;

  for (const line of lines) {
    if (!line.trim()) continue;
    
    // Check if line matches tag format "XX  - Value"
    const match = line.match(/^([A-Z0-9]{2})\s+-\s*(.*)/);
    
    if (match) {
      const tag = match[1];
      const value = match[2].trim();

      if (tag === 'TY') {
        if (currentRecord) {
          records.push(currentRecord);
        }
        currentRecord = {
          type: value,
          authors: [],
          keywords: []
        };
      } else if (currentRecord) {
        switch (tag) {
          case 'AU':
          case 'A1':
            currentRecord.authors.push(value);
            break;
          case 'TI':
          case 'T1':
            currentRecord.title = (currentRecord.title ? currentRecord.title + ' ' : '') + value;
            break;
          case 'AB':
            currentRecord.abstract = (currentRecord.abstract ? currentRecord.abstract + ' ' : '') + value;
            break;
          case 'PY':
          case 'Y1':
            // "2024" or "2024/01/01"
            const yearMatch = value.match(/^\d{4}/);
            if (yearMatch) currentRecord.year = yearMatch[0];
            break;
          case 'DO':
            currentRecord.doi = value;
            break;
          case 'JO':
          case 'T2':
          case 'JF':
            currentRecord.journal = value;
            break;
          case 'KW':
            currentRecord.keywords.push(value);
            break;
          case 'VL':
            currentRecord.volume = value;
            break;
          case 'IS':
            currentRecord.issue = value;
            break;
          case 'SP':
            currentRecord.pages = value;
            break;
          case 'EP':
            if (currentRecord.pages) currentRecord.pages += '-' + value;
            break;
          case 'LA':
            currentRecord.language = value;
            break;
          case 'UR':
            currentRecord.url = value;
            break;
          case 'ER':
            records.push(currentRecord);
            currentRecord = null;
            break;
        }
      }
    } else if (currentRecord) {
      // Handle multi-line abstracts or titles if they are just continuations
      if (currentRecord.abstract && !line.match(/^[A-Z0-9]{2}\s+-/)) {
        currentRecord.abstract += ' ' + line.trim();
      }
    }
  }

  // Push the last one if ER was missing
  if (currentRecord) {
    records.push(currentRecord);
  }

  return records;
}
