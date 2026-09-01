'use client';

import React, { useState } from 'react';
import {
  Search,
  Copy,
  Check,
  Bot,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  Sliders,
  History,
  Info,
} from 'lucide-react';
import { Project, SearchStrategy } from '../types';
import { invokeSearchStrategyAgent } from '../services/agentPlatform';

interface SearchStrategyViewProps {
  project: Project;
  onUpdateSearchStrategies: (strategies: SearchStrategy[]) => void;
  onNextStage: () => void;
}

export const SearchStrategyView: React.FC<SearchStrategyViewProps> = ({
  project,
  onUpdateSearchStrategies,
  onNextStage,
}) => {
  const [loading, setLoading] = useState(false);
  const [copiedDb, setCopiedDb] = useState<string | null>(null);
  const [selectedDb, setSelectedDb] = useState<string>('Scopus');

  const defaultStrategies: SearchStrategy[] = [
    {
      id: 'strat_scopus',
      projectId: project.id,
      database: 'Scopus',
      searchString: `TITLE-ABS-KEY ( ("maritime transport" OR "commercial ship*" OR "container vessel" OR "bulk carrier") AND ("machine learning" OR "deep learning" OR "LSTM" OR "Transformer" OR "physics-informed") AND ("fuel oil consumption" OR "GHG emission*" OR "CO2 emission" OR "energy efficiency") ) AND PUBYEAR > 2017 AND ( LIMIT-TO ( DOCTYPE , "ar" ) OR LIMIT-TO ( DOCTYPE , "cp" ) OR LIMIT-TO ( DOCTYPE , "re" ) ) AND ( LIMIT-TO ( LANGUAGE , "English" ) )`,
      conceptGroups: [
        {
          conceptName: 'Domain Setting (Maritime Fleet)',
          booleanOperator: 'AND',
          terms: ['"maritime transport"', '"commercial ship*"', '"container vessel"', '"bulk carrier"'],
        },
        {
          conceptName: 'Computational AI Methods',
          booleanOperator: 'AND',
          terms: ['"machine learning"', '"deep learning"', '"LSTM"', '"Transformer"', '"physics-informed"'],
        },
        {
          conceptName: 'Decarbonization / Efficiency Outcomes',
          booleanOperator: 'AND',
          terms: ['"fuel oil consumption"', '"GHG emission*"', '"CO2 emission"', '"energy efficiency"'],
        },
      ],
      booleanLogic: 'Concept Group 1 AND Concept Group 2 AND Concept Group 3',
      filters: {
        publicationTypes: ['Journal Article (ar)', 'Conference Paper (cp)', 'Review (re)'],
        languages: ['English'],
        yearRange: { start: 2018, end: 2026 },
        subjectAreas: ['Engineering', 'Computer Science', 'Energy', 'Environmental Science'],
      },
      rationale: 'Calibrated with field-specific wildcard operators (ship*) to maximize recall while constraining noise in title-abs-key fields.',
      expectedRecall: 'High (~88% of relevant publications)',
      expectedPrecision: 'High (~75% title-abstract relevance)',
      version: 1,
      notes: 'Directly compatible with Scopus Advanced Search interface.',
      searchHistory: [
        {
          date: '2026-08-18',
          searchString: 'TITLE-ABS-KEY ( ... )',
          resultCountEstimate: 540,
          notes: 'Executed on Scopus API / Web UI.',
        },
      ],
    },
    {
      id: 'strat_wos',
      projectId: project.id,
      database: 'Web of Science',
      searchString: `TS=(("maritime transport" OR "vessel" OR "container ship" OR "bulk carrier") AND ("machine learning" OR "deep learning" OR "neural network" OR "PINN") AND ("fuel consumption" OR "emission reduction" OR "energy efficiency")) AND PY=(2018-2026) AND DT=(Article OR Review OR Proceedings Paper) AND LA=(English)`,
      conceptGroups: [
        {
          conceptName: 'Domain & Vessels',
          booleanOperator: 'AND',
          terms: ['"maritime transport"', '"vessel"', '"container ship"', '"bulk carrier"'],
        },
        {
          conceptName: 'Machine Learning Models',
          booleanOperator: 'AND',
          terms: ['"machine learning"', '"deep learning"', '"neural network"', '"PINN"'],
        },
        {
          conceptName: 'Target Metrics',
          booleanOperator: 'AND',
          terms: ['"fuel consumption"', '"emission reduction"', '"energy efficiency"'],
        },
      ],
      booleanLogic: 'TS = (Group 1 AND Group 2 AND Group 3)',
      filters: {
        publicationTypes: ['Article', 'Review', 'Proceedings Paper'],
        languages: ['English'],
        yearRange: { start: 2018, end: 2026 },
        subjectAreas: ['Transportation Science', 'Computer Science', 'Engineering Marine'],
      },
      rationale: 'Uses Web of Science Core Collection Topic Search (TS) to query Title, Abstract, and Keywords Plus.',
      expectedRecall: 'Very High (~90%)',
      expectedPrecision: 'High (~72%)',
      version: 1,
      notes: 'Matches WoS nested Boolean parentheses formatting standards.',
      searchHistory: [
        {
          date: '2026-08-18',
          searchString: 'TS=( ... )',
          resultCountEstimate: 490,
          notes: 'WoS Core Collection export.',
        },
      ],
    },
    {
      id: 'strat_gs',
      projectId: project.id,
      database: 'Google Scholar',
      searchString: `allintitle: (ship OR vessel OR maritime) ("machine learning" OR "deep learning" OR "neural") ("fuel consumption" OR "emission")`,
      conceptGroups: [
        {
          conceptName: 'Title Core Triplet',
          booleanOperator: 'AND',
          terms: ['(ship OR vessel OR maritime)', '("machine learning" OR "deep learning" OR "neural")', '("fuel consumption" OR "emission")'],
        },
      ],
      booleanLogic: 'allintitle: Group 1 AND Group 2 AND Group 3',
      filters: {
        publicationTypes: ['Articles and Patents'],
        languages: ['English preferred'],
        yearRange: { start: 2018, end: 2026 },
        subjectAreas: ['All'],
      },
      rationale: 'Restricted to allintitle due to Google Scholar search term limits and absence of full nested boolean support.',
      expectedRecall: 'Medium (~65%)',
      expectedPrecision: 'Very High (~85% title relevance)',
      version: 1,
      notes: 'Use Publish or Perish or Scholar export for RIS/BibTeX generation.',
      searchHistory: [
        {
          date: '2026-08-18',
          searchString: 'allintitle: ...',
          resultCountEstimate: 218,
          notes: 'Captured leading preprints and early access articles.',
        },
      ],
    },
  ];

  const strategies = project.searchStrategies?.length ? project.searchStrategies : defaultStrategies;
  const activeStrat = strategies.find((s) => s.database === selectedDb) || strategies[0];

  const handleCopy = (str: string, db: string) => {
    navigator.clipboard.writeText(str);
    setCopiedDb(db);
    setTimeout(() => setCopiedDb(null), 2000);
  };

  const handleTriggerAgent = async () => {
    setLoading(true);
    try {
      const categories = project.taxonomyCategories || [];
      const res = await invokeSearchStrategyAgent(categories, project.id);
      onUpdateSearchStrategies(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-mono font-bold uppercase">
                Stage 3 • Search Strategy Formulation
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Agent: Search Strategy Agent
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 mt-2">
              Calibrated Boolean Query Strings by Database
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Provides database-specific syntax (Scopus, Web of Science, and Google Scholar) adhering to PRISMA 2020 reporting standards. Query strings can be copied directly into academic search engines.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTriggerAgent}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Synthesizing...' : 'Re-Calibrate Queries'}</span>
            </button>

            <button
              onClick={onNextStage}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              <span>Stage 4: Literature Import</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Database Selector Tabs */}
        <div className="flex gap-2 mt-6 pt-4 border-t border-slate-800">
          {strategies.map((strat) => (
            <button
              key={strat.database}
              onClick={() => setSelectedDb(strat.database)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                selectedDb === strat.database
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {strat.database}
            </button>
          ))}
        </div>
      </div>

      {/* Active Strategy Detailed Card */}
      {activeStrat && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          {/* Query String Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Full Calibrated Search String ({activeStrat.database})
              </span>
              <button
                onClick={() => handleCopy(activeStrat.searchString, activeStrat.database)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 text-xs font-bold rounded-lg transition-colors"
              >
                {copiedDb === activeStrat.database ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Query String</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-amber-200/90 leading-relaxed overflow-x-auto selection:bg-amber-500/30">
              {activeStrat.searchString}
            </div>
          </div>

          {/* Concept Groups Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Boolean Concept Groupings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {activeStrat.conceptGroups.map((group, idx) => (
                <div
                  key={idx}
                  className="bg-slate-800/50 border border-slate-800 rounded-lg p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">
                      {group.conceptName}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      {group.booleanOperator}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {group.terms.map((t, tIdx) => (
                      <span
                        key={tIdx}
                        className="px-2 py-0.5 bg-slate-900 text-slate-300 rounded text-[11px] font-mono"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Metadata & Quality Calibration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Expected Recall
              </span>
              <span className="text-xs text-emerald-400 font-semibold">
                {activeStrat.expectedRecall}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Expected Precision
              </span>
              <span className="text-xs text-sky-400 font-semibold">
                {activeStrat.expectedPrecision}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Applied Limits
              </span>
              <span className="text-xs text-slate-300">
                {activeStrat.filters.languages.join(', ')} • {activeStrat.filters.yearRange.start}-{activeStrat.filters.yearRange.end}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
