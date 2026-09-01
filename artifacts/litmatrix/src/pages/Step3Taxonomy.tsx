import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Loader2, RefreshCw, Plus, Save, Trash2 } from 'lucide-react';

export default function Step3Taxonomy() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [taxonomy, setTaxonomy] = useState<{categories: any[]}>({ categories: [] });

  useEffect(() => {
    if (id) {
      fetch(`/api/projects/${id}`)
        .then(res => res.json())
        .then(data => {
          setProject(data);
          if (data.taxonomy) {
            setTaxonomy(data.taxonomy);
          }
        });
    }
  }, [id]);

  const runTaxonomy = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${id}/taxonomy`, { method: 'POST' });
      const data = await res.json();
      setTaxonomy(data);
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
        body: JSON.stringify({ taxonomy })
      });
      navigate(`/project/${id}/step4-search`);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const addCategory = () => {
    setTaxonomy(prev => ({
      categories: [
        ...(prev.categories || []),
        { category: 'New Category', content: '', keywords: '', selected: true }
      ]
    }));
  };

  const updateCategory = (index: number, field: string, value: any) => {
    setTaxonomy(prev => {
      const newCats = [...prev.categories];
      newCats[index] = { ...newCats[index], [field]: value };
      return { categories: newCats };
    });
  };

  const removeCategory = (index: number) => {
    setTaxonomy(prev => {
      const newCats = [...prev.categories];
      newCats.splice(index, 1);
      return { categories: newCats };
    });
  };

  return (
    <div className="max-w-5xl mx-auto p-10 h-full overflow-y-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Langkah 3: Tapis & Pilih Terma Rujukan Taksonomi</h2>
          <p className="text-slate-500">AI mencadangkan kategori, subkategori dan kata kunci berdasarkan penguraian topik.</p>
        </div>
        <button
          onClick={runTaxonomy}
          disabled={loading}
          className="flex items-center text-sm font-medium text-blue-600 bg-blue-50 px-4 py-2 rounded-md hover:bg-blue-100 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Regenerate AI Analysis
        </button>
      </div>

      {!taxonomy?.categories || taxonomy.categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
          <p className="text-slate-500 mb-4">Belum ada taksonomi dijana.</p>
          <button
            onClick={runTaxonomy}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium flex items-center hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            Generate with AI
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                  <th className="p-4 w-16 text-center">Pilih</th>
                  <th className="p-4 w-1/4">Category</th>
                  <th className="p-4 w-1/4">Content</th>
                  <th className="p-4">Keywords</th>
                  <th className="p-4 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {taxonomy.categories.map((cat, idx) => (
                  <tr key={idx} className={cat.selected ? 'bg-white' : 'bg-slate-50/50 opacity-60'}>
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={cat.selected}
                        onChange={(e) => updateCategory(idx, 'selected', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                    </td>
                    <td className="p-4">
                      <input
                        type="text"
                        value={cat.category}
                        onChange={(e) => updateCategory(idx, 'category', e.target.value)}
                        className="w-full p-2 border border-transparent hover:border-slate-200 focus:border-blue-500 rounded bg-transparent outline-none"
                      />
                    </td>
                    <td className="p-4">
                      <input
                        type="text"
                        value={cat.content}
                        onChange={(e) => updateCategory(idx, 'content', e.target.value)}
                        className="w-full p-2 border border-transparent hover:border-slate-200 focus:border-blue-500 rounded bg-transparent outline-none"
                      />
                    </td>
                    <td className="p-4">
                      <textarea
                        value={cat.keywords}
                        onChange={(e) => updateCategory(idx, 'keywords', e.target.value)}
                        className="w-full p-2 border border-transparent hover:border-slate-200 focus:border-blue-500 rounded bg-transparent outline-none resize-y min-h-[40px] font-mono text-sm"
                      />
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => removeCategory(idx)} className="text-slate-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={addCategory}
                className="flex items-center text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                <Plus className="w-4 h-4 mr-2" /> Tambah Kategori
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
            <h3 className="text-xs uppercase tracking-widest text-blue-800 font-semibold mb-4">Selected Keywords</h3>
            <div className="flex flex-wrap gap-2">
              {taxonomy.categories.filter(c => c.selected && c.keywords).map((cat, idx) => (
                <div key={idx} className="px-3 py-1.5 bg-white border border-blue-200 rounded-md text-sm text-blue-800 font-mono shadow-sm">
                  {cat.keywords}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-slate-200 mt-8 gap-4">
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium flex items-center hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
            >
              <Save className="w-4 h-4 mr-2" />
              Jana Rentetan Carian <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
