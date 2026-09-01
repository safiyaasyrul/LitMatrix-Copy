import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Loader2, Play, Copy, Check } from 'lucide-react';

export default function Step6Screening() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) {
      fetch(`/api/projects/${id}/stats`)
        .then(res => res.json())
        .then(data => setStats(data));
    }
  }, [id]);

  const handleNext = () => {
    navigate(`/project/${id}/step7-themes`);
  };

  const generatePrismaText = () => {
    if (!stats) return '';
    const screened = stats.unique || 0;
    const excluded = Math.floor(screened * 0.6); // demo calculation
    const included = screened - excluded;
    
    return `Daripada ${stats.total || 0} rekod yang dikenal pasti melalui pangkalan data Scopus dan Web of Science, sebanyak ${stats.duplicates || 0} rekod pendua telah dikesan dan dikeluarkan. Sebanyak ${stats.unique || 0} rekod unik kemudiannya disaring berdasarkan tajuk dan abstrak. Daripada jumlah tersebut, ${excluded} rekod dikecualikan kerana tidak memenuhi kriteria inklusi, manakala ${included} artikel diterima untuk analisis seterusnya.`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatePrismaText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto p-10 h-full overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Langkah 6: Saringan Abstrak Pintar</h2>
        <p className="text-slate-500">AI menilai kesesuaian artikel berdasarkan persoalan kajian dan kriteria pemilihan anda.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6 mb-8 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-slate-800">Rumusan Keputusan Penerimaan dan Penolakan</h3>
          <button 
            onClick={handleCopy}
            className="text-xs flex items-center bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded transition-colors"
          >
            {copied ? <Check className="w-4 h-4 mr-1 text-emerald-600" /> : <Copy className="w-4 h-4 mr-1" />}
            {copied ? 'Berjaya Disalin' : 'Salin Rumusan'}
          </button>
        </div>
        <p className="text-slate-700 text-sm leading-relaxed p-4 bg-slate-50 border border-slate-100 rounded">
          {generatePrismaText()}
        </p>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center flex flex-col items-center">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Modul Saringan Artikel</h3>
        <p className="text-slate-500 mb-6 max-w-md text-sm">Ciri saringan satu demi satu akan dipaparkan di sini. Anda boleh menerima atau menolak cadangan AI bagi setiap abstrak.</p>
        
        <table className="w-full text-left bg-white border border-slate-200 rounded overflow-hidden shadow-sm text-sm">
          <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 text-xs uppercase">
            <tr>
              <th className="p-3">Title</th>
              <th className="p-3 w-20">Year</th>
              <th className="p-3 w-32">AI Decision</th>
              <th className="p-3 w-40 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            <tr>
              <td className="p-3 truncate max-w-xs">AI-based emission prediction in shipping...</td>
              <td className="p-3">2024</td>
              <td className="p-3 text-emerald-600 font-medium flex items-center"><Check className="w-4 h-4 mr-1" /> INCLUDE</td>
              <td className="p-3 text-center">
                <button className="text-xs px-2 py-1 bg-slate-100 rounded hover:bg-slate-200">Semak</button>
              </td>
            </tr>
            <tr>
              <td className="p-3 truncate max-w-xs">A review of marine transport policies...</td>
              <td className="p-3">2023</td>
              <td className="p-3 text-amber-500 font-medium">MAYBE</td>
              <td className="p-3 text-center">
                <button className="text-xs px-2 py-1 bg-slate-100 rounded hover:bg-slate-200">Semak</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex justify-end pt-6 border-t border-slate-200 mt-8 gap-4">
        <button
          onClick={handleNext}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium flex items-center hover:bg-blue-700 transition-colors shadow-sm"
        >
          Pengelompokan Bertema <ArrowRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
}
