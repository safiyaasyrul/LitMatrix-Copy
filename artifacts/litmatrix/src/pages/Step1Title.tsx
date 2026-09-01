import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';

export default function Step1Title() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id && id !== 'new') {
      fetch(`/api/projects/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.title) {
            setTitle(data.title);
          }
        });
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    setLoading(true);
    try {
      if (id && id !== 'new') {
        await fetch(`/api/projects/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title })
        });
        navigate(`/project/${id}/step2-topic`);
      } else {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title })
        });
        const data = await res.json();
        navigate(`/project/${data.id}/step2-topic`);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-10 h-full flex flex-col justify-center">
      <h2 className="text-3xl font-bold text-slate-800 mb-2">Langkah 1: Tajuk Kertas</h2>
      <p className="text-slate-500 mb-10 text-lg">Masukkan tajuk atau fokus awal kajian anda.</p>
      
      <form onSubmit={handleSubmit} className="w-full">
        <label className="block text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wider">
          Tajuk Kertas / Paper Title
        </label>
        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Contoh: Artificial Intelligence Approaches for Maritime CO₂ Emission Prediction and Mitigation"
          className="w-full p-5 bg-slate-50 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-slate-900 text-lg mb-8 resize-none shadow-sm"
          rows={4}
        />
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium flex items-center hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            Teruskan <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </form>
    </div>
  );
}
