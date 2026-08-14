export interface ToneCheckRequest {
  draft: string;
}

export interface ToneCheckResult {
  flagged: boolean;
  tactic: string | null;
  suggested_rewrite: string | null;
}
