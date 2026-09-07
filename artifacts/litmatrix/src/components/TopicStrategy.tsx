import React, { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Layers3, Lightbulb, MapPin, Sparkles } from "lucide-react";
import { SLRProtocol, TopicDecomposition } from "../types/slr";
import { callAI, parseJSONLoose } from "../utils/aiClient";

interface TopicStrategyProps {
  protocol: SLRProtocol;
  onUpdateProtocol: (protocol: SLRProtocol) => void;
  aiConfig: any;
  onContinueToSearch?: () => void;
}

const EMPTY_TOPIC: TopicDecomposition = {
  topic: "",
  fieldOfStudy: "",
  problemStatement: "",
  context: "",
};

export default function TopicStrategy({
  protocol,
  onUpdateProtocol,
  aiConfig,
  onContinueToSearch,
}: TopicStrategyProps) {
  const [draft, setDraft] = useState<TopicDecomposition>(
    protocol.topicDecomposition || {
      ...EMPTY_TOPIC,
      topic: protocol.title && !/\[topic\]|abstract-level systematic review/i.test(protocol.title) ? protocol.title : "",
    }
  );
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(
      protocol.topicDecomposition || {
        ...EMPTY_TOPIC,
        topic: protocol.title && !/\[topic\]|abstract-level systematic review/i.test(protocol.title) ? protocol.title : "",
      }
    );
  }, [protocol.topicDecomposition, protocol.title]);

  const updateDraft = (field: keyof TopicDecomposition, value: string) => {
    const next = { ...draft, [field]: value };
    setDraft(next);
    onUpdateProtocol({ ...protocol, topicDecomposition: next });
  };

  const analyzeTopic = async () => {
    if (!draft.topic.trim() || generating) return;
    setGenerating(true);
    setError(null);
    try {
      const prompt = `Decompose this user-supplied systematic-review topic into three concise planning fields.

Topic: "${draft.topic.trim()}"

Return ONLY JSON:
{
  "fieldOfStudy": "The academic or professional field",
  "problemStatement": "The specific problem, outcome, exposure, intervention, or phenomenon being reviewed",
  "context": "The setting, population, industry, geography, institution, or operational context"
}

Rules:
- Use only concepts present in the supplied topic.
- Do not invent statistics, locations, populations, institutions, prior-review findings, or causal claims.
- Keep each value concise and suitable for editing by the researcher.
- If a detail is not specified, use "Not specified in the topic."`;
      const parsed = parseJSONLoose(
        await callAI(
          prompt,
          "You are a careful systematic-review scoping assistant. Extract topic structure without adding unsupported facts.",
          aiConfig
        )
      );
      const next: TopicDecomposition = {
        topic: draft.topic.trim(),
        fieldOfStudy: typeof parsed?.fieldOfStudy === "string" ? parsed.fieldOfStudy.trim() : draft.fieldOfStudy,
        problemStatement:
          typeof parsed?.problemStatement === "string" ? parsed.problemStatement.trim() : draft.problemStatement,
        context: typeof parsed?.context === "string" ? parsed.context.trim() : draft.context,
      };
      setDraft(next);
      onUpdateProtocol({ ...protocol, topicDecomposition: next });
    } catch (err: any) {
      setError(err?.message || "The topic could not be analyzed.");
    } finally {
      setGenerating(false);
    }
  };

  const fields = [
    {
      key: "fieldOfStudy" as const,
      label: "Field of Study",
      helper: "The discipline or branch of knowledge",
      icon: <BookOpen className="w-4 h-4" />,
      classes: "border-sky-200 bg-sky-50/40 text-sky-950",
      placeholder: "e.g., Maritime Transportation and Environmental Engineering",
    },
    {
      key: "problemStatement" as const,
      label: "Problem Statement",
      helper: "The problem, outcome, intervention, or phenomenon",
      icon: <Lightbulb className="w-4 h-4" />,
      classes: "border-amber-200 bg-amber-50/50 text-amber-950",
      placeholder: "e.g., Carbon dioxide and greenhouse-gas emissions mitigation",
    },
    {
      key: "context" as const,
      label: "Context / Setting",
      helper: "Where, for whom, or in which system the topic applies",
      icon: <MapPin className="w-4 h-4" />,
      classes: "border-indigo-200 bg-indigo-50/40 text-indigo-950",
      placeholder: "e.g., Global shipping industry and commercial vessel operations",
    },
  ];

  return (
    <section className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] text-indigo-600 uppercase tracking-wider font-bold">
              Topic strategy · PRISMA 2020 setup
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">Define the review topic</h2>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Start with the researcher’s own topic. The assistant decomposes it into a field, problem, and setting before search keywords or titles are generated.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2 text-xs text-indigo-800">
            <Layers3 className="w-4 h-4" />
            <span>Topic → Keywords → Title</span>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
            Research topic or area of interest
          </label>
          <textarea
            rows={3}
            value={draft.topic}
            onChange={(event) => updateDraft("topic", event.target.value)}
            placeholder="e.g., Decarbonization strategies for maritime transport and greenhouse-gas mitigation"
            className="w-full resize-y rounded-xl border border-slate-300 bg-slate-50/60 p-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] text-slate-500">
              Keep this broad enough for a systematic search; refine the scope in the fields below.
            </p>
            <button
              type="button"
              onClick={analyzeTopic}
              disabled={generating || !draft.topic.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-mono font-bold text-white shadow-xs transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {generating ? "Analyzing topic..." : "Decompose topic with AI"}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div>
          <div className="font-mono text-[10px] text-slate-500 uppercase tracking-wider font-bold">
            Topic decomposition
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review and edit every field. These values become the source for search-keyword suggestions and title drafting.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {fields.map((field) => (
            <div key={field.key} className={`rounded-xl border p-4 ${field.classes}`}>
              <label className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider">
                {field.icon}
                {field.label}
              </label>
              <p className="mt-1 text-[11px] opacity-70">{field.helper}</p>
              <textarea
                rows={2}
                value={draft[field.key]}
                onChange={(event) => updateDraft(field.key, event.target.value)}
                placeholder={field.placeholder}
                className="mt-3 w-full resize-y rounded-lg border border-white/80 bg-white/80 p-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          ))}
        </div>

        {error && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {error}
          </div>
        )}

        {onContinueToSearch && (
          <div className="flex justify-end border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onContinueToSearch}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-mono font-bold text-white shadow-xs transition hover:bg-indigo-700"
            >
              Continue to Search Keywords
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}