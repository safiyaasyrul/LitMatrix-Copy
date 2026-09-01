import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Filter, CheckCircle2, XCircle, HelpCircle, ChevronLeft, ChevronRight, Loader2, Bot } from 'lucide-react';

export default function Screening() {
  const { id } = useParams();
  const [paper, setPaper] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [aiScreening, setAiScreening] = useState<any>(null);
  
  useEffect(() => {
    fetchStats();
    fetchNextPaper();
  }, [id]);

  const fetchStats = async () => {
    if (!id) return;
    const res = await fetch(`/api/projects/${id}/stats`);
    const data = await res.json();
    setStats(data);
  };

  const fetchNextPaper = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${id}/papers/next`);
      if (res.ok) {
        const data = await res.json();
        setPaper(data);
        setAiScreening(null);
      } else {
        setPaper(null);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const runAIScreening = async () => {
    if (!id || !paper) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${id}/ai-screen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId: paper.id })
      });
      const data = await res.json();
      setAiScreening(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const submitDecision = async (decision: string, reason?: string) => {
    if (!id || !paper) return;
    setLoading(true);
    try {
      await fetch(`/api/projects/${id}/screen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId: paper.id, decision, reason, aiScreening })
      });
      await fetchStats();
      await fetchNextPaper();
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  if (!stats) return <div className="p-10 text-white/40 flex items-center justify-center h-full text-sm uppercase tracking-widest bg-[#0A0A0A]">Loading...</div>;

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] text-[#F0F0F0] font-sans">
      <header className="h-24 border-b border-white/10 flex items-center justify-between px-10 shrink-0">
        <div>
          <h1 className="text-sm uppercase tracking-[0.3em] font-light text-white/60">Screening</h1>
        </div>
        <div className="flex items-center gap-6 text-xs uppercase tracking-widest text-white/40">
          <div>Total: {stats.unique}</div>
          <div className="text-emerald-400">Included: {stats.included || 0}</div>
          <div className="text-red-400">Excluded: {stats.excluded || 0}</div>
        </div>
      </header>

      <section className="flex-1 p-10 overflow-y-auto max-w-5xl mx-auto w-full">
        {!paper && !loading ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Filter className="w-16 h-16 text-white/10 mb-6" />
            <h2 className="text-2xl font-serif italic text-white mb-2">Screening Complete</h2>
            <p className="text-sm text-white/40 max-w-md">You have screened all available unique papers in this project.</p>
          </div>
        ) : paper ? (
          <div className="flex flex-col gap-8">
            <div className="bg-white/5 border border-white/10 p-8 rounded-sm relative">
              <div className="absolute top-8 right-8 flex gap-4">
                <div className="h-1 w-12 bg-white/60"></div>
                <div className="h-1 w-12 bg-white/10"></div>
              </div>
              
              <div className="flex flex-wrap gap-3 mb-6">
                <span className="px-3 py-1 border border-white/20 text-[10px] uppercase tracking-widest">{paper.year}</span>
                <span className="px-3 py-1 border border-white/20 text-[10px] uppercase tracking-widest">{paper.sources?.[0] || 'Unknown'}</span>
                {paper.doi && <span className="px-3 py-1 border border-white/20 text-[10px] uppercase tracking-widest truncate max-w-xs">{paper.doi}</span>}
              </div>
              
              <h2 className="text-2xl font-serif italic text-white mb-4 leading-relaxed">{paper.title}</h2>
              <p className="text-sm font-light text-white/60 mb-6">{paper.authors?.join(', ')}</p>
              
              <div className="text-[10px] uppercase text-white/40 tracking-widest mb-4">Abstract</div>
              <p className="text-sm font-light tracking-wide text-white/90 leading-relaxed bg-black/20 p-6 rounded-sm border border-white/5">
                {paper.abstract || <span className="italic text-white/30">No abstract available for this paper.</span>}
              </p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 flex gap-4">
                <button 
                  onClick={() => submitDecision('INCLUDE')}
                  disabled={loading}
                  className="flex-1 border border-emerald-500/30 bg-emerald-950/20 text-emerald-400 p-4 rounded-sm flex items-center justify-center gap-3 hover:bg-emerald-950/40 transition-colors"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-xs uppercase tracking-widest font-semibold">Include</span>
                </button>
                <button 
                  onClick={() => submitDecision('EXCLUDE')}
                  disabled={loading}
                  className="flex-1 border border-red-500/30 bg-red-950/20 text-red-400 p-4 rounded-sm flex items-center justify-center gap-3 hover:bg-red-950/40 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                  <span className="text-xs uppercase tracking-widest font-semibold">Exclude</span>
                </button>
                <button 
                  onClick={() => submitDecision('MAYBE')}
                  disabled={loading}
                  className="flex-1 border border-amber-500/30 bg-amber-950/20 text-amber-400 p-4 rounded-sm flex items-center justify-center gap-3 hover:bg-amber-950/40 transition-colors"
                >
                  <HelpCircle className="w-5 h-5" />
                  <span className="text-xs uppercase tracking-widest font-semibold">Maybe</span>
                </button>
              </div>
              
              <div>
                <button 
                  onClick={runAIScreening}
                  disabled={loading || aiScreening}
                  className="w-full h-full border border-blue-500/30 bg-blue-950/20 text-blue-400 p-4 rounded-sm flex flex-col items-center justify-center gap-2 hover:bg-blue-950/40 transition-colors disabled:opacity-50"
                >
                  {loading && !aiScreening ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Bot className="w-6 h-6" />
                  )}
                  <span className="text-[10px] uppercase tracking-widest font-semibold">
                    {aiScreening ? 'AI Evaluated' : 'Run AI Screening'}
                  </span>
                </button>
              </div>
            </div>

            {/* AI Screening Result */}
            {aiScreening && (
              <div className={`p-6 border rounded-sm ${
                aiScreening.error ? 'border-red-500/30 bg-red-950/10' :
                aiScreening.decision === 'INCLUDE' ? 'border-emerald-500/30 bg-emerald-950/10' : 
                aiScreening.decision === 'EXCLUDE' ? 'border-red-500/30 bg-red-950/10' : 
                'border-amber-500/30 bg-amber-950/10'
              }`}>
                {aiScreening.error ? (
                  <div className="flex flex-col gap-2">
                    <h3 className="text-xs uppercase tracking-widest font-semibold flex items-center gap-2 text-red-400">
                      <Bot className="w-4 h-4" /> AI Screening Failed
                    </h3>
                    <p className="text-sm font-light text-red-300 leading-relaxed">{aiScreening.error}</p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xs uppercase tracking-widest font-semibold flex items-center gap-2">
                        <Bot className="w-4 h-4" /> AI Recommendation
                      </h3>
                      <span className={`px-3 py-1 text-[10px] uppercase tracking-widest font-bold rounded-sm border ${
                        aiScreening.decision === 'INCLUDE' ? 'border-emerald-500/30 text-emerald-400' : 
                        aiScreening.decision === 'EXCLUDE' ? 'border-red-500/30 text-red-400' : 
                        'border-amber-500/30 text-amber-400'
                      }`}>
                        {aiScreening.decision} ({aiScreening.confidence}%)
                      </span>
                    </div>
                    <p className="text-sm font-light leading-relaxed mb-4">{aiScreening.reason}</p>
                    
                    {aiScreening.criterionAssessment && (
                      <div className="mt-6 border-t border-white/10 pt-4">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 mb-3">Criteria Assessment</div>
                        <ul className="space-y-2">
                          {aiScreening.criterionAssessment.map((c: any, i: number) => (
                            <li key={i} className="text-xs font-light flex items-center gap-2">
                              {c.met ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <XCircle className="w-3 h-3 text-red-400" />}
                              {c.criterion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-white/30" />
          </div>
        )}
      </section>
    </div>
  );
}
