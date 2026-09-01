import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Trash2, ChevronRight, FileSignature } from 'lucide-react';

export default function CreateProject() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [reviewType, setReviewType] = useState('Systematic Literature Review');
  const [researchQuestion, setResearchQuestion] = useState('');
  const [inclusion, setInclusion] = useState(['English language']);
  const [exclusion, setExclusion] = useState(['Conference abstracts']);

  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => setProjects(data));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        reviewType,
        researchQuestion,
        inclusionCriteria: inclusion,
        exclusionCriteria: exclusion
      })
    });
    const data = await res.json();
    navigate(`/project/${data.id}`);
  };

  const addCriteria = (setter: any, state: string[]) => {
    setter([...state, '']);
  };

  const updateCriteria = (setter: any, state: string[], index: number, value: string) => {
    const next = [...state];
    next[index] = value;
    setter(next);
  };

  const removeCriteria = (setter: any, state: string[], index: number) => {
    setter(state.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F0F0F0] font-sans p-10 flex justify-center">
      <div className="max-w-4xl w-full">
        <div className="flex items-center space-x-4 mb-12">
          <div className="w-12 h-12 rounded-sm border border-white/20 bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center">
            <FileSignature className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-serif tracking-widest text-white italic uppercase">ScholarPen</h1>
            <p className="text-[10px] uppercase tracking-widest text-white/30 mt-1">From Literature Search to Review Paper</p>
          </div>
        </div>

        {projects.length > 0 && (
          <div className="mb-16">
            <h2 className="text-sm uppercase tracking-[0.3em] font-light text-white/60 mb-6">My Reviews</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/project/${p.id}`)}
                  className="bg-white/5 border border-white/10 p-6 rounded-sm hover:bg-white hover:text-black transition-all text-left group flex flex-col justify-between"
                >
                  <div>
                    <h3 className="font-serif text-lg italic mb-2 line-clamp-2">{p.title || 'Untitled Project'}</h3>
                    <p className="text-[10px] uppercase tracking-widest text-white/40 group-hover:text-black/60">{p.reviewType}</p>
                  </div>
                  <div className="flex items-center text-xs uppercase tracking-widest font-semibold mt-8 text-white/80 group-hover:text-black">
                    Open Review <ChevronRight className="w-4 h-4 ml-2" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white/5 border border-white/10 rounded-sm relative">
          <div className="p-8 border-b border-white/10 flex justify-between items-end">
            <h2 className="text-xl font-serif italic text-white">Create New Review</h2>
            <div className="flex gap-4">
              <div className="h-1 w-12 bg-white/60"></div>
              <div className="h-1 w-12 bg-white/10"></div>
            </div>
          </div>
          
          <form onSubmit={handleCreate} className="p-8 space-y-8">
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase text-white/40 tracking-widest mb-2">Review Title</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-4 bg-transparent border border-white/20 rounded-sm focus:border-white focus:bg-white/5 outline-none transition-all text-white font-light" placeholder="e.g. Artificial Intelligence Approaches..." />
              </div>
              
              <div>
                <label className="block text-[10px] uppercase text-white/40 tracking-widest mb-2">Review Type</label>
                <select value={reviewType} onChange={e => setReviewType(e.target.value)} className="w-full p-4 bg-[#0A0A0A] border border-white/20 rounded-sm focus:border-white outline-none transition-all text-white font-light appearance-none">
                  <option>Systematic Literature Review</option>
                  <option>Scoping Review</option>
                  <option>Narrative Review</option>
                  <option>Bibliometric Review</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-white/40 tracking-widest mb-2">Research Question</label>
                <textarea required rows={3} value={researchQuestion} onChange={e => setResearchQuestion(e.target.value)} className="w-full p-4 bg-transparent border border-white/20 rounded-sm focus:border-white focus:bg-white/5 outline-none transition-all text-white font-light resize-none" placeholder="e.g. What methods have been developed..." />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/10">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-[10px] uppercase text-white/40 tracking-widest">Inclusion Criteria</label>
                  <button type="button" onClick={() => addCriteria(setInclusion, inclusion)} className="text-white/60 hover:text-white text-[10px] uppercase tracking-widest flex items-center">
                    <Plus className="w-3 h-3 mr-1" /> Add
                  </button>
                </div>
                <div className="space-y-3">
                  {inclusion.map((c, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="w-4 h-4 border border-white/30 flex items-center justify-center flex-shrink-0 text-[10px] text-white">✓</div>
                      <input type="text" value={c} onChange={e => updateCriteria(setInclusion, inclusion, i, e.target.value)} className="flex-1 p-3 bg-transparent border border-white/20 rounded-sm text-sm focus:border-white outline-none font-light" placeholder="Criterion..." />
                      <button type="button" onClick={() => removeCriteria(setInclusion, inclusion, i)} className="p-2 text-white/40 hover:text-white transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-[10px] uppercase text-white/40 tracking-widest">Exclusion Criteria</label>
                  <button type="button" onClick={() => addCriteria(setExclusion, exclusion)} className="text-white/60 hover:text-white text-[10px] uppercase tracking-widest flex items-center">
                    <Plus className="w-3 h-3 mr-1" /> Add
                  </button>
                </div>
                <div className="space-y-3">
                  {exclusion.map((c, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="w-4 h-4 border border-white/30 flex items-center justify-center flex-shrink-0 text-[10px] text-white/50">✕</div>
                      <input type="text" value={c} onChange={e => updateCriteria(setExclusion, exclusion, i, e.target.value)} className="flex-1 p-3 bg-transparent border border-white/20 rounded-sm text-sm focus:border-white outline-none font-light" placeholder="Criterion..." />
                      <button type="button" onClick={() => removeCriteria(setExclusion, exclusion, i)} className="p-2 text-white/40 hover:text-white transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-white/10 flex justify-end">
              <button type="submit" className="border border-white/20 px-8 py-4 text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center">
                Create Review Project
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
