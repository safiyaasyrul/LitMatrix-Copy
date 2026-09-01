import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Loader2, RefreshCw, Save } from 'lucide-react';

export default function Step2Topic() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [topics, setTopics] = useState<any>({});
  const [isEditing, setIsEditing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (id) {
      fetch(`/api/projects/${id}`)
        .then(res => res.json())
        .then(data => {
          setProject(data);
          if (data.topicDecomposition) {
            setTopics(data.topicDecomposition);
          }
        });
    }
  }, [id]);

  const runDecomposition = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${id}/decompose`, { method: 'POST' });
      const data = await res.json();
      setTopics(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicDecomposition: topics })
      });
      navigate(`/project/${id}/step3-taxonomy`);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const updateTopic = (key: string, value: string) => {
    setTopics(prev => ({ ...prev, [key]: value }));
  };

  const labels = {
    fieldOfStudy: 'Field of Study',
    problemStatement: 'Problem Statement',
    contextSetting: 'Context / Setting',
    population: 'Population / Object of Study',
    mainPhenomenon: 'Main Phenomenon',
    technologyMethod: 'Technology / Method',
    geographicScope: 'Geographic Scope',
    timeScope: 'Time Scope'
  };

  return (
    <div className="max-w-5xl mx-auto p-10 h-full overflow-y-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Langkah 2: Penguraian Topik</h2>
          <p className="text-slate-500">AI menganalisis tajuk anda untuk mengenal pasti struktur dan skop kajian.</p>
        </div>
        <button
          onClick={runDecomposition}
          disabled={loading}
          className="flex items-center text-sm font-medium text-blue-600 bg-blue-50 px-4 py-2 rounded-md hover:bg-blue-100 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Regenerate AI Analysis
        </button>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-8 shadow-sm">
        <h3 className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-2">Paper Title</h3>
        <p className="text-lg font-serif italic text-slate-800">{project?.title || 'Loading...'}</p>
      </div>

      {!topics || Object.keys(topics).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
          <p className="text-slate-500 mb-4">Belum ada penguraian topik.</p>
          <button
            onClick={runDecomposition}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium flex items-center hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            Generate with AI
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(labels).map(([key, label]) => (
              <div key={key} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm group">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</h4>
                  <button 
                    onClick={() => setIsEditing(prev => ({ ...prev, [key]: !prev[key] }))}
                    className="text-[10px] uppercase font-bold tracking-widest text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {isEditing[key] ? 'Done' : 'Edit'}
                  </button>
                </div>
                {isEditing[key] ? (
                  <textarea
                    value={topics[key] || ''}
                    onChange={(e) => updateTopic(key, e.target.value)}
                    className="w-full p-3 border border-blue-200 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm text-slate-800 resize-y min-h-[80px]"
                  />
                ) : (
                  <p className="text-slate-700 text-sm leading-relaxed">{topics[key] || <span className="text-slate-300 italic">Not applicable</span>}</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-6 border-t border-slate-200 mt-8 gap-4">
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium flex items-center hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
            >
              <Save className="w-4 h-4 mr-2" />
              Pilih Terma & Kata Kunci <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
