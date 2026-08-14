export interface ExerciseRecord {
  id: string;
  type: "identify_framing" | "fact_vs_opinion" | "spot_fallacy" | "evaluate_evidence";
  prompt: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}
