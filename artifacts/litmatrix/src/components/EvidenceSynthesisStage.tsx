import React, { useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Layers, Sparkles } from "lucide-react";
import { SLRProtocol, SLRRecord, StudyCharacteristic, SynthesisResult } from "../types/slr";
import { callAI, parseJSONLoose } from "../utils/aiClient";
import { QUALITATIVE_SYNTHESIS_GUARD } from "../utils/synthesisState";

export type EvidenceSynthesisPhase =
  | "descriptive"
  | "thematic"
  | "clusters"
  | "cross-study"
  | "gaps"
  | "agenda";

interface Props {
  phase: EvidenceSynthesisPhase;
  synthesis: SynthesisResult;
  onUpdateSynthesis: (value: SynthesisResult) => void;
  includedRecords: SLRRecord[];
  characteristics: StudyCharacteristic[];
  protocol: SLRProtocol;
  aiConfig: any;
  onNavigateToScreening?: () => void;
}

const phaseMeta: Record<EvidenceSynthesisPhase, { step: string; title: string; description: string }> = {
  descriptive: {
    step: "Evidence Synthesis 1 of 6",
    title: "Descriptive Synthesis",
    description: "Map each included abstract to its finding, then compare what was studied and reported.",
  },
  thematic: {
    step: "Evidence Synthesis 2 of 6",
    title: "Thematic Synthesis",
    description: "Group recurring findings into traceable, evidence-grounded themes.",
  },
  clusters: {
    step: "Evidence Synthesis 3 of 6",
    title: "Cluster Analysis",
    description: "Organize related studies by shared patterns while preserving important differences.",
  },
  "cross-study": {
    step: "Evidence Synthesis 4 of 6",
    title: "Cross-study Evidence Synthesis",
    description: "Answer each research question and integrate patterns across the complete evidence base.",
  },
  gaps: {
    step: "Evidence Synthesis 5 of 6",
    title: "Research Gap Analysis",
    description: "Identify gaps only where the included evidence is absent, weak, inconsistent, or underreported.",
  },
  agenda: {
    step: "Evidence Synthesis 6 of 6",
    title: "Future Research Agenda",
    description: "Translate evidence-grounded gaps into cautious, prioritized directions for future research.",
  },
};

export default function EvidenceSynthesisStage({
  phase,
  synthesis,
  onUpdateSynthesis,
  includedRecords,
  characteristics,
  protocol,
  aiConfig,
  onNavigateToScreening,
}: Props) {
  const [generating, setGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const meta = phaseMeta[phase];
  const researchQuestions = (protocol.primaryResearchQuestions || []).filter((item) => item.trim());
  const recordById = new Map(includedRecords.map((record) => [record.id, record]));

  const evidenceRows = characteristics.length
    ? characteristics.map((study) => ({
        recordId: study.recordId,
        studyLabel: study.authorYear,
        category: study.category || "Uncategorized evidence",
        focus: study.interventionOrFocus?.slice(0, 240) || "Not reported",
        outcome: study.primaryOutcome?.slice(0, 240) || "Not reported",
        design: study.studyDesign?.slice(0, 160) || "Not reported",
        finding: study.keyFinding?.slice(0, 650) || "Not reported",
        sourceAbstract: recordById.get(study.recordId)?.abstract || "",
      }))
    : includedRecords.map((record) => ({
        recordId: record.id,
        studyLabel: `${record.authors[0]?.split(",")[0] || "Author"} et al. (${record.year || "Year not reported"})`,
        category: "Uncategorized evidence",
        focus: record.title,
        outcome: "Not reported",
        design: "Not yet extracted from the complete abstract",
        finding: "Structured extraction is pending for this record.",
        sourceAbstract: record.abstract || "",
      }));

  const createEvidenceMap = (clearError = true) => {
    const byCategory = new Map<string, typeof evidenceRows>();
    evidenceRows.forEach((row) => byCategory.set(row.category, [...(byCategory.get(row.category) || []), row]));
    onUpdateSynthesis({
      ...synthesis,
      status: "evidence_map",
      studyEvidence: evidenceRows.map((row) => ({
        recordId: row.recordId,
        studyLabel: row.studyLabel,
        finding: row.finding,
        assignedResearchQuestions: [],
      })),
       descriptiveSynthesis: {
         overview: `${evidenceRows.length} included abstracts are mapped for comparison. Cross-study patterns require finalized synthesis.`,
        comparisons: [],
      },
      subtopics: Array.from(byCategory.entries()).map(([title, rows]) => ({
        title,
        prose: `${rows.length} included abstract${rows.length === 1 ? "" : "s"} contribute to this provisional group.`,
        recordIds: rows.map((row) => row.recordId),
      })),
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
    if (clearError) setErrorMessage(null);
  };

  const generateEvidenceChain = async () => {
    if (!evidenceRows.length) return;
    setGenerating(true);
    setErrorMessage(null);
    const prompt = `Produce one coherent qualitative evidence-synthesis chain from reviewer-included citation records and abstracts.

Research questions:
${researchQuestions.map((question, index) => `RQ${index + 1}: ${question.replace(/^RQ\\d+:\\s*/i, "")}`).join("\n")}

Study evidence. The sourceAbstract field contains each complete abstract and is the authoritative evidence source; extracted fields are only an aid:
${JSON.stringify(evidenceRows)}

Required reasoning chain: Study -> finding -> comparison -> pattern -> theme -> overall conclusion -> research gaps -> future research agenda.

Rules:
1. Use only supplied evidence. Treat "Not reported" as missing information, not as an evidence-quality deficiency.
2. Results state what studies found. Do not invent methods, outcomes, causal effects, numbers, or full-text evidence.
3. Discussion-style meaning and recommendations belong only in implications and the future agenda.
4. Use exact supplied recordIds in comparisons, themes, clusters, RQ findings, and gaps.
5. Return one entry for every RQ. State insufficient evidence where necessary.
6. Keep every prose field under 90 words.
7. Do not produce GRADE ratings, pooled effects, p-values, confidence intervals, heterogeneity statistics, meta-analysis, or forest-plot data.

Return ONLY compact JSON:
{
  "descriptiveSynthesis": {
    "overview": "Descriptive overview of included evidence",
    "comparisons": [{"recordIds":["id"],"findingComparison":"What findings report","sharedPattern":"Shared pattern","differences":"Important differences"}]
  },
  "subtopics": [{"title":"Theme","prose":"Thematic synthesis","recordIds":["id"]}],
  "clusters": [{"title":"Cluster","description":"Why these studies cluster","sharedPattern":"Shared pattern","differences":"Differences within cluster","recordIds":["id"]}],
  "rqFindings": [{"rqId":"RQ1","question":"Exact question","synthesizedAnswer":"What studies found","dominantPatterns":"Patterns","contradictions":"Contradictions","evidenceGaps":"Gaps","contributingRecordIds":["id"]}],
  "crossStudySynthesis": {"overallPatterns":"Integrated patterns","contradictions":"Cross-cutting contradictions","evidenceGaps":"Principal gaps","implications":"Evidence-bounded meaning"},
  "researchGaps": [{"gap":"Specific gap","evidenceBasis":"Why the included evidence demonstrates this gap","affectedResearchQuestions":["RQ1"],"recordIds":["id"]}],
  "futureResearchAgenda": [{"priority":"Priority","rationale":"Why it follows from the evidence","suggestedApproach":"Cautious research direction","linkedGap":"Matching gap"}]
}`;

    try {
      const text = await callAI(
        prompt,
        "You are a domain-agnostic qualitative systematic-review methodologist. Return complete compact JSON only.",
        aiConfig,
        6500
      );
      const raw = parseJSONLoose(text);
      const parsed = raw?.synthesis || raw;
      const expectedRqIds = researchQuestions.map((_, index) => `RQ${index + 1}`);
      const complete =
        parsed?.descriptiveSynthesis?.overview &&
        Array.isArray(parsed?.subtopics) &&
        parsed.subtopics.length > 0 &&
        Array.isArray(parsed?.clusters) &&
        parsed.clusters.length > 0 &&
        Array.isArray(parsed?.rqFindings) &&
        expectedRqIds.every((rqId) => parsed.rqFindings.some((item: any) => item?.rqId === rqId)) &&
        parsed?.crossStudySynthesis?.overallPatterns &&
        Array.isArray(parsed?.researchGaps) &&
        Array.isArray(parsed?.futureResearchAgenda);
      if (!complete) throw new Error("The AI response did not contain the complete six-stage evidence chain.");

      const studyEvidence = evidenceRows.map((row) => ({
        recordId: row.recordId,
        studyLabel: row.studyLabel,
        finding: row.finding,
        assignedResearchQuestions: parsed.rqFindings
          .filter((item: any) => item.contributingRecordIds?.includes(row.recordId))
          .map((item: any) => item.rqId),
      }));
      onUpdateSynthesis({
        ...synthesis,
        status: "finalized",
        studyEvidence,
        descriptiveSynthesis: parsed.descriptiveSynthesis,
        subtopics: parsed.subtopics,
        clusters: parsed.clusters,
        rqFindings: parsed.rqFindings,
        crossStudySynthesis: parsed.crossStudySynthesis,
        researchGaps: parsed.researchGaps,
        futureResearchAgenda: parsed.futureResearchAgenda,
        keyFindingsTable: parsed.subtopics.map((theme: any) => ({
          topic: theme.title,
          summary: theme.prose,
          consistency: "Synthesized qualitatively",
          evidenceBase: `${theme.recordIds?.length || 0} contributing records`,
        })),
        forestPlotEstimates: [],
        pooledEffectEstimate: undefined,
        heterogeneityDiscussion: QUALITATIVE_SYNTHESIS_GUARD,
      });
    } catch (error: any) {
      createEvidenceMap(false);
      setErrorMessage(`${error.message || "Evidence synthesis failed"} A traceable evidence map was preserved; retry to finalize the chain.`);
    } finally {
      setGenerating(false);
    }
  };

  if (!evidenceRows.length) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
        <h2 className="font-bold text-amber-950">No included evidence is available</h2>
        <p className="text-xs text-amber-800">Confirm title and abstract screening decisions before synthesis.</p>
        {onNavigateToScreening && <button onClick={onNavigateToScreening} className="px-4 py-2 rounded-lg bg-amber-700 text-white text-xs font-mono">Go to Screening</button>}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="rounded-xl bg-slate-950 text-white p-6 space-y-4">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-indigo-300">{meta.step}</div>
            <h2 className="text-2xl font-bold mt-1">{meta.title}</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">{meta.description}</p>
          </div>
          <button onClick={generateEvidenceChain} disabled={generating} className="self-start flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-mono font-bold disabled:bg-slate-600">
            <Sparkles className="w-4 h-4" />{generating ? "Synthesizing complete chain..." : synthesis.status === "finalized" ? "Regenerate Evidence Chain" : "Generate Evidence Chain"}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-300">
          {["Study", "Finding", "Comparison", "Pattern", "Theme", "Overall conclusion"].map((item, index) => <React.Fragment key={item}><span className="rounded bg-white/10 px-2 py-1">{item}</span>{index < 5 && <ArrowRight className="w-3 h-3" />}</React.Fragment>)}
        </div>
      </header>

      {errorMessage && <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900">{errorMessage}</div>}
      <div className={`rounded-xl border p-4 text-xs flex items-center gap-2 ${synthesis.status === "finalized" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-white text-slate-600"}`}>
        {synthesis.status === "finalized" ? <CheckCircle2 className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
        {synthesis.status === "finalized" ? "Complete evidence chain finalized and available to Discussion and Manuscript." : "This page is awaiting a finalized evidence chain."}
      </div>
      <div role="note" className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-xs text-indigo-950">
        {QUALITATIVE_SYNTHESIS_GUARD}
      </div>

      {phase === "descriptive" && <div className="space-y-4">
        <EvidenceCard title="Evidence-base overview" text={synthesis.descriptiveSynthesis?.overview} />
        {(synthesis.studyEvidence || []).map((item) => <div key={item.recordId}><EvidenceCard title={item.studyLabel} text={item.finding} tags={item.assignedResearchQuestions} /></div>)}
        {(synthesis.descriptiveSynthesis?.comparisons || []).map((item, index) => <div key={index}><EvidenceCard title={`Comparison ${index + 1}`} text={item.findingComparison} details={[["Shared pattern", item.sharedPattern], ["Differences", item.differences]]} tags={item.recordIds} /></div>)}
      </div>}
      {phase === "thematic" && <CardList items={(synthesis.subtopics || []).map((item) => ({ title: item.title, text: item.prose, tags: item.recordIds }))} empty="Generate the evidence chain to create thematic synthesis." />}
      {phase === "clusters" && <CardList items={(synthesis.clusters || []).map((item) => ({ title: item.title, text: item.description, tags: item.recordIds, details: [["Shared pattern", item.sharedPattern], ["Differences", item.differences]] }))} empty="Generate the evidence chain to create study clusters." />}
      {phase === "cross-study" && <div className="space-y-4">
        <CardList items={(synthesis.rqFindings || []).map((item) => ({ title: `${item.rqId}: ${item.question}`, text: item.synthesizedAnswer, tags: item.contributingRecordIds, details: [["Dominant patterns", item.dominantPatterns], ["Contradictions", item.contradictions], ["Evidence gaps", item.evidenceGaps]] }))} empty="Generate the evidence chain to answer the research questions." />
        {synthesis.crossStudySynthesis && <EvidenceCard title="Integrated cross-study conclusion" text={synthesis.crossStudySynthesis.overallPatterns} details={[["Contradictions", synthesis.crossStudySynthesis.contradictions], ["Evidence gaps", synthesis.crossStudySynthesis.evidenceGaps], ["Implications", synthesis.crossStudySynthesis.implications]]} />}
      </div>}
      {phase === "gaps" && <CardList items={(synthesis.researchGaps || []).map((item) => ({ title: item.gap, text: item.evidenceBasis, tags: [...item.affectedResearchQuestions, ...item.recordIds] }))} empty="Generate the evidence chain to identify evidence-grounded research gaps." />}
      {phase === "agenda" && <CardList items={(synthesis.futureResearchAgenda || []).map((item) => ({ title: item.priority, text: item.rationale, details: [["Suggested approach", item.suggestedApproach], ["Linked gap", item.linkedGap]] }))} empty="Generate the evidence chain to develop the future research agenda." />}
    </div>
  );
}

function EvidenceCard({ title, text, tags = [], details = [] }: { title: string; text?: string; tags?: string[]; details?: string[][] }) {
  return <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
    <h3 className="font-bold text-slate-950">{title}</h3>
    <p className="text-sm leading-relaxed text-slate-700">{text || "Not yet generated."}</p>
    {details.map(([label, value]) => <div key={label} className="rounded-lg bg-slate-50 p-3"><div className="text-[10px] font-mono font-bold uppercase text-slate-500">{label}</div><p className="text-xs text-slate-700 mt-1">{value}</p></div>)}
    {tags.length > 0 && <div className="flex flex-wrap gap-1">{tags.map((tag) => <span key={tag} className="rounded bg-indigo-50 px-2 py-1 text-[10px] font-mono text-indigo-700">{tag}</span>)}</div>}
  </article>;
}

function CardList({ items, empty }: { items: Array<{ title: string; text: string; tags?: string[]; details?: string[][] }>; empty: string }) {
  if (!items.length) return <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">{empty}</div>;
  return <div className="space-y-4">{items.map((item, index) => <div key={`${item.title}-${index}`}><EvidenceCard {...item} /></div>)}</div>;
}