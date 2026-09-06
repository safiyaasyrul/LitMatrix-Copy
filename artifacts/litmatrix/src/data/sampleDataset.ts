import { SLRRecord, ScreeningDecision, StudyCharacteristic, AbstractReportingAssessment, RiskOfBiasItem, SynthesisCategory, GradeCertaintyItem, SynthesisResult, DiscussionSections, SLRProtocol } from "../types/slr";

export const BLANK_PROTOCOL: SLRProtocol = {
  title: "Abstract-Level Systematic Review of [Topic]: Narrative and Thematic Synthesis",
  reviewType: "Systematic Review with Narrative Synthesis",
  introductionRationale: "",
  backgroundContext: "",
  knowledgeGap: "",
  primaryResearchQuestions: [
    "RQ1: What evidence directly addresses the review topic?",
    "RQ2: What methods, settings, and outcomes are reported by the eligible studies?",
    "RQ3: What limitations and evidence gaps remain?",
  ],
  secondaryObjectives: [
    "Describe patterns and differences across the included studies",
    "Describe abstract-level methodological reporting and evidence limitations without assigning formal risk-of-bias judgments",
  ],
  formulationFramework: "PICO",
  objectivesPICO: {
    population: "Define target population or condition (e.g., adults with specific condition)...",
    intervention: "Define intervention, diagnostic method, or exposure of interest...",
    comparator: "Define comparator, control group, or standard of care...",
    outcomes: "Primary and secondary outcomes of interest...",
    studyDesigns: "Eligible study designs (e.g., RCTs, cohort studies, observational trials)...",
  },
  objectivesPICOC: {
    population: "Define the population, system, setting, or unit of analysis...",
    intervention: "Define the intervention, method, policy, technology, or exposure...",
    comparison: "Define any relevant comparison or baseline...",
    outcomes: "Define outcomes or phenomena of interest...",
    context: "Define the operational, geographical, environmental, or institutional context...",
    studyDesigns: "Define eligible empirical study designs...",
  },
  objectivesPEO: {
    population: "Target ecosystem, catchment, biota, or observational cohort...",
    exposure: "Environmental factor, pollutant, climate stressor, or risk agent...",
    outcomes: "Ecological degradation, disease incidence, or biomarker changes...",
    setting: "Geographic region, climate zone, or ecosystem setting...",
    studyDesigns: "Longitudinal observational cohorts, biomonitoring surveys, field registries...",
  },
  objectivesSPIDER: {
    sample: "Target informants, stakeholder groups, or study participants...",
    phenomenonOfInterest: "Lived experiences, perceptions, behaviors, or decision-making processes...",
    design: "Qualitative methodology (in-depth interviews, focus groups, ethnography)...",
    evaluation: "Subjective themes (attitudes, emotional impacts, barriers, facilitators)...",
    researchType: "Qualitative (phenomenology, grounded theory) or Mixed-Methods...",
  },
  eligibilityCriteria: {
    inclusion: [
      "Peer-reviewed original research studies",
      "Direct relevance to the review questions",
      "Sufficient methodological information for evidence extraction",
      "English language publication",
    ],
    exclusion: [
      "Non-peer reviewed preprints, editorials, letters, or commentary",
      "Records outside the defined scope",
      "Insufficient information to establish eligibility",
    ],
    timeframe: "Last 5-10 Years - Present",
    language: "English",
    groupingForSynthesis: "Thematic grouping by intervention subtype or study design.",
  },
  informationSources: [],
  searchStrategies: [],
  selectionProcess: {
    numReviewers: 1,
    independentScreening: false,
    disputeResolution: "Not configured.",
    automationTools: "AI-assisted title and abstract screening suggestions; final decisions require user confirmation.",
    screeningThreshold: 80,
  },
  dataCollectionProcess: {
    numReviewers: 1,
    independentExtraction: false,
    authorContactProcess: "Not configured.",
    automationTools: "AI-assisted extraction from supplied citation metadata; unreported fields remain unreported.",
  },
  dataItems: {
    outcomesSought: "Outcomes and findings relevant to the review questions.",
    otherVariables: "Study setting, evidence source, sample or case, design, methods, and validation approach.",
    missingDataAssumptions: "No values are imputed. Missing information is recorded as not reported.",
  },
  riskOfBiasMethods: {
    toolName: "Abstract-level methodological reporting checklist; no formal risk-of-bias assessment.",
    numReviewers: 1,
    domainsAssessed: "Study design, dataset/sample, outcome definition, validation, comparator/baseline, external validation, uncertainty, implementation, direct target outcome, and abstract reporting completeness.",
    automationTools: "AI-assisted abstract reporting suggestions; every judgment requires reviewer confirmation.",
  },
  effectMeasures: "Not prespecified. Quantitative pooling requires comparable, extractable effect data.",
  synthesisMethods: {
    criteriaForEligibility: "Studies meeting the documented eligibility criteria.",
    dataPreparation: "Narrative coding and grouping using explicitly extracted study characteristics.",
    visualDisplays: "Study-characteristics tables and thematic summary tables.",
    synthesisModel: "Narrative and thematic synthesis by default.",
    heterogeneityExploration: "Describe differences in study design, setting, data sources, methods, and reported outcomes.",
    sensitivityAnalysis: "Not applicable unless a quantitative analysis is subsequently specified and performed.",
  },
  reportingBiasMethods: "Describe likely reporting and publication limitations without statistical tests unless suitable data are available.",
  certaintyMethods: "Use a certainty framework appropriate to the evidence types; do not assign certainty automatically.",
};

export const SAMPLE_PROTOCOL: SLRProtocol = {
  title: "Machine Learning for Early Type 2 Diabetes Risk Prediction: An Abstract-Level Systematic Review with Narrative and Thematic Synthesis",
  reviewType: "Systematic Review with Narrative and Thematic Synthesis",
  introductionRationale: "Type 2 Diabetes Mellitus represents a substantial global health burden. Machine-learning approaches are increasingly used to model early risk from clinical and longitudinal data, but the available literature varies in population, data source, validation approach, and outcome reporting. This review therefore synthesizes what is reported in the available citation records and abstracts, using narrative and thematic synthesis rather than unsupported quantitative pooling.",
  backgroundContext: "T2DM accounts for >90% of global diabetes cases, imposing an estimated $966 billion annual economic burden. Routine clinical risk calculators frequently suffer from moderate discrimination (AUC ~0.70-0.76) and suboptimal calibration when deployed across multi-ethnic cohorts. Machine learning models leveraging multimodal electronic health record features offer a promising paradigm for personalized predictive stratification.",
  knowledgeGap: "Existing literature is fragmented across disparate algorithm implementations, heterogeneous feature sets, and inconsistent reporting of calibration and external validation. A qualitative cross-study synthesis is needed to compare recurring findings, contradictions, methodological limitations, and evidence gaps.",
  primaryResearchQuestions: [
    "RQ1 (Reported evidence): What methods, populations, data sources, validation approaches, and outcomes are reported by studies of supervised machine learning for early Type 2 Diabetes risk prediction?",
    "RQ2 (Cross-study patterns): What recurring patterns, differences, and contradictions appear across model families, clinical settings, and reported outcomes?",
    "RQ3 (Evidence limitations): Which reporting gaps and unresolved questions limit interpretation of transportability, external validation, and real-world implementation?",
  ],
  secondaryObjectives: [
    "Describe differences in study design, populations, data sources, validation approaches, and reported outcomes without statistical pooling",
    "Identify top consistent predictive feature rankings (e.g., fasting plasma glucose, HbA1c, BMI, lipid ratios) across model architectures",
    "Develop an evidence-grounded future research agenda from identified gaps and methodological limitations",
  ],
  formulationFramework: "PICO",
  objectivesPICO: {
    population: "Adult populations (aged >= 18 years) at risk of developing Type 2 Diabetes Mellitus (T2DM) without baseline diagnosis.",
    intervention: "Supervised machine learning algorithms (e.g., XGBoost, Random Forest, Support Vector Machines, Neural Networks, Logistic Regression) utilizing electronic health records, genomic markers, or metabolic biomarkers.",
    comparator: "Standard clinical risk scores (e.g., FINDRISC, ADA Risk Score, Framingham Diabetes Risk Score) or standard clinical practice.",
    outcomes: "Primary: Predictive discrimination (AUC-ROC, C-statistic), sensitivity, specificity, and Odds Ratio / Hazard Ratio for early incidence. Secondary: Model calibration (Brier score), feature importance rankings.",
    studyDesigns: "Prospective cohort studies, retrospective observational cohorts, and validated clinical registry trials.",
  },
  objectivesPICOC: {
    population: "Healthcare electronic health record (EHR) databases, longitudinal clinical registries, and ambulatory monitoring systems.",
    intervention: "Machine learning prediction pipelines (XGBoost, Random Forest, Multi-Layer Perceptrons, LightGBM).",
    comparison: "Baseline statistical logistic regression models and classical scoring rules (FINDRISC, ADA scoring index).",
    outcomes: "Model discrimination (AUC-ROC, C-statistic), F1-score, Brier calibration score, and inference latency.",
    context: "Primary care clinical decision support systems and ambulatory outpatient triage workflows.",
    studyDesigns: "Empirical machine learning benchmarks and multi-center retrospective validation studies.",
  },
  objectivesPEO: {
    population: "Adult non-diabetic human populations undergoing routine metabolic and laboratory screening.",
    exposure: "Combined metabolic risk exposures (elevated fasting glucose, HbA1c, dyslipidemia, insulin resistance biomarkers).",
    outcomes: "Incident Type 2 Diabetes onset within 3 to 10-year follow-up windows and microvascular complication risks.",
    setting: "Community cohorts and population-level longitudinal biobanks across diverse ethnic populations.",
    studyDesigns: "Longitudinal prospective cohort studies and population-based epidemiology registries.",
  },
  objectivesSPIDER: {
    sample: "Primary care physicians, endocrinologists, and prediabetic adult patients utilizing predictive clinical tools.",
    phenomenonOfInterest: "Clinical perceptions, trust, adoption barriers, and user experience when implementing AI risk prediction scores.",
    design: "Semi-structured qualitative interviews, clinician focus groups, and usability surveys.",
    evaluation: "Perceived diagnostic utility, workflow integration friction, explanatory clarity, and shared decision-making impact.",
    researchType: "Qualitative and mixed-methods implementation studies.",
  },
  eligibilityCriteria: {
    inclusion: [
      "Peer-reviewed journal articles or conference proceedings published 2019-2026",
      "Studies developing or validating machine learning models for Type 2 Diabetes prediction",
      "Human adult participants (>= 18 years old)",
      "Abstract reports a direct target outcome or evaluated result relevant to the review questions",
      "English language publication",
    ],
    exclusion: [
      "Type 1 diabetes or gestational diabetes prediction only",
      "Records that do not identify an eligible primary empirical design or direct target outcome in the abstract",
      "Non-peer reviewed preprints, editorials, letters, or abstract-only conference posters",
      "Animal models or in vitro cellular studies",
      "Reviews, editorials, protocols, commentaries, or purely conceptual records unless explicitly eligible",
    ],
    timeframe: "January 2019 - Present (2026)",
    language: "English",
    groupingForSynthesis: "Categories must emerge from explicitly reported study design, population/data source, method, validation approach, or outcome; use narrative and thematic grouping and retain an unclassified category where the abstract is insufficient.",
  },
  informationSources: [
    { name: "Scopus (Elsevier)", lastSearchedDate: "2026-08-15", urlOrHost: "scopus.com", recordsRetrieved: 42 },
    { name: "Web of Science Core Collection", lastSearchedDate: "2026-08-15", urlOrHost: "webofscience.com", recordsRetrieved: 38 },
    { name: "PubMed / MEDLINE (NLM)", lastSearchedDate: "2026-08-16", urlOrHost: "pubmed.ncbi.nlm.nih.gov", recordsRetrieved: 29 },
    { name: "Google Scholar (Advanced Search)", lastSearchedDate: "2026-08-16", urlOrHost: "scholar.google.com", recordsRetrieved: 24 },
  ],
  searchStrategies: [
    {
      database: "Scopus",
      query: `TITLE-ABS-KEY ( ( "machine learning" OR "deep learning" OR "artificial intelligence" OR "random forest" OR "xgboost" OR "neural network" ) AND ( "type 2 diabetes" OR "T2DM" OR "diabetes mellitus" ) AND ( "prediction" OR "early detection" OR "risk stratification" OR "prognostic model" ) ) AND PUBYEAR > 2018 AND ( LIMIT-TO ( DOCTYPE , "ar" ) OR LIMIT-TO ( DOCTYPE , "cp" ) ) AND ( LIMIT-TO ( LANGUAGE , "English" ) )`,
      filters: "Years 2019-2026, Article/Conference Paper, English",
    },
    {
      database: "Web of Science",
      query: `TS=(("machine learning" OR "deep learning" OR "XGBoost" OR "Random Forest") AND ("type 2 diabetes" OR "diabetes mellitus") AND ("prediction" OR "risk assessment")) AND PY=(2019-2026) AND DT=(Article OR Proceedings Paper) AND LA=(English)`,
      filters: "Years 2019-2026, Article/Proceedings, English",
    },
    {
      database: "PubMed",
      query: `(("machine learning"[Title/Abstract] OR "deep learning"[Title/Abstract] OR "artificial intelligence"[Title/Abstract]) AND ("Diabetes Mellitus, Type 2"[MeSH Terms] OR "type 2 diabetes"[Title/Abstract]) AND ("early diagnosis"[MeSH Terms] OR "risk prediction"[Title/Abstract])) AND ("2019/01/01"[Date - Publication] : "3000"[Date - Publication]) AND English[Language]`,
      filters: "2019-2026, Humans, English",
    },
  ],
  selectionProcess: {
    numReviewers: 2,
    independentScreening: true,
    disputeResolution: "Consensus through joint re-evaluation or adjudication by a third senior reviewer.",
    automationTools: "AI-assisted title/abstract screening using relevance threshold (>= 80% score) followed by human reviewer confirmation.",
    screeningThreshold: 80,
  },
  dataCollectionProcess: {
    numReviewers: 2,
    independentExtraction: true,
    authorContactProcess: "Corresponding authors contacted via email for missing metric values with 3-week response window.",
    automationTools: "Structured automated extraction matrix verified against primary PDF text.",
  },
  dataItems: {
    outcomesSought: "Primary: AUC-ROC / C-statistic, sensitivity, specificity, positive predictive value (PPV), F1-score. Secondary: Brier score calibration, top SHAP predictive variables.",
    otherVariables: "Country, sample cohort size, age range, female %, clinical setting (EHR vs community screening), validation method (k-fold CV vs external cohort), missing data handling.",
    missingDataAssumptions: "Missing standard errors imputed using reported 95% confidence intervals or p-values according to Cochrane Handbook guidance.",
  },
  riskOfBiasMethods: {
    toolName: "Abstract-level reporting checklist; formal risk-of-bias tools were not applied because full texts were not retrieved.",
    numReviewers: 2,
    domainsAssessed: "Study design, dataset/sample, outcome definition, validation, comparator/baseline, external validation, uncertainty, implementation, direct target outcome, and abstract reporting completeness.",
    automationTools: "AI-assisted abstract reporting suggestions; every judgment requires reviewer confirmation.",
  },
  effectMeasures: "Not applicable by default. Quantitative synthesis is not justified unless comparable, extractable effect data and an approved quantitative plan are supplied.",
  synthesisMethods: {
    criteriaForEligibility: "Studies providing validated predictive performance metrics in general adult cohorts.",
    dataPreparation: "Conversion of ROC confidence bounds into standard error using Wilson score / Hanley-McNeil variance formulas.",
    visualDisplays: "Study-characteristics tables, adaptive study-quality summaries, thematic clusters, and cross-study evidence tables.",
    synthesisModel: "Narrative and thematic synthesis; quantitative synthesis is not applicable or not justified for the abstract-level evidence workflow.",
    heterogeneityExploration: "Subgroup analysis comparing algorithm type (Tree ensemble vs Deep Learning vs Logistic regression) and validation type (internal vs external cohort).",
    sensitivityAnalysis: "Not applicable to the abstract-level narrative workflow; describe contradictions and evidence gaps instead.",
  },
  reportingBiasMethods: "Visual inspection of funnel plot asymmetry and Egger's linear regression test for funnel asymmetry (significance threshold p < 0.05).",
  certaintyMethods: "Not applicable by default. The report describes reporting completeness and evidence limitations without assigning formal certainty ratings.",
};

export const SAMPLE_RECORDS: SLRRecord[] = [
  {
    id: "rec-01",
    title: "Ensemble Machine Learning for Early Risk Stratification of Type 2 Diabetes in Large-Scale Electronic Health Records",
    authors: ["Chen, L.", "Zhang, M.", "Kumar, A.", "Patel, R."],
    year: "2023",
    source: "Journal of Medical Internet Research, 25(4), e44120",
    doi: "10.2196/44120",
    databaseSource: "Scopus",
    abstract: "Early detection of type 2 diabetes mellitus (T2DM) is critical for preventing irreversible microvascular and macrovascular complications. In this retrospective cohort study of 124,500 adult patients from an integrated healthcare system (2014-2022), we engineered 48 clinical features from routine electronic health records and trained multiple machine learning algorithms. Extreme Gradient Boosting (XGBoost) achieved an area under the receiver operating characteristic curve (AUC-ROC) of 0.892 (95% CI 0.884-0.900), outperforming Random Forest (AUC 0.865) and conventional Logistic Regression (AUC 0.781). Key predictive biomarkers identified through SHAP analysis included fasting plasma glucose, BMI trajectory over 3 years, HbA1c fluctuation, and serum triglycerides. External validation on an independent cohort of 32,000 patients maintained high discrimination (AUC 0.876). Our findings demonstrate that automated EHR ensemble models can identify undiagnosed prediabetes and diabetes up to 3 years prior to clinical onset.",
  },
  {
    id: "rec-02",
    title: "Deep Neural Network Architectures for Multimodal Diabetes Onset Prediction Combining Genomic and Phenotypic Features",
    authors: ["Nakamura, S.", "Tanaka, K.", "Yamamoto, H."],
    year: "2024",
    source: "IEEE Transactions on Biomedical Engineering, 71(2), 512-521",
    doi: "10.1109/TBME.2023.3312456",
    databaseSource: "Web of Science",
    abstract: "Integrating high-dimensional polygenic risk scores with clinical biomarkers offers potential for precision diabetes prevention. We developed a multimodal deep feedforward neural network combining 120 single nucleotide polymorphisms (SNPs) and 24 clinical parameters in a cohort of 45,800 Japanese adults followed over 7 years. The deep multimodal model achieved an AUC-ROC of 0.914 (95% CI 0.901-0.927) and sensitivity of 84.6% at 85% specificity. Multimodal fusion yielded a significant 0.052 gain in AUC over clinical features alone. Calibration slope was 0.98, indicating near-optimal risk probability estimation. Deep learning architectures capture complex non-linear gene-environment interactions that standard linear risk calculators overlook.",
  },
  {
    id: "rec-03",
    title: "Comparison of Machine Learning Algorithms Versus Traditional Clinical Risk Scores for Diabetes Screening in Primary Care",
    authors: ["Williams, E. R.", "Davies, G. M.", "O'Connor, T."],
    year: "2022",
    source: "Diabetes Care, 45(6), 1380-1388",
    doi: "10.2337/dc21-2190",
    databaseSource: "PubMed",
    abstract: "Standard screening scores such as FINDRISC and the ADA risk score rely on static questionnaire points and have modest specificity. We evaluated whether machine learning models using non-invasive primary care features can improve early triage. In a prospective screening study of 18,200 non-diabetic adults across 42 UK general practices, a LightGBM classifier yielded an AUC of 0.841 (95% CI 0.825-0.857), compared with 0.724 (95% CI 0.706-0.742) for FINDRISC and 0.710 for the ADA score (P < .001). Decision curve analysis showed superior net clinical benefit across all threshold probabilities from 5% to 30%. Machine learning improves screening efficiency while reducing unnecessary confirmatory blood testing by 34%.",
  },
  {
    id: "rec-04",
    title: "Longitudinal Trajectory Mining Using Recurrent Neural Networks for 5-Year Diabetes Incidence Forecasting",
    authors: ["Gomez, R.", "Silva, F.", "Santos, M.", "Costa, J."],
    year: "2023",
    source: "Lancet Digital Health, 5(8), e510-e519",
    doi: "10.1016/S2589-7500(23)00112-4",
    databaseSource: "Scopus",
    abstract: "Most risk models evaluate cross-sectional single-timepoint measurements, ignoring temporal health dynamics. We trained Long Short-Term Memory (LSTM) recurrent neural networks on 5 consecutive annual health checkup records from 67,300 Brazilian public workers. The LSTM model achieved an AUC-ROC of 0.885 (95% CI 0.871-0.899) for predicting incident diabetes within a 5-year future horizon. Incorporating rate-of-change in blood pressure, fasting glucose slope, and waist-to-hip velocity substantially enhanced discrimination compared to baseline static values alone. Sequential deep temporal learning represents a powerful paradigm for proactive diabetes intervention.",
  },
  {
    id: "rec-05",
    title: "Explainable Artificial Intelligence for Diabetes Prediction Using SHAP Values and CatBoost in Community Screening",
    authors: ["Al-Mansoori, H.", "Khalid, N.", "Al-Mutawa, A."],
    year: "2024",
    source: "Artificial Intelligence in Medicine, 149, 102780",
    doi: "10.1016/j.artmed.2024.102780",
    databaseSource: "Web of Science",
    abstract: "Lack of algorithmic interpretability hampers clinical adoption of artificial intelligence in preventive healthcare. We developed an explainable CatBoost prediction model for 14,200 participants in a Middle Eastern community diabetes prevention trial. The CatBoost model demonstrated an AUC of 0.872 (95% CI 0.855-0.889) with 81.2% accuracy. Individual-level TreeSHAP force plots were generated in real-time to provide clinician-facing explanations. Age, family history, alanine aminotransferase (ALT), and resting heart rate were the most influential risk drivers. Clinician trust scores increased from 42% to 88% when transparent SHAP explanations accompanied risk probabilities.",
  },
  {
    id: "rec-06",
    title: "Support Vector Machine Classification of Impaired Glucose Tolerance Using Routine Hematological Parameters",
    authors: ["Fischer, B.", "Schmidt, U.", "Weber, K."],
    year: "2021",
    source: "BMC Medical Informatics and Decision Making, 21(1), 198",
    doi: "10.1186/s12911-021-01560-w",
    databaseSource: "PubMed",
    abstract: "Complete blood count (CBC) indices reflect subclinical chronic inflammation and may indicate incipient metabolic disease. We investigated whether Support Vector Machines with radial basis kernels (SVM-RBF) can detect impaired glucose regulation from routine CBC and lipid panels in 9,450 outpatient subjects. The SVM model achieved an AUC of 0.814 (95% CI 0.793-0.835), sensitivity of 76.5%, and specificity of 78.1%. Neutrophil-to-lymphocyte ratio and red blood cell distribution width (RDW) emerged as potent non-glycemic predictive signals. This low-cost diagnostic approach holds value in resource-limited rural clinics where specialized HbA1c tests are constrained.",
  },
  {
    id: "rec-07",
    title: "Predictive Analytics for Incident Type 2 Diabetes in Postmenopausal Women: A Random Forest Survival Model",
    authors: ["Larsson, A.", "Eriksson, M.", "Sundstrom, J."],
    year: "2022",
    source: "Maturitas, 160, 45-52",
    doi: "10.1016/j.maturitas.2022.02.004",
    databaseSource: "Google Scholar",
    abstract: "Hormonal shifts post-menopause accelerate abdominal adiposity and insulin resistance. We applied Random Survival Forests (RSF) to a 10-year follow-up cohort of 11,800 postmenopausal women without baseline diabetes. The RSF model achieved a concordance index (C-index) of 0.838 (95% CI 0.819-0.857), significantly outperforming the standard Cox proportional hazards model (C-index 0.762). Top predictors included years since menopause, homeostatic model assessment of insulin resistance (HOMA-IR), waist circumference, and self-reported physical activity levels. Machine learning survival curves accurately stratified high-risk individuals for lifestyle intervention.",
  },
  {
    id: "rec-08",
    title: "Graph Neural Networks for Modeling Comorbidity Interactions in Type 2 Diabetes Risk Prediction",
    authors: ["Zhou, Y.", "Qian, X.", "Li, T."],
    year: "2024",
    source: "Journal of Biomedical Informatics, 150, 104592",
    doi: "10.1016/j.jbi.2024.104592",
    databaseSource: "Scopus",
    abstract: "Patient disease trajectories involve intricate co-occurrence networks among chronic conditions. We constructed heterogeneous patient-disease bipartite graphs from 52,000 outpatient records and applied Graph Convolutional Networks (GCN) to predict 3-year diabetes incidence. The GCN architecture achieved an AUC-ROC of 0.895 (95% CI 0.881-0.909), surpassing baseline Multilayer Perceptrons (AUC 0.832) and logistic regression (AUC 0.774). Hypertension, non-alcoholic fatty liver disease (NAFLD), and polycystic ovary syndrome (PCOS) formed dense high-risk comorbidity clusters. Graph embeddings effectively capture topological health risks across interconnected diagnostic codes.",
  },
  {
    id: "rec-09",
    title: "Cost-Effectiveness of Machine Learning-Driven Targeted Diabetes Screening Programs: A Markov Decision Model",
    authors: ["Henderson, P.", "Clark, D.", "Foster, H."],
    year: "2023",
    source: "Value in Health, 26(10), 1432-1441",
    doi: "10.1016/j.jval.2023.05.011",
    databaseSource: "Web of Science",
    abstract: "While machine learning models achieve high statistical accuracy, health economic evaluations remain sparse. We developed a Markov microsimulation model simulating lifetime costs and quality-adjusted life years (QALYs) of implementing an XGBoost-based screening algorithm compared to universal opportunistic screening in 100,000 simulated 45-year-old adults. The ML-guided strategy had an incremental cost-effectiveness ratio (ICER) of $14,250 per QALY gained, well beneath standard willingness-to-pay thresholds of $50,000/QALY. Earlier detection reduced 10-year incidence of diabetic retinopathy by 22% and cardiovascular events by 18%.",
  },
  {
    id: "rec-10",
    title: "Retrospective Analysis of Insulin Resistance in Rodent Models of Diet-Induced Obesity",
    authors: ["Miller, K.", "Baker, S."],
    year: "2020",
    source: "Laboratory Animal Science, 49(3), 210-218",
    doi: "10.1038/laban.2020.12",
    databaseSource: "PubMed",
    abstract: "High-fat diet induced metabolic syndrome was evaluated in male C57BL/6J mice over 16 weeks to determine hepatic glucose output and adipose tissue macrophage infiltration. Glucose tolerance tests were performed at week 8 and week 16.",
  },
  {
    id: "rec-11",
    title: "Machine Learning for Prediction of Gestational Diabetes Mellitus During the First Trimester",
    authors: ["Sun, X.", "Wu, J."],
    year: "2022",
    source: "American Journal of Obstetrics & Gynecology, 226(4), 580-588",
    doi: "10.1016/j.ajog.2021.11.020",
    databaseSource: "Scopus",
    abstract: "Gestational diabetes mellitus (GDM) affects maternal and fetal outcomes. We trained Random Forest algorithms on 6,200 pregnant women at 10-14 weeks gestation to predict GDM diagnosed at 24-28 weeks oral glucose tolerance test. The model achieved an AUC of 0.812.",
  },
  {
    id: "rec-12",
    title: "Editorial: The Promise and Pitfalls of Artificial Intelligence in Endocrinology Practice",
    authors: ["Roberts, J."],
    year: "2023",
    source: "Nature Reviews Endocrinology, 19(1), 5-6",
    doi: "10.1038/s41574-022-00780-z",
    databaseSource: "Google Scholar",
    abstract: "A brief editorial commentary discussing recent developments in medical machine learning for diabetes and thyroid disease management, highlighting data privacy and regulatory considerations.",
  },
];

export const SAMPLE_SCREENING: Record<string, ScreeningDecision> = {
  "rec-01": { score: 95, reason: "Directly evaluates XGBoost & Random Forest for T2DM prediction in large EHR cohort.", decision: "include", agreed: true },
  "rec-02": { score: 96, reason: "Evaluates multimodal deep neural network combining genomics and clinical data for diabetes onset.", decision: "include", agreed: true },
  "rec-03": { score: 92, reason: "Direct comparison of LightGBM machine learning vs FINDRISC/ADA clinical risk scores.", decision: "include", agreed: true },
  "rec-04": { score: 94, reason: "Evaluates LSTM recurrent neural networks on longitudinal trajectory EHR for diabetes incidence.", decision: "include", agreed: true },
  "rec-05": { score: 91, reason: "Evaluates CatBoost and explainable SHAP artificial intelligence in community diabetes screening.", decision: "include", agreed: true },
  "rec-06": { score: 88, reason: "Evaluates Support Vector Machines on routine hematological parameters for glucose intolerance.", decision: "include", agreed: true },
  "rec-07": { score: 89, reason: "Evaluates Random Survival Forests for diabetes prediction in postmenopausal women.", decision: "include", agreed: true },
  "rec-08": { score: 93, reason: "Evaluates Graph Neural Networks on comorbidity networks for 3-year diabetes prediction.", decision: "include", agreed: true },
  "rec-09": { score: 85, reason: "Evaluates health economics and performance of ML targeted screening for T2DM.", decision: "include", agreed: true },
  "rec-10": { score: 25, reason: "Animal model in mice; fails population eligibility criteria.", decision: "exclude", agreed: false, exclusionReason: "Wrong population", exclusionNotes: "Pre-clinical rodent study." },
  "rec-11": { score: 45, reason: "Gestational diabetes (GDM) during pregnancy, not general Type 2 Diabetes.", decision: "exclude", agreed: false, exclusionReason: "Wrong outcome", exclusionNotes: "Gestational diabetes mellitus only." },
  "rec-12": { score: 30, reason: "Editorial opinion piece without empirical dataset or prediction model.", decision: "exclude", agreed: false, exclusionReason: "Wrong study design", exclusionNotes: "Editorial commentary." },
};

export const SAMPLE_CHARACTERISTICS: StudyCharacteristic[] = [
  {
    recordId: "rec-01",
    authorYear: "Chen et al. (2023)",
    country: "United States",
    sampleSize: "N = 124,500 (Train) / 32,000 (Test)",
    population: "Adult EHR primary & outpatient care (age 18-80)",
    interventionOrFocus: "XGBoost & Random Forest (48 EHR clinical features)",
    comparator: "Logistic Regression & ADA Risk Score",
    primaryOutcome: "AUC-ROC 0.892 (95% CI 0.884-0.900), Sens 82.4%, Spec 83.1%",
    studyDesign: "Retrospective cohort with external multi-center validation",
    keyFinding: "XGBoost achieved superior 3-year prediabetes/T2DM forecasting; fasting glucose slope and BMI velocity were top SHAP features.",
  },
  {
    recordId: "rec-02",
    authorYear: "Nakamura et al. (2024)",
    country: "Japan",
    sampleSize: "N = 45,800",
    population: "Adult Japanese annual health checkup cohort",
    interventionOrFocus: "Multimodal Deep Feedforward NN (120 SNPs + 24 clinical biomarkers)",
    comparator: "Clinical-only NN & Standard Polygenic Risk Score",
    primaryOutcome: "AUC-ROC 0.914 (95% CI 0.901-0.927), Sens 84.6%, Spec 85.0%",
    studyDesign: "Prospective 7-year observational cohort",
    keyFinding: "Genomic-clinical multimodal fusion yielded +0.052 AUC improvement over clinical factors alone with near-perfect calibration (slope 0.98).",
  },
  {
    recordId: "rec-03",
    authorYear: "Williams et al. (2022)",
    country: "United Kingdom",
    sampleSize: "N = 18,200",
    population: "Primary care general practice attendees",
    interventionOrFocus: "LightGBM Gradient Boosting (routine non-invasive features)",
    comparator: "FINDRISC Score (AUC 0.724) & ADA Risk Score (AUC 0.710)",
    primaryOutcome: "AUC-ROC 0.841 (95% CI 0.825-0.857), Net Benefit +0.34",
    studyDesign: "Prospective community screening validation",
    keyFinding: "Machine learning reduced unnecessary confirmatory diagnostic blood draws by 34% while maintaining 90% case detection.",
  },
  {
    recordId: "rec-04",
    authorYear: "Gomez et al. (2023)",
    country: "Brazil",
    sampleSize: "N = 67,300",
    population: "Public sector employee longitudinal cohort",
    interventionOrFocus: "Long Short-Term Memory (LSTM) Recurrent Neural Network",
    comparator: "Static single-timepoint Logistic Regression (AUC 0.782)",
    primaryOutcome: "AUC-ROC 0.885 (95% CI 0.871-0.899), 5-Year Horizon",
    studyDesign: "Longitudinal retrospective cohort (5 annual waves)",
    keyFinding: "Sequential temporal modelling of glycemic velocity and blood pressure trajectory significantly outperformed static point measures.",
  },
  {
    recordId: "rec-05",
    authorYear: "Al-Mansoori et al. (2024)",
    country: "United Arab Emirates",
    sampleSize: "N = 14,200",
    population: "Middle Eastern community prevention screening",
    interventionOrFocus: "CatBoost with real-time TreeSHAP explainability plots",
    comparator: "Standard Stepwise Logistic Regression",
    primaryOutcome: "AUC-ROC 0.872 (95% CI 0.855-0.889), Accuracy 81.2%",
    studyDesign: "Cross-sectional & prospective follow-up",
    keyFinding: "Explainable AI increased clinician diagnostic trust from 42% to 88% by providing transparent biomarker attribution.",
  },
  {
    recordId: "rec-06",
    authorYear: "Fischer et al. (2021)",
    country: "Germany",
    sampleSize: "N = 9,450",
    population: "Outpatient clinical laboratory attendees",
    interventionOrFocus: "Support Vector Machines (SVM-RBF) on CBC & lipid indices",
    comparator: "Fasting Glucose single threshold test",
    primaryOutcome: "AUC-ROC 0.814 (95% CI 0.793-0.835), Sens 76.5%, Spec 78.1%",
    studyDesign: "Retrospective cross-sectional validation",
    keyFinding: "Neutrophil-to-lymphocyte ratio and RDW reflect inflammatory metabolic syndrome, offering affordable triage for low-resource clinics.",
  },
  {
    recordId: "rec-07",
    authorYear: "Larsson et al. (2022)",
    country: "Sweden",
    sampleSize: "N = 11,800",
    population: "Postmenopausal women (10-year follow-up)",
    interventionOrFocus: "Random Survival Forest (RSF) with hormonal & metabolic variables",
    comparator: "Cox Proportional Hazards Model (C-index 0.762)",
    primaryOutcome: "Concordance C-index 0.838 (95% CI 0.819-0.857)",
    studyDesign: "Prospective cohort (10-year horizon)",
    keyFinding: "Non-linear interaction between years post-menopause and HOMA-IR was accurately modeled by RSF to predict long-term risk.",
  },
  {
    recordId: "rec-08",
    authorYear: "Zhou et al. (2024)",
    country: "China",
    sampleSize: "N = 52,000",
    population: "Multi-hospital regional outpatient network",
    interventionOrFocus: "Graph Convolutional Network (GCN) on patient-disease graphs",
    comparator: "Multilayer Perceptron (AUC 0.832) & Logistic Regression",
    primaryOutcome: "AUC-ROC 0.895 (95% CI 0.881-0.909), Macro F1 0.82",
    studyDesign: "Retrospective multi-hospital graph modeling",
    keyFinding: "Comorbidity graph embeddings captured synergistic interactions between NAFLD, hypertension, and PCOS for diabetes forecasting.",
  },
  {
    recordId: "rec-09",
    authorYear: "Henderson et al. (2023)",
    country: "Australia / USA",
    sampleSize: "N = 100,000 simulated cohort",
    population: "Adult general population aged 45+",
    interventionOrFocus: "XGBoost-guided screening coupled with lifestyle intervention",
    comparator: "Universal opportunistic standard screening",
    primaryOutcome: "ICER $14,250 / QALY gained, Retinopathy reduction 22%",
    studyDesign: "Markov decision-analytic microsimulation",
    keyFinding: "Targeted ML-based screening is highly cost-effective and prevents severe microvascular end-organ damage over lifetime horizons.",
  },
];

/**
 * A completed abstract-level appraisal fixture for the nine reviewer-included
 * records above. It deliberately records reporting completeness, not risk of
 * bias or certainty, so the demo can exercise the manuscript gate without
 * manufacturing evidence beyond the supplied abstracts.
 */
export const SAMPLE_REPORTING_ASSESSMENTS: AbstractReportingAssessment[] =
  SAMPLE_RECORDS.slice(0, 9).map((record) => {
    const text = `${record.title}\n${record.abstract || ""}`;
    const yes = (pattern: RegExp) => pattern.test(text);
    const assessment = {
      recordId: record.id,
      authorYear: `${record.authors[0]?.split(",")[0] || "Author"} (${record.year || "n.d."})`,
      studyDesignIdentifiable: "Yes" as const,
      datasetSampleDescribed: "Yes" as const,
      outcomeClearlyDefined: "Yes" as const,
      validationDescribed: yes(/validat|compared|outperform|surpass|decision curve/i) ? "Yes" as const : "Unclear" as const,
      comparatorBaselineDescribed: yes(/compared|versus|\bvs\.?\b|outperform|surpass|baseline|standard/i) ? "Yes" as const : "Unclear" as const,
      externalValidation: yes(/external|independent cohort|multi-center|multi-hospital/i) ? "Yes" as const : "Unclear" as const,
      uncertaintyReported: yes(/95% CI|confidence|calibration|p\s*[<=>]/i) ? "Yes" as const : "Unclear" as const,
      realWorldImplementation: yes(/clinical|primary care|community|screening|outpatient|practice|healthcare|diagnostic|prevention/i) ? "Yes" as const : "Unclear" as const,
      directTargetOutcome: yes(/diabetes|glucose|glycemic|metabolic/i) ? "Yes" as const : "Unclear" as const,
      abstractReportingCompleteness: "Moderate" as const,
      evidenceNotes:
        "Completed demo fixture based only on the supplied title and abstract. Unclear means not reported in the available abstract.",
    };
    const definite = [
      assessment.studyDesignIdentifiable,
      assessment.datasetSampleDescribed,
      assessment.outcomeClearlyDefined,
      assessment.validationDescribed,
      assessment.comparatorBaselineDescribed,
      assessment.externalValidation,
      assessment.uncertaintyReported,
      assessment.realWorldImplementation,
      assessment.directTargetOutcome,
    ].filter((value) => value === "Yes").length;
    return {
      ...assessment,
      abstractReportingCompleteness: definite >= 7 ? "High" : definite >= 4 ? "Moderate" : "Low",
    };
  });

export const SAMPLE_RISK_OF_BIAS: RiskOfBiasItem[] = [
  {
    recordId: "rec-01",
    authorYear: "Chen et al. (2023)",
    d1Selection: "Low",
    d2Performance: "Low",
    d3Attrition: "Low",
    d4Detection: "Low",
    d5Reporting: "Low",
    overall: "Low",
    justification: "Large representative EHR population; rigorous independent external validation cohort; transparent imputation and metric reporting.",
  },
  {
    recordId: "rec-02",
    authorYear: "Nakamura et al. (2024)",
    d1Selection: "Low",
    d2Performance: "Low",
    d3Attrition: "Low",
    d4Detection: "Low",
    d5Reporting: "Low",
    overall: "Low",
    justification: "Prospective 7-year design with blind outcome verification and complete genotype quality control.",
  },
  {
    recordId: "rec-03",
    authorYear: "Williams et al. (2022)",
    d1Selection: "Low",
    d2Performance: "Low",
    d3Attrition: "Some concerns",
    d4Detection: "Low",
    d5Reporting: "Low",
    overall: "Low",
    justification: "Multi-center prospective general practice cohort; minor loss to 2-year confirmatory follow-up appropriately handled.",
  },
  {
    recordId: "rec-04",
    authorYear: "Gomez et al. (2023)",
    d1Selection: "Low",
    d2Performance: "Low",
    d3Attrition: "Low",
    d4Detection: "Low",
    d5Reporting: "Low",
    overall: "Low",
    justification: "Complete 5-wave annual medical records with validated ICD-10 diagnostic coding.",
  },
  {
    recordId: "rec-05",
    authorYear: "Al-Mansoori et al. (2024)",
    d1Selection: "Some concerns",
    d2Performance: "Low",
    d3Attrition: "Low",
    d4Detection: "Low",
    d5Reporting: "Low",
    overall: "Some concerns",
    justification: "Single-region community screening cohort; potential selection bias towards health-conscious volunteers.",
  },
  {
    recordId: "rec-06",
    authorYear: "Fischer et al. (2021)",
    d1Selection: "Some concerns",
    d2Performance: "Some concerns",
    d3Attrition: "Low",
    d4Detection: "Low",
    d5Reporting: "Some concerns",
    overall: "Some concerns",
    justification: "Cross-sectional outpatient sample without prospective external test set; partial reporting of calibration.",
  },
  {
    recordId: "rec-07",
    authorYear: "Larsson et al. (2022)",
    d1Selection: "Low",
    d2Performance: "Low",
    d3Attrition: "Low",
    d4Detection: "Low",
    d5Reporting: "Low",
    overall: "Low",
    justification: "Well-characterized 10-year prospective registry cohort with standardized Cox and RSF comparisons.",
  },
  {
    recordId: "rec-08",
    authorYear: "Zhou et al. (2024)",
    d1Selection: "Low",
    d2Performance: "Low",
    d3Attrition: "Low",
    d4Detection: "Low",
    d5Reporting: "Low",
    overall: "Low",
    justification: "Multi-hospital data linkage with robust graph split train/validation partitions.",
  },
  {
    recordId: "rec-09",
    authorYear: "Henderson et al. (2023)",
    d1Selection: "Low",
    d2Performance: "Low",
    d3Attrition: "Low",
    d4Detection: "Low",
    d5Reporting: "Low",
    overall: "Low",
    justification: "Validated CHEERS compliant decision-analytic Markov microsimulation model with extensive probabilistic sensitivity analyses.",
  },
];

export const SAMPLE_CATEGORIES: SynthesisCategory[] = [
  {
    name: "1. Tree-Based Gradient Boosting Ensembles (XGBoost, LightGBM, CatBoost)",
    recordIds: ["rec-01", "rec-03", "rec-05", "rec-07", "rec-09"],
    summaryProse:
      "Tree-based gradient boosting models demonstrated consistently high discriminative capacity for Type 2 Diabetes prediction across general outpatient and community cohorts. Chen et al. (2023) established that XGBoost achieved an AUC-ROC of 0.892 (95% CI 0.884-0.900) in 124,500 EHR records, outperforming traditional logistic regression (AUC 0.781). Similarly, Williams et al. (2022) found LightGBM superior to standard clinical risk tools (FINDRISC AUC 0.724 vs LightGBM AUC 0.841), eliminating 34% of unnecessary confirmatory blood draws. Al-Mansoori et al. (2024) integrated CatBoost with explainable TreeSHAP values, raising clinician trust from 42% to 88%. Larsson et al. (2022) extended tree ensembles into survival analysis with Random Survival Forests (C-index 0.838), while Henderson et al. (2023) confirmed economic viability (ICER $14,250/QALY).",
    tableRows: [
      {
        authorYear: "Chen et al. (2023)",
        focus: "XGBoost 3-year T2DM EHR prediction",
        keyFinding: "AUC 0.892; BMI velocity and fasting glucose slope were primary drivers.",
        method: "Retrospective EHR cohort with external multi-center validation",
        effectEstimate: "AUC = 0.89 (0.88 - 0.90)",
      },
      {
        authorYear: "Williams et al. (2022)",
        focus: "LightGBM vs FINDRISC/ADA clinical risk scores",
        keyFinding: "AUC 0.841 vs FINDRISC 0.724; 34% reduction in false-positive blood tests.",
        method: "Prospective primary care general practice validation",
        effectEstimate: "AUC = 0.84 (0.83 - 0.86)",
      },
      {
        authorYear: "Al-Mansoori et al. (2024)",
        focus: "CatBoost & Explainable TreeSHAP in community screening",
        keyFinding: "AUC 0.872; transparent biomarker attribution boosted clinician trust to 88%.",
        method: "Community-based cross-sectional screening",
        effectEstimate: "AUC = 0.87 (0.86 - 0.89)",
      },
      {
        authorYear: "Larsson et al. (2022)",
        focus: "Random Survival Forests in postmenopausal women",
        keyFinding: "C-index 0.838; captured non-linear interaction between menopause duration and HOMA-IR.",
        method: "Prospective 10-year registry cohort",
        effectEstimate: "C-index = 0.84 (0.82 - 0.86)",
      },
    ],
    references: [
      "Chen, L., Zhang, M., Kumar, A., & Patel, R. (2023). Ensemble Machine Learning for Early Risk Stratification of Type 2 Diabetes in Large-Scale Electronic Health Records. Journal of Medical Internet Research, 25, e44120.",
      "Williams, E. R., Davies, G. M., & O'Connor, T. (2022). Comparison of Machine Learning Algorithms Versus Traditional Clinical Risk Scores for Diabetes Screening in Primary Care. Diabetes Care, 45(6), 1380-1388.",
      "Al-Mansoori, H., Khalid, N., & Al-Mutawa, A. (2024). Explainable Artificial Intelligence for Diabetes Prediction Using SHAP Values and CatBoost in Community Screening. Artificial Intelligence in Medicine, 149, 102780.",
      "Larsson, A., Eriksson, M., & Sundstrom, J. (2022). Predictive Analytics for Incident Type 2 Diabetes in Postmenopausal Women: A Random Forest Survival Model. Maturitas, 160, 45-52.",
      "Henderson, P., Clark, D., & Foster, H. (2023). Cost-Effectiveness of Machine Learning-Driven Targeted Diabetes Screening Programs. Value in Health, 26(10), 1432-1441.",
    ],
    metaAnalysisData: {
      pooledEstimate: "0.864",
      ci95: "0.850 - 0.878",
      iSquared: "48.2%",
      pVal: "< 0.001",
      heterogeneityInterpretation: "Moderate statistical heterogeneity (I² = 48.2%) attributable to differences between primary care and tertiary hospital EHR cohorts.",
      studies: [
        { name: "Chen et al. (2023)", estimate: 0.892, ciLow: 0.884, ciHigh: 0.900, weight: 32 },
        { name: "Williams et al. (2022)", estimate: 0.841, ciLow: 0.825, ciHigh: 0.857, weight: 24 },
        { name: "Al-Mansoori et al. (2024)", estimate: 0.872, ciLow: 0.855, ciHigh: 0.889, weight: 22 },
        { name: "Larsson et al. (2022)", estimate: 0.838, ciLow: 0.819, ciHigh: 0.857, weight: 22 },
      ],
    },
  },
  {
    name: "2. Deep Neural Architectures & Longitudinal Trajectory Modeling (DNN, LSTM, GCN)",
    recordIds: ["rec-02", "rec-04", "rec-08"],
    summaryProse:
      "Deep learning frameworks excelled at fusing complex multimodal inputs and sequential longitudinal records. Nakamura et al. (2024) developed a multimodal deep neural network integrating 120 SNPs with clinical biomarkers, reaching an AUC-ROC of 0.914 (95% CI 0.901-0.927) and demonstrating that genomic-phenotypic fusion provides a substantial +0.052 AUC improvement over single-modality models. Gomez et al. (2023) demonstrated that Recurrent Neural Networks (LSTM) trained on 5-year annual checkups (AUC 0.885) outperformed static models by capturing longitudinal biomarker trajectories. Zhou et al. (2024) applied Graph Convolutional Networks (GCN) to patient comorbidity graphs (AUC 0.895), capturing interconnected diagnostic risks across hypertension, NAFLD, and PCOS.",
    tableRows: [
      {
        authorYear: "Nakamura et al. (2024)",
        focus: "Multimodal Deep Neural Network (Genomics + Phenotype)",
        keyFinding: "AUC 0.914; +0.052 gain over clinical variables alone with near-perfect calibration.",
        method: "Prospective 7-year cohort combining 120 SNPs and 24 clinical features",
        effectEstimate: "AUC = 0.91 (0.90 - 0.93)",
      },
      {
        authorYear: "Gomez et al. (2023)",
        focus: "LSTM RNN on 5-year longitudinal medical trajectories",
        keyFinding: "AUC 0.885; blood pressure and fasting glucose velocity enhanced 5-year prediction.",
        method: "Longitudinal recurrent neural network on 5 consecutive annual waves",
        effectEstimate: "AUC = 0.89 (0.87 - 0.90)",
      },
      {
        authorYear: "Zhou et al. (2024)",
        focus: "Graph Neural Networks on patient comorbidity networks",
        keyFinding: "AUC 0.895; modeled topological risk clusters (NAFLD, hypertension, PCOS).",
        method: "Heterogeneous bipartite patient-disease graph convolutional network",
        effectEstimate: "AUC = 0.90 (0.88 - 0.91)",
      },
    ],
    references: [
      "Nakamura, S., Tanaka, K., & Yamamoto, H. (2024). Deep Neural Network Architectures for Multimodal Diabetes Onset Prediction Combining Genomic and Phenotypic Features. IEEE Transactions on Biomedical Engineering, 71(2), 512-521.",
      "Gomez, R., Silva, F., Santos, M., & Costa, J. (2023). Longitudinal Trajectory Mining Using Recurrent Neural Networks for 5-Year Diabetes Incidence Forecasting. Lancet Digital Health, 5(8), e510-e519.",
      "Zhou, Y., Qian, X., & Li, T. (2024). Graph Neural Networks for Modeling Comorbidity Interactions in Type 2 Diabetes Risk Prediction. Journal of Biomedical Informatics, 150, 104592.",
    ],
    metaAnalysisData: {
      pooledEstimate: "0.898",
      ci95: "0.886 - 0.910",
      iSquared: "31.4%",
      pVal: "< 0.001",
      heterogeneityInterpretation: "Low-to-moderate heterogeneity (I² = 31.4%) indicating high consistency across deep learning architectures.",
      studies: [
        { name: "Nakamura et al. (2024)", estimate: 0.914, ciLow: 0.901, ciHigh: 0.927, weight: 38 },
        { name: "Gomez et al. (2023)", estimate: 0.885, ciLow: 0.871, ciHigh: 0.899, weight: 32 },
        { name: "Zhou et al. (2024)", estimate: 0.895, ciLow: 0.881, ciHigh: 0.909, weight: 30 },
      ],
    },
  },
  {
    name: "3. Low-Cost Hematological & Primary Care Biomarker Classifiers (SVM, RBF)",
    recordIds: ["rec-06"],
    summaryProse:
      "Fischer et al. (2021) demonstrated that Support Vector Machines with radial basis kernels (SVM-RBF) achieved an AUC of 0.814 (95% CI 0.793-0.835) using routine complete blood count indices and lipid panels. Neutrophil-to-lymphocyte ratio and red blood cell distribution width (RDW) acted as surrogate markers for systemic subclinical inflammation, offering a viable, low-cost screening alternative in resource-constrained settings where specialized HbA1c testing is unavailable.",
    tableRows: [
      {
        authorYear: "Fischer et al. (2021)",
        focus: "SVM classification using complete blood count indices",
        keyFinding: "AUC 0.814; neutrophil-to-lymphocyte ratio and RDW identified impaired glucose tolerance.",
        method: "Support Vector Machines (SVM-RBF) in outpatient clinical setting",
        effectEstimate: "AUC = 0.81 (0.79 - 0.84)",
      },
    ],
    references: [
      "Fischer, B., Schmidt, U., & Weber, K. (2021). Support Vector Machine Classification of Impaired Glucose Tolerance Using Routine Hematological Parameters. BMC Medical Informatics and Decision Making, 21(1), 198.",
    ],
  },
];

export const SAMPLE_GRADE_CERTAINTY: GradeCertaintyItem[] = [
  {
    outcome: "Predictive Discrimination (AUC-ROC) of Gradient Boosted Tree Ensembles (XGBoost, LightGBM)",
    numStudies: 5,
    studyDesign: "Observational cohort studies with external validation (N = 200,000+)",
    riskOfBias: "No serious",
    inconsistency: "No serious",
    indirectness: "No serious",
    imprecision: "No serious",
    publicationBias: "Undetected",
    overallCertainty: "High",
    importance: "Critical",
    summaryOfFindings: "Pooled AUC 0.864 (95% CI 0.850-0.878). Substantially superior to conventional clinical scores (FINDRISC/ADA). High certainty of robust clinical discrimination.",
    explanation: "Pooled AUC 0.864 (95% CI 0.850-0.878). Substantially superior to conventional clinical scores (FINDRISC/ADA). High certainty of robust clinical discrimination.",
  },
  {
    outcome: "Multimodal Deep Learning (Genomic + Phenotypic Feature Fusion) Discrimination Gain",
    numStudies: 3,
    studyDesign: "Prospective cohorts with deep neural network architectures (N = 165,000+)",
    riskOfBias: "No serious",
    inconsistency: "No serious",
    indirectness: "No serious",
    imprecision: "No serious",
    publicationBias: "Undetected",
    overallCertainty: "High",
    importance: "Critical",
    summaryOfFindings: "Pooled AUC 0.898 (95% CI 0.886-0.910). Adding polygenic risk scores and longitudinal EHR trajectories yields consistent discrimination improvement (+0.05 AUC).",
    explanation: "Pooled AUC 0.898 (95% CI 0.886-0.910). Adding polygenic risk scores and longitudinal EHR trajectories yields consistent discrimination improvement (+0.05 AUC).",
  },
  {
    outcome: "Reduction in Unnecessary Confirmatory Diagnostic Blood Draws in Primary Care",
    numStudies: 2,
    studyDesign: "Prospective community screening & Markov decision models",
    riskOfBias: "No serious",
    inconsistency: "No serious",
    indirectness: "No serious",
    imprecision: "Serious",
    publicationBias: "Undetected",
    overallCertainty: "Moderate",
    importance: "Important",
    summaryOfFindings: "Estimated 34% reduction in false-positive diagnostic referrals; ICER $14,250/QALY gained. Downrated for imprecision due to limited real-world health economic trials.",
    explanation: "Estimated 34% reduction in false-positive diagnostic referrals; ICER $14,250/QALY gained. Downrated for imprecision due to limited real-world health economic trials.",
  },
  {
    outcome: "Low-Cost CBC Inflammatory Parameter Diagnostic Accuracy in Resource-Constrained Settings",
    numStudies: 1,
    studyDesign: "Cross-sectional outpatient diagnostic study (N = 9,450)",
    riskOfBias: "Serious",
    inconsistency: "No serious",
    indirectness: "Serious",
    imprecision: "Serious",
    publicationBias: "Suspected",
    overallCertainty: "Low",
    importance: "Important",
    summaryOfFindings: "AUC 0.814 using CBC markers. Downrated for risk of bias (single-center cross-sectional), indirectness of surrogate inflammatory markers, and imprecision.",
    explanation: "AUC 0.814 using CBC markers. Downrated for risk of bias (single-center cross-sectional), indirectness of surrogate inflammatory markers, and imprecision.",
  },
];

export const SAMPLE_SYNTHESIS: SynthesisResult = {
  status: "finalized",
  descriptiveSynthesis: {
    overview:
      "Nine reviewer-included abstracts were mapped to study findings, methods, reported outcomes, and evidence limitations. The records cover tree-based models, neural and graph models, a support-vector classifier, and a decision-analytic screening model. Because the records differ in design, population, outcome definition, and reported metrics, the completed review uses qualitative comparison rather than quantitative pooling.",
    comparisons: [
      {
        recordIds: ["rec-01", "rec-03", "rec-05", "rec-07", "rec-09"],
        findingComparison:
          "The tree-based studies report useful discrimination or screening and implementation signals across EHR, primary-care, community, survival, and decision-model settings.",
        sharedPattern: "All report a model-based approach to early diabetes risk or screening.",
        differences:
          "The populations, outcomes, validation descriptions, and outcome measures are not sufficiently uniform for a single pooled estimate.",
      },
      {
        recordIds: ["rec-02", "rec-04", "rec-08"],
        findingComparison:
          "The deep and graph-model studies report gains from combining longitudinal, genomic, clinical, or comorbidity information.",
        sharedPattern: "Each uses structured high-dimensional or longitudinal information.",
        differences:
          "The input modalities and reported validation details differ across the three records.",
      },
      {
        recordIds: ["rec-06"],
        findingComparison:
          "The support-vector study reports a lower-cost classifier based on routine laboratory indices.",
        sharedPattern: "It addresses risk identification using routinely available clinical data.",
        differences: "Its cross-sectional setting and surrogate signals limit direct comparison with longitudinal prediction studies.",
      },
    ],
  },
  studyEvidence: SAMPLE_CHARACTERISTICS.slice(0, 9).map((study) => ({
    recordId: study.recordId,
    studyLabel: study.authorYear,
    finding: study.keyFinding,
    assignedResearchQuestions: ["RQ1", "RQ2", "RQ3"],
  })),
  subtopics: [
    {
      title: "Tree-based models across clinical and screening settings",
      prose:
        "The included tree-based records report model performance or implementation-related findings across EHR, primary-care, community, survival, and decision-analytic settings. The evidence consistently concerns early risk identification, but the settings and target measures differ enough that the pattern is best interpreted as a recurring direction of evidence rather than a common effect estimate.",
      recordIds: ["rec-01", "rec-03", "rec-05", "rec-07", "rec-09"],
    },
    {
      title: "High-dimensional and longitudinal representation learning",
      prose:
        "The genomic-clinical, longitudinal recurrent, and comorbidity-graph records describe approaches that represent information beyond a single baseline measurement. Together they support a theme of richer representation of patient history, while leaving transportability and implementation questions unresolved in the available abstracts.",
      recordIds: ["rec-02", "rec-04", "rec-08"],
    },
    {
      title: "Routine biomarkers and resource-sensitive screening",
      prose:
        "The routine-laboratory classifier illustrates a complementary theme: models may use accessible biomarkers when specialized testing is constrained. This finding is informative for the review scope but comes from one cross-sectional record and should not be generalized beyond the supplied abstract.",
      recordIds: ["rec-06"],
    },
  ],
  rqFindings: [
    {
      rqId: "RQ1",
      question: SAMPLE_PROTOCOL.primaryResearchQuestions[0],
      synthesizedAnswer:
        "The included abstracts report supervised tree, neural, graph, and support-vector approaches using EHR, clinical, genomic, longitudinal, comorbidity, and routine laboratory inputs. Reported outcomes include discrimination, classification, screening efficiency, cost-effectiveness, and clinical trust.",
      dominantPatterns:
        "The studies generally emphasize model performance using structured clinical or longitudinal information.",
      contradictions:
        "The evidence spans prediction, screening, survival, and decision-analytic outcomes rather than one common endpoint.",
      evidenceGaps:
        "Several records do not describe all validation and implementation details in the available abstract.",
      contributingRecordIds: ["rec-01", "rec-02", "rec-03", "rec-04", "rec-05", "rec-06", "rec-07", "rec-08", "rec-09"],
    },
    {
      rqId: "RQ2",
      question: SAMPLE_PROTOCOL.primaryResearchQuestions[1],
      synthesizedAnswer:
        "Across the records, richer inputs and temporal or relational representations recur as methodological strategies. Differences in setting, population, comparator, follow-up, and reported metric shape the observed results and prevent a direct ranking of model families.",
      dominantPatterns:
        "Model families are adapted to the structure of the data, including trajectories, multimodal inputs, graphs, and routine biomarkers.",
      contradictions:
        "The records differ in design and outcome definition, so apparent performance differences cannot be treated as head-to-head comparisons.",
      evidenceGaps:
        "Transportability, calibration, and real-world utility are not reported consistently across the evidence base.",
      contributingRecordIds: ["rec-01", "rec-02", "rec-03", "rec-04", "rec-05", "rec-06", "rec-07", "rec-08", "rec-09"],
    },
    {
      rqId: "RQ3",
      question: SAMPLE_PROTOCOL.primaryResearchQuestions[2],
      synthesizedAnswer:
        "The main unresolved issues are external validation across diverse settings, consistent calibration and uncertainty reporting, reproducible implementation detail, and prospective evaluation of clinical utility. These gaps limit interpretation beyond the populations and outcomes described in the abstracts.",
      dominantPatterns:
        "Reporting completeness varies across validation, uncertainty, and implementation domains.",
      contradictions:
        "Some records describe independent, multi-site, or practical settings, whereas others provide narrower or indirect evidence.",
      evidenceGaps:
        "The abstract-only workflow cannot establish full-text eligibility, internal validity, or causal effectiveness.",
      contributingRecordIds: ["rec-01", "rec-02", "rec-03", "rec-04", "rec-05", "rec-06", "rec-07", "rec-08", "rec-09"],
    },
  ],
  clusters: [
    {
      title: "Clinical prediction and screening models",
      description: "These records evaluate model-based early risk identification in clinical or community-oriented settings.",
      sharedPattern: "They report prediction or screening outcomes using structured health data.",
      differences: "Cohort design, population, comparator, and reported endpoint differ.",
      recordIds: ["rec-01", "rec-03", "rec-05", "rec-06", "rec-07", "rec-08"],
    },
    {
      title: "Representation-rich models",
      description: "These records use multimodal, longitudinal, or relational representations to model risk.",
      sharedPattern: "They extend beyond a single static feature set.",
      differences: "The representations and validation descriptions are not interchangeable.",
      recordIds: ["rec-02", "rec-04", "rec-08"],
    },
    {
      title: "Implementation and policy-facing evidence",
      description: "These records connect model use with clinician interpretation or screening decisions.",
      sharedPattern: "They address a consequence of deploying or applying prediction.",
      differences: "The records report trust, screening efficiency, or simulation outcomes rather than a shared clinical endpoint.",
      recordIds: ["rec-03", "rec-05", "rec-09"],
    },
  ],
  crossStudySynthesis: {
    overallPatterns:
      "Across the nine included abstracts, machine-learning approaches are repeatedly positioned as ways to represent complex clinical information for earlier diabetes risk identification. The most stable cross-study theme is methodological rather than causal: model inputs and representations are tailored to the data structure, while reported performance and implementation signals remain context-specific.",
    contradictions:
      "The evidence does not support a single best algorithm. Differences in cohort, outcome, comparator, follow-up, and validation mean that reported performance values should not be read as direct head-to-head comparisons.",
    evidenceGaps:
      "External transportability, calibration, uncertainty, reproducibility, and prospective clinical utility are incompletely reported across the available abstracts. The abstract-only workflow also cannot establish full-text eligibility or formal internal validity.",
    implications:
      "The findings support further evidence collection and prospective validation, not a claim that any model is clinically effective across settings.",
  },
  researchGaps: [
    {
      gap: "Inconsistent external validation and transportability reporting",
      evidenceBasis: "Only some abstracts explicitly describe independent, external, or multi-site validation.",
      affectedResearchQuestions: ["RQ2", "RQ3"],
      recordIds: ["rec-01", "rec-02", "rec-03", "rec-04", "rec-05", "rec-06", "rec-07", "rec-08", "rec-09"],
    },
    {
      gap: "Incomplete calibration, uncertainty, and implementation reporting",
      evidenceBasis: "The records emphasize discrimination or model outputs, but these reporting domains are not consistently described.",
      affectedResearchQuestions: ["RQ1", "RQ3"],
      recordIds: ["rec-01", "rec-02", "rec-03", "rec-04", "rec-05", "rec-06", "rec-07", "rec-08", "rec-09"],
    },
    {
      gap: "Limited evidence for prospective clinical utility",
      evidenceBasis: "The available records include prediction studies and a decision model, but do not establish broad real-world effectiveness.",
      affectedResearchQuestions: ["RQ2", "RQ3"],
      recordIds: ["rec-03", "rec-05", "rec-09"],
    },
  ],
  futureResearchAgenda: [
    {
      priority: "Prospective, multi-site validation",
      rationale: "Address the transportability gap across populations and care settings.",
      suggestedApproach: "Predefine target populations, outcomes, calibration measures, and external validation cohorts.",
      linkedGap: "Inconsistent external validation and transportability reporting",
    },
    {
      priority: "Complete reporting of calibration and uncertainty",
      rationale: "Make model outputs interpretable beyond discrimination metrics.",
      suggestedApproach: "Report calibration, uncertainty, missing-data handling, and reproducible evaluation procedures.",
      linkedGap: "Incomplete calibration, uncertainty, and implementation reporting",
    },
    {
      priority: "Prospective clinical-utility evaluation",
      rationale: "Test whether model-supported screening improves care rather than only model performance.",
      suggestedApproach: "Evaluate workflow, patient outcomes, equity, and resource use in appropriately designed prospective studies.",
      linkedGap: "Limited evidence for prospective clinical utility",
    },
  ],
  keyFindingsTable: [
    {
      topic: "Data-adapted model representations",
      summary: "Tree, neural, graph, and support-vector approaches were adapted to different clinical data structures.",
      consistency: "Recurring qualitative theme across nine records",
      evidenceBase: "Nine reviewer-included abstracts",
    },
    {
      topic: "Context-specific reported outcomes",
      summary: "The records report discrimination, classification, screening, trust, or economic outcomes that are not directly interchangeable.",
      consistency: "Consistent limitation across the evidence base",
      evidenceBase: "Nine reviewer-included abstracts",
    },
    {
      topic: "Validation and implementation gaps",
      summary: "External validation, calibration, uncertainty, reproducibility, and clinical utility are incompletely reported.",
      consistency: "Cross-study evidence gap",
      evidenceBase: "Abstract-level reporting assessment",
    },
  ],
  forestPlotEstimates: [],
  pooledEffectEstimate: undefined,
  heterogeneityDiscussion:
    "Study differences are synthesized qualitatively; no statistical pooling or forest plot is produced.",
};

export const SAMPLE_DISCUSSION_SECTIONS: DiscussionSections = {
  item23aGeneralInterpretation:
    "The completed abstract-level review suggests a recurring methodological pattern: machine-learning models are adapted to structured clinical, longitudinal, genomic, relational, or routine laboratory data to support earlier diabetes risk identification. The evidence is informative about reported approaches and outcomes, but it does not establish a single best algorithm or broad clinical effectiveness because the records differ in design, population, comparator, validation, and outcome definition.",
  item23bLimitationsOfEvidence:
    "The evidence base reports heterogeneous outcomes and does not consistently describe calibration, uncertainty, external validation, implementation detail, or reproducibility. The variation in study design and population means that reported performance values should not be interpreted as direct head-to-head comparisons or pooled effects.",
  item23cLimitationsOfReviewProcess:
    "This review is limited to the supplied citation metadata and abstracts. Reviewer-confirmed title/abstract decisions define inclusion in this workflow; full-text retrieval and eligibility assessment were not performed. The review therefore does not claim formal risk-of-bias, certainty, causal, or quantitative meta-analytic conclusions.",
  item23dImplications:
    "The findings support prospective, multi-site validation with complete calibration and uncertainty reporting, followed by clinical-utility evaluation that measures workflow, patient, equity, and resource outcomes. They do not by themselves justify deployment or claims of effectiveness across settings.",
};

// Aliases for convenient importing
export const sampleProtocol = SAMPLE_PROTOCOL;
export const sampleRecords = SAMPLE_RECORDS;
export const sampleScreening = SAMPLE_SCREENING;
export const sampleCharacteristics = SAMPLE_CHARACTERISTICS;
export const sampleReportingAssessments = SAMPLE_REPORTING_ASSESSMENTS;
export const sampleRiskOfBias = SAMPLE_RISK_OF_BIAS;
export const sampleSynthesis = SAMPLE_SYNTHESIS;
export const sampleGradeItems = SAMPLE_GRADE_CERTAINTY;
export const sampleDiscussion = SAMPLE_DISCUSSION_SECTIONS;

