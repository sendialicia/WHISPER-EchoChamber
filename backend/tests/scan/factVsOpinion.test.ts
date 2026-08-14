import { describe, it, expect } from "vitest";
import { reconcileMode } from "@modules/scan/factVsOpinion.service";

describe("scan/factVsOpinion", () => {
  it("falls back to fact_context if both_sides is missing a side", () => {
    const result = reconcileMode({
      mode: "both_sides",
      tactic: null,
      side_a: null,
      side_b: { label: "Side B", steelman: "..." },
      fact_summary: null,
      common_ground: null,
      context_note: null,
    });

    expect(result.mode).toBe("fact_context");
  });

  it("leaves a valid both_sides result untouched", () => {
    const input = {
      mode: "both_sides" as const,
      tactic: null,
      side_a: { label: "Side A", steelman: "..." },
      side_b: { label: "Side B", steelman: "..." },
      fact_summary: null,
      common_ground: "Both agree on X",
      context_note: null,
    };

    expect(reconcileMode(input)).toEqual(input);
  });
});

// TODO (Person A): add tests for triage.service (confidence thresholding)
// and analyze.service (mocking llmClient) once prompts are stable.
