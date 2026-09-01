import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BookOpen, FileText, CheckCircle2, XCircle, HelpCircle, Layers, Link as LinkIcon, Database } from 'lucide-react';

export default function Dashboard() {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/projects/${id}`).then(res => res.json()).then(setProject);
    fetch(`/api/projects/${id}/stats`).then(res => res.json()).then(setStats);
  }, [id]);

  if (!project || !stats) return <div className="p-10 text-white/40 flex items-center justify-center h-full text-sm uppercase tracking-widest">Loading project overview...</div>;

  const getProgress = () => {
    if (stats.total === 0) return 10;
    if (stats.duplicates > 0) return 30;
    return 10;
  };

  const statCards = [
    { label: 'Records Imported', value: stats.total },
    { label: 'Scopus Records', value: stats.scopus },
    { label: 'WoS Records', value: stats.wos },
    { label: 'Duplicates', value: stats.duplicates },
    { label: 'Unique Records', value: stats.unique },
    { label: 'Included', value: 0 },
    { label: 'Excluded', value: 0 },
    { label: 'Pending Screen', value: stats.unique },
  ];

  return (
    <div className="flex flex-col h-full">
      <header className="h-24 border-b border-white/10 flex items-center justify-between px-10 shrink-0">
        <div>
          <h1 className="text-sm uppercase tracking-[0.3em] font-light text-white/60">Project Overview</h1>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-right">
            <div className="text-[10px] uppercase text-white/30 tracking-widest">{project.reviewType}</div>
            <div className="text-sm text-white/80 mt-1">{new Date(project.createdAt).toLocaleDateString()}</div>
          </div>
          <div className="h-10 w-10 rounded-full border border-white/20 bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white/50" />
          </div>
        </div>
      </header>

      <section className="flex-1 p-10 flex flex-col gap-8 overflow-y-auto">
        <div>
          <h2 className="text-2xl font-serif italic text-white mb-2">{project.title}</h2>
        </div>

        <div className="bg-white/5 border border-white/10 p-8 rounded-sm relative">
          <div className="text-[10px] uppercase text-white/40 tracking-widest mb-4">Research Question</div>
          <p className="text-lg font-light tracking-wide text-white/90 leading-relaxed">{project.researchQuestion}</p>
          <div className="absolute top-8 right-8 flex gap-4">
            <div className="h-1 w-12 bg-white/60"></div>
            <div className="h-1 w-12 bg-white/10"></div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm uppercase tracking-[0.3em] font-light text-white/60">Review Progress</h2>
            <span className="text-xs text-white/90">{getProgress()}%</span>
          </div>
          <div className="h-px w-full bg-white/10 relative mb-4">
            <div className="absolute top-0 left-0 h-full bg-white/60 transition-all duration-1000" style={{ width: `${getProgress()}%` }}></div>
            <div className="absolute top-1/2 -translate-y-1/2 w-1.5 h-3 bg-white" style={{ left: `calc(${getProgress()}% - 3px)` }}></div>
          </div>
          <div className="flex justify-between text-[9px] uppercase tracking-widest text-white/30">
            <span className={getProgress() >= 10 ? 'text-white' : ''}>Import</span>
            <span className={getProgress() >= 30 ? 'text-white' : ''}>Deduplication</span>
            <span>Screening</span>
            <span>Extraction</span>
            <span>Analysis</span>
            <span>Writing</span>
          </div>
        </div>

        <div>
          <h2 className="text-sm uppercase tracking-[0.3em] font-light text-white/60 mb-6">Literature Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {statCards.map((c, i) => (
              <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-sm flex flex-col">
                <div className="text-[10px] uppercase text-white/40 tracking-widest mb-4">{c.label}</div>
                <div className="text-3xl font-light tracking-tight text-white">{c.value.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        {stats.total === 0 && (
          <div className="mt-8 border border-white/10 p-10 flex flex-col items-center justify-center text-center rounded-sm">
            <Database className="w-8 h-8 text-white/30 mb-6" />
            <div className="text-lg font-serif italic mb-2">No Literature Imported</div>
            <div className="text-sm text-white/40 mb-8 max-w-md">Begin your systematic review by importing RIS files from Scopus or Web of Science.</div>
            <Link to={`/project/${id}/import`} className="border border-white/20 px-8 py-3 text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all">
              Import Records
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
