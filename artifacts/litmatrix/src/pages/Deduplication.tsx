import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Link as LinkIcon, AlertCircle, CheckCircle2, Copy, Search, Loader2 } from 'lucide-react';

export default function Deduplication() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [duplicateCount, setDuplicateCount] = useState(0);

  useEffect(() => {
    fetch(`/api/projects/${id}/stats`).then(res => res.json()).then(setStats);
  }, [id]);

  const runDeduplication = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${id}/deduplicate`, { method: 'POST' });
      const data = await res.json();
      setDuplicateCount(data.duplicateCount);
      const statsRes = await fetch(`/api/projects/${id}/stats`);
      const newStats = await statsRes.json();
      setStats(newStats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!stats) return <div className="p-10 text-white/40 flex items-center justify-center h-full text-sm uppercase tracking-widest bg-[#0A0A0A]">Loading...</div>;

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] text-[#F0F0F0] font-sans">
      <header className="h-24 border-b border-white/10 flex items-center justify-between px-10 shrink-0">
        <div>
          <h1 className="text-sm uppercase tracking-[0.3em] font-light text-white/60">Deduplication</h1>
        </div>
      </header>

      <section className="flex-1 p-10 flex flex-col gap-8 overflow-y-auto max-w-5xl mx-auto w-full">
        <div>
          <h2 className="text-2xl font-serif italic text-white mb-2">Identify Duplicates</h2>
          <p className="text-[10px] uppercase tracking-widest text-white/40">Identify and merge duplicate records imported from multiple databases.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 border border-white/10 p-6 rounded-sm flex flex-col relative overflow-hidden">
            <div className="absolute -right-4 -top-4 text-white/5">
              <Copy className="w-24 h-24" />
            </div>
            <p className="text-[10px] uppercase text-white/40 tracking-widest mb-4">Total Records</p>
            <p className="text-3xl font-light tracking-tight text-white relative z-10">{stats.total.toLocaleString()}</p>
          </div>

          <div className="bg-white/5 border border-white/10 p-6 rounded-sm flex flex-col relative overflow-hidden">
            <div className="absolute -right-4 -top-4 text-amber-500/10">
              <AlertCircle className="w-24 h-24" />
            </div>
            <p className="text-[10px] uppercase text-white/40 tracking-widest mb-4 text-amber-400">Duplicates Found</p>
            <p className="text-3xl font-light tracking-tight text-white relative z-10">{stats.duplicates.toLocaleString()}</p>
          </div>

          <div className="bg-white/5 border border-white/10 p-6 rounded-sm flex flex-col relative overflow-hidden">
            <div className="absolute -right-4 -top-4 text-emerald-500/10">
              <CheckCircle2 className="w-24 h-24" />
            </div>
            <p className="text-[10px] uppercase text-white/40 tracking-widest mb-4 text-emerald-400">Unique Records</p>
            <p className="text-3xl font-light tracking-tight text-white relative z-10">{stats.unique.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-sm">
          <div className="p-8 border-b border-white/10 flex justify-between items-end">
            <h2 className="text-xl font-serif italic text-white flex items-center">
              <Search className="w-4 h-4 mr-3 text-white/40" /> Automated Detection
            </h2>
            <div className="flex gap-4">
              <div className="h-1 w-12 bg-white/60"></div>
              <div className="h-1 w-12 bg-white/10"></div>
            </div>
          </div>
          
          <div className="p-10">
            <p className="text-sm font-light text-white/60 mb-8 max-w-2xl">Run our automated algorithm to find duplicates based on DOI, exact title match, and fuzzy title similarity.</p>
            <button 
              onClick={runDeduplication}
              disabled={loading}
              className="border border-white/20 px-8 py-3 text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-white"
            >
              {loading ? <><Loader2 className="w-4 h-4 mr-3 animate-spin" /> Detecting...</> : <><LinkIcon className="w-4 h-4 mr-3" /> Run Deduplication</>}
            </button>
            
            {duplicateCount > 0 && (
              <div className="mt-8 bg-emerald-950/30 text-emerald-400 p-6 border border-emerald-900/50 rounded-sm flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-3" />
                <span className="text-sm font-light">Successfully identified {duplicateCount} new duplicates.</span>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
