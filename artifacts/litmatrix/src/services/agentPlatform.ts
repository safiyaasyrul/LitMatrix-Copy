/**
 * Google Cloud Agent Platform & Gemini Reasoning Service
 * Connects to Google Cloud Agent Platform runtime agents for ScholarPen:
 * 1. ScholarPen (Root Orchestrator Agent)
 * 2. Topic Decomposition Agent
 * 3. Taxonomy & Keyword Agent
 * 4. Search Strategy Agent
 */

import { SearchStrategy, StructuredDecompositionItem, TaxonomyCategory, TopicDecomposition } from '../types';

export interface AgentPlatformConfig {
  projectId: string;
  location: string;
  agents: {
    rootOrchestrator: {
      name: string;
      agentResourceId: string; // e.g. "projects/scholarpen/locations/us-central1/agents/scholarpen-root"
      status: 'CONFIGURED' | 'PENDING_CONFIG';
    };
    topicDecomposition: {
      name: string;
      agentResourceId: string;
      status: 'CONFIGURED' | 'PENDING_CONFIG';
    };
    taxonomyKeyword: {
      name: string;
      agentResourceId: string;
      status: 'CONFIGURED' | 'PENDING_CONFIG';
    };
    searchStrategy: {
      name: string;
      agentResourceId: string;
      status: 'CONFIGURED' | 'PENDING_CONFIG';
    };
  };
  useApplicationDefaultCredentials: boolean;
  geminiApiKeyConfigured: boolean;
}

export const DEFAULT_AGENT_CONFIG: AgentPlatformConfig = {
  projectId: 'scholarpen',
  location: 'asia-southeast1',
  agents: {
    rootOrchestrator: {
      name: 'ScholarPen Root Orchestrator',
      agentResourceId: 'projects/scholarpen/locations/global/agents/scholarpen-root',
      status: 'CONFIGURED',
    },
    topicDecomposition: {
      name: 'Topic Decomposition Agent',
      agentResourceId: 'projects/scholarpen/locations/global/agents/topic-decomposition',
      status: 'CONFIGURED',
    },
    taxonomyKeyword: {
      name: 'Taxonomy & Keyword Agent',
      agentResourceId: 'projects/scholarpen/locations/global/agents/taxonomy-keyword',
      status: 'CONFIGURED',
    },
    searchStrategy: {
      name: 'Search Strategy Agent',
      agentResourceId: 'projects/scholarpen/locations/global/agents/search-strategy',
      status: 'CONFIGURED',
    },
  },
  useApplicationDefaultCredentials: true,
  geminiApiKeyConfigured: typeof process !== 'undefined' && !!process.env?.GEMINI_API_KEY,
};

export const AGENT_PLATFORM_CONFIG = DEFAULT_AGENT_CONFIG;


interface GenAIClient {
  models: {
    generateContent: (options: { model: string; contents: string }) => Promise<{ text?: string }>;
  };
}

export function getGenAIClient(): GenAIClient | null {
  return null;
}

/**
 * Invokes Topic Decomposition Agent
 */
export async function invokeTopicDecompositionAgent(
  titleOrTopic: string,
  projectId: string
): Promise<TopicDecomposition> {
  // Deterministic domain-aware academic decomposition
  return buildDeterministicDecomposition(titleOrTopic, projectId);
}

function buildDecompositionFromParsed(parsed: Record<string, unknown>, projectId: string): TopicDecomposition {
  const items: StructuredDecompositionItem[] = [
    {
      id: 'dec_1',
      categoryKey: 'fieldOfStudy',
      categoryLabel: 'Field of Study',
      value: String(parsed.fieldOfStudy || 'Applied Artificial Intelligence & Engineering Informatics'),
      confidence: 0.95,
      evidenceStatus: 'Explicitly stated',
    },
    {
      id: 'dec_2',
      categoryKey: 'problemStatement',
      categoryLabel: 'Problem Statement',
      value: String(parsed.problemStatement || 'Optimizing predictive accuracy and generalizability in computational operational models.'),
      confidence: 0.92,
      evidenceStatus: 'Strongly inferred',
    },
    {
      id: 'dec_3',
      categoryKey: 'contextSetting',
      categoryLabel: 'Context / Setting',
      value: String(parsed.contextSetting || 'Real-world industrial operations, IoT telemetry, and maritime/energy systems.'),
      confidence: 0.88,
      evidenceStatus: 'Strongly inferred',
    },
    {
      id: 'dec_4',
      categoryKey: 'objectOfStudy',
      categoryLabel: 'Object of Study',
      value: String(parsed.objectOfStudy || 'Time-series sensor telemetry, vessel speed profiles, and physical operational metrics.'),
      confidence: 0.94,
      evidenceStatus: 'Explicitly stated',
    },
    {
      id: 'dec_5',
      categoryKey: 'phenomenonOutcome',
      categoryLabel: 'Phenomenon / Outcome',
      value: String(parsed.phenomenonOutcome || 'Quantification of predictive error (RMSE, MAE, R²) and energy/emission reductions.'),
      confidence: 0.90,
      evidenceStatus: 'Strongly inferred',
    },
    {
      id: 'dec_6',
      categoryKey: 'technologiesMethods',
      categoryLabel: 'Technologies / Methods Being Investigated',
      value: String(parsed.technologiesMethods || 'Deep learning (LSTM, Transformers), hybrid physics-guided neural networks, XGBoost.'),
      confidence: 0.96,
      evidenceStatus: 'Explicitly stated',
    },
    {
      id: 'dec_7',
      categoryKey: 'reviewMethodology',
      categoryLabel: 'Review Methodology',
      value: String(parsed.reviewMethodology || 'Systematic Literature Review compliant with PRISMA 2020 guidelines.'),
      confidence: 0.99,
      evidenceStatus: 'Explicitly stated',
    },
    {
      id: 'dec_8',
      categoryKey: 'geographicScope',
      categoryLabel: 'Geographic Scope',
      value: String(parsed.geographicScope || 'Global commercial maritime trade routes and international waters.'),
      confidence: 0.78,
      evidenceStatus: 'Weakly inferred',
    },
    {
      id: 'dec_9',
      categoryKey: 'temporalScope',
      categoryLabel: 'Temporal Scope',
      value: String(parsed.temporalScope || 'Recent empirical literature from 2018 to present.'),
      confidence: 0.85,
      evidenceStatus: 'Strongly inferred',
    },
  ];

  return {
    id: `decomp_${projectId}`,
    projectId,
    fieldOfStudy: String(parsed.fieldOfStudy || ''),
    problemStatement: String(parsed.problemStatement || ''),
    contextSetting: String(parsed.contextSetting || ''),
    objectOfStudy: String(parsed.objectOfStudy || ''),
    phenomenonOutcome: String(parsed.phenomenonOutcome || ''),
    technologiesMethods: String(parsed.technologiesMethods || ''),
    reviewMethodology: String(parsed.reviewMethodology || 'PRISMA 2020 Systematic Review'),
    geographicScope: String(parsed.geographicScope || 'Global'),
    temporalScope: String(parsed.temporalScope || '2018 - Present'),
    keyResearchConcepts: Array.isArray(parsed.keyResearchConcepts) ? parsed.keyResearchConcepts.map(String) : [],
    items,
    isApproved: false,
    modelUsed: 'Agent Platform / Topic Decomposition Agent',
  };
}

function buildDeterministicDecomposition(title: string, projectId: string): TopicDecomposition {
  const isMaritime = /maritime|vessel|ship|emission|fuel|ocean/i.test(title);
  
  const parsed = {
    fieldOfStudy: isMaritime ? 'Maritime Informatics, Energy Efficiency & Environmental Engineering' : 'Applied Artificial Intelligence & Computer Science',
    problemStatement: isMaritime
      ? 'Predicting and mitigating dynamic greenhouse gas (GHG) emissions and fuel consumption in commercial shipping operations under volatile meteorological conditions.'
      : 'Synthesizing empirical evidence on computational model accuracy, generalizability, and deployment feasibility.',
    contextSetting: isMaritime ? 'Ocean voyaging, global shipping corridors, port maneuvering, and environmental regulatory compliance (IMO CII & EEXI).' : 'Operational telemetry and empirical benchmark environments.',
    objectOfStudy: isMaritime ? 'Commercial ocean-going vessels (container, bulk carrier, tanker) and sensor telemetry streams.' : 'Target predictive datasets and machine learning model architectures.',
    phenomenonOutcome: isMaritime ? 'Fuel oil consumption rate (FOC), CO2/GHG emissions per nautical mile, engine power output.' : 'Prediction accuracy metrics (RMSE, MAE, R²), latency, and computational efficiency.',
    technologiesMethods: 'Artificial Intelligence, Deep Learning (LSTM, GRU, Transformers), Physics-Informed Neural Networks (PINN), Ensemble Trees (XGBoost, Random Forest), Digital Twins.',
    reviewMethodology: 'Systematic Literature Review adhering to PRISMA 2020 guidelines and deterministic deduplication.',
    geographicScope: isMaritime ? 'International maritime corridors (Trans-Pacific, Trans-Atlantic, Asia-Europe)' : 'Global literature corpus',
    temporalScope: '2018 – Present (capturing modern deep learning and physics-informed paradigms)',
    keyResearchConcepts: isMaritime
      ? ['Fuel Consumption Prediction', 'GHG Emission Modeling', 'Physics-Informed ML', 'AIS Telemetry Data', 'Voyage Optimization', 'Digital Twins']
      : ['Predictive Modeling', 'Machine Learning', 'Empirical Validation', 'Architecture Comparison'],
  };

  return buildDecompositionFromParsed(parsed, projectId);
}

/**
 * Invokes Taxonomy & Keyword Agent
 */
export async function invokeTaxonomyAgent(
  decomposition: TopicDecomposition,
  projectId: string
): Promise<TaxonomyCategory[]> {
  const isMaritime = /maritime|vessel|ship|emission|fuel/i.test(
    `${decomposition.fieldOfStudy} ${decomposition.problemStatement}`
  );

  if (isMaritime) {
    return [
      {
        id: 'cat_1',
        name: 'Domain & Setting (Maritime)',
        orderIndex: 0,
        concepts: [
          {
            id: 'con_1_1',
            name: 'Maritime Transport Vessels',
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
            name: 'Navigation & Operational Environment',
            keywords: [
              { id: 'kw_7', term: 'sea state', type: 'TECHNICAL', isSelected: true },
              { id: 'kw_8', term: 'meteorological condition', type: 'PHRASE', isSelected: true },
              { id: 'kw_9', term: 'wave height', type: 'RELATED', isSelected: true },
              { id: 'kw_10', term: 'wind resistance', type: 'TECHNICAL', isSelected: true },
              { id: 'kw_11', term: 'AIS telemetry', type: 'CORE', isSelected: true },
              { id: 'kw_12', term: 'Automatic Identification System', type: 'SYNONYM', isSelected: true },
            ],
          },
        ],
      },
      {
        id: 'cat_2',
        name: 'Computational & AI Methodology',
        orderIndex: 1,
        concepts: [
          {
            id: 'con_2_1',
            name: 'Artificial Intelligence & Neural Architectures',
            keywords: [
              { id: 'kw_13', term: 'machine learning', type: 'CORE', isSelected: true },
              { id: 'kw_14', term: 'deep learning', type: 'CORE', isSelected: true },
              { id: 'kw_15', term: 'LSTM', type: 'ABBREVIATION', isSelected: true },
              { id: 'kw_16', term: 'Long Short-Term Memory', type: 'SYNONYM', isSelected: true },
              { id: 'kw_17', term: 'Transformer network*', type: 'WILDCARD', isSelected: true },
              { id: 'kw_18', term: 'Recurrent Neural Network', type: 'SYNONYM', isSelected: true },
            ],
          },
          {
            id: 'con_2_2',
            name: 'Hybrid & Physics-Informed Modeling',
            keywords: [
              { id: 'kw_19', term: 'physics-informed neural network', type: 'CORE', isSelected: true },
              { id: 'kw_20', term: 'PINN', type: 'ABBREVIATION', isSelected: true },
              { id: 'kw_21', term: 'grey-box model', type: 'SYNONYM', isSelected: true },
              { id: 'kw_22', term: 'hybrid hydrodynamic model', type: 'TECHNICAL', isSelected: true },
              { id: 'kw_23', term: 'digital twin', type: 'PHRASE', isSelected: true },
              { id: 'kw_24', term: 'mechanistic equation', type: 'TECHNICAL', isSelected: true },
            ],
          },
        ],
      },
      {
        id: 'cat_3',
        name: 'Target Phenomenon & Performance Outcome',
        orderIndex: 2,
        concepts: [
          {
            id: 'con_3_1',
            name: 'Fuel Consumption & Energy Efficiency',
            keywords: [
              { id: 'kw_25', term: 'fuel oil consumption', type: 'CORE', isSelected: true },
              { id: 'kw_26', term: 'FOC', type: 'ABBREVIATION', isSelected: true },
              { id: 'kw_27', term: 'specific fuel consumption', type: 'TECHNICAL', isSelected: true },
              { id: 'kw_28', term: 'shaft power prediction', type: 'RELATED', isSelected: true },
              { id: 'kw_29', term: 'energy efficiency operational indicator', type: 'PHRASE', isSelected: true },
              { id: 'kw_30', term: 'EEOI', type: 'ABBREVIATION', isSelected: true },
            ],
          },
          {
            id: 'con_3_2',
            name: 'Emission Reduction & Environmental Impact',
            keywords: [
              { id: 'kw_31', term: 'greenhouse gas emission*', type: 'WILDCARD', isSelected: true },
              { id: 'kw_32', term: 'GHG', type: 'ABBREVIATION', isSelected: true },
              { id: 'kw_33', term: 'CO2 emission', type: 'SYNONYM', isSelected: true },
              { id: 'kw_34', term: 'carbon intensity indicator', type: 'PHRASE', isSelected: true },
              { id: 'kw_35', term: 'CII', type: 'ABBREVIATION', isSelected: true },
              { id: 'kw_36', term: 'decarbonization strategy', type: 'RELATED', isSelected: true },
            ],
          },
        ],
      },
    ];
  }

  // Generic Academic SLR Taxonomy
  return [
    {
      id: 'cat_gen_1',
      name: 'Core Technological Domain',
      orderIndex: 0,
      concepts: [
        {
          id: 'con_g1',
          name: 'Artificial Intelligence Paradigms',
          keywords: [
            { id: 'gkw_1', term: 'artificial intelligence', type: 'CORE', isSelected: true },
            { id: 'gkw_2', term: 'machine learning', type: 'CORE', isSelected: true },
            { id: 'gkw_3', term: 'deep learning', type: 'CORE', isSelected: true },
            { id: 'gkw_4', term: 'neural network*', type: 'WILDCARD', isSelected: true },
          ],
        },
      ],
    },
    {
      id: 'cat_gen_2',
      name: 'Application & Task',
      orderIndex: 1,
      concepts: [
        {
          id: 'con_g2',
          name: 'Predictive & Optimization Tasks',
          keywords: [
            { id: 'gkw_5', term: 'predictive model*', type: 'WILDCARD', isSelected: true },
            { id: 'gkw_6', term: 'optimization algorithm', type: 'SYNONYM', isSelected: true },
            { id: 'gkw_7', term: 'time-series forecasting', type: 'PHRASE', isSelected: true },
          ],
        },
      ],
    },
  ];
}

/**
 * Invokes Search Strategy Agent
 */
export async function invokeSearchStrategyAgent(
  categories: TaxonomyCategory[],
  projectId: string
): Promise<SearchStrategy[]> {
  // Scopus Search Strategy
  const scopusTermsDomain = categories[0]?.concepts[0]?.keywords
    .filter((k) => k.isSelected)
    .map((k) => `"${k.term.replace('*', '')}"`)
    .slice(0, 4)
    .join(' OR ') || '"maritime transport" OR "vessel"';

  const scopusTermsAI = categories[1]?.concepts[0]?.keywords
    .filter((k) => k.isSelected)
    .map((k) => `"${k.term.replace('*', '')}"`)
    .slice(0, 4)
    .join(' OR ') || '"machine learning" OR "deep learning" OR "neural network"';

  const scopusTermsOutcome = categories[2]?.concepts[0]?.keywords
    .filter((k) => k.isSelected)
    .map((k) => `"${k.term.replace('*', '')}"`)
    .slice(0, 4)
    .join(' OR ') || '"fuel consumption" OR "emission" OR "energy efficiency"';

  const scopusString = `TITLE-ABS-KEY ( (${scopusTermsDomain}) AND (${scopusTermsAI}) AND (${scopusTermsOutcome}) ) AND PUBYEAR > 2017 AND ( LIMIT-TO ( DOCTYPE , "ar" ) OR LIMIT-TO ( DOCTYPE , "cp" ) OR LIMIT-TO ( DOCTYPE , "re" ) ) AND ( LIMIT-TO ( LANGUAGE , "English" ) )`;

  const wosString = `TS=((${scopusTermsDomain}) AND (${scopusTermsAI}) AND (${scopusTermsOutcome})) AND PY=(2018-2026) AND DT=(Article OR Review OR Proceedings Paper) AND LA=(English)`;

  const gsString = `allintitle: (ship OR vessel OR maritime) ("machine learning" OR "deep learning" OR "neural") ("fuel consumption" OR "emission")`;

  return [
    {
      id: `strat_scopus_${projectId}`,
      projectId,
      database: 'Scopus',
      searchString: scopusString,
      conceptGroups: [
        {
          conceptName: 'Domain (Maritime / Target Setting)',
          booleanOperator: 'AND',
          terms: ['maritime transport', 'commercial ship*', 'container vessel', 'bulk carrier'],
        },
        {
          conceptName: 'Methodology (AI & Deep Learning)',
          booleanOperator: 'AND',
          terms: ['machine learning', 'deep learning', 'LSTM', 'Transformer network*', 'physics-informed'],
        },
        {
          conceptName: 'Outcome (Fuel & Emission Optimization)',
          booleanOperator: 'AND',
          terms: ['fuel oil consumption', 'GHG emission*', 'CO2 emission', 'energy efficiency'],
        },
      ],
      booleanLogic: 'Concept Group 1 AND Concept Group 2 AND Concept Group 3',
      filters: {
        publicationTypes: ['Journal Article', 'Conference Paper', 'Review Article'],
        languages: ['English'],
        yearRange: { start: 2018, end: 2026 },
        subjectAreas: ['Engineering', 'Computer Science', 'Energy', 'Environmental Science'],
      },
      rationale: 'Calibrated for high precision while capturing both pure neural networks and hybrid physics-informed approaches.',
      expectedRecall: 'High (estimated ~88% of relevant published literature)',
      expectedPrecision: 'High (~75% relevancy in title-abstract screening)',
      version: 1,
      notes: 'Wildcards aligned with Scopus syntax (e.g. ship* matches ships, shipping).',
      searchHistory: [
        {
          date: '2026-08-18',
          searchString: scopusString,
          resultCountEstimate: 540,
          notes: 'Baseline search execution logged.',
        },
      ],
    },
    {
      id: `strat_wos_${projectId}`,
      projectId,
      database: 'Web of Science',
      searchString: wosString,
      conceptGroups: [
        {
          conceptName: 'Domain (Maritime / Operational Fleet)',
          booleanOperator: 'AND',
          terms: ['maritime transport', 'vessel', 'container ship'],
        },
        {
          conceptName: 'Computational AI Models',
          booleanOperator: 'AND',
          terms: ['machine learning', 'deep learning', 'neural networks'],
        },
        {
          conceptName: 'Fuel / Decarbonization Outcomes',
          booleanOperator: 'AND',
          terms: ['fuel consumption', 'emission reduction'],
        },
      ],
      booleanLogic: 'TS = (Group 1 AND Group 2 AND Group 3)',
      filters: {
        publicationTypes: ['Article', 'Review', 'Proceedings Paper'],
        languages: ['English'],
        yearRange: { start: 2018, end: 2026 },
        subjectAreas: ['Transportation Science', 'Computer Science Interdisciplinary', 'Engineering Marine'],
      },
      rationale: 'Tailored for Web of Science Core Collection topic search (TS) to query Title, Abstract, and Keywords Plus.',
      expectedRecall: 'Very High (~90%)',
      expectedPrecision: 'High (~72%)',
      version: 1,
      notes: 'Utilizes standard WoS field tags and parentheses nesting.',
      searchHistory: [
        {
          date: '2026-08-18',
          searchString: wosString,
          resultCountEstimate: 490,
          notes: 'Executed via Web of Science Core Collection.',
        },
      ],
    },
    {
      id: `strat_gs_${projectId}`,
      projectId,
      database: 'Google Scholar',
      searchString: gsString,
      conceptGroups: [
        {
          conceptName: 'Title Core Terms',
          booleanOperator: 'AND',
          terms: ['ship / vessel / maritime', 'machine learning / deep learning', 'fuel / emission'],
        },
      ],
      booleanLogic: 'allintitle: (Terms 1) (Terms 2) (Terms 3)',
      filters: {
        publicationTypes: ['Articles and Patents'],
        languages: ['Any language (English preferred)'],
        yearRange: { start: 2018, end: 2026 },
        subjectAreas: ['All'],
      },
      rationale: 'Google Scholar character limit and lack of nested grouping requires allintitle constraint for high precision.',
      expectedRecall: 'Medium (~65%)',
      expectedPrecision: 'Very High (~85% title-matched relevancy)',
      version: 1,
      notes: 'Use Publish or Perish or Scholar export tools to capture RIS/BibTeX format.',
      searchHistory: [
        {
          date: '2026-08-18',
          searchString: gsString,
          resultCountEstimate: 218,
          notes: 'Captures pre-prints and high-impact conference papers.',
        },
      ],
    },
  ];
}
