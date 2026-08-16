import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";

/**
 * The retry path only runs when the provider is failing, which is exactly when
 * nobody is watching — so it is worth pinning down here rather than finding
 * out during a demo that a spike takes the feature down.
 *
 * fetch is stubbed so no request ever leaves the machine.
 */

let generateWithGemini: typeof import("@core/llm/providers/gemini.provider")["generateWithGemini"];
let LlmUnavailableError: typeof import("@core/llm/llmErrors")["LlmUnavailableError"];

beforeAll(async () => {
  // env.ts parses at import time, so these have to be in place first.
  process.env.GEMINI_API_KEY = "test-key";
  process.env.GEMINI_DEEP_MODEL = "primary-model";
  process.env.GEMINI_DEEP_FALLBACK_MODELS = "fallback-model,last-resort-model";

  ({ generateWithGemini } = await import("@core/llm/providers/gemini.provider"));
  ({ LlmUnavailableError } = await import("@core/llm/llmErrors"));
});

const ok = (text: string) =>
  new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), {
    status: 200,
  });

const fail = (status: number, body = `{"error":{"code":${status}}}`) =>
  new Response(body, { status });

/** A 429 shaped like Google's daily free-tier quota failure. */
const outOfQuota = () =>
  fail(
    429,
    JSON.stringify({
      error: {
        code: 429,
        details: [
          {
            "@type": "type.googleapis.com/google.rpc.QuotaFailure",
            violations: [
              { quotaId: "GenerateRequestsPerDayPerProjectPerModel-FreeTier" },
            ],
          },
        ],
      },
    })
  );

/** Which model each call was aimed at, read back off the request URL. */
function modelsCalled(fetchMock: ReturnType<typeof vi.fn>): string[] {
  return fetchMock.mock.calls.map((call) => {
    const url = String(call[0]);
    return url.split("/models/")[1].split(":")[0];
  });
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.useFakeTimers();
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/**
 * Runs a call to completion, letting the backoff timers fire immediately.
 *
 * The rejection handler is attached before the timers advance: awaiting the
 * timers first leaves a rejected promise briefly unobserved, which Node
 * reports as an unhandled rejection and vitest then fails the run over.
 */
async function run() {
  const settled = generateWithGemini({ prompt: "hi", speed: "deep" }).then(
    (value) => ({ ok: true as const, value }),
    (error) => ({ ok: false as const, error })
  );

  await vi.runAllTimersAsync();

  const result = await settled;
  if (result.ok) return result.value;
  throw result.error;
}

describe("gemini provider retries", () => {
  it("returns the first success without retrying", async () => {
    fetchMock.mockResolvedValueOnce(ok("done"));

    await expect(run()).resolves.toMatchObject({ text: "done" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries an overloaded model and succeeds on a later attempt", async () => {
    fetchMock
      .mockResolvedValueOnce(fail(503))
      .mockResolvedValueOnce(ok("recovered"));

    await expect(run()).resolves.toMatchObject({ text: "recovered" });
    expect(modelsCalled(fetchMock)).toEqual(["primary-model", "primary-model"]);
  });

  it("moves to the next model once the primary is exhausted", async () => {
    fetchMock
      .mockResolvedValueOnce(fail(503))
      .mockResolvedValueOnce(fail(503))
      .mockResolvedValueOnce(ok("from fallback"));

    await expect(run()).resolves.toMatchObject({ text: "from fallback" });
    expect(modelsCalled(fetchMock)).toEqual([
      "primary-model",
      "primary-model",
      "fallback-model",
    ]);
  });

  it("walks the whole chain before giving up", async () => {
    // The point of the chain: a spike on the newest model shouldn't end the
    // request while an older one is answering normally.
    fetchMock
      .mockResolvedValueOnce(fail(503))
      .mockResolvedValueOnce(fail(503))
      .mockResolvedValueOnce(fail(503))
      .mockResolvedValueOnce(ok("from the last one"));

    await expect(run()).resolves.toMatchObject({ text: "from the last one" });
    expect(modelsCalled(fetchMock)).toEqual([
      "primary-model",
      "primary-model",
      "fallback-model",
      "last-resort-model",
    ]);
  });

  it("reports unavailable only when every model is overloaded", async () => {
    fetchMock.mockImplementation(async () => fail(503));

    await expect(run()).rejects.toBeInstanceOf(LlmUnavailableError);
  });

  it("retries a rate limit the same way", async () => {
    fetchMock.mockResolvedValueOnce(fail(429)).mockResolvedValueOnce(ok("after 429"));

    await expect(run()).resolves.toMatchObject({ text: "after 429" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("skips to the next model when the daily quota is gone", async () => {
    // The free tier counts per model per day, so waiting cannot help but the
    // next model still has its own budget.
    fetchMock
      .mockImplementationOnce(async () => outOfQuota())
      .mockResolvedValueOnce(ok("from fallback"));

    await expect(run()).resolves.toMatchObject({ text: "from fallback" });
    expect(modelsCalled(fetchMock)).toEqual(["primary-model", "fallback-model"]);
  });

  it("does not retry a bad request", async () => {
    // A 400 means the request itself is wrong. Repeating it just makes the
    // user wait longer for the same answer.
    fetchMock.mockImplementation(async () => fail(400));

    await expect(run()).rejects.toThrow(/400/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("skips a model the key cannot reach and uses the next one", async () => {
    // A 404 is a problem with that entry in the chain, not with the request.
    // Ending the attempt there would let one stale model name in the config
    // take down a feature the other models could have served.
    fetchMock
      .mockImplementationOnce(async () => fail(404))
      .mockResolvedValueOnce(ok("from fallback"));

    await expect(run()).resolves.toMatchObject({ text: "from fallback" });
    expect(modelsCalled(fetchMock)).toEqual(["primary-model", "fallback-model"]);
  });

  it("gives up when no model in the chain is reachable", async () => {
    fetchMock.mockImplementation(async () => fail(404));

    await expect(run()).rejects.toBeInstanceOf(LlmUnavailableError);
    // One attempt each, no retries — a missing model will not appear.
    expect(modelsCalled(fetchMock)).toEqual([
      "primary-model",
      "fallback-model",
      "last-resort-model",
    ]);
  });
});
