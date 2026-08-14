export interface PracticeTopic {
  id: string;
  topic: string;
  position: string; // the position the user is asked to steelman
  source: "scan_history" | "curated_bank";
}

export interface PracticeExercise {
  id: string;
  type: "identify_framing" | "fact_vs_opinion" | "spot_fallacy" | "evaluate_evidence";
  prompt: string;
  options: string[];
  // No "correct answer" scoring shown to the user per spec — this is for
  // internal exercise generation/validation only.
  correctOptionIndex: number;
  explanation: string;
}

export interface CompareRequest {
  topic: string;
  position: string;
  userSteelman?: string; // omitted if the user chose to skip
}

export interface CompareResult {
  userSteelman: string | null;
  aiSteelman: string;
}
