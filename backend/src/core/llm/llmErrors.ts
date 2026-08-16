/**
 * Errors the LLM layer raises that callers, and ultimately the user, need to
 * tell apart.
 *
 * Without these every provider failure arrives as a generic Error and comes
 * out of the API as a 500 carrying the provider's own wording — so "the model
 * is busy right now, try again" and "your request was malformed" look
 * identical to the app, and neither reads as something a person can act on.
 */

export class LlmUnavailableError extends Error {
  readonly code = "llm_unavailable";

  constructor(
    /** The provider status that caused this, for the logs. */
    readonly upstreamStatus: number,
    message = "The analysis service is busy right now. Please try again in a moment."
  ) {
    super(message);
    this.name = "LlmUnavailableError";
  }
}

/** Statuses worth retrying: overload, rate limiting, and transient faults. */
export function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

/**
 * Whether a 429 means "you are out of requests for today" rather than "you
 * are going too fast".
 *
 * Google returns 429 for both, and the difference decides what to do. A
 * per-minute limit clears in seconds, so waiting works. A daily quota does
 * not clear until tomorrow, so waiting only burns the user's time before
 * failing anyway — and since the free tier counts per model, the right move
 * is to go straight to the next model in the chain, which has its own budget.
 */
export function isDailyQuotaExhausted(body: string): boolean {
  return /PerDay/i.test(body);
}
