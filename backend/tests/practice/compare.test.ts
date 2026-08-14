import { describe, it } from "vitest";

// TODO (Person B): mock llmClient.generate and test generateComparison()
// returns both userSteelman (passthrough) and aiSteelman (from LLM json).
describe("practice/compare", () => {
  it.todo("passes through userSteelman unchanged when provided");
  it.todo("returns userSteelman=null when the user skipped");
  it.todo("parses aiSteelman from the LLM's JSON response");
});
