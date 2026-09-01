/**
 * Google Cloud Storage Literature File Service
 * Dedicated bucket: scholarpen-literature-scholarpen-ai
 * Prefixes:
 *   uploads/ris/
 *   uploads/csv/
 *   uploads/bibtex/
 *   uploads/nbib/
 */

import { ImportFileRecord } from '../types';

export const GCS_CONFIG = {
  projectId: 'scholarpen',
  bucketName: 'scholarpen-literature-scholarpen-ai',
  sqlInstance: 'scholarpen-db',
  database: 'scholarpen',
  dbUser: 'scholarpen-app',
  prefixes: {
    RIS: 'uploads/ris/',
    CSV: 'uploads/csv/',
    BibTeX: 'uploads/bibtex/',
    NBIB: 'uploads/nbib/',
    TXT: 'uploads/txt/',
  },
};

/**
 * Creates GCS URI for imported literature file
 */
export function buildGcsUri(format: 'RIS' | 'CSV' | 'BibTeX' | 'NBIB' | 'TXT', fileName: string): string {
  const prefix = GCS_CONFIG.prefixes[format] || 'uploads/other/';
  const safeName = fileName.replace(/[^\w.-]/g, '_');
  const timestamp = Date.now();
  return `gs://${GCS_CONFIG.bucketName}/${prefix}${timestamp}_${safeName}`;
}

/**
 * Creates an Import File Record
 */
export function createImportFileRecord(
  file: File,
  format: 'RIS' | 'CSV' | 'BibTeX' | 'NBIB' | 'TXT',
  sourceDatabase: 'Scopus' | 'Web of Science' | 'Google Scholar' | 'Other',
  recordCount: number
): ImportFileRecord {
  return {
    id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    fileName: file.name,
    fileFormat: format,
    sourceDatabase,
    gcsUri: buildGcsUri(format, file.name),
    recordCount,
    uploadedAt: new Date().toISOString(),
    fileSizeBytes: file.size,
  };
}
