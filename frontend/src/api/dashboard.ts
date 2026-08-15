import { request } from "./client";
import type {
  EchoChamberMeterResult,
  ReflectionJournalEntry,
  SourceDiversityNudge,
} from "./types";

/**
 * Feature 3 — Dashboard.
 *
 * These routes carry no `:userId` — the backend reads the user from the
 * verified token, so a client can't request someone else's data.
 */

export function getEchoChamberMeter(signal?: AbortSignal): Promise<EchoChamberMeterResult> {
  return request<EchoChamberMeterResult>("/dashboard/echo-chamber-meter", {
    auth: true,
    signal,
  });
}

export function getSourceDiversity(signal?: AbortSignal): Promise<SourceDiversityNudge[]> {
  return request<SourceDiversityNudge[]>("/dashboard/source-diversity", {
    auth: true,
    signal,
  });
}

export function getReflectionJournal(
  signal?: AbortSignal
): Promise<ReflectionJournalEntry[]> {
  return request<ReflectionJournalEntry[]>("/dashboard/reflection-journal", {
    auth: true,
    signal,
  });
}
