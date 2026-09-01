import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Loader2, UploadCloud, FileText, CheckCircle2, Play } from 'lucide-react';

export default function Step5Import() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [deduplicating, setDeduplicating] = useState(false);
  const [dedupResult, setDedupResult] = useState<any>(null);

  const fetchStats = () => {
    fetch(`/api/projects/${id}/stats`)
      .then(res => res.json())
      .then(data => setStats(data));
  };

  useEffect(() => {
    if (id) {
      fetchStats();
    }
  }, [id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source', 'Unknown');
    
    try {
      await fetch(`/api/projects/${id}/upload`, {
        method: 'POST',
        body: formData,
      });
      fetchStats();
    } catch (e) {
      console.error(e);
    }
    setUploading(false);
    
    if (e.target) {
      e.target.value = '';
    }
  };

  const runDeduplication = async () => {
    setDeduplicating(true);
    try {
      const res = await fetch(`/api/projects/${id}/deduplicate`, { method: 'POST' });
      const data = await res.json();
      setDedupResult(data);
      fetchStats();
    } catch (e) {
      console.error(e);
    }
    setDeduplicating(false);
  };

  const handleNext = () => {
    navigate(`/project/${id}/step6-screening`);
  };

  return (
    <div className="max-w-5xl mx-auto p-10 h-full overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Langkah 5: Pengimportan Data & Penyahduplikasian</h2>
        <p className="text-slate-500">Muat naik rekod daripada Scopus, Web of Science atau sumber lain untuk diproses dan dibersihkan.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Muat Naik Fail</h3>
          
          <label className="flex-1 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 flex flex-col items-center justify-center p-8 cursor-pointer hover:bg-slate-100 hover:border-blue-400 transition-colors">
            {uploading ? (
              <div className="flex flex-col items-center text-blue-600">
                <Loader2 className="w-10 h-10 animate-spin mb-4" />
                <p className="font-medium">Memuat naik dan memproses...</p>
              </div>
            ) : (
              <>
                <UploadCloud className="w-12 h-12 text-slate-400 mb-4" />
                <p className="text-slate-700 font-medium mb-1">Seret fail ke sini</p>
                <p className="text-slate-500 text-sm mb-4">atau [Pilih Fail]</p>
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 bg-white px-3 py-1 rounded border border-slate-200">
                  <span>RIS</span> <span>•</span> <span>CSV</span> <span>•</span> <span>BibTeX</span>
                </div>
                <input type="file" accept=".ris,.csv,.bib,.txt" className="hidden" onChange={handleFileUpload} />
              </>
            )}
          </label>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
            Dataset Tersedia
            {stats && stats.total > 0 && <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-2" />}
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded">
              <span className="text-sm text-slate-600 font-medium">Scopus</span>
              <span className="text-sm font-bold text-slate-800">{stats?.sources?.scopus || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded">
              <span className="text-sm text-slate-600 font-medium">Web of Science</span>
              <span className="text-sm font-bold text-slate-800">{stats?.sources?.wos || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded">
              <span className="text-sm text-slate-600 font-medium">Other</span>
              <span className="text-sm font-bold text-slate-800">{stats?.sources?.other || 0}</span>
            </div>
            
            <div className="pt-4 border-t border-slate-200">
              <div className="flex justify-between items-center p-3 bg-blue-50 border border-blue-100 rounded text-blue-900">
                <span className="text-sm font-bold">Total Rekod</span>
                <span className="text-lg font-bold">{stats?.total || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {stats && stats.total > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-8 relative">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Pengesanan Pendua (Deduplication)</h3>
          
          <div className="flex justify-between items-center mb-6">
            <p className="text-sm text-slate-600 max-w-lg">
              Jalankan enjin penyahduplikasian AI untuk mengesan rekod pendua melalui pemadanan DOI, tajuk, dan skor persamaan semantik.
            </p>
            <button
              onClick={runDeduplication}
              disabled={deduplicating}
              className="bg-slate-800 text-white px-5 py-2 rounded font-medium flex items-center hover:bg-slate-900 transition-colors disabled:opacity-50 text-sm"
            >
              {deduplicating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {deduplicating ? 'Memproses...' : 'Jalankan Deduplication'}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Rekod Unik</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.unique || 0}</p>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Pendua Pasti</p>
              <p className="text-2xl font-bold text-amber-500">{stats.duplicates || 0}</p>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Telah Diproses</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total || 0}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-6 border-t border-slate-200 mt-8 gap-4">
        <button
          onClick={handleNext}
          disabled={!stats || stats.total === 0}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium flex items-center hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
        >
          Saringan Abstrak Pintar <ArrowRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
}
