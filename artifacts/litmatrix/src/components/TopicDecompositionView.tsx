'use client';

import React, { useState } from 'react';
import {
  Split,
  Bot,
  CheckCircle,
  AlertCircle,
  Edit3,
  Save,
  ArrowRight,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { Project, TopicDecomposition } from '../types';
import { invokeTopicDecompositionAgent } from '../services/agentPlatform';

interface TopicDecompositionViewProps {
  project: Project;
  onUpdateDecomposition: (decomp: TopicDecomposition) => void;
  onNextStage: () => void;
}

export const TopicDecompositionView: React.FC<TopicDecompositionViewProps> = ({
  project,
  onUpdateDecomposition,
  onNextStage,
}) => {
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Initial fallback if not yet decomposed
  const decomp = project.topicDecomposition || {
    id: `decomp_${project.id}`,
    projectId: project.id,
    fieldOfStudy: 'Applied Artificial Intelligence & Maritime Informatics',
    problemStatement: 'Predicting and mitigating dynamic greenhouse gas emissions and fuel consumption in commercial shipping operations.',
    contextSetting: 'International shipping corridors, sensor telemetry streams, and environmental regulations (IMO CII & EEXI).',
    objectOfStudy: 'Commercial ocean-going transport vessels (container ships, tankers, bulk carriers).',
    phenomenonOutcome: 'Fuel oil consumption rate (FOC), shaft power, and CO2 emission intensity per voyage.',
    technologiesMethods: 'Physics-informed neural networks (PINN), LSTM, Transformer architectures, XGBoost, and Digital Twins.',
    reviewMethodology: 'Systematic Literature Review adhering to PRISMA 2020 guidelines.',
    geographicScope: 'Global commercial maritime trade routes.',
    temporalScope: '2018 – Present (contemporary deep learning and physics-informed models).',
    keyResearchConcepts: [
      'Fuel Consumption Modeling',
      'Maritime GHG Emissions',
      'Physics-Informed Deep Learning',
      'AIS & Telemetry Sensor Data',
      'Digital Twins',
      'Operational Optimization',
    ],
    items: [
      {
        id: 'dim_1',
        categoryKey: 'fieldOfStudy',
        categoryLabel: '1. Field of Study',
        value: 'Applied Artificial Intelligence, Maritime Informatics & Environmental Engineering',
        confidence: 0.96,
        evidenceStatus: 'Explicitly stated',
      },
      {
        id: 'dim_2',
        categoryKey: 'problemStatement',
        categoryLabel: '2. Problem Statement',
        value: 'Predicting and mitigating dynamic greenhouse gas emissions and fuel consumption in commercial shipping operations under non-stationary weather conditions.',
        confidence: 0.94,
        evidenceStatus: 'Explicitly stated',
      },
      {
        id: 'dim_3',
        categoryKey: 'contextSetting',
        categoryLabel: '3. Context / Setting',
        value: 'Global commercial ocean corridors, high-frequency IoT sensor telemetry, and international decarbonization regulations (IMO CII & EEXI).',
        confidence: 0.92,
        evidenceStatus: 'Strongly inferred',
      },
      {
        id: 'dim_4',
        categoryKey: 'objectOfStudy',
        categoryLabel: '4. Object of Study',
        value: 'Ocean-going merchant vessels (container ships, bulk carriers, tankers) and onboard propulsion telemetry streams.',
        confidence: 0.95,
        evidenceStatus: 'Explicitly stated',
      },
      {
        id: 'dim_5',
        categoryKey: 'phenomenonOutcome',
        categoryLabel: '5. Phenomenon / Target Outcome',
        value: 'Fuel oil consumption (FOC), power prediction accuracy (RMSE, MAE, R²), and operational CO2 mitigation.',
        confidence: 0.93,
        evidenceStatus: 'Explicitly stated',
      },
      {
        id: 'dim_6',
        categoryKey: 'technologiesMethods',
        categoryLabel: '6. Technologies / Methods Being Investigated',
        value: 'Deep learning (LSTM, CNN, Transformers), hybrid physics-informed neural networks (PINN), ensemble tree models (XGBoost, Random Forest), and edge digital twins.',
        confidence: 0.97,
        evidenceStatus: 'Explicitly stated',
      },
      {
        id: 'dim_7',
        categoryKey: 'reviewMethodology',
        categoryLabel: '7. Review Methodology',
        value: 'Systematic Literature Review compliant with PRISMA 2020 guidelines and deterministic multi-tier deduplication.',
        confidence: 0.99,
        evidenceStatus: 'Explicitly stated',
      },
      {
        id: 'dim_8',
        categoryKey: 'geographicScope',
        categoryLabel: '8. Geographic Scope',
        value: 'International maritime navigation waters (Trans-Pacific, Trans-Atlantic, European ECA zones).',
        confidence: 0.82,
        evidenceStatus: 'Strongly inferred',
      },
      {
        id: 'dim_9',
        categoryKey: 'temporalScope',
        categoryLabel: '9. Temporal Scope',
        value: '2018 – Present (capturing contemporary advances in deep learning and physical modeling).',
        confidence: 0.88,
        evidenceStatus: 'Strongly inferred',
      },
    ],
    isApproved: true,
    modelUsed: 'Topic Decomposition Agent (Google Agent Platform)',
  };

  const handleTriggerDecomposition = async () => {
    setLoading(true);
    try {
      const result = await invokeTopicDecompositionAgent(project.title, project.id);
      onUpdateDecomposition(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (id: string, currentVal: string) => {
    setEditingId(id);
    setEditValue(currentVal);
  };

  const handleSaveEdit = (id: string) => {
    const updatedItems = decomp.items.map((item) =>
      item.id === id ? { ...item, value: editValue, evidenceStatus: 'Explicitly stated' as const } : item
    );
    const updatedDecomp: TopicDecomposition = {
      ...decomp,
      items: updatedItems,
      isApproved: true,
    };
    onUpdateDecomposition(updatedDecomp);
    setEditingId(null);
  };

  const handleToggleApproval = () => {
    onUpdateDecomposition({
      ...decomp,
      isApproved: !decomp.isApproved,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Agent Control */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-mono font-bold uppercase">
                Stage 1 • Systematic Scope Formulation
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Agent: Topic Decomposition Agent
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 mt-2">
              10-Dimension Structured Research Decomposition
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Deconstructs the research question into structured conceptual dimensions. Reviewers can inspect confidence scores, audit evidence statuses, and calibrate values before generating taxonomy keywords.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTriggerDecomposition}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Analyzing Scope...' : 'Re-Run Decomposition Agent'}</span>
            </button>

            <button
              onClick={onNextStage}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              <span>Stage 2: Taxonomy</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Approval status banner */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            {decomp.isApproved ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <CheckCircle className="w-4 h-4" />
                Researcher Approved for Taxonomy Generation
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <AlertCircle className="w-4 h-4" />
                Pending Researcher Verification & Approval
              </span>
            )}
            <span className="text-slate-500 font-mono">({decomp.modelUsed})</span>
          </div>

          <button
            onClick={handleToggleApproval}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              decomp.isApproved
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
            }`}
          >
            {decomp.isApproved ? 'Revoke Approval' : 'Approve Decomposition'}
          </button>
        </div>
      </div>

      {/* 10 Dimension Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {decomp.items.map((item) => {
          const isEditingThis = editingId === item.id;

          return (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 relative group hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-bold text-amber-400 tracking-wide">
                  {item.categoryLabel}
                </span>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                      item.evidenceStatus === 'Explicitly stated'
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                        : item.evidenceStatus === 'Strongly inferred'
                        ? 'bg-sky-500/10 text-sky-300 border border-sky-500/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.evidenceStatus}
                  </span>

                  <span className="text-[10px] font-mono text-slate-400">
                    {(item.confidence * 100).toFixed(0)}% conf
                  </span>

                  {!isEditingThis && (
                    <button
                      onClick={() => handleStartEdit(item.id, item.value)}
                      className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {isEditingThis ? (
                <div className="space-y-2">
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(item.id)}
                      className="flex items-center gap-1 px-3 py-1 bg-amber-500 text-slate-950 font-bold text-xs rounded"
                    >
                      <Save className="w-3 h-3" /> Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-2.5 py-1 bg-slate-800 text-slate-400 text-xs rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {item.value}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Key Research Concepts Cloud */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          10. Extracted Core Research Concepts
        </h3>
        <div className="flex flex-wrap gap-2">
          {decomp.keyResearchConcepts?.map((concept, idx) => (
            <span
              key={idx}
              className="px-3 py-1 bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium"
            >
              {concept}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
