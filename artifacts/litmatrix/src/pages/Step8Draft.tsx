import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Loader2, Play, FileText, CheckCircle2 } from 'lucide-react';

export default function Step8Draft() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  const generateDraft = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setDone(true);
    }, 2000);
  };

  return (
    <div className="max-w-5xl mx-auto p-10 h-full overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Langkah 8: Jana Draf Kajian</h2>
        <p className="text-slate-500">Menyediakan rangka (blueprint) artikel kajian berserta statistik PRISMA.</p>
      </div>
      
      {!done ? (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-10 text-center flex flex-col items-center">
          <FileText className="w-12 h-12 text-slate-400 mb-4" />
          <h3 className="text-lg font-bold text-slate-800 mb-2">Sedia Untuk Menjana Draf</h3>
          <p className="text-slate-500 mb-6 max-w-md">AI akan membina struktur utama artikel termasuk metodologi, dapatan dan perbincangan.</p>
          <button
            onClick={generateDraft}
            disabled={generating}
            className="bg-slate-800 text-white px-8 py-3 rounded-lg font-medium flex items-center hover:bg-slate-900 transition-colors shadow-sm disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Play className="w-5 h-5 mr-2" />}
            {generating ? 'Menjana Blueprint...' : 'Jana Blueprint'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 flex items-start">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 mr-3 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-emerald-900 mb-1">Blueprint Berjaya Dijana</h3>
              <p className="text-sm text-emerald-700">Semua struktur utama, pecahan tema, dan statistik PRISMA telah dikunci.</p>
            </div>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Review Blueprint</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-center"><span className="w-6 text-slate-400">1.</span> Introduction</li>
              <li className="flex items-center"><span className="w-6 text-slate-400">2.</span> Methodology (PRISMA Included)</li>
              <li className="flex items-center"><span className="w-6 text-slate-400">3.</span> Results & Publication Trends</li>
              <li className="flex items-center"><span className="w-6 text-slate-400">4.</span> Thematic Synthesis (4 Themes)</li>
              <li className="flex items-center"><span className="w-6 text-slate-400">5.</span> Discussion</li>
              <li className="flex items-center"><span className="w-6 text-slate-400">6.</span> Research Gaps</li>
              <li className="flex items-center"><span className="w-6 text-slate-400">7.</span> Future Directions & Conclusion</li>
            </ul>
          </div>
          
          <div className="flex justify-end pt-6 border-t border-slate-200 mt-8 gap-4">
            <button
              onClick={() => navigate(`/project/${id}/step9-paper`)}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium inline-flex items-center hover:bg-blue-700 transition-colors shadow-sm"
            >
              Jana Kertas Kajian Penuh <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
