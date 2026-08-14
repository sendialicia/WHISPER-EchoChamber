/**
 * Placeholder model shape — replace with your actual ORM
 * (Prisma/Drizzle/TypeORM) schema once the DB is wired up.
 * This shape is what dashboard/* aggregates over, so keep it stable.
 */
export interface ScanLogEntry {
  id: string;
  userId: string; // or deviceId if fully local/anonymous
  createdAt: string; // ISO timestamp
  sourceText: string;
  sourceUrl?: string;
  mode: "both_sides" | "fact_context";
  tactic: string | null;
  topic?: string; // used by dashboard + practice topic bank
  sideShown?: "a" | "b"; // which side the original content presented — feeds Echo Chamber Meter
}
