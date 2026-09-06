import type { SynthesisResult } from "../types/slr";

export const QUALITATIVE_SYNTHESIS_GUARD =
  "Study differences are synthesized qualitatively; no statistical pooling or forest plot is produced.";

const RETIRED_QUANTITATIVE_KEYS = new Set([
  "categories",
  "gradeCertainty",
  "gradeItems",
  "metaAnalysisData",
  "riskOfBias",
  "riskOfBiasItems",
]);

/**
 * Reconcile browser-persisted synthesis data with the active qualitative
 * workflow. Older saved reviews may contain fields from retired quantitative
 * synthesis and certainty workflows.
 */
export function normalizePersistedSynthesis(value: unknown): SynthesisResult {
  const persisted =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const qualitativeFields = Object.fromEntries(
    Object.entries(persisted).filter(([key]) => !RETIRED_QUANTITATIVE_KEYS.has(key)),
  );

  return {
    ...qualitativeFields,
    forestPlotEstimates: [],
    pooledEffectEstimate: undefined,
    heterogeneityDiscussion: QUALITATIVE_SYNTHESIS_GUARD,
  } as SynthesisResult;
}