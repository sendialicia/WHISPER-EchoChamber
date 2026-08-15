import { describe, it, expect } from "vitest";
import { buildTriagePrompt } from "@core/llm/prompts/triage.prompt";
import { buildAnalyzePrompt } from "@core/llm/prompts/analyze.prompt";

describe("scan prompt builders (image support)", () => {
  it("buildTriagePrompt embeds plain text when present", () => {
    const prompt = buildTriagePrompt("hello world");
    expect(prompt).toContain("hello world");
  });

  it("buildTriagePrompt points to the screenshot when text is empty", () => {
    const prompt = buildTriagePrompt(undefined);
    expect(prompt).toContain("attached screenshot");
    expect(prompt).not.toContain('"""');
  });

  it("buildAnalyzePrompt embeds plain text when present", () => {
    const prompt = buildAnalyzePrompt("some text");
    expect(prompt).toContain("some text");
  });

  it("buildAnalyzePrompt points to the screenshot when text is empty", () => {
    const prompt = buildAnalyzePrompt("");
    expect(prompt).toContain("attached screenshot");
  });

  it("buildAnalyzePrompt still appends source context", () => {
    const prompt = buildAnalyzePrompt("", "extra context from source");
    expect(prompt).toContain("attached screenshot");
    expect(prompt).toContain("extra context from source");
  });
});
