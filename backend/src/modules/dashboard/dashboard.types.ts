export interface EchoChamberMeterResult {
  // e.g. 0 = perfectly balanced exposure, 1 = fully one-sided
  skewScore: number;
  dominantSide: string | null;
  topicsCovered: number;
}

export interface SourceDiversityNudge {
  topic: string;
  reason: string;
  suggestedReadingTitle: string;
  suggestedReadingUrl: string;
}

export interface ReflectionJournalEntry {
  topic: string;
  occurrences: number;
  lastTriggeredAt: string;
}
