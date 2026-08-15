import { describe, it, expect } from "vitest";
import { triageRequestSchema, analyzeRequestSchema } from "@modules/scan/scan.schema";

// A tiny but genuinely valid base64 payload.
const B64 = "iVBORw0KGgo=";

describe("scan request schemas", () => {
  describe("content presence", () => {
    it("rejects a body with neither text nor image", () => {
      const parsed = triageRequestSchema.safeParse({});
      expect(parsed.success).toBe(false);
    });

    it("rejects text that is only whitespace", () => {
      // Would otherwise pass the presence check while the prompt builder
      // falls through to "see the attached screenshot" with no image sent.
      const parsed = triageRequestSchema.safeParse({ text: "   \n  " });
      expect(parsed.success).toBe(false);
    });

    it("accepts text alone", () => {
      const parsed = triageRequestSchema.safeParse({ text: "  vaccines cause autism  " });
      expect(parsed.success).toBe(true);
      if (parsed.success) expect(parsed.data.text).toBe("vaccines cause autism");
    });

    it("accepts an image alone", () => {
      const parsed = triageRequestSchema.safeParse({ imageBase64: B64 });
      expect(parsed.success).toBe(true);
    });

    it("accepts an image with whitespace-only text", () => {
      const parsed = triageRequestSchema.safeParse({ text: "  ", imageBase64: B64 });
      expect(parsed.success).toBe(true);
    });
  });

  describe("imageBase64 normalisation", () => {
    it("strips a data: URI prefix", () => {
      const parsed = triageRequestSchema.safeParse({
        imageBase64: `data:image/png;base64,${B64}`,
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) expect(parsed.data.imageBase64).toBe(B64);
    });

    it("strips line breaks inserted by base64 encoders", () => {
      const parsed = triageRequestSchema.safeParse({ imageBase64: "iVBO\nRw0K\nGgo=" });
      expect(parsed.success).toBe(true);
      if (parsed.success) expect(parsed.data.imageBase64).toBe(B64);
    });

    it("rejects a string that is not base64", () => {
      const parsed = triageRequestSchema.safeParse({ imageBase64: "not base64 at all!!" });
      expect(parsed.success).toBe(false);
    });

    it("rejects an empty image string", () => {
      const parsed = triageRequestSchema.safeParse({ imageBase64: "" });
      expect(parsed.success).toBe(false);
    });
  });

  describe("imageMimeType", () => {
    it("accepts a supported type", () => {
      const parsed = triageRequestSchema.safeParse({
        imageBase64: B64,
        imageMimeType: "image/jpeg",
      });
      expect(parsed.success).toBe(true);
    });

    it("rejects an unsupported type", () => {
      // "image/jpg" is a common typo — better a 400 here than a provider error.
      const parsed = triageRequestSchema.safeParse({
        imageBase64: B64,
        imageMimeType: "image/jpg",
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe("analyze-only fields", () => {
    it("accepts a valid sourceUrl alongside an image", () => {
      const parsed = analyzeRequestSchema.safeParse({
        imageBase64: B64,
        sourceUrl: "https://example.com/article",
      });
      expect(parsed.success).toBe(true);
    });

    it("rejects a malformed sourceUrl", () => {
      const parsed = analyzeRequestSchema.safeParse({ text: "hi", sourceUrl: "not-a-url" });
      expect(parsed.success).toBe(false);
    });

    it("applies the same content rule as triage", () => {
      expect(analyzeRequestSchema.safeParse({}).success).toBe(false);
    });
  });
});
