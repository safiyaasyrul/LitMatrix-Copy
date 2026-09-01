'use client';

import React, { useState } from 'react';
import {
  Tag,
  Bot,
  Plus,
  Trash2,
  Check,
  RefreshCw,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Project, TaxonomyCategory, TaxonomyKeyword } from '../types';
import { invokeTaxonomyAgent } from '../services/agentPlatform';

interface TaxonomyViewProps {
  project: Project;
  onUpdateTaxonomy: (categories: TaxonomyCategory[]) => void;
  onNextStage: () => void;
}

export const TaxonomyView: React.FC<TaxonomyViewProps> = ({
  project,
  onUpdateTaxonomy,
  onNextStage,
}) => {
  const [loading, setLoading] = useState(false);
  const [newKeywordInput, setNewKeywordInput] = useState<{ [conceptId: string]: string }>({});

  const categories: TaxonomyCategory[] = project.taxonomyCategories || [
    {
      id: 'cat_1',
      name: '1. Domain & Setting (Maritime Transport)',
      orderIndex: 0,
      concepts: [
        {
          id: 'con_1_1',
          name: 'Vessel Types & Fleet Operations',
          keywords: [
            { id: 'kw_1', term: 'maritime transport', type: 'CORE', isSelected: true },
            { id: 'kw_2', term: 'commercial ship*', type: 'WILDCARD', isSelected: true },
            { id: 'kw_3', term: 'container vessel', type: 'SYNONYM', isSelected: true },
            { id: 'kw_4', term: 'bulk carrier', type: 'RELATED', isSelected: true },
            { id: 'kw_5', term: 'ocean-going vessel', type: 'PHRASE', isSelected: true },
            { id: 'kw_6', term: 'fleet operation', type: 'RELATED', isSelected: true },
          ],
        },
        {
          id: 'con_1_2',
          name: 'Telemetry & Environmental Context',
          keywords: [
            { id: 'kw_7', term: 'AIS telemetry', type: 'CORE', isSelected: true },
            { id: 'kw_8', term: 'Automatic Identification System', type: 'SYNONYM', isSelected: true },
            { id: 'kw_9', term: 'sea state', type: 'TECHNICAL', isSelected: true },
            { id: 'kw_10', term: 'wave height', type: 'TECHNICAL', isSelected: true },
            { id: 'kw_11', term: 'meteorological data', type: 'PHRASE', isSelected: true },
          ],
        },
      ],
    },
    {
      id: 'cat_2',
      name: '2. Computational & AI Methodology',
      orderIndex: 1,
      concepts: [
        {
          id: 'con_2_1',
          name: 'Deep Learning & Neural Architectures',
          keywords: [
            { id: 'kw_12', term: 'machine learning', type: 'CORE', isSelected: true },
            { id: 'kw_13', term: 'deep learning', type: 'CORE', isSelected: true },
            { id: 'kw_14', term: 'LSTM', type: 'ABBREVIATION', isSelected: true },
            { id: 'kw_15', term: 'Long Short-Term Memory', type: 'SYNONYM', isSelected: true },
            { id: 'kw_16', term: 'Transformer network*', type: 'WILDCARD', isSelected: true },
            { id: 'kw_17', term: 'Recurrent Neural Network', type: 'SYNONYM', isSelected: true },
          ],
        },
        {
          id: 'con_2_2',
          name: 'Hybrid & Physics-Informed Modeling',
          keywords: [
            { id: 'kw_18', term: 'physics-informed neural network', type: 'CORE', isSelected: true },
            { id: 'kw_19', term: 'PINN', type: 'ABBREVIATION', isSelected: true },
            { id: 'kw_20', term: 'grey-box model', type: 'SYNONYM', isSelected: true },
            { id: 'kw_21', term: 'digital twin', type: 'PHRASE', isSelected: true },
            { id: 'kw_22', term: 'hydrodynamic equation', type: 'TECHNICAL', isSelected: true },
          ],
        },
      ],
    },
    {
      id: 'cat_3',
      name: '3. Target Phenomenon & Performance Outcome',
      orderIndex: 2,
      concepts: [
        {
          id: 'con_3_1',
          name: 'Fuel Consumption & Power Estimation',
          keywords: [
            { id: 'kw_23', term: 'fuel oil consumption', type: 'CORE', isSelected: true },
            { id: 'kw_24', term: 'FOC', type: 'ABBREVIATION', isSelected: true },
            { id: 'kw_25', term: 'shaft power prediction', type: 'TECHNICAL', isSelected: true },
            { id: 'kw_26', term: 'energy efficiency operational indicator', type: 'PHRASE', isSelected: true },
            { id: 'kw_27', term: 'EEOI', type: 'ABBREVIATION', isSelected: true },
          ],
        },
        {
          id: 'con_3_2',
          name: 'Emissions & Decarbonization Metrics',
          keywords: [
            { id: 'kw_28', term: 'greenhouse gas emission*', type: 'WILDCARD', isSelected: true },
            { id: 'kw_29', term: 'GHG', type: 'ABBREVIATION', isSelected: true },
            { id: 'kw_30', term: 'CO2 emission', type: 'SYNONYM', isSelected: true },
            { id: 'kw_31', term: 'Carbon Intensity Indicator', type: 'PHRASE', isSelected: true },
            { id: 'kw_32', term: 'CII', type: 'ABBREVIATION', isSelected: true },
          ],
        },
      ],
    },
  ];

  const handleToggleKeyword = (catId: string, conceptId: string, kwId: string) => {
    const updated = categories.map((cat) => {
      if (cat.id !== catId) return cat;
      return {
        ...cat,
        concepts: cat.concepts.map((con) => {
          if (con.id !== conceptId) return con;
          return {
            ...con,
            keywords: con.keywords.map((kw) =>
              kw.id === kwId ? { ...kw, isSelected: !kw.isSelected } : kw
            ),
          };
        }),
      };
    });
    onUpdateTaxonomy(updated);
  };

  const handleAddKeyword = (catId: string, conceptId: string) => {
    const term = (newKeywordInput[conceptId] || '').trim();
    if (!term) return;

    const newKw: TaxonomyKeyword = {
      id: `kw_custom_${Date.now()}`,
      term,
      type: 'CORE',
      isSelected: true,
    };

    const updated = categories.map((cat) => {
      if (cat.id !== catId) return cat;
      return {
        ...cat,
        concepts: cat.concepts.map((con) => {
          if (con.id !== conceptId) return con;
          return {
            ...con,
            keywords: [...con.keywords, newKw],
          };
        }),
      };
    });

    onUpdateTaxonomy(updated);
    setNewKeywordInput({ ...newKeywordInput, [conceptId]: '' });
  };

  const handleTriggerTaxonomyAgent = async () => {
    setLoading(true);
    try {
      const dummyDecomp = project.topicDecomposition || ({} as any);
      const res = await invokeTaxonomyAgent(dummyDecomp, project.id);
      onUpdateTaxonomy(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const totalSelectedKeywords = categories.reduce(
    (acc, cat) =>
      acc +
      cat.concepts.reduce(
        (cAcc, con) => cAcc + con.keywords.filter((k) => k.isSelected).length,
        0
      ),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header & Agent Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-mono font-bold uppercase">
                Stage 2 • Taxonomy & Controlled Vocabulary
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Agent: Taxonomy & Keyword Agent
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 mt-2">
              Multi-Faceted Search Keyword Classification
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Organizes terms across domain concepts, computational paradigms, and outcome indicators. Selected terms ({totalSelectedKeywords} active) directly parameterize the Scopus, Web of Science, and Google Scholar search queries.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTriggerTaxonomyAgent}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Classifying...' : 'Re-Generate Taxonomy'}</span>
            </button>

            <button
              onClick={onNextStage}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              <span>Stage 3: Search Strategy</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Category Blocks */}
      <div className="space-y-5">
        {categories.map((category) => (
          <div
            key={category.id}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-400" />
                {category.name}
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                {category.concepts.reduce((acc, c) => acc + c.keywords.filter((k) => k.isSelected).length, 0)} Selected
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {category.concepts.map((concept) => (
                <div
                  key={concept.id}
                  className="bg-slate-800/40 border border-slate-800/80 rounded-lg p-4 space-y-3"
                >
                  <span className="text-xs font-bold text-slate-200 block">
                    {concept.name}
                  </span>

                  {/* Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {concept.keywords.map((kw) => (
                      <button
                        key={kw.id}
                        onClick={() => handleToggleKeyword(category.id, concept.id, kw.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                          kw.isSelected
                            ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-xs'
                            : 'bg-slate-800 text-slate-400 border border-slate-700/60 opacity-60 line-through'
                        }`}
                      >
                        {kw.isSelected && <Check className="w-3 h-3 text-amber-400" />}
                        <span>{kw.term}</span>
                        <span className="text-[9px] uppercase px-1 rounded bg-slate-900/60 text-slate-400 font-mono">
                          {kw.type}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Add Keyword Input */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                    <input
                      type="text"
                      placeholder="Add custom keyword..."
                      value={newKeywordInput[concept.id] || ''}
                      onChange={(e) =>
                        setNewKeywordInput({ ...newKeywordInput, [concept.id]: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddKeyword(category.id, concept.id);
                      }}
                      className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                    <button
                      onClick={() => handleAddKeyword(category.id, concept.id)}
                      className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded-md transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
