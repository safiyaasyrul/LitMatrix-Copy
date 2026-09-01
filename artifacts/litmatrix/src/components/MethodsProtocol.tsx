import React, { useState } from "react";
import { SLRProtocol, FormulationFrameworkType, ObjectivesPICO, ObjectivesPICOC, ObjectivesPEO, ObjectivesSPIDER } from "../types/slr";
import { Sparkles, Plus, Trash2, BookOpen, ShieldCheck, CheckSquare, Layers, HelpCircle, FileText, Check, Cpu, Leaf, MessageSquare, Stethoscope, Wand2, Info, ArrowRight } from "lucide-react";
import { callAI, parseJSONLoose } from "../utils/aiClient";

interface MethodsProtocolProps {
  protocol: SLRProtocol;
  onUpdateProtocol: (protocol: SLRProtocol) => void;
  aiConfig: any;
}

// Intelligent detection of framework from review title and keywords
export function detectFrameworkFromTitle(title: string): FormulationFrameworkType {
  const t = title.toLowerCase();

  // Engineering & Technology keywords (PICOC)
  const techKeywords = [
    "software", "algorithm", "architecture", "deep learning", "machine learning",
    "neural", "iot", "cloud", "blockchain", "robotics", "cyber", "computation",
    "computing", "distributed", "hardware", "firmware", "compiler", "network",
    "microservice", "ai-driven", "smart contract", "edge computing", "fpga",
    "gpu", "latency", "throughput", "system", "technology", "engineering",
    "devops", "kubernetes", "database", "query optimization", "compiler", "api",
    "data pipeline", "computer vision", "nlp", "large language model", "llm"
  ];
  if (techKeywords.some((k) => t.includes(k))) {
    return "PICOC";
  }

  // Environmental, Ecological, Occupational, and Exposure keywords (PEO)
  const environmentalKeywords = [
    "environmental", "exposure", "pollutant", "pollution", "climate", "ecology",
    "ecological", "catchment", "ecosystem", "species", "biodiversity", "marine",
    "forest", "microplastic", "pesticide", "occupational", "hazard", "toxicology",
    "ambient", "particulate", "pm2.5", "water quality", "soil", "air quality",
    "wildlife", "biomonitoring", "roses", "epidemiology", "risk factor",
    "contaminant", "heavy metal", "river", "ocean", "wetland", "coastal"
  ];
  if (environmentalKeywords.some((k) => t.includes(k))) {
    return "PEO";
  }

  // Qualitative & Mixed-methods keywords (SPIDER)
  const qualitativeKeywords = [
    "qualitative", "lived experience", "perceptions", "attitudes", "barriers",
    "facilitators", "interview", "interviews", "focus group", "thematic",
    "phenomenology", "grounded theory", "ethnography", "mixed-method", "mixed method",
    "delphi", "coping", "perspectives", "social", "behavioral", "stakeholder",
    "user experience", "ux", "narrative inquiry", "lived reality", "feelings"
  ];
  if (qualitativeKeywords.some((k) => t.includes(k))) {
    return "SPIDER";
  }

  // Clinical / Health / Medical (PICO) default
  return "PICO";
}

export default function MethodsProtocol({ protocol, onUpdateProtocol, aiConfig }: MethodsProtocolProps) {
  const [generatingAll, setGeneratingAll] = useState(false);
  const [newInclusion, setNewInclusion] = useState("");
  const [newExclusion, setNewExclusion] = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const [newObjective, setNewObjective] = useState("");

  const currentFramework: FormulationFrameworkType = protocol.formulationFramework || "PICO";

  // Framework switch handler with state synchronization
  const handleFrameworkChange = (newFramework: FormulationFrameworkType) => {
    onUpdateProtocol({
      ...protocol,
      formulationFramework: newFramework,
    });
  };

  // Auto-detect and switch framework based on current title
  const handleAutoDetectFramework = () => {
    const detected = detectFrameworkFromTitle(protocol.title || "");
    onUpdateProtocol({
      ...protocol,
      formulationFramework: detected,
    });
  };

  // Form field handlers for each framework
  const handlePicoChange = (field: keyof ObjectivesPICO, val: string) => {
    onUpdateProtocol({
      ...protocol,
      objectivesPICO: {
        ...protocol.objectivesPICO,
        [field]: val,
      },
    });
  };

  const handlePicocChange = (field: keyof ObjectivesPICOC, val: string) => {
    const currentPicoc = protocol.objectivesPICOC || {
      population: protocol.objectivesPICO.population || "",
      intervention: protocol.objectivesPICO.intervention || "",
      comparison: protocol.objectivesPICO.comparator || "",
      outcomes: protocol.objectivesPICO.outcomes || "",
      context: "Deployment setting and runtime operational constraints",
      studyDesigns: protocol.objectivesPICO.studyDesigns || "",
    };
    onUpdateProtocol({
      ...protocol,
      objectivesPICOC: {
        ...currentPicoc,
        [field]: val,
      },
    });
  };

  const handlePeoChange = (field: keyof ObjectivesPEO, val: string) => {
    const currentPeo = protocol.objectivesPEO || {
      population: protocol.objectivesPICO.population || "",
      exposure: protocol.objectivesPICO.intervention || "",
      outcomes: protocol.objectivesPICO.outcomes || "",
      setting: "Geographic scale, climate zone, or ecosystem setting",
      studyDesigns: protocol.objectivesPICO.studyDesigns || "",
    };
    onUpdateProtocol({
      ...protocol,
      objectivesPEO: {
        ...currentPeo,
        [field]: val,
      },
    });
  };

  const handleSpiderChange = (field: keyof ObjectivesSPIDER, val: string) => {
    const currentSpider = protocol.objectivesSPIDER || {
      sample: protocol.objectivesPICO.population || "",
      phenomenonOfInterest: protocol.objectivesPICO.intervention || "",
      design: "Semi-structured in-depth interviews, focus groups, and thematic synthesis",
      evaluation: protocol.objectivesPICO.outcomes || "",
      researchType: "Qualitative research or Mixed-Methods",
    };
    onUpdateProtocol({
      ...protocol,
      objectivesSPIDER: {
        ...currentSpider,
        [field]: val,
      },
    });
  };

  // AI Generation tailored strictly to Title AND the Selected Framework (PICO / PICOC / PEO / SPIDER)
  const handleAiAutoDraftAll = async () => {
    if (!protocol.title.trim()) return;
    setGeneratingAll(true);
    try {
      let frameworkSpecificInstructions = "";
      let expectedJsonStructure = "";

      if (currentFramework === "PICO") {
        frameworkSpecificInstructions = `Framework: PICO (Clinical / Health-Oriented Evidence Synthesis).
Focus on: Target clinical patient population (P), therapeutic/diagnostic intervention (I), clinical comparator or standard of care (C), measurable clinical/diagnostic outcomes (O), and eligible medical study designs (S - RCTs, cohort studies).`;
        expectedJsonStructure = `"pico_population": "...",
  "pico_intervention": "...",
  "pico_comparator": "...",
  "pico_outcomes": "...",
  "pico_studyDesigns": "...",`;
      } else if (currentFramework === "PICOC") {
        frameworkSpecificInstructions = `Framework: PICOC (Engineering & Technology Systematic Literature Review - Kitchenham & Charters standard).
Focus on: Target software systems/codebases/users (P), technology/algorithm/architecture/tool (I), baseline comparison/legacy heuristics/state-of-the-art benchmark (C), technical performance metrics like latency, throughput, accuracy, memory, scalability (O), and operational deployment context/environmental constraints (C).`;
        expectedJsonStructure = `"picoc_population": "...",
  "picoc_intervention": "...",
  "picoc_comparison": "...",
  "picoc_outcomes": "...",
  "picoc_context": "...",
  "picoc_studyDesigns": "...",`;
      } else if (currentFramework === "PEO") {
        frameworkSpecificInstructions = `Framework: PEO (Observational / Environmental / Exposure-Oriented Evidence Synthesis - ROSES Standard).
Focus on: Target ecological population/community/catchment/cohort (P), environmental exposure/pollutant/climate stressor/hazard (E), ecological impacts/disease incidence/biomarkers (O), ecosystem/geographical setting (S), and field observational study designs.`;
        expectedJsonStructure = `"peo_population": "...",
  "peo_exposure": "...",
  "peo_outcomes": "...",
  "peo_setting": "...",
  "peo_studyDesigns": "...",`;
      } else if (currentFramework === "SPIDER") {
        frameworkSpecificInstructions = `Framework: SPIDER (Qualitative / Mixed-Method Evidence Synthesis - Cooke, Smith & Booth standard).
Focus on: Target informants/study participants/stakeholder sample (S), phenomenon of interest/lived experience/perceptions/behaviors (PI), qualitative research design like interviews/focus groups/ethnography (D), evaluation of subjective themes/attitudes/barriers/facilitators (E), and research type like Qualitative or Mixed-Methods (R).`;
        expectedJsonStructure = `"spider_sample": "...",
  "spider_phenomenonOfInterest": "...",
  "spider_design": "...",
  "spider_evaluation": "...",
  "spider_researchType": "...",`;
      }

      const prompt = `Systematic Review Title: "${protocol.title}"
Review Type: "${protocol.reviewType}"
Formulation Framework: "${currentFramework}"

${frameworkSpecificInstructions}

Act as a world-class systematic review methodologist, domain scholar, and journal editor. Generate a comprehensive, publication-grade Introduction, Academic Rationale (PRISMA 2020 Item 3 / ROSES Item 3), Explicit Objectives & Research Questions (PRISMA 2020 Item 4 / ROSES Item 4), and structured framework elements strictly tailored to this topic and framework.

Return ONLY valid JSON matching this exact structure:
{
  "introductionRationale": "A thorough, 2-3 paragraph academic rationale explaining the domain background, problem magnitude, limitations of current methods, specific gaps in existing systematic reviews, and the definitive justification for conducting this review...",
  "backgroundContext": "Concise summary of domain background, practical significance, and current baselines...",
  "knowledgeGap": "Specific methodological, empirical, or qualitative gap in current literature justifying this synthesis...",
  "primaryResearchQuestions": [
    "RQ1: ...",
    "RQ2: ...",
    "RQ3: ..."
  ],
  "secondaryObjectives": [
    "...",
    "..."
  ],
  ${expectedJsonStructure}
  "inclusion": [
    "...",
    "...",
    "...",
    "..."
  ],
  "exclusion": [
    "...",
    "...",
    "..."
  ],
  "groupingForSynthesis": "..."
}`;

      const text = await callAI(
        prompt,
        "You are an expert systematic review methodologist adhering strictly to PRISMA 2020, PRISMA-S, and ROSES guidelines across health, engineering, environmental, and qualitative domains.",
        aiConfig
      );
      const parsed = parseJSONLoose(text);
      if (parsed) {
        // Build updated objects
        const updatedPico: ObjectivesPICO = {
          population: parsed.pico_population || parsed.population || protocol.objectivesPICO.population,
          intervention: parsed.pico_intervention || parsed.intervention || protocol.objectivesPICO.intervention,
          comparator: parsed.pico_comparator || parsed.comparator || protocol.objectivesPICO.comparator,
          outcomes: parsed.pico_outcomes || parsed.outcomes || protocol.objectivesPICO.outcomes,
          studyDesigns: parsed.pico_studyDesigns || parsed.studyDesigns || protocol.objectivesPICO.studyDesigns,
        };

        const updatedPicoc: ObjectivesPICOC = {
          population: parsed.picoc_population || parsed.population || protocol.objectivesPICOC?.population || updatedPico.population,
          intervention: parsed.picoc_intervention || parsed.intervention || protocol.objectivesPICOC?.intervention || updatedPico.intervention,
          comparison: parsed.picoc_comparison || parsed.comparator || protocol.objectivesPICOC?.comparison || updatedPico.comparator,
          outcomes: parsed.picoc_outcomes || parsed.outcomes || protocol.objectivesPICOC?.outcomes || updatedPico.outcomes,
          context: parsed.picoc_context || protocol.objectivesPICOC?.context || "Deployment environment, computational platform, and runtime operational constraints",
          studyDesigns: parsed.picoc_studyDesigns || parsed.studyDesigns || protocol.objectivesPICOC?.studyDesigns || "Empirical software benchmarks, controlled experiments, and industrial case studies",
        };

        const updatedPeo: ObjectivesPEO = {
          population: parsed.peo_population || parsed.population || protocol.objectivesPEO?.population || updatedPico.population,
          exposure: parsed.peo_exposure || parsed.intervention || protocol.objectivesPEO?.exposure || updatedPico.intervention,
          outcomes: parsed.peo_outcomes || parsed.outcomes || protocol.objectivesPEO?.outcomes || updatedPico.outcomes,
          setting: parsed.peo_setting || protocol.objectivesPEO?.setting || "Geographical scale, climatic zone, and ecosystem setting",
          studyDesigns: parsed.peo_studyDesigns || parsed.studyDesigns || protocol.objectivesPEO?.studyDesigns || "Longitudinal field biomonitoring, observational cohort surveys, and ecological registries",
        };

        const updatedSpider: ObjectivesSPIDER = {
          sample: parsed.spider_sample || parsed.population || protocol.objectivesSPIDER?.sample || updatedPico.population,
          phenomenonOfInterest: parsed.spider_phenomenonOfInterest || parsed.intervention || protocol.objectivesSPIDER?.phenomenonOfInterest || updatedPico.intervention,
          design: parsed.spider_design || protocol.objectivesSPIDER?.design || "Semi-structured in-depth interviews, focus groups, and thematic qualitative synthesis",
          evaluation: parsed.spider_evaluation || parsed.outcomes || protocol.objectivesSPIDER?.evaluation || updatedPico.outcomes,
          researchType: parsed.spider_researchType || protocol.objectivesSPIDER?.researchType || "Qualitative research (phenomenology, grounded theory) or Mixed-Methods",
        };

        onUpdateProtocol({
          ...protocol,
          introductionRationale: parsed.introductionRationale || protocol.introductionRationale,
          backgroundContext: parsed.backgroundContext || protocol.backgroundContext,
          knowledgeGap: parsed.knowledgeGap || protocol.knowledgeGap,
          primaryResearchQuestions: Array.isArray(parsed.primaryResearchQuestions) && parsed.primaryResearchQuestions.length > 0
            ? parsed.primaryResearchQuestions
            : protocol.primaryResearchQuestions || [],
          secondaryObjectives: Array.isArray(parsed.secondaryObjectives) && parsed.secondaryObjectives.length > 0
            ? parsed.secondaryObjectives
            : protocol.secondaryObjectives || [],
          objectivesPICO: updatedPico,
          objectivesPICOC: updatedPicoc,
          objectivesPEO: updatedPeo,
          objectivesSPIDER: updatedSpider,
          eligibilityCriteria: {
            ...protocol.eligibilityCriteria,
            inclusion: Array.isArray(parsed.inclusion) && parsed.inclusion.length > 0
              ? parsed.inclusion
              : protocol.eligibilityCriteria.inclusion,
            exclusion: Array.isArray(parsed.exclusion) && parsed.exclusion.length > 0
              ? parsed.exclusion
              : protocol.eligibilityCriteria.exclusion,
            groupingForSynthesis: parsed.groupingForSynthesis || protocol.eligibilityCriteria.groupingForSynthesis,
          },
        });
      }
    } catch (err) {
      console.error(err);
      handleHeuristicDraft();
    }
    setGeneratingAll(false);
  };

  // Instant heuristic draft tailored specifically to Title & Active Framework (PICO / PICOC / PEO / SPIDER)
  const handleHeuristicDraft = () => {
    const t = protocol.title.trim() || "Target Research Topic";

    if (currentFramework === "PICOC") {
      // Engineering & Technology Formulation
      onUpdateProtocol({
        ...protocol,
        introductionRationale: `${t} has emerged as a pivotal domain in contemporary software engineering, computing systems, and applied technology. Rapid technological acceleration has led to diverse architectural paradigms, algorithmic implementations, and tool frameworks. However, published engineering studies frequently present disparate empirical benchmarks, conflicting latency/throughput trade-offs, and heterogeneous deployment constraints without standardized quality assessment. Conducting a PRISMA 2020-compliant systematic literature review using the PICOC framework (Kitchenham & Charters) is essential to consolidate cumulative empirical evidence, quantify comparative performance benchmarks against baseline standards, and establish reproducible guidelines for technological adoption.`,
        backgroundContext: `Engineering foundations and recent technological advances in ${t}, addressing computational scalability, architectural robustness, and implementation trade-offs across modern production environments.`,
        knowledgeGap: `Lack of consolidated empirical benchmarks, fragmented evaluation metrics (latency vs. throughput vs. resource consumption), and inconsistent reporting of runtime operational constraints across current studies on ${t}.`,
        primaryResearchQuestions: [
          `RQ1 (Performance & Efficiency): What are the empirical performance benchmarks (e.g., latency, throughput, accuracy, memory footprint) of ${t} across target software systems?`,
          `RQ2 (Comparative Benchmark): How does ${t} perform compared to baseline techniques, legacy heuristics, and alternative technological architectures?`,
          `RQ3 (Contextual & Operational Trade-offs): What runtime deployment constraints, scalability limitations, or environmental factors moderate the efficacy of ${t}?`,
        ],
        secondaryObjectives: [
          `Quantify trade-offs between computational overhead and output quality across implementation environments`,
          `Synthesize key architectural patterns, open-source tooling, and reproducibility characteristics across included literature`,
        ],
        objectivesPICOC: {
          population: `Target software systems, embedded platforms, enterprise microservices, and computing architectures implementing ${t}.`,
          intervention: `${t} algorithms, frameworks, tools, or architectural techniques.`,
          comparison: `Conventional baseline algorithms, legacy rule-based heuristics, or state-of-the-art comparator frameworks.`,
          outcomes: `Computational latency (ms), throughput, execution accuracy (F1/AUC), resource consumption, and scalability metrics.`,
          context: `Production environments, cloud/edge deployment settings, real-time runtime constraints, and industrial vs academic benchmarks.`,
          studyDesigns: `Empirical software evaluations, controlled benchmark experiments, and industrial case studies.`,
        },
        eligibilityCriteria: {
          ...protocol.eligibilityCriteria,
          inclusion: [
            "Peer-reviewed original research in computer science, software engineering, or related technological domains",
            `Empirical validation or benchmark evaluation of ${t}`,
            "Clear reporting of quantitative performance metrics or architectural evaluation",
            "English language publication",
          ],
          exclusion: [
            "Abstract-only posters or non-peer-reviewed whitepapers lacking empirical data",
            "Studies without comparative baselines or clear experimental methodology",
            "Purely conceptual proposals without implementation or benchmark verification",
          ],
          groupingForSynthesis: "Thematic grouping by algorithm family, architectural design, and target deployment platform.",
        },
      });
    } else if (currentFramework === "PEO") {
      // Observational / Environmental / Exposure Formulation (ROSES Standard)
      onUpdateProtocol({
        ...protocol,
        introductionRationale: `${t} represents a pressing subject of inquiry across environmental sciences, ecological conservation, and public health epidemiology. Anthropogenic activities and environmental transformations have intensified exposure to environmental stressors, contaminants, and ecosystem perturbations. While an expanding body of observational and field monitoring literature exists, findings exhibit considerable variability attributable to differential exposure gradients, sampling regimes, and geographical heterogeneity. This systematic evidence synthesis adheres to PRISMA 2020 and ROSES reporting standards using the PEO framework to consolidate cumulative findings, assess exposure-response relationships, and provide evidence-based recommendations for policy and management.`,
        backgroundContext: `Ecological baseline and environmental exposure pathways associated with ${t}, highlighting susceptibility of populations/ecosystems and critical regulatory thresholds.`,
        knowledgeGap: `Conflicting exposure-response evidence, geographic sampling gaps, and lack of standardized methodological risk-of-bias appraisal across observational studies on ${t}.`,
        primaryResearchQuestions: [
          `RQ1 (Exposure Impact): What is the quantitative relationship between exposure to ${t} and ecological/health outcomes across affected populations or ecosystems?`,
          `RQ2 (Gradient & Sensitivity): How do varying exposure levels, chemical/climatic gradients, or spatial settings modulate adverse outcomes?`,
          `RQ3 (Methodological Appraisal): What observational bias domains (confounding, exposure measurement error, outcome misclassification) influence cumulative evidence?`,
        ],
        secondaryObjectives: [
          `Evaluate geographic and spatial subgroup variations across biomes, catchment areas, and demographic strata`,
          `Grade the certainty of evidence for primary environmental/health endpoints using the GRADE/ROSES certainty matrix`,
        ],
        objectivesPEO: {
          population: `Target ecosystems, biotas, catchments, communities, or observational human cohorts subject to ${t}.`,
          exposure: `Environmental exposure, chemical pollutant, climatic stressor, or physical hazard associated with ${t}.`,
          outcomes: `Ecosystem health indicators, biodiversity metrics, bioaccumulation factors, disease incidence, or toxicological biomarkers.`,
          setting: `Geographic regions, climatic zones, aquatic/terrestrial biomes, or industrial/residential settings.`,
          studyDesigns: `Longitudinal prospective cohorts, catchment biomonitoring surveys, and cross-sectional environmental registries.`,
        },
        eligibilityCriteria: {
          ...protocol.eligibilityCriteria,
          inclusion: [
            "Peer-reviewed original observational or field monitoring research",
            `Explicit measurement of exposure to ${t} and defined ecological or health endpoints`,
            "Clear reporting of quantitative risk metrics, concentrations, or effect sizes",
            "English language publication",
          ],
          exclusion: [
            "In vitro or purely simulated exposure models lacking field or human relevance",
            "Studies lacking verified exposure quantification or validated outcome metrics",
            "Editorial opinions or non-peer-reviewed commentaries",
          ],
          groupingForSynthesis: "Thematic grouping by exposure intensity, geographical region, and study design.",
        },
      });
    } else if (currentFramework === "SPIDER") {
      // Qualitative & Mixed-Methods Formulation
      onUpdateProtocol({
        ...protocol,
        introductionRationale: `Understanding the subjective experiences, perspectives, and behavioral dynamics surrounding ${t} is essential for informing human-centered practice, policy design, and organizational interventions. While quantitative evaluations capture discrete metrics, qualitative and mixed-method evidence provides critical insight into the complex lived realities, institutional barriers, cultural contexts, and facilitators of adoption. Despite a rich body of qualitative research, existing evidence remains fragmented across disparate methodologies and localized settings. This systematic review applies the SPIDER framework (Sample, Phenomenon of Interest, Design, Evaluation, Research type) to synthesize qualitative and mixed-method evidence, providing a cohesive thematic model of ${t}.`,
        backgroundContext: `Social, psychological, and organizational dimensions of ${t}, focusing on stakeholder perceptions, lived experiences, and implementation realities.`,
        knowledgeGap: `Fragmented qualitative findings, lack of thematic synthesis across diverse informant cohorts, and limited understanding of user-perceived barriers and enablers regarding ${t}.`,
        primaryResearchQuestions: [
          `RQ1 (Phenomenon & Lived Experience): What are the core lived experiences, perceptions, and attitudes of stakeholders regarding ${t}?`,
          `RQ2 (Barriers & Facilitators): What qualitative themes characterize the principal enablers and systemic barriers influencing engagement with ${t}?`,
          `RQ3 (Contextual Variation): How do organizational, cultural, or demographic contexts shape participants' decision-making and evaluation of ${t}?`,
        ],
        secondaryObjectives: [
          `Construct a meta-aggregative thematic framework mapping core qualitative dimensions and stakeholder recommendations`,
          `Appraise methodological rigor of included qualitative studies using the CASP (Critical Appraisal Skills Programme) criteria`,
        ],
        objectivesSPIDER: {
          sample: `Target informants, study participants, clinicians, educators, community members, or end-users engaged with ${t}.`,
          phenomenonOfInterest: `Lived experiences, perceptions, attitudes, coping strategies, or decision-making processes regarding ${t}.`,
          design: `Semi-structured in-depth interviews, focus groups, phenomenological inquiry, ethnography, and narrative analysis.`,
          evaluation: `Subjective themes, perceived psychological impacts, institutional barriers, facilitators, and satisfaction.`,
          researchType: `Qualitative research (phenomenology, grounded theory, thematic analysis) and Mixed-Methods studies.`,
        },
        eligibilityCriteria: {
          ...protocol.eligibilityCriteria,
          inclusion: [
            "Peer-reviewed original qualitative or mixed-methods research studies",
            `Direct investigation of participants' experiences or perceptions regarding ${t}`,
            "Clear reporting of qualitative data collection and analytical methodology",
            "English language publication",
          ],
          exclusion: [
            "Purely quantitative surveys lacking open-ended qualitative exploration or verbatim participant quotes",
            "Studies without verifiable qualitative methodology or analytical framework",
            "Commentaries, book reviews, or non-peer-reviewed essays",
          ],
          groupingForSynthesis: "Thematic grouping by stakeholder role, qualitative methodology, and key emerging thematic domains.",
        },
      });
    } else {
      // Clinical / Health PICO Formulation
      onUpdateProtocol({
        ...protocol,
        introductionRationale: `${t} represents a critical subject of inquiry across contemporary clinical medicine and healthcare. Despite an expanding volume of primary empirical investigations, reported findings exhibit notable variations in methodological rigor, intervention architectures, cohort demographics, and measured outcome metrics. Existing reviews either remain outdated, rely on restricted sample scopes, or fail to systematically evaluate methodological risk of bias under standardized reporting frameworks. Therefore, this systematic literature review is conducted in accordance with PRISMA 2020 to synthesize cumulative evidence, quantify comparative effect sizes, and establish robust evidence-based benchmarks.`,
        backgroundContext: `Clinical importance, epidemiological burden, and therapeutic/diagnostic significance of ${t} across target patient populations.`,
        knowledgeGap: `Inconsistent findings, fragmented sub-methodologies, and lack of standardized quality appraisal across existing studies on ${t}.`,
        primaryResearchQuestions: [
          `RQ1 (Primary Efficacy/Effect): What is the cumulative effect, diagnostic accuracy, or clinical impact of ${t} across eligible patient cohorts?`,
          `RQ2 (Comparative Performance): How does ${t} perform relative to conventional clinical baselines and standard-of-care comparators?`,
          `RQ3 (Methodological Bias & Generalizability): What key methodological characteristics and risk-of-bias domains moderate clinical outcomes across settings?`,
        ],
        secondaryObjectives: [
          `Evaluate subgroup variations across demographic and methodological strata`,
          `Grade the certainty of evidence for primary outcomes using the GRADE framework`,
        ],
        objectivesPICO: {
          population: `Target patient population, demographic cohort, or clinical condition evaluated in ${t}.`,
          intervention: `${t} clinical intervention, therapeutic modality, diagnostic test, or biomarker.`,
          comparator: `Standard clinical care, placebo, active control, or conventional diagnostic tool.`,
          outcomes: `Primary clinical endpoints, diagnostic precision (AUC-ROC, sensitivity, specificity), relative risk, hazard ratio, or mortality.`,
          studyDesigns: `Randomized controlled trials (RCTs), prospective cohort studies, and validated clinical registry trials.`,
        },
        eligibilityCriteria: {
          ...protocol.eligibilityCriteria,
          inclusion: [
            "Peer-reviewed original clinical or epidemiological research studies",
            `Human participants evaluated for ${t}`,
            "Clear reporting of quantitative outcomes with statistical precision (95% CIs)",
            "English language publication",
          ],
          exclusion: [
            "Non-peer-reviewed commentaries, editorials, or conference abstracts lacking full text",
            "Studies lacking validated outcome metrics or comparative data",
            "Animal or in vitro cellular models",
          ],
          groupingForSynthesis: "Thematic grouping by clinical intervention subtype, patient baseline risk, and study design.",
        },
      });
    }
  };

  const addQuestion = () => {
    if (!newQuestion.trim()) return;
    const current = protocol.primaryResearchQuestions || [];
    onUpdateProtocol({
      ...protocol,
      primaryResearchQuestions: [...current, newQuestion.trim()],
    });
    setNewQuestion("");
  };

  const removeQuestion = (idx: number) => {
    const current = protocol.primaryResearchQuestions || [];
    onUpdateProtocol({
      ...protocol,
      primaryResearchQuestions: current.filter((_, i) => i !== idx),
    });
  };

  const addObjective = () => {
    if (!newObjective.trim()) return;
    const current = protocol.secondaryObjectives || [];
    onUpdateProtocol({
      ...protocol,
      secondaryObjectives: [...current, newObjective.trim()],
    });
    setNewObjective("");
  };

  const removeObjective = (idx: number) => {
    const current = protocol.secondaryObjectives || [];
    onUpdateProtocol({
      ...protocol,
      secondaryObjectives: current.filter((_, i) => i !== idx),
    });
  };

  const addInclusion = () => {
    if (!newInclusion.trim()) return;
    onUpdateProtocol({
      ...protocol,
      eligibilityCriteria: {
        ...protocol.eligibilityCriteria,
        inclusion: [...protocol.eligibilityCriteria.inclusion, newInclusion.trim()],
      },
    });
    setNewInclusion("");
  };

  const removeInclusion = (index: number) => {
    onUpdateProtocol({
      ...protocol,
      eligibilityCriteria: {
        ...protocol.eligibilityCriteria,
        inclusion: protocol.eligibilityCriteria.inclusion.filter((_, i) => i !== index),
      },
    });
  };

  const addExclusion = () => {
    if (!newExclusion.trim()) return;
    onUpdateProtocol({
      ...protocol,
      eligibilityCriteria: {
        ...protocol.eligibilityCriteria,
        exclusion: [...protocol.eligibilityCriteria.exclusion, newExclusion.trim()],
      },
    });
    setNewExclusion("");
  };

  const removeExclusion = (index: number) => {
    onUpdateProtocol({
      ...protocol,
      eligibilityCriteria: {
        ...protocol.eligibilityCriteria,
        exclusion: protocol.eligibilityCriteria.exclusion.filter((_, i) => i !== index),
      },
    });
  };

  const questions = protocol.primaryResearchQuestions || [
    "RQ1: What is the cumulative effect, accuracy, or performance across included studies?",
    "RQ2: How do comparative approaches or sub-methodologies perform against baseline benchmarks?",
    "RQ3: What sources of methodological heterogeneity or bias influence outcomes across study settings?",
  ];

  const objectives = protocol.secondaryObjectives || [
    "Evaluate subgroup variations across demographic and methodological strata",
    "Assess certainty of cumulative evidence using the GRADE framework",
  ];

  // Active framework configurations
  const frameworksList: {
    id: FormulationFrameworkType;
    label: string;
    targetDomain: string;
    icon: React.ReactNode;
    colorTheme: string;
    borderActive: string;
    bgActive: string;
    textActive: string;
    desc: string;
  }[] = [
    {
      id: "PICO",
      label: "PICO",
      targetDomain: "Clinical & Health-Oriented",
      icon: <Stethoscope className="w-4 h-4" />,
      colorTheme: "indigo",
      borderActive: "border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/70",
      bgActive: "bg-indigo-600 text-white",
      textActive: "text-indigo-900",
      desc: "Population · Intervention · Comparator · Outcome (Clinical Medicine, Healthcare, Pharmacology)",
    },
    {
      id: "PICOC",
      label: "PICOC",
      targetDomain: "Engineering & Technology",
      icon: <Cpu className="w-4 h-4" />,
      colorTheme: "sky",
      borderActive: "border-sky-600 ring-2 ring-sky-500/20 bg-sky-50/70",
      bgActive: "bg-sky-600 text-white",
      textActive: "text-sky-950",
      desc: "Population · Intervention · Comparison · Outcome · Context (Software Engineering, AI/ML Systems, CS)",
    },
    {
      id: "PEO",
      label: "PEO",
      targetDomain: "Observational & Environmental / Exposure",
      icon: <Leaf className="w-4 h-4" />,
      colorTheme: "emerald",
      borderActive: "border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/70",
      bgActive: "bg-emerald-700 text-white",
      textActive: "text-emerald-950",
      desc: "Population · Exposure · Outcome · Setting (Environmental Science, ROSES, Ecology, Public Health)",
    },
    {
      id: "SPIDER",
      label: "SPIDER",
      targetDomain: "Qualitative & Mixed-Method Evidence",
      icon: <MessageSquare className="w-4 h-4" />,
      colorTheme: "amber",
      borderActive: "border-amber-600 ring-2 ring-amber-500/20 bg-amber-50/70",
      bgActive: "bg-amber-600 text-white",
      textActive: "text-amber-950",
      desc: "Sample · Phenomenon of Interest · Design · Evaluation · Research type (Qualitative, UX, Social Sciences)",
    },
  ];

  const activeFwMeta = frameworksList.find((f) => f.id === currentFramework) || frameworksList[0];

  return (
    <div id="methods-protocol-container" className="space-y-6">
      {/* Top Review Title & Metadata */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-mono text-[10px] text-indigo-600 uppercase tracking-wider font-bold">
              PRISMA 2020 Item 1 & 24a · ROSES Item 1
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-0.5">
              Review Title, Methodology & Registration
            </h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleAutoDetectFramework}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="Automatically detect optimal framework (PICO, PICOC, PEO, SPIDER) based on title keywords"
            >
              <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
              Auto-Detect Framework
            </button>
            <button
              onClick={handleHeuristicDraft}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="Apply instant structured template tailored to title and chosen framework"
            >
              <FileText className="w-3.5 h-3.5 text-slate-600" />
              Quick Template ({currentFramework})
            </button>
            <button
              onClick={handleAiAutoDraftAll}
              disabled={generatingAll || !protocol.title.trim()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
              {generatingAll ? `Synthesizing ${currentFramework} Protocol...` : `AI Auto-Draft (${currentFramework})`}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
              Review Title (Item 1)
            </label>
            <input
              type="text"
              value={protocol.title}
              onChange={(e) => onUpdateProtocol({ ...protocol, title: e.target.value })}
              placeholder="e.g. Machine Learning for Early Type 2 Diabetes Prediction: A Systematic Review and Meta-Analysis"
              className="w-full text-sm font-sans p-2.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
              Review Type & Methodology
            </label>
            <select
              value={protocol.reviewType}
              onChange={(e) => onUpdateProtocol({ ...protocol, reviewType: e.target.value })}
              className="w-full text-sm font-sans p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-slate-800"
            >
              <option>Systematic Review and Quantitative Meta-Analysis</option>
              <option>Systematic Literature Review (Narrative / Thematic)</option>
              <option>Diagnostic Accuracy Systematic Review</option>
              <option>Scoping Review (PRISMA-ScR)</option>
              <option>Prognostic / Prediction Model Systematic Review</option>
              <option>Environmental Evidence Synthesis (ROSES)</option>
              <option>Qualitative Evidence Synthesis (SPIDER / Meta-Ethnography)</option>
              <option>Engineering & Technology SLR (Kitchenham PICOC)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
            Protocol Registration & Repository Link (PRISMA Item 24a / ROSES Item 1)
          </label>
          <input
            type="text"
            value={protocol.protocolRegistration || ""}
            onChange={(e) => onUpdateProtocol({ ...protocol, protocolRegistration: e.target.value })}
            placeholder="e.g. PROSPERO Registration ID: CRD42026884129 · Open Science Framework (osf.io/xxxx) / PROCEED registry"
            className="w-full text-xs font-mono p-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
          />
        </div>
      </div>

      {/* SECTION 1: PRISMA Item 3 - RATIONALE & BACKGROUND */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-4">
        <div>
          <div className="font-mono text-[10px] text-indigo-600 uppercase tracking-wider font-bold">
            PRISMA 2020 Item 3 · ROSES Item 3
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-0.5">
            Introduction: Rationale & Background Context
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Describe the rationale for the review in the context of what is already known, domain problem magnitude, existing literature gaps, and why a systematic synthesis is warranted under the <strong className="text-slate-800">{activeFwMeta.label} ({activeFwMeta.targetDomain})</strong> framework.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-mono font-semibold text-slate-700">
              Domain Background & Problem Significance
            </label>
            <textarea
              rows={3}
              value={protocol.backgroundContext || ""}
              onChange={(e) => onUpdateProtocol({ ...protocol, backgroundContext: e.target.value })}
              placeholder="Contextualize the scientific, clinical, technological, or environmental problem..."
              className="w-full text-xs font-sans p-2.5 bg-slate-50/70 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 leading-relaxed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono font-semibold text-slate-700">
              Knowledge Gap & Synthesis Justification
            </label>
            <textarea
              rows={3}
              value={protocol.knowledgeGap || ""}
              onChange={(e) => onUpdateProtocol({ ...protocol, knowledgeGap: e.target.value })}
              placeholder="What controversies, fragmented methodologies, or lack of pooled benchmarks justify this review?..."
              className="w-full text-xs font-sans p-2.5 bg-slate-50/70 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 leading-relaxed"
            />
          </div>
        </div>

        <div className="space-y-1.5 pt-1">
          <label className="block text-xs font-mono font-semibold text-slate-700">
            Full Drafted Rationale (Item 3 Manuscript Section)
          </label>
          <textarea
            rows={5}
            value={protocol.introductionRationale || ""}
            onChange={(e) => onUpdateProtocol({ ...protocol, introductionRationale: e.target.value })}
            placeholder="Complete multi-paragraph academic rationale for the Introduction section..."
            className="w-full text-xs font-sans p-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 leading-relaxed"
          />
        </div>
      </div>

      {/* SECTION 2: PRISMA Item 4 - OBJECTIVES & RESEARCH QUESTIONS */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-6">
        <div>
          <div className="font-mono text-[10px] text-indigo-600 uppercase tracking-wider font-bold">
            PRISMA 2020 Item 4 · ROSES Item 4
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-0.5">
            Formulation Framework, Objectives & Research Questions
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Select the formulation framework tailored to your review domain to automatically adapt research questions, criteria fields, and search query architectures.
          </p>
        </div>

        {/* 4 Formulation Framework Selector Cards */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
              Formulation Framework Selector
            </label>
            <span className="text-[11px] font-mono text-slate-500">
              Active: <span className="font-bold text-indigo-700">{activeFwMeta.label}</span> ({activeFwMeta.targetDomain})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {frameworksList.map((fw) => {
              const isSelected = fw.id === currentFramework;
              return (
                <button
                  key={fw.id}
                  type="button"
                  onClick={() => handleFrameworkChange(fw.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? fw.borderActive
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`flex items-center gap-1.5 font-mono text-xs font-bold ${isSelected ? fw.textActive : "text-slate-800"}`}>
                        {fw.icon}
                        {fw.label}
                      </span>
                      {isSelected && (
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${fw.bgActive}`}>
                          Selected
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-slate-900 mb-1">
                      {fw.targetDomain}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      {fw.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Primary Research Questions */}
        <div className="border border-indigo-100 rounded-xl p-4 bg-indigo-50/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-indigo-900 uppercase flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              Explicit Research Questions ({questions.length}) · {activeFwMeta.label}
            </span>
          </div>
          <div className="space-y-2">
            {questions.map((rq, idx) => (
              <div key={idx} className="flex items-start justify-between gap-2 p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 shadow-2xs">
                <span className="font-medium text-slate-800 leading-snug">{rq}</span>
                <button
                  onClick={() => removeQuestion(idx)}
                  className="text-slate-400 hover:text-rose-600 cursor-pointer p-0.5 transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addQuestion()}
              placeholder={`Add explicit research question for ${currentFramework}...`}
              className="flex-1 text-xs font-sans p-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
            />
            <button
              onClick={addQuestion}
              className="px-3 py-1.5 text-xs font-mono font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer transition-colors shadow-2xs"
            >
              Add Question
            </button>
          </div>
        </div>

        {/* Secondary Objectives */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" />
              Secondary Objectives & Subgroup Aims ({objectives.length})
            </span>
          </div>
          <div className="space-y-2">
            {objectives.map((obj, idx) => (
              <div key={idx} className="flex items-start justify-between gap-2 p-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 shadow-2xs">
                <span>• {obj}</span>
                <button
                  onClick={() => removeObjective(idx)}
                  className="text-slate-400 hover:text-rose-600 cursor-pointer p-0.5 transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newObjective}
              onChange={(e) => setNewObjective(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addObjective()}
              placeholder="Add secondary objective (e.g., meta-regression, sensitivity analysis, thematic modeling)..."
              className="flex-1 text-xs font-sans p-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 text-slate-800"
            />
            <button
              onClick={addObjective}
              className="px-3 py-1.5 text-xs font-mono font-semibold text-slate-800 bg-slate-200 hover:bg-slate-300 rounded-lg cursor-pointer transition-colors shadow-2xs"
            >
              Add Objective
            </button>
          </div>
        </div>

        {/* DYNAMIC FRAMEWORK INPUTS: PICO / PICOC / PEO / SPIDER */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="font-mono text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span>{activeFwMeta.icon}</span>
              <span>Structured {currentFramework} Criteria Breakdown</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              {activeFwMeta.targetDomain}
            </span>
          </div>

          {/* 1. PICO (Clinical / Health) */}
          {currentFramework === "PICO" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-xl space-y-1.5">
                <div className="font-mono text-xs font-bold text-indigo-900">
                  P · Population / Participants / Patients
                </div>
                <p className="text-[11px] text-slate-500">Target patient group, cohort demographics, or disease state.</p>
                <textarea
                  rows={2}
                  value={protocol.objectivesPICO.population}
                  onChange={(e) => handlePicoChange("population", e.target.value)}
                  placeholder="e.g. Adults (>= 18 years) at risk of Type 2 Diabetes..."
                  className="w-full text-xs font-sans p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                />
              </div>

              <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-xl space-y-1.5">
                <div className="font-mono text-xs font-bold text-indigo-900">
                  I · Intervention / Therapy / Diagnostic Test
                </div>
                <p className="text-[11px] text-slate-500">Therapeutic intervention, medical test, or health strategy.</p>
                <textarea
                  rows={2}
                  value={protocol.objectivesPICO.intervention}
                  onChange={(e) => handlePicoChange("intervention", e.target.value)}
                  placeholder="e.g. Supervised machine learning algorithms (XGBoost, Random Forest)..."
                  className="w-full text-xs font-sans p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                />
              </div>

              <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-xl space-y-1.5">
                <div className="font-mono text-xs font-bold text-indigo-900">
                  C · Comparator / Control / Standard of Care
                </div>
                <p className="text-[11px] text-slate-500">Baseline clinical standard, placebo, or routine clinical care.</p>
                <textarea
                  rows={2}
                  value={protocol.objectivesPICO.comparator}
                  onChange={(e) => handlePicoChange("comparator", e.target.value)}
                  placeholder="e.g. Standard clinical risk scores (FINDRISC, ADA)..."
                  className="w-full text-xs font-sans p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                />
              </div>

              <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-xl space-y-1.5">
                <div className="font-mono text-xs font-bold text-indigo-900">
                  O · Outcomes / Measures (Item 10a)
                </div>
                <p className="text-[11px] text-slate-500">Clinical endpoints, diagnostic AUC, sensitivity, mortality.</p>
                <textarea
                  rows={2}
                  value={protocol.objectivesPICO.outcomes}
                  onChange={(e) => handlePicoChange("outcomes", e.target.value)}
                  placeholder="e.g. AUC-ROC, C-index, Sensitivity, Specificity, Odds Ratio..."
                  className="w-full text-xs font-sans p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                />
              </div>

              <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-xl sm:col-span-2 lg:col-span-2 space-y-1.5">
                <div className="font-mono text-xs font-bold text-indigo-900">
                  S · Study Designs Eligible (Item 5)
                </div>
                <p className="text-[11px] text-slate-500">Permissible empirical designs, trial types, or cohort methodologies.</p>
                <textarea
                  rows={2}
                  value={protocol.objectivesPICO.studyDesigns}
                  onChange={(e) => handlePicoChange("studyDesigns", e.target.value)}
                  placeholder="e.g. Prospective cohorts, randomized controlled trials (RCTs), retrospective registry cohorts..."
                  className="w-full text-xs font-sans p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                />
              </div>
            </div>
          )}

          {/* 2. PICOC (Engineering & Technology) */}
          {currentFramework === "PICOC" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="p-4 bg-sky-50/40 border border-sky-100 rounded-xl space-y-1.5">
                <div className="font-mono text-xs font-bold text-sky-950 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-sky-600" />
                  P · Population / Target Systems / Applications / Users
                </div>
                <p className="text-[11px] text-slate-500">Target software systems, architectures, codebases, hardware nodes, or end-users.</p>
                <textarea
                  rows={2}
                  value={protocol.objectivesPICOC?.population || protocol.objectivesPICO.population}
                  onChange={(e) => handlePicocChange("population", e.target.value)}
                  placeholder="e.g. Enterprise microservices, edge IoT sensor networks, distributed codebases..."
                  className="w-full text-xs font-sans p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-800"
                />
              </div>

              <div className="p-4 bg-sky-50/40 border border-sky-100 rounded-xl space-y-1.5">
                <div className="font-mono text-xs font-bold text-sky-950 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-sky-600" />
                  I · Intervention / Technology / Tool / Algorithm
                </div>
                <p className="text-[11px] text-slate-500">The specific technological tool, algorithm, architecture, or engineering approach.</p>
                <textarea
                  rows={2}
                  value={protocol.objectivesPICOC?.intervention || protocol.objectivesPICO.intervention}
                  onChange={(e) => handlePicocChange("intervention", e.target.value)}
                  placeholder="e.g. Transformer-based neural architectures, consensus algorithms, LLM static analysis..."
                  className="w-full text-xs font-sans p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-800"
                />
              </div>

              <div className="p-4 bg-sky-50/40 border border-sky-100 rounded-xl space-y-1.5">
                <div className="font-mono text-xs font-bold text-sky-950 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-sky-600" />
                  C · Comparison / Baseline Benchmark / Standard Tool
                </div>
                <p className="text-[11px] text-slate-500">Baseline algorithms, traditional approaches, or state-of-the-art benchmarks.</p>
                <textarea
                  rows={2}
                  value={protocol.objectivesPICOC?.comparison || protocol.objectivesPICO.comparator}
                  onChange={(e) => handlePicocChange("comparison", e.target.value)}
                  placeholder="e.g. Traditional rule-based heuristics, monolithic architectures, legacy SonarQube..."
                  className="w-full text-xs font-sans p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-800"
                />
              </div>

              <div className="p-4 bg-sky-50/40 border border-sky-100 rounded-xl space-y-1.5">
                <div className="font-mono text-xs font-bold text-sky-950 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-sky-600" />
                  O · Outcomes / Performance & Technical Metrics
                </div>
                <p className="text-[11px] text-slate-500">Latency (ms), throughput (req/s), F1-score, memory, energy consumption (J).</p>
                <textarea
                  rows={2}
                  value={protocol.objectivesPICOC?.outcomes || protocol.objectivesPICO.outcomes}
                  onChange={(e) => handlePicocChange("outcomes", e.target.value)}
                  placeholder="e.g. Latency (ms), throughput, F1-score, memory footprint, energy consumption..."
                  className="w-full text-xs font-sans p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-800"
                />
              </div>

              <div className="p-4 bg-sky-50/40 border border-sky-100 rounded-xl space-y-1.5">
                <div className="font-mono text-xs font-bold text-sky-950 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-sky-600" />
                  C · Context / Environmental & Operational Constraints
                </div>
                <p className="text-[11px] text-slate-500">Deployment setting, resource constraints, high concurrency, edge vs cloud.</p>
                <textarea
                  rows={2}
                  value={protocol.objectivesPICOC?.context || ""}
                  onChange={(e) => handlePicocChange("context", e.target.value)}
                  placeholder="e.g. Real-time embedded constraints, resource-constrained IoT devices, high concurrency..."
                  className="w-full text-xs font-sans p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-800"
                />
              </div>

              <div className="p-4 bg-sky-50/40 border border-sky-100 rounded-xl space-y-1.5">
                <div className="font-mono text-xs font-bold text-sky-950 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-sky-600" />
                  S · Study Designs / Empirical Methods
                </div>
                <p className="text-[11px] text-slate-500">Empirical evaluations, benchmark comparative tests, or software field trials.</p>
                <textarea
                  rows={2}
                  value={protocol.objectivesPICOC?.studyDesigns || protocol.objectivesPICO.studyDesigns}
                  onChange={(e) => handlePicocChange("studyDesigns", e.target.value)}
                  placeholder="e.g. Empirical software experiments, benchmark simulation studies, case studies..."
                  className="w-full text-xs font-sans p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-800"
                />
              </div>
            </div>
          )}

          {/* 3. PEO (Observational / Environmental / Exposure) */}
          {currentFramework === "PEO" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-xl space-y-1.5">
                <div className="font-mono text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                  P · Population / Ecosystem / Biota / Cohort
                </div>
                <p className="text-[11px] text-slate-500">Target ecological community, species, catchment, or observational human cohort.</p>
                <textarea
                  rows={2}
                  value={protocol.objectivesPEO?.population || protocol.objectivesPICO.population}
                  onChange={(e) => handlePeoChange("population", e.target.value)}
                  placeholder="e.g. Coastal mangrove ecosystems, benthic marine organisms, urban residential communities..."
                  className="w-full text-xs font-sans p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                />
              </div>

              <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-xl space-y-1.5">
                <div className="font-mono text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                  E · Exposure / Environmental Factor / Pollutant
                </div>
                <p className="text-[11px] text-slate-500">Environmental stressor, chemical pollutant, climatic variable, or physical hazard.</p>
                <textarea
                  rows={2}
                  value={protocol.objectivesPEO?.exposure || protocol.objectivesPICO.intervention}
                  onChange={(e) => handlePeoChange("exposure", e.target.value)}
                  placeholder="e.g. Microplastics contamination (<5mm), atmospheric PM2.5, agricultural pesticide runoff..."
                  className="w-full text-xs font-sans p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                />
              </div>

              <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-xl space-y-1.5">
                <div className="font-mono text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                  O · Outcomes / Ecological & Health Impacts
                </div>
                <p className="text-[11px] text-slate-500">Biodiversity decline, bioaccumulation factor, disease incidence, soil acidification.</p>
                <textarea
                  rows={2}
                  value={protocol.objectivesPEO?.outcomes || protocol.objectivesPICO.outcomes}
                  onChange={(e) => handlePeoChange("outcomes", e.target.value)}
                  placeholder="e.g. Species mortality, bioaccumulation factor, respiratory morbidity, soil acidification..."
                  className="w-full text-xs font-sans p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                />
              </div>

              <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-xl space-y-1.5">
                <div className="font-mono text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                  S · Setting / Ecosystem & Geographical Context
                </div>
                <p className="text-[11px] text-slate-500">Geographic scale, biome, climate zone, or spatial environmental setting.</p>
                <textarea
                  rows={2}
                  value={protocol.objectivesPEO?.setting || ""}
                  onChange={(e) => handlePeoChange("setting", e.target.value)}
                  placeholder="e.g. Tropical estuarine wetlands, post-industrial urban centers, sub-Saharan agricultural zones..."
                  className="w-full text-xs font-sans p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                />
              </div>

              <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-xl sm:col-span-2 lg:col-span-2 space-y-1.5">
                <div className="font-mono text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                  D · Study Designs / Field Sampling Methods (ROSES)
                </div>
                <p className="text-[11px] text-slate-500">Field survey designs, environmental sampling registries, or epidemiological cohorts.</p>
                <textarea
                  rows={2}
                  value={protocol.objectivesPEO?.studyDesigns || protocol.objectivesPICO.studyDesigns}
                  onChange={(e) => handlePeoChange("studyDesigns", e.target.value)}
                  placeholder="e.g. Longitudinal field monitoring surveys, catchment biomonitoring, observational cohort studies..."
                  className="w-full text-xs font-sans p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                />
              </div>
            </div>
          )}

          {/* 4. SPIDER (Qualitative & Mixed-Method) */}
          {currentFramework === "SPIDER" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="p-4 bg-amber-50/40 border border-amber-100 rounded-xl space-y-1.5">
                <div className="font-mono text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                  S · Sample / Informants / Study Participants
                </div>
                <p className="text-[11px] text-slate-500">Target group of study participants, informants, interviewees, or key stakeholders.</p>
                <textarea
                  rows={2}
                  value={protocol.objectivesSPIDER?.sample || protocol.objectivesPICO.population}
                  onChange={(e) => handleSpiderChange("sample", e.target.value)}
                  placeholder="e.g. Intensive care nursing staff, first-generation university students, chronic pain patients..."
                  className="w-full text-xs font-sans p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800"
                />
              </div>

              <div className="p-4 bg-amber-50/40 border border-amber-100 rounded-xl space-y-1.5">
                <div className="font-mono text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                  PI · Phenomenon of Interest (PI)
                </div>
                <p className="text-[11px] text-slate-500">The central experience, social behavior, belief, perception, or phenomenon explored.</p>
                <textarea
                  rows={2}
                  value={protocol.objectivesSPIDER?.phenomenonOfInterest || protocol.objectivesPICO.intervention}
                  onChange={(e) => handleSpiderChange("phenomenonOfInterest", e.target.value)}
                  placeholder="e.g. Lived experiences of occupational burnout, coping strategies, decision-making during triage..."
                  className="w-full text-xs font-sans p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800"
                />
              </div>

              <div className="p-4 bg-amber-50/40 border border-amber-100 rounded-xl space-y-1.5">
                <div className="font-mono text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                  D · Design / Qualitative Methodology
                </div>
                <p className="text-[11px] text-slate-500">Qualitative research techniques, data collection approaches, and analytical traditions.</p>
                <textarea
                  rows={2}
                  value={protocol.objectivesSPIDER?.design || ""}
                  onChange={(e) => handleSpiderChange("design", e.target.value)}
                  placeholder="e.g. Semi-structured in-depth interviews, focus groups, phenomenological inquiry, ethnography, Delphi..."
                  className="w-full text-xs font-sans p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800"
                />
              </div>

              <div className="p-4 bg-amber-50/40 border border-amber-100 rounded-xl space-y-1.5">
                <div className="font-mono text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                  E · Evaluation / Subjective Themes & Perceptions
                </div>
                <p className="text-[11px] text-slate-500">The qualitative findings, thematic concepts, attitudes, and subjective experiences captured.</p>
                <textarea
                  rows={2}
                  value={protocol.objectivesSPIDER?.evaluation || protocol.objectivesPICO.outcomes}
                  onChange={(e) => handleSpiderChange("evaluation", e.target.value)}
                  placeholder="e.g. Perceived psychological safety, feelings of isolation, organizational barriers, trust, stigma..."
                  className="w-full text-xs font-sans p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800"
                />
              </div>

              <div className="p-4 bg-amber-50/40 border border-amber-100 rounded-xl sm:col-span-2 lg:col-span-2 space-y-1.5">
                <div className="font-mono text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                  R · Research Type (Qualitative / Mixed-Methods)
                </div>
                <p className="text-[11px] text-slate-500">Epistemological tradition (Qualitative, Mixed-Methods, Quantitative-descriptive).</p>
                <textarea
                  rows={2}
                  value={protocol.objectivesSPIDER?.researchType || ""}
                  onChange={(e) => handleSpiderChange("researchType", e.target.value)}
                  placeholder="e.g. Qualitative research (phenomenology, grounded theory), Mixed-Methods (concurrent/sequential)..."
                  className="w-full text-xs font-sans p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PRISMA Item 5: Eligibility Criteria (Inclusion / Exclusion) */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-4">
        <div>
          <div className="font-mono text-[10px] text-indigo-600 uppercase tracking-wider font-bold">
            PRISMA 2020 Item 5
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-0.5">
            Eligibility Criteria & Planned Synthesis Grouping
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Explicitly specify inclusion and exclusion criteria and how studies will be categorized for synthesis under the {currentFramework} framework.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Inclusion */}
          <div className="border border-emerald-100 rounded-xl p-4 bg-emerald-50/30">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs font-bold text-emerald-800 uppercase flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                Inclusion Criteria ({protocol.eligibilityCriteria.inclusion.length})
              </span>
            </div>
            <div className="space-y-2 mb-3 max-h-56 overflow-y-auto">
              {protocol.eligibilityCriteria.inclusion.map((inc, i) => (
                <div key={i} className="flex items-start justify-between gap-2 p-2.5 bg-white border border-slate-200/80 rounded-lg text-xs text-slate-800 shadow-2xs">
                  <span>• {inc}</span>
                  <button onClick={() => removeInclusion(i)} className="text-slate-400 hover:text-rose-600 cursor-pointer p-0.5 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newInclusion}
                onChange={(e) => setNewInclusion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addInclusion()}
                placeholder="Add inclusion criterion..."
                className="flex-1 text-xs font-sans p-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
              />
              <button
                onClick={addInclusion}
                className="px-3 py-1.5 text-xs font-mono font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer transition-colors shadow-2xs"
              >
                Add
              </button>
            </div>
          </div>

          {/* Exclusion */}
          <div className="border border-rose-100 rounded-xl p-4 bg-rose-50/30">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs font-bold text-rose-800 uppercase flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-rose-600" />
                Exclusion Criteria ({protocol.eligibilityCriteria.exclusion.length})
              </span>
            </div>
            <div className="space-y-2 mb-3 max-h-56 overflow-y-auto">
              {protocol.eligibilityCriteria.exclusion.map((exc, i) => (
                <div key={i} className="flex items-start justify-between gap-2 p-2.5 bg-white border border-slate-200/80 rounded-lg text-xs text-slate-800 shadow-2xs">
                  <span>• {exc}</span>
                  <button onClick={() => removeExclusion(i)} className="text-slate-400 hover:text-rose-600 cursor-pointer p-0.5 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newExclusion}
                onChange={(e) => setNewExclusion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addExclusion()}
                placeholder="Add exclusion criterion..."
                className="flex-1 text-xs font-sans p-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-800"
              />
              <button
                onClick={addExclusion}
                className="px-3 py-1.5 text-xs font-mono font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg cursor-pointer transition-colors shadow-2xs"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Grouping for Synthesis */}
        <div className="pt-2">
          <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
            Planned Grouping for Synthesis (Item 5 & Item 13a)
          </label>
          <textarea
            rows={2}
            value={protocol.eligibilityCriteria.groupingForSynthesis}
            onChange={(e) =>
              onUpdateProtocol({
                ...protocol,
                eligibilityCriteria: {
                  ...protocol.eligibilityCriteria,
                  groupingForSynthesis: e.target.value,
                },
              })
            }
            placeholder="e.g. Grouping by algorithm architecture / exposure gradient / stakeholder perspective and methodological design..."
            className="w-full text-xs font-sans p-2.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
          />
        </div>
      </div>

      {/* PRISMA Items 8, 9 & 11: Review Process, Automation, and RoB Methods */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-4">
        <div>
          <div className="font-mono text-[10px] text-indigo-600 uppercase tracking-wider font-bold">
            PRISMA 2020 Items 8, 9 & 11
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-0.5">
            Selection, Data Collection & Quality Appraisal Methods
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2">
            <div className="font-mono text-xs font-bold text-slate-900">
              Item 8: Selection Process
            </div>
            <p className="text-[11px] text-slate-500">
              Number of reviewers, independent screening, dispute adjudication, and automation tool details.
            </p>
            <div className="space-y-2 pt-1 text-xs">
              <label className="block text-[11px] font-mono text-slate-500">Number of Reviewers:</label>
              <input
                type="number"
                value={protocol.selectionProcess.numReviewers}
                onChange={(e) =>
                  onUpdateProtocol({
                    ...protocol,
                    selectionProcess: { ...protocol.selectionProcess, numReviewers: parseInt(e.target.value) || 2 },
                  })
                }
                className="w-full p-2 border border-slate-200 rounded-lg bg-white text-xs font-mono text-slate-800"
              />
              <label className="block text-[11px] font-mono text-slate-500 pt-1">Automation Disclosure:</label>
              <textarea
                rows={2}
                value={protocol.selectionProcess.automationTools}
                onChange={(e) =>
                  onUpdateProtocol({
                    ...protocol,
                    selectionProcess: { ...protocol.selectionProcess, automationTools: e.target.value },
                  })
                }
                className="w-full p-2 border border-slate-200 rounded-lg bg-white text-xs text-slate-800"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2">
            <div className="font-mono text-xs font-bold text-slate-900">
              Item 9: Data Collection Process
            </div>
            <p className="text-[11px] text-slate-500">
              Data extraction methods, independent extraction, author contact for missing data.
            </p>
            <div className="space-y-2 pt-1 text-xs">
              <label className="block text-[11px] font-mono text-slate-500">Extraction Strategy:</label>
              <textarea
                rows={3}
                value={protocol.dataCollectionProcess.authorContactProcess}
                onChange={(e) =>
                  onUpdateProtocol({
                    ...protocol,
                    dataCollectionProcess: { ...protocol.dataCollectionProcess, authorContactProcess: e.target.value },
                  })
                }
                className="w-full p-2 border border-slate-200 rounded-lg bg-white text-xs text-slate-800"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2">
            <div className="font-mono text-xs font-bold text-slate-900">
              Item 11: Quality Appraisal / RoB Tool
            </div>
            <p className="text-[11px] text-slate-500">
              Standardized tool (RoB 2, ROBINS-I, PROBAST, Newcastle-Ottawa, CASP) and domain definitions.
            </p>
            <div className="space-y-2 pt-1 text-xs">
              <label className="block text-[11px] font-mono text-slate-500">Tool Name & Domains:</label>
              <textarea
                rows={3}
                value={protocol.riskOfBiasMethods.toolName}
                onChange={(e) =>
                  onUpdateProtocol({
                    ...protocol,
                    riskOfBiasMethods: { ...protocol.riskOfBiasMethods, toolName: e.target.value },
                  })
                }
                className="w-full p-2 border border-slate-200 rounded-lg bg-white text-xs text-slate-800"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
