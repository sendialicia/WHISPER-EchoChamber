import { pgPool } from "@db/postgresClient";
import { getScanLogsForUser } from "@modules/logging/scanLog.service";
import type { PracticeTopic } from "./practice.types";

interface TopicRow {
  id: string;
  topic: string;
  position_a: string;
  position_b: string;
}

/**
 * Feature 4 — pulls a topic either from the user's own scan history
 * (preferred, more personally relevant, stays in local SQLite) or the
 * curated `topics` table in Postgres/Supabase as a fallback for users
 * with no scan history yet (e.g. brand new users).
 */
export async function getPracticeTopic(userId: string): Promise<PracticeTopic> {
  const logs = await getScanLogsForUser(userId);
  const topicsWithSides = logs.filter((l) => l.topic);

  if (topicsWithSides.length > 0) {
    const pick = topicsWithSides[Math.floor(Math.random() * topicsWithSides.length)];
    return {
      id: pick.id,
      topic: pick.topic!,
      position: pick.sideShown === "a" ? "side_b" : "side_a", // challenge the opposite side
      source: "scan_history",
    };
  }

  const result = await pgPool.query<TopicRow>(
    "SELECT * FROM topics ORDER BY RANDOM() LIMIT 1"
  );
  const row = result.rows[0];

  if (!row) {
    throw new Error(
      "No curated topics available and no scan history to draw from. Run \"npm run seed\" or add rows to the topics table in Supabase."
    );
  }

  // Randomly challenge either position when pulling from the curated bank.
  const position = Math.random() < 0.5 ? row.position_a : row.position_b;

  return {
    id: row.id,
    topic: row.topic,
    position,
    source: "curated_bank",
  };
}