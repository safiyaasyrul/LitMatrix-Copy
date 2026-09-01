import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Loader2, RefreshCw, Copy, Save, Check } from 'lucide-react';

export default function Step4Search() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchData, setSearchData] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetch(`/api/projects/${id}`)
        .then(res => res.json())
        .then(data => {
          setProject(data);
          if (data.searchStrings) {
            setSearchData(data.searchStrings);
          }
        });
    }
  }, [id]);

  const runSearchGeneration = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${id}/search-strings`, { method: 'POST' });
      const data = await res.json();
      setSearchData(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleUpdateTitle = async (newTitle: string) => {
    setLoading(true);
    try {
      await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      });
      setProject(prev => ({ ...prev, title: newTitle }));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleNext = () => {
    navigate(`/project/${id}/step5-import`);
  };

  return (
    <div className="max-w-5xl mx-auto p-10 h-full overflow-y-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Langkah 4: Rentetan Carian Pangkalan Data</h2>
          <p className="text-slate-500">AI membina rentetan carian berdasarkan kata kunci dan taksonomi yang dipilih.</p>
        </div>
        <button
          onClick={runSearchGeneration}
          disabled={loading}
          className="flex items-center text-sm font-medium text-blue-600 bg-blue-50 px-4 py-2 rounded-md hover:bg-blue-100 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Jana Rentetan Carian
        </button>
      </div>

      {!searchData ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
          <p className="text-slate-500 mb-4">Rentetan carian belum dijana.</p>
          <button
            onClick={runSearchGeneration}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium flex items-center hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            Generate with AI
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-sm uppercase tracking-widest text-slate-500 font-bold mb-6">Pilihan Penapisan (Manual di Pangkalan Data)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="text-xs font-semibold text-slate-700 mb-3">Publication Type</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm text-slate-600"><input type="checkbox" defaultChecked className="rounded text-blue-600" /> <span>Journal Article</span></label>
                  <label className="flex items-center space-x-2 text-sm text-slate-600"><input type="checkbox" className="rounded text-blue-600" /> <span>Review Article</span></label>
                  <label className="flex items-center space-x-2 text-sm text-slate-600"><input type="checkbox" className="rounded text-blue-600" /> <span>Conference Paper</span></label>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-700 mb-3">Language</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm text-slate-600"><input type="checkbox" defaultChecked className="rounded text-blue-600" /> <span>English</span></label>
                  <label className="flex items-center space-x-2 text-sm text-slate-600"><input type="checkbox" className="rounded text-blue-600" /> <span>Malay</span></label>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-700 mb-3">Publication Year</h4>
                <div className="flex items-center space-x-2">
                  <input type="number" defaultValue="2015" className="w-20 p-2 border border-slate-200 rounded text-sm" />
                  <span className="text-slate-400">hingga</span>
                  <input type="number" defaultValue="2026" className="w-20 p-2 border border-slate-200 rounded text-sm" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 relative group">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex justify-between items-center">
                SCOPUS
                <button onClick={() => handleCopy(searchData.scopus, 'scopus')} className="text-blue-600 hover:text-blue-800 flex items-center text-xs">
                  {copiedField === 'scopus' ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                  Copy
                </button>
              </h3>
              <div className="bg-white p-4 border border-slate-200 rounded font-mono text-sm text-slate-700 overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto">
                {searchData.scopus}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 relative group">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex justify-between items-center">
                WEB OF SCIENCE
                <button onClick={() => handleCopy(searchData.wos, 'wos')} className="text-blue-600 hover:text-blue-800 flex items-center text-xs">
                  {copiedField === 'wos' ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                  Copy
                </button>
              </h3>
              <div className="bg-white p-4 border border-slate-200 rounded font-mono text-sm text-slate-700 overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto">
                {searchData.wos}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 relative group md:col-span-2">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex justify-between items-center">
                GOOGLE SCHOLAR
                <button onClick={() => handleCopy(searchData.scholar, 'scholar')} className="text-blue-600 hover:text-blue-800 flex items-center text-xs">
                  {copiedField === 'scholar' ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                  Copy
                </button>
              </h3>
              <div className="bg-white p-4 border border-slate-200 rounded font-mono text-sm text-slate-700 overflow-x-auto whitespace-pre-wrap max-h-32 overflow-y-auto">
                {searchData.scholar}
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
            <h3 className="text-sm font-bold text-blue-900 mb-2">AI Suggested Search Strategy</h3>
            <p className="text-sm text-blue-800 leading-relaxed">
              {searchData.aiSuggestion}
            </p>
          </div>

          {searchData.alternativeTitles && searchData.alternativeTitles.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Cadangan Tajuk Artikel (AI Suggested)</h3>
              <p className="text-xs text-slate-500 mb-4">Tajuk semasa: <span className="italic">{project?.title}</span></p>
              <div className="space-y-3">
                {searchData.alternativeTitles.map((title: string, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-3 border border-slate-100 rounded bg-slate-50 hover:bg-slate-100 transition-colors">
                    <span className="text-sm font-medium text-slate-700">{title}</span>
                    <button 
                      onClick={() => handleUpdateTitle(title)}
                      className="text-xs px-3 py-1 bg-white border border-slate-200 rounded text-slate-600 hover:text-blue-600 hover:border-blue-200"
                    >
                      Guna Tajuk Ini
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-6 border-t border-slate-200 mt-8">
            <button
              onClick={handleNext}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium flex items-center hover:bg-blue-700 transition-colors shadow-sm"
            >
              Pengimportan Data & Penyahduplikasian <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
