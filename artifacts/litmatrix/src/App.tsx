import React, { useState, useEffect, useMemo } from "react";
import {
  SLRProtocol,
  SLRRecord,
  ScreeningDecision,
  StudyCharacteristic,
  AbstractReportingAssessment,
  SynthesisResult,
  DiscussionSections,
} from "./types/slr";
import {
  sampleProtocol,
  sampleRecords,
  sampleScreening,
  sampleCharacteristics,
  sampleReportingAssessments,
  sampleSynthesis,
  sampleDiscussion,
  BLANK_PROTOCOL,
} from "./data/sampleDataset";

import MethodsProtocol from "./components/MethodsProtocol";
import TopicStrategy from "./components/TopicStrategy";
import SearchStringsGenerator from "./components/SearchStringsGenerator";
import RecordsImport from "./components/RecordsImport";
import ScreeningSection from "./components/ScreeningSection";
import PrismaDiagram from "./components/PrismaDiagram";
import EvidenceSynthesisStage, { EvidenceSynthesisPhase } from "./components/EvidenceSynthesisStage";
import DiscussionSection from "./components/DiscussionSection";
import FullReviewReport from "./components/FullReviewReport";
import ApiKeySection from "./components/ApiKeySection";
import {
  normalizePersistedSynthesis,
  QUALITATIVE_SYNTHESIS_GUARD,
} from "./utils/synthesisState";

import {
  UserAIKeysConfig,
  DEFAULT_AI_KEYS_CONFIG,
  getActiveAIConfig,
  SupportedAIProvider,
  isOpenRouterApiKey,
  OPENROUTER_DEFAULT_BASE,
} from "./utils/aiClient";

import {
  FileSpreadsheet,
  Search,
  UploadCloud,
  CheckCircle,
  GitBranch,
  BarChart2,
  BookOpen,
  FileText,
  Sparkles,
  ChevronRight,
  Menu,
  X,
  RotateCcw,
  Check,
  Key,
  FilePlus,
} from "lucide-react";

export default function App() {
  // Navigation State
  const [activeStage, setActiveStage] = useState<number>(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Application data states. New workspaces start blank; demonstration content is opt-in.
  const [protocol, setProtocol] = useState<SLRProtocol>(() => {
    const saved = localStorage.getItem("slr_protocol_v1");
    return saved ? JSON.parse(saved) : BLANK_PROTOCOL;
  });

  const [records, setRecords] = useState<SLRRecord[]>(() => {
    const saved = localStorage.getItem("slr_records_v1");
    return saved ? JSON.parse(saved) : [];
  });

  const [dupesRemoved, setDupesRemoved] = useState<number>(() => {
    const saved = localStorage.getItem("slr_dupes_v1");
    return saved ? JSON.parse(saved) : 0;
  });

  const [screening, setScreening] = useState<Record<string, ScreeningDecision>>(() => {
    const saved = localStorage.getItem("slr_screening_v1");
    if (!saved) return {};

    try {
      const parsed = JSON.parse(saved) as Record<string, ScreeningDecision>;
      return Object.fromEntries(
        Object.entries(parsed).map(([recordId, decision]) => {
          if (decision?.agreed !== undefined) return [recordId, decision];
          if (decision?.recommendation === "include") {
            return [recordId, { ...decision, agreed: true, decision: "include" }];
          }
          if (decision?.recommendation === "exclude") {
            return [recordId, { ...decision, agreed: false, decision: "exclude" }];
          }
          if (decision?.recommendation === "maybe") {
            return [
              recordId,
              {
                ...decision,
                recommendation: "exclude",
                decision: "exclude",
                agreed: false,
                exclusionReason: decision.exclusionReason || "Insufficient evidence in record",
              },
            ];
          }
          return [recordId, decision];
        })
      );
    } catch {
      return {};
    }
  });

  const [characteristics, setCharacteristics] = useState<StudyCharacteristic[]>(() => {
    const saved = localStorage.getItem("slr_chars_v1");
    return saved ? JSON.parse(saved) : [];
  });

  const [reportingAssessments, setReportingAssessments] = useState<AbstractReportingAssessment[]>(() => {
    const saved = localStorage.getItem("slr_reporting_appraisal_v1");
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  });

  const [synthesis, setSynthesis] = useState<SynthesisResult>(() => {
    const saved = localStorage.getItem("slr_synthesis_v1");
    const parsed = saved ? JSON.parse(saved) : {};
    return normalizePersistedSynthesis(parsed);
  });

  const [discussion, setDiscussion] = useState<DiscussionSections>(() => {
    const saved = localStorage.getItem("slr_discussion_v1");
    return saved ? JSON.parse(saved) : sampleDiscussion;
  });

  const [keysConfig, setKeysConfig] = useState<UserAIKeysConfig>(() => {
    const saved = localStorage.getItem("slr_ai_keys_v1");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const merged: UserAIKeysConfig = {
          ...DEFAULT_AI_KEYS_CONFIG,
          ...parsed,
          openai: { ...DEFAULT_AI_KEYS_CONFIG.openai, ...(parsed.openai || {}) },
          claude: { ...DEFAULT_AI_KEYS_CONFIG.claude, ...(parsed.claude || {}) },
          gemini: { ...DEFAULT_AI_KEYS_CONFIG.gemini, ...(parsed.gemini || {}) },
          emergent: { ...DEFAULT_AI_KEYS_CONFIG.emergent, ...(parsed.emergent || {}) },
          replit: { ...DEFAULT_AI_KEYS_CONFIG.replit, ...(parsed.replit || {}) },
          other: { ...DEFAULT_AI_KEYS_CONFIG.other, ...(parsed.other || {}) },
        };

        // One-time migration for browsers that previously auto-selected a saved
        // OpenRouter or direct-provider key. Preserve optional keys, but restore
        // the built-in managed provider as the default.
        const managedDefaultMigrationKey = "slr_managed_ai_default_v1";
        if (!localStorage.getItem(managedDefaultMigrationKey)) {
          merged.activeProvider = "replit-managed";
          localStorage.setItem(managedDefaultMigrationKey, "complete");
          return merged;
        }

        // Migrate configurations saved before direct-provider keys auto-selected
        // themselves. An OpenRouter key is always authoritative, even if it
        // was previously pasted into another provider card.
        const openRouterSource = (
          ["other", "openai", "claude", "gemini", "emergent", "replit"] as const
        ).find((provider) => isOpenRouterApiKey(merged[provider].apiKey));
        if (openRouterSource) {
          merged.other = {
            ...merged.other,
            apiKey: merged[openRouterSource].apiKey,
            model: merged.other.model?.includes("/")
              ? merged.other.model
              : merged[openRouterSource].model?.includes("/")
              ? merged[openRouterSource].model
              : "openai/gpt-4o-mini",
            customBase: OPENROUTER_DEFAULT_BASE,
          };
          merged.activeProvider = "other";
        } else if (merged.activeProvider === "server-gemini" || !merged.activeProvider) {
          const configuredProvider = (
            ["other", "openai", "claude", "gemini", "emergent", "replit"] as const
          ).find((provider) => Boolean(merged[provider].apiKey?.trim()));
          if (configuredProvider) {
            merged.activeProvider = configuredProvider as SupportedAIProvider;
          } else {
            merged.activeProvider = "replit-managed";
          }
        } else if (
          merged.activeProvider !== "replit-managed" &&
          !merged[merged.activeProvider]?.apiKey?.trim()
        ) {
          merged.activeProvider = "replit-managed";
        }

        return merged;
      } catch {
        return DEFAULT_AI_KEYS_CONFIG;
      }
    }
    return DEFAULT_AI_KEYS_CONFIG;
  });

  // Local storage persistence effects
  useEffect(() => {
    localStorage.setItem("slr_protocol_v1", JSON.stringify(protocol));
  }, [protocol]);

  useEffect(() => {
    localStorage.setItem("slr_records_v1", JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem("slr_dupes_v1", JSON.stringify(dupesRemoved));
  }, [dupesRemoved]);

  useEffect(() => {
    localStorage.setItem("slr_screening_v1", JSON.stringify(screening));
  }, [screening]);

  useEffect(() => {
    localStorage.setItem("slr_chars_v1", JSON.stringify(characteristics));
  }, [characteristics]);

  useEffect(() => {
    localStorage.setItem("slr_reporting_appraisal_v1", JSON.stringify(reportingAssessments));
  }, [reportingAssessments]);

  useEffect(() => {
    localStorage.setItem("slr_synthesis_v1", JSON.stringify(synthesis));
  }, [synthesis]);

  useEffect(() => {
    localStorage.setItem("slr_discussion_v1", JSON.stringify(discussion));
  }, [discussion]);

  useEffect(() => {
    localStorage.setItem("slr_ai_keys_v1", JSON.stringify(keysConfig));
  }, [keysConfig]);

  const activeAIConfig = useMemo(() => {
    return getActiveAIConfig(keysConfig);
  }, [keysConfig]);

  // AI-finalized title/abstract decisions define final inclusion for this
  // abstract-based review workflow.
  const includedRecords = useMemo(() => {
    return records.filter((r) => screening[r.id]?.agreed === true);
  }, [records, screening]);

  // Derived excluded records
  const excludedRecords = useMemo(() => {
    return records.filter((r) => screening[r.id]?.agreed === false);
  }, [records, screening]);

  // Exclusion reasons breakdown for PRISMA Item 16b
  const exclusionReasonsBreakdown = useMemo(() => {
    const acc: Record<string, number> = {};
    excludedRecords.forEach((r) => {
      const reason = screening[r.id]?.exclusionReason || "Wrong study design";
      acc[reason] = (acc[reason] || 0) + 1;
    });
    return acc;
  }, [excludedRecords, screening]);

  // PRISMA flow counts are derived from the current record library and recorded
  // AI decisions. A record can be present in the library before screening,
  // so deduplicated and screened counts must remain separate.
  const prismaCounts = useMemo(() => {
    const totalIdentified = records.length + (dupesRemoved || 0);
    const screenedCount = records.filter((r) => screening[r.id]?.agreed !== undefined).length;
    const recordsNotScreenedCount = Math.max(records.length - screenedCount, 0);
    const screenedExcludedCount = excludedRecords.length;
    const includedCount = includedRecords.length;
    const uploadedSourceNames = Array.from(
      new Set(
        records.flatMap((record) => {
          const sources =
            record.databaseSources && record.databaseSources.length > 0
              ? record.databaseSources
              : record.databaseSource
              ? [record.databaseSource]
              : [];
          return sources.flatMap((source) =>
            source
              .split(",")
              .map((value) => value.trim())
              .filter(Boolean)
          );
        })
      )
    );

    return {
      identifiedDb: totalIdentified,
      identifiedOther: 0,
      identifiedDbSources: uploadedSourceNames,
      identifiedOtherSources: [],
      duplicatesRemoved: dupesRemoved || 0,
      recordsAfterDuplicatesRemoved: records.length,
      screened: screenedCount,
      recordsNotScreened: recordsNotScreenedCount,
      screenedExcluded: screenedExcludedCount,
      exclusionReasonsBreakdown,
      included: includedCount,
    };
  }, [
    records,
    screening,
    dupesRemoved,
    includedRecords,
    excludedRecords,
    exclusionReasonsBreakdown,
  ]);

  // Reset to full sample dataset
  const handleResetSample = () => {
    if (window.confirm("Reload complete PRISMA 2020 systematic review dataset (Type 2 Diabetes demo)?")) {
      setProtocol(sampleProtocol);
      setRecords(sampleRecords);
      setDupesRemoved(284);
      setScreening(sampleScreening);
      setCharacteristics(sampleCharacteristics);
      setReportingAssessments(sampleReportingAssessments);
      setSynthesis({
        ...sampleSynthesis,
        status: "finalized",
      });
      setDiscussion(sampleDiscussion);
    }
  };

  // Reset to clean blank review
  const handleStartBlankReview = () => {
    if (
      window.confirm(
        "Start a blank review? This will clear all records, screening decisions, characteristics, abstract reporting appraisals, and reset the protocol template for your own research topic."
      )
    ) {
      setProtocol(BLANK_PROTOCOL);
      setRecords([]);
      setDupesRemoved(0);
      setScreening({});
      setCharacteristics([]);
      setReportingAssessments([]);
      setSynthesis({
        status: undefined,
        descriptiveSynthesis: undefined,
        studyEvidence: [],
        subtopics: [],
        clusters: [],
        rqFindings: [],
        crossStudySynthesis: undefined,
        researchGaps: [],
        futureResearchAgenda: [],
        keyFindingsTable: [],
        forestPlotEstimates: [],
        pooledEffectEstimate: undefined,
        heterogeneityDiscussion: QUALITATIVE_SYNTHESIS_GUARD,
      });
      setDiscussion({
        item23aGeneralInterpretation: "",
        item23bLimitationsOfEvidence: "",
        item23cLimitationsOfReviewProcess: "",
        item23dImplications: "",
      });
    }
  };

  // Keep downstream stages aligned without manufacturing screening or analysis results.
  const handleAutoSyncAllStagesFromRecords = (customRecordsList?: SLRRecord[]) => {
    const targetRecords = customRecordsList || records;
    if (targetRecords.length === 0) {
      alert("No records available to synchronize. Please upload or import bibliographic records first.");
      return;
    }

    const recordIds = new Set(targetRecords.map((record) => record.id));
    setScreening((current) =>
      Object.fromEntries(Object.entries(current).filter(([recordId]) => recordIds.has(recordId)))
    );
    setCharacteristics((current) => current.filter((item) => recordIds.has(item.recordId)));
    setReportingAssessments((current) => current.filter((item) => recordIds.has(item.recordId)));
    setSynthesis({
      status: undefined,
      descriptiveSynthesis: undefined,
      studyEvidence: [],
      subtopics: [],
      clusters: [],
      rqFindings: [],
      crossStudySynthesis: undefined,
      researchGaps: [],
      futureResearchAgenda: [],
      keyFindingsTable: [],
      forestPlotEstimates: [],
      pooledEffectEstimate: undefined,
      heterogeneityDiscussion: QUALITATIVE_SYNTHESIS_GUARD,
    });
    setDiscussion({
      item23aGeneralInterpretation: "",
      item23bLimitationsOfEvidence: "",
      item23cLimitationsOfReviewProcess: "",
      item23dImplications: "",
    });
    alert("Records synchronized. Unscreened records remain pending; no inclusion, appraisal, or synthesis results were generated.");
  };

  // Navigation stages for the review workflow.
  const stages = [
    {
      id: "ai-keys",
      label: "AI Providers & API Keys",
      badge: "OpenAI, Claude, Gemini",
      icon: Key,
    },
    {
      id: "protocol",
      label: "Topic Strategy & Protocol",
      badge: "Items 4, 5, 8–15",
      icon: FileSpreadsheet,
    },
    {
      id: "search",
      label: "Search Strings & Sources",
      badge: "Items 6 & 7",
      icon: Search,
    },
    {
      id: "import",
      label: "Records & Deduplication",
      badge: "Items 6 & 16a",
      icon: UploadCloud,
    },
    {
      id: "screening",
      label: "Study Selection & Eligibility Criteria",
      badge: "Item 5 · Items 8, 16a–b",
      icon: CheckCircle,
    },
    {
      id: "diagram",
      label: "PRISMA Flow Diagram",
      badge: "Item 16a",
      icon: GitBranch,
    },
    { id: "descriptive", label: "Descriptive Synthesis", badge: "Study → Finding", icon: BarChart2 },
    { id: "thematic", label: "Thematic Synthesis", badge: "Pattern → Theme", icon: BarChart2 },
    { id: "clusters", label: "Cluster Analysis", badge: "Related Evidence", icon: BarChart2 },
    { id: "cross-study", label: "Cross-study Evidence Synthesis", badge: "Items 13a–f", icon: BarChart2 },
    { id: "gaps", label: "Research Gap Analysis", badge: "Evidence Gaps", icon: BarChart2 },
    { id: "agenda", label: "Future Research Agenda", badge: "Research Priorities", icon: BarChart2 },
    {
      id: "discussion",
      label: "Discussion & Interpretation",
      badge: "Items 23a–23d",
      icon: BookOpen,
    },
    {
      id: "manuscript",
      label: "Consolidated Manuscript",
      badge: "Full Report",
      icon: FileText,
    },
  ];

  return (
    <div id="prisma-workbench-root" className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Application Bar */}
      <header className="bg-white text-slate-900 border-b border-slate-200 px-4 py-3 sm:px-6 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
                <GitBranch className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base tracking-tight text-slate-900">
                    PRISMA 2020 Workbench
                  </span>
                </div>
                <p className="text-xs text-slate-500 hidden sm:block truncate max-w-md">
                  {protocol.title || "Systematic Literature Review Assistant"}
                </p>
              </div>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleStartBlankReview}
              title="Start a fresh blank systematic review"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900 border border-slate-200 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <FilePlus className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline">New Review</span>
            </button>

            <button
              onClick={handleResetSample}
              title="Reset to PRISMA Diabetes Sample Dataset"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden md:inline">Load Demo</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace with Sidebar */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* Left Navigation Sidebar */}
        <aside
          className={`fixed lg:sticky top-[57px] left-0 z-20 h-[calc(100vh-57px)] w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
            mobileNavOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Stages List Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              PRISMA 2020 Workflow
            </span>
            <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
              14 Stages
            </span>
          </div>

          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {stages.map((stage, idx) => {
              const Icon = stage.icon;
              const isActive = activeStage === idx;
              return (
                <button
                  key={stage.id}
                  onClick={() => {
                    setActiveStage(idx);
                    setMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all cursor-pointer ${
                    isActive
                      ? "bg-indigo-50 text-indigo-950 font-semibold border border-indigo-100/80 shadow-2xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? "text-indigo-600" : "text-slate-400"
                      }`}
                    />
                    <div className="truncate">
                      <div className={`text-xs truncate ${isActive ? "font-semibold text-indigo-950" : "text-slate-700"}`}>{stage.label}</div>
                      <div
                        className={`text-[10px] font-mono ${
                          isActive ? "text-indigo-600 font-medium" : "text-slate-400"
                        }`}
                      >
                        {stage.badge}
                      </div>
                    </div>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/70">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Included Studies:</span>
              <strong className="text-emerald-700 font-mono font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{includedRecords.length} studies</strong>
            </div>
            <div className="flex items-center justify-between text-xs mt-2">
              <span className="text-slate-500 font-medium">Total Records:</span>
              <strong className="text-slate-700 font-mono">{records.length} records</strong>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Stage 1: AI Providers & API Keys */}
          {activeStage === 0 && (
            <ApiKeySection
              keysConfig={keysConfig}
              onUpdateKeysConfig={setKeysConfig}
              onContinueToNext={() => setActiveStage(1)}
            />
          )}

          {/* Stage 2: Protocol & PICO Objectives */}
          {activeStage === 1 && (
            <div className="space-y-6">
              <TopicStrategy
                protocol={protocol}
                onUpdateProtocol={setProtocol}
                aiConfig={activeAIConfig}
                onContinueToSearch={() => setActiveStage(2)}
              />
              <MethodsProtocol
                protocol={protocol}
                onUpdateProtocol={setProtocol}
                aiConfig={activeAIConfig}
              />
            </div>
          )}

          {/* Stage 3: Information Sources & Search Strings */}
          {activeStage === 2 && (
            <SearchStringsGenerator
              protocol={protocol}
              onUpdateProtocol={setProtocol}
              aiConfig={activeAIConfig}
            />
          )}

          {/* Stage 4: Records Import & Deduplication */}
          {activeStage === 3 && (
            <RecordsImport
              records={records}
              onUpdateRecords={setRecords}
              dupesRemoved={dupesRemoved}
              onUpdateDupesRemoved={setDupesRemoved}
              onLoadSample={handleResetSample}
              onStartBlankReview={handleStartBlankReview}
              onAutoSyncAllStagesFromRecords={handleAutoSyncAllStagesFromRecords}
            />
          )}

          {/* Stage 5: Study Selection & Eligibility Criteria */}
          {activeStage === 4 && (
            <ScreeningSection
              records={records}
              screening={screening}
              onUpdateScreening={setScreening}
              protocol={protocol}
              aiConfig={activeAIConfig}
            />
          )}

          {/* Stage 6: PRISMA 2020 Flow Diagram */}
          {activeStage === 5 && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs">
                <div className="font-mono text-[10px] text-indigo-600 uppercase tracking-wider font-bold">
                  PRISMA 2020 Item 16a
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-1">
                  PRISMA 2020 Flow Diagram Generator
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Abstract-based flow of records through identification, title/abstract screening, and AI-finalized inclusion, with SVG and high-resolution PNG download.
                </p>
              </div>

              <PrismaDiagram counts={prismaCounts} />
            </div>
          )}

          {(["descriptive", "thematic", "clusters", "cross-study", "gaps", "agenda"] as EvidenceSynthesisPhase[]).map(
            (phase, index) =>
              activeStage === 6 + index && (
                <React.Fragment key={phase}>
                  <EvidenceSynthesisStage
                    phase={phase}
                    synthesis={synthesis}
                    onUpdateSynthesis={setSynthesis}
                    includedRecords={includedRecords}
                    characteristics={characteristics}
                    protocol={protocol}
                    aiConfig={activeAIConfig}
                    onNavigateToScreening={() => setActiveStage(4)}
                  />
                </React.Fragment>
              )
          )}

          {/* Stage 13: Discussion */}
          {activeStage === 12 && (
            <DiscussionSection
              discussion={discussion}
              onUpdateDiscussion={setDiscussion}
              protocol={protocol}
              synthesis={synthesis}
              aiConfig={activeAIConfig}
              includedRecords={includedRecords}
              characteristics={characteristics}
            />
          )}

          {/* Stage 14: Consolidated Manuscript */}
          {activeStage === 13 && (
            <FullReviewReport
              protocol={protocol}
              includedRecords={includedRecords}
              characteristics={characteristics}
              reportingAssessments={reportingAssessments}
              synthesis={synthesis}
              discussion={discussion}
              counts={prismaCounts}
              aiConfig={activeAIConfig}
            />
          )}

        </main>
      </div>
    </div>
  );
}
