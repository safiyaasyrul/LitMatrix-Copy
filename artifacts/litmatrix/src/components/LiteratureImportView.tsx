'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle,
  Database,
  Cloud,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Layers,
  Trash2,
} from 'lucide-react';
import { ImportFileRecord, Paper, Project } from '../types';
import { parseLiteratureContent } from '../services/parsers';
import { createImportFileRecord, GCS_CONFIG } from '../services/cloudStorage';
import { getSamplePapers } from '../services/storage';

interface LiteratureImportViewProps {
  project: Project;
  onAddPapers: (papers: Paper[], fileRecord: ImportFileRecord) => void;
  onNextStage: () => void;
}

export const LiteratureImportView: React.FC<LiteratureImportViewProps> = ({
  project,
  onAddPapers,
  onNextStage,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedDatabase, setSelectedDatabase] = useState<'Scopus' | 'Web of Science' | 'Google Scholar' | 'Other'>('Scopus');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const importedFiles = project.importedFiles || [];
  const papers = project.papers || [];

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setImporting(true);
    setImportError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const text = await file.text();

        // Determine format from filename extension
        const ext = file.name.split('.').pop()?.toLowerCase();
        let format: 'RIS' | 'CSV' | 'BibTeX' | 'NBIB' | 'TXT' = 'RIS';
        if (ext === 'csv') format = 'CSV';
        else if (ext === 'bib' || ext === 'bibtex') format = 'BibTeX';
        else if (ext === 'nbib') format = 'NBIB';
        else if (ext === 'txt') format = 'TXT';

        const parsedResult = parseLiteratureContent(text, format, file.name, selectedDatabase, project.id);
        const fileRecord = createImportFileRecord(file, format, selectedDatabase, parsedResult.papers.length);

        onAddPapers(parsedResult.papers, fileRecord);
      }
    } catch (e: any) {
      setImportError(`Parsing failed: ${e.message || 'Check file encoding and format structure.'}`);
    } finally {
      setImporting(false);
    }
  };

  const handleLoadSampleDataset = () => {
    const sample = getSamplePapers(project.id);
    const mockFile: ImportFileRecord = {
      id: `file_benchmark_${Date.now()}`,
      fileName: 'benchmark_maritime_ai_corpus.ris',
      fileFormat: 'RIS',
      sourceDatabase: 'Scopus',
      gcsUri: `gs://${GCS_CONFIG.bucketName}/uploads/ris/benchmark_maritime_ai_corpus.ris`,
      recordCount: sample.length,
      uploadedAt: new Date().toISOString(),
      fileSizeBytes: 48920,
    };
    onAddPapers(sample, mockFile);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-mono font-bold uppercase">
                Stage 4 • Raw Literature Ingestion
              </span>
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                <Cloud className="w-3.5 h-3.5 text-sky-400" />
                GCS: {GCS_CONFIG.bucketName}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 mt-2">
              Deterministic Multi-Format Literature Ingestion
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Upload bibliography exports from Scopus, Web of Science, and Google Scholar. Parsers normalize DOIs, standardize author names, and preserve full provenance across database imports.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLoadSampleDataset}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 text-xs font-semibold rounded-lg transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Load Benchmark Dataset (7 Papers)</span>
            </button>

            <button
              onClick={onNextStage}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              <span>Stage 5: Deduplication</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Database Origin Selection */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Assign Origin Database:
          </span>
          {(['Scopus', 'Web of Science', 'Google Scholar', 'Other'] as const).map((db) => (
            <button
              key={db}
              onClick={() => setSelectedDatabase(db)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedDatabase === db
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {db}
            </button>
          ))}
        </div>
      </div>

      {/* Drag and Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-150 ${
          dragOver
            ? 'border-amber-400 bg-amber-500/10 scale-[1.005]'
            : 'border-slate-700 bg-slate-900/60 hover:border-slate-500 hover:bg-slate-900'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".ris,.csv,.bib,.bibtex,.nbib,.txt"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        <UploadCloud className="w-12 h-12 text-amber-400 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-100">
          {importing ? 'Processing & Ingesting Literature...' : 'Drop RIS, CSV, BibTeX, or NBIB files here'}
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Supports direct exports from Scopus (.ris, .csv), Web of Science (.txt, .csv), PubMed/MEDLINE (.nbib), and BibTeX (.bib)
        </p>
        <span className="inline-block mt-3 px-3 py-1 bg-slate-800 border border-slate-700 rounded-md text-[11px] font-mono text-slate-300">
          Target Bucket: {GCS_CONFIG.bucketName} ({GCS_CONFIG.prefixes.RIS})
        </span>
      </div>

      {importError && (
        <div className="bg-rose-950/40 border border-rose-800/80 rounded-xl p-4 flex items-center gap-3 text-xs text-rose-300">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{importError}</span>
        </div>
      )}

      {/* Imported Files & Ingested Papers Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            Ingested Literature Records ({papers.length} total)
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {importedFiles.length} source file(s) registered
          </span>
        </div>

        {papers.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            No literature records imported yet. Upload bibliography files or load the benchmark dataset above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Title & Authors</th>
                  <th className="py-2.5 px-3">Year / Journal</th>
                  <th className="py-2.5 px-3">DOI</th>
                  <th className="py-2.5 px-3">Source DB</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {papers.slice(0, 10).map((paper) => (
                  <tr key={paper.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 max-w-md">
                      <div className="font-semibold text-slate-100 truncate">
                        {paper.title}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {paper.authors?.join(', ') || 'No authors'}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">
                      <div>{paper.year || 'n.d.'}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[180px]">{paper.journal || '-'}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300 truncate max-w-[180px]">
                      {paper.doi ? (
                        <span className="text-sky-400 hover:underline">{paper.doi}</span>
                      ) : (
                        <span className="text-slate-500">Unspecified</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap gap-1">
                        {paper.sources?.map((s, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-amber-300 border border-slate-700"
                          >
                            {s.sourceDatabase}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
