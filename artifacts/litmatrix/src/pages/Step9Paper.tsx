import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Download, FileText, CheckCircle2 } from 'lucide-react';

export default function Step9Paper() {
  const { id } = useParams();
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  const generatePaper = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setDone(true);
    }, 3000);
  };

  return (
    <div className="max-w-5xl mx-auto p-10 h-full overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Langkah 9: Jana Kertas Kajian</h2>
        <p className="text-slate-500">Sintesis akhir untuk keseluruhan artikel kajian berserta rujukan yang boleh dikesan (traceable citations).</p>
      </div>

      {!done ? (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-10 text-center flex flex-col items-center">
          <FileText className="w-12 h-12 text-slate-400 mb-4" />
          <h3 className="text-lg font-bold text-slate-800 mb-2">Penjanaan Artikel Penuh</h3>
          <p className="text-slate-500 mb-6 max-w-md text-sm">
            Nota: Sintesis semasa adalah berdasarkan metadata dan abstrak artikel. Dakwaan terperinci berkaitan kaedah, saiz sampel, nilai statistik, keputusan eksperimen dan parameter teknikal hendaklah disahkan melalui teks penuh artikel.
          </p>
          <button
            onClick={generatePaper}
            disabled={generating}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium inline-flex items-center hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <FileText className="w-5 h-5 mr-2" />}
            {generating ? 'Sedang Menjana Teks...' : 'Jana Kertas Penuh'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mr-3 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-emerald-900 mb-1">Artikel Selesai Dijana</h3>
                <p className="text-sm text-emerald-700">Semua dakwaan (claims) berjaya dipautkan kepada sumber.</p>
              </div>
            </div>
            <button className="bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-100 px-4 py-2 rounded text-sm font-medium flex items-center shadow-sm">
              <Download className="w-4 h-4 mr-2" /> Eksport PDF
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-10 shadow-sm max-w-4xl mx-auto">
            <h1 className="text-2xl font-serif font-bold text-center mb-6">AI-Based Maritime CO₂ Emission Prediction and Mitigation: A Systematic Literature Review</h1>
            <h3 className="font-bold text-sm mb-2">ABSTRACT</h3>
            <p className="text-sm text-slate-700 leading-relaxed mb-6 text-justify">
              Maritime transportation contributes significantly to greenhouse gas emissions, while accurate and scalable vessel-level CO₂ prediction remains challenging. This systematic literature review synthesizes current research on the application of artificial intelligence and machine learning in maritime emission prediction and mitigation...
            </p>
            
            <h3 className="font-bold text-sm mb-2 mt-8">1. INTRODUCTION</h3>
            <p className="text-sm text-slate-700 leading-relaxed mb-4 text-justify">
              The maritime industry is facing increasing pressure to decarbonize. Across the reviewed literature, machine-learning approaches have increasingly been used to model nonlinear relationships between vessel operational characteristics and CO₂ emissions <span className="text-blue-600 font-medium cursor-pointer hover:underline">[SP001, SP034]</span>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
