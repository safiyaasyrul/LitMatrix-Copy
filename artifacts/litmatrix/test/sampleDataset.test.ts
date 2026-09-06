import assert from "node:assert/strict";
import { test } from "node:test";
import * as sampleDataset from "../src/data/sampleDataset";
import {
  normalizePersistedSynthesis,
  QUALITATIVE_SYNTHESIS_GUARD,
} from "../src/utils/synthesisState";

const allowedFixtureExports = [
  "SAMPLE_CHARACTERISTICS",
  "SAMPLE_DISCUSSION_SECTIONS",
  "SAMPLE_PROTOCOL",
  "SAMPLE_RECORDS",
  "SAMPLE_REPORTING_ASSESSMENTS",
  "SAMPLE_SCREENING",
  "SAMPLE_SYNTHESIS",
  "sampleCharacteristics",
  "sampleDiscussion",
  "sampleProtocol",
  "sampleRecords",
  "sampleReportingAssessments",
  "sampleScreening",
  "sampleSynthesis",
].sort();

const quantitativeStructureKeys = new Set([
  "categories",
  "gradeCertainty",
  "gradeItems",
  "metaAnalysisData",
  "riskOfBias",
  "riskOfBiasItems",
]);

function findKeys(value: unknown, keys: Set<string>, path = "fixture"): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findKeys(item, keys, `${path}[${index}]`));
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  return Object.entries(value).flatMap(([key, nestedValue]) => {
    const keyPath = `${path}.${key}`;
    const matches = keys.has(key) ? [keyPath] : [];
    return [...matches, ...findKeys(nestedValue, keys, keyPath)];
  });
}

test("completed demo exports remain qualitative and abstract-grounded", () => {
  const exportedFixtureNames = Object.keys(sampleDataset)
    .filter((name) => name === "BLANK_PROTOCOL" || name.startsWith("SAMPLE_") || name.startsWith("sample"))
    .sort();

  assert.deepEqual(exportedFixtureNames, ["BLANK_PROTOCOL", ...allowedFixtureExports].sort());
  assert.deepEqual(findKeys(sampleDataset.SAMPLE_SYNTHESIS, quantitativeStructureKeys), []);
  assert.deepEqual(sampleDataset.SAMPLE_SYNTHESIS.forestPlotEstimates, []);
  assert.equal(sampleDataset.SAMPLE_SYNTHESIS.pooledEffectEstimate, undefined);
});

test("reported metrics remain valid evidence fields, not quantitative fixture payloads", () => {
  assert.ok(sampleDataset.SAMPLE_RECORDS.some((record) => /\bAUC\b|\bCI\b|\bQALY\b/.test(record.abstract)));
  assert.ok(
    sampleDataset.SAMPLE_CHARACTERISTICS.some((study) => /\bAUC\b|\bCI\b|\bQALY\b/.test(study.primaryOutcome)),
  );
});

test("legacy persisted synthesis is normalized to the qualitative workflow", () => {
  const legacyPersistedSynthesis = {
    status: "finalized",
    descriptiveSynthesis: { overview: "Legacy overview", comparisons: [] },
    categories: [
      {
        name: "Legacy category",
        metaAnalysisData: {
          pooledEstimate: "0.86",
          ci95: "0.80–0.90",
          iSquared: "72%",
          pVal: "0.01",
          studies: [{ name: "Legacy study", estimate: 0.86, ciLow: 0.8, ciHigh: 0.9, weight: 1 }],
        },
      },
    ],
    gradeCertainty: [{ outcome: "Legacy outcome", overallCertainty: "High" }],
    riskOfBiasItems: [{ recordId: "legacy", overall: "Low" }],
    forestPlotEstimates: [{ study: "Legacy study", effectSize: 0.86 }],
    pooledEffectEstimate: {
      effectMeasure: "AUC",
      effectSize: 0.86,
      ciLower: 0.8,
      ciUpper: 0.9,
      heterogeneityI2: "72%",
    },
    heterogeneityDiscussion: "Pooled effect with I² = 72% and p = 0.01.",
  };

  const normalized = normalizePersistedSynthesis(
    JSON.parse(JSON.stringify(legacyPersistedSynthesis)),
  );

  assert.deepEqual(normalized.forestPlotEstimates, []);
  assert.equal(normalized.pooledEffectEstimate, undefined);
  assert.equal(normalized.heterogeneityDiscussion, QUALITATIVE_SYNTHESIS_GUARD);
  assert.equal("categories" in normalized, false);
  assert.equal("gradeCertainty" in normalized, false);
  assert.equal("riskOfBiasItems" in normalized, false);
  assert.equal(normalized.descriptiveSynthesis?.overview, "Legacy overview");
});