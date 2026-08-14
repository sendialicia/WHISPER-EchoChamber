import { describe, it, expect, vi } from "vitest";
import { computeEchoChamberMeter } from "@modules/dashboard/echoChamberMeter.service";

vi.mock("@modules/logging/scanLog.service", () => ({
  getScanLogsForUser: vi.fn().mockResolvedValue([
    { id: "1", userId: "u1", createdAt: "2026-01-01", sourceText: "", mode: "both_sides", tactic: null, sideShown: "a", topic: "topicA" },
    { id: "2", userId: "u1", createdAt: "2026-01-02", sourceText: "", mode: "both_sides", tactic: null, sideShown: "a", topic: "topicB" },
    { id: "3", userId: "u1", createdAt: "2026-01-03", sourceText: "", mode: "both_sides", tactic: null, sideShown: "b", topic: "topicA" },
  ]),
}));

describe("dashboard/echoChamberMeter", () => {
  it("computes a skew score based on dominant side", async () => {
    const result = await computeEchoChamberMeter("u1");
    expect(result.dominantSide).toBe("a");
    expect(result.skewScore).toBeCloseTo(2 / 3);
    expect(result.topicsCovered).toBe(2);
  });
});
