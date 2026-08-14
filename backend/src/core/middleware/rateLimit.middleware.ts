import type { NextFunction, Request, Response } from "express";

/**
 * Placeholder in-memory rate limiter. Swap for a proper library
 * (e.g. express-rate-limit, or a Redis-backed limiter) before production —
 * this exists so LLM-calling routes (scan, tone) don't get hammered and
 * blow through your free-tier quota.
 */
const requestLog = new Map<string, number[]>();

export function rateLimit(maxRequests = 30, windowMs = 60_000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip ?? "unknown";
    const now = Date.now();
    const timestamps = (requestLog.get(key) ?? []).filter(
      (t) => now - t < windowMs
    );

    if (timestamps.length >= maxRequests) {
      return res.status(429).json({ error: "rate_limited" });
    }

    timestamps.push(now);
    requestLog.set(key, timestamps);
    next();
  };
}
