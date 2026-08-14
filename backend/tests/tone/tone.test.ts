import { describe, it, expect } from "vitest";

// TODO (Person B): mock llmClient.generate and test that checkTone()
// correctly maps a flagged/unflagged LLM response to ToneCheckResult.
describe("tone/checkTone", () => {
  it.todo("returns flagged=false when the LLM reports no attacking tone");
  it.todo("returns a suggested_rewrite when flagged=true");
  it.todo("never blocks — always returns a result, never throws on flagged content");
});
