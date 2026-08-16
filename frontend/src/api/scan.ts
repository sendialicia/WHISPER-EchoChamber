import { request } from "./client";
import type {
  AnalyzeRequest,
  AnalyzeResult,
  ScanLogEntry,
  ScanLogRequest,
  TriageRequest,
  TriageResult,
} from "./types";

/**
 * Feature 1 — Scan & Context.
 *
 * Both endpoints take `text` OR `imageBase64`: text when the accessibility
 * tree gave us the post directly, the screenshot when it didn't.
 */

/** Stage (b) — fast, cheap check for whether this is worth analysing. */
export function triage(req: TriageRequest, signal?: AbortSignal): Promise<TriageResult> {
  return request<TriageResult>("/scan/triage", { method: "POST", body: req, signal });
}

/** Stages (c)+(d) — the full card. Only worth calling if triage passed. */
export function analyze(req: AnalyzeRequest, signal?: AbortSignal): Promise<AnalyzeResult> {
  return request<AnalyzeResult>("/scan/analyze", { method: "POST", body: req, signal });
}

/** Stage 7 — opt-in logging. Requires a session; the user comes from the token. */
export function logScan(req: ScanLogRequest): Promise<{ status: string }> {
  return request<{ status: string }>("/log/scan", {
    method: "POST",
    body: req,
    auth: true,
  });
}

/** The caller's own recent scans, newest first. Requires a session. */
export function getScanHistory(limit = 20, signal?: AbortSignal): Promise<ScanLogEntry[]> {
  return request<ScanLogEntry[]>(`/log/scans?limit=${limit}`, { auth: true, signal });
}
