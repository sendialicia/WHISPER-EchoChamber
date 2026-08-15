import { describe, it, expect } from "vitest";
import { reconcileMode } from "@modules/scan/factVsOpinion.service";
import type { AnalyzeResult } from "@modules/scan/scan.types";

const base: AnalyzeResult = {
  mode: "both_sides",
  tactic: null,
  side_a: { label: "Side A", steelman: "..." },
  side_b: { label: "Side B", steelman: "..." },
  fact_summary: null,
  common_ground: null,
  context_note: null,
  topic: null,
  side_shown: null,
};

describe("scan/factVsOpinion", () => {
  it("falls back to fact_context if both_sides is missing a side", () => {
    const result = reconcileMode({ ...base, side_a: null });
    expect(result.mode).toBe("fact_context");
  });

  it("leaves a valid both_sides result untouched", () => {
    const input: AnalyzeResult = { ...base, common_ground: "Both agree on X" };
    expect(reconcileMode(input)).toEqual(input);
  });

  it("drops side_shown when it falls back to fact_context", () => {
    // A stance is meaningless once there are no two sides to take it between.
    const result = reconcileMode({ ...base, side_a: null, side_shown: "b" });
    expect(result.side_shown).toBeNull();
  });

  describe("topic normalisation", () => {
    it("folds spacing and case into one slug", () => {
      expect(reconcileMode({ ...base, topic: "Minimum Wage" }).topic).toBe("minimum_wage");
    });

    it("strips punctuation and collapses separators", () => {
      expect(reconcileMode({ ...base, topic: "  AI, in Education!  " }).topic).toBe(
        "ai_in_education"
      );
    });

    it("leaves an already-canonical slug alone", () => {
      expect(reconcileMode({ ...base, topic: "remote_work" }).topic).toBe("remote_work");
    });

    it("treats a topic of only punctuation as absent", () => {
      expect(reconcileMode({ ...base, topic: "???" }).topic).toBeNull();
    });

    it("passes null through", () => {
      expect(reconcileMode({ ...base, topic: null }).topic).toBeNull();
    });
  });

  describe("side_shown normalisation", () => {
    it("keeps a valid side", () => {
      expect(reconcileMode({ ...base, side_shown: "a" }).side_shown).toBe("a");
    });

    it("rejects anything that isn't a or b", () => {
      const result = reconcileMode({
        ...base,
        side_shown: "neither" as AnalyzeResult["side_shown"],
      });
      expect(result.side_shown).toBeNull();
    });
  });
});

// TODO (Person A): add tests for triage.service (confidence thresholding)
// and analyze.service (mocking llmClient) once prompts are stable.
