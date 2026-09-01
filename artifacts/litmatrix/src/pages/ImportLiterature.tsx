import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, FileText, Database, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function ImportLiterature() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState('Scopus');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('source', source);

    try {
      const res = await fetch(`/api/projects/${id}/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setSuccess(data.count);
        setFile(null);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] text-[#F0F0F0] font-sans">
      <header className="h-24 border-b border-white/10 flex items-center justify-between px-10 shrink-0">
        <div>
          <h1 className="text-sm uppercase tracking-[0.3em] font-light text-white/60">Import Literature</h1>
        </div>
      </header>

      <section className="flex-1 p-10 flex flex-col gap-8 overflow-y-auto max-w-4xl mx-auto w-full">
        <div>
          <h2 className="text-2xl font-serif italic text-white mb-2">Upload Records</h2>
          <p className="text-[10px] uppercase tracking-widest text-white/40">Upload bibliographic records in .ris format from Scopus or Web of Science.</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-sm flex flex-col">
          <div className="p-8">
            <div className="mb-8">
              <label className="block text-[10px] uppercase text-white/40 tracking-widest mb-4">Database Source</label>
              <div className="flex space-x-6">
                <label className={`flex-1 p-5 border cursor-pointer flex items-center space-x-4 transition-all rounded-sm ${source === 'Scopus' ? 'border-white bg-white/5' : 'border-white/10 hover:border-white/40'}`}>
                  <input type="radio" name="source" value="Scopus" checked={source === 'Scopus'} onChange={() => setSource('Scopus')} className="hidden" />
                  <div className={`w-4 h-4 border flex items-center justify-center ${source === 'Scopus' ? 'border-white' : 'border-white/30'}`}>
                    {source === 'Scopus' && <div className="w-2 h-2 bg-white" />}
                  </div>
                  <span className="text-xs uppercase tracking-widest font-light text-white">Scopus</span>
                </label>
                <label className={`flex-1 p-5 border cursor-pointer flex items-center space-x-4 transition-all rounded-sm ${source === 'Web of Science' ? 'border-white bg-white/5' : 'border-white/10 hover:border-white/40'}`}>
                  <input type="radio" name="source" value="Web of Science" checked={source === 'Web of Science'} onChange={() => setSource('Web of Science')} className="hidden" />
                  <div className={`w-4 h-4 border flex items-center justify-center ${source === 'Web of Science' ? 'border-white' : 'border-white/30'}`}>
                    {source === 'Web of Science' && <div className="w-2 h-2 bg-white" />}
                  </div>
                  <span className="text-xs uppercase tracking-widest font-light text-white">Web of Science</span>
                </label>
              </div>
            </div>

            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border border-white/10 border-dashed rounded-sm p-16 flex flex-col items-center justify-center hover:bg-white/5 transition-colors cursor-pointer"
            >
              {file ? (
                <div className="flex flex-col items-center">
                  <FileText className="w-10 h-10 text-white mb-6" />
                  <p className="text-sm font-light text-white tracking-wide">{file.name}</p>
                  <p className="text-[10px] uppercase tracking-widest text-white/40 mt-2">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-xs uppercase tracking-widest text-red-400 mt-6 hover:text-red-300">Remove file</button>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <Upload className="w-10 h-10 text-white/30 mb-6" />
                  <p className="text-sm font-light text-white tracking-wide mb-2">Drag and drop your RIS file here</p>
                  <p className="text-[10px] uppercase tracking-widest text-white/40 mb-8">or click to browse from your computer</p>
                  <input type="file" id="file" accept=".ris,application/x-research-info-systems" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  <label htmlFor="file" className="border border-white/20 px-8 py-3 text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all cursor-pointer">
                    Browse Files
                  </label>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-8 bg-red-950/30 text-red-400 p-6 border border-red-900/50 rounded-sm flex items-start space-x-4">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="text-xs uppercase tracking-widest font-semibold mb-2">Import Failed</p>
                  <p className="text-sm font-light">{error}</p>
                </div>
              </div>
            )}

            {success !== null && (
              <div className="mt-8 bg-emerald-950/30 text-emerald-400 p-6 border border-emerald-900/50 rounded-sm flex items-start space-x-4">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="text-xs uppercase tracking-widest font-semibold mb-2">Import Successful</p>
                  <p className="text-sm font-light">Successfully imported {success.toLocaleString()} records from {source}.</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-8 border-t border-white/10 flex justify-between items-center bg-[#0A0A0A]">
            <button onClick={() => navigate(`/project/${id}`)} className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-colors">
              Back to Dashboard
            </button>
            <button 
              onClick={handleUpload}
              disabled={!file || loading}
              className="border border-white/20 px-8 py-3 text-[10px] uppercase tracking-widest hover:bg-white hover:text-black disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-white transition-all flex items-center"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-3 animate-spin" /> Processing...</>
              ) : (
                'Upload and Process RIS'
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
