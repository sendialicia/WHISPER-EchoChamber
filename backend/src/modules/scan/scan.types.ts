import type { ContentMode, FramingTactic } from "@core/config/constants";

export interface TriageRequest {
  text: string;
}

export interface TriageResult {
  is_controversial: boolean;
  confidence: number;
}

export interface AnalyzeRequest {
  text: string;
  sourceUrl?: string;
}

export interface SideArgument {
  label: string;
  steelman: string;
}

export interface AnalyzeResult {
  mode: ContentMode;
  tactic: FramingTactic | null;
  side_a: SideArgument | null;
  side_b: SideArgument | null;
  fact_summary: string | null;
  common_ground: string | null;
  context_note: string | null;
}
