import assert from "node:assert/strict";
import { test } from "node:test";
import * as sampleDataset from "../src/data/sampleDataset";

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