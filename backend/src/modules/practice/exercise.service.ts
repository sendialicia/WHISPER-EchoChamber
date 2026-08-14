import { pgPool } from "@db/postgresClient";
import type { PracticeExercise } from "./practice.types";

/**
 * Feature 4 — Critical Thinking Exercises, backed by Postgres/Supabase
 * (shared content, same for every user — see db/postgresClient.ts).
 * Content is centrally managed there: add/edit rows via the seed script
 * (`npm run seed`) or directly in the Supabase table editor, no redeploy
 * needed to update exercise content.
 */

interface ExerciseRow {
  id: string;
  type: PracticeExercise["type"];
  prompt: string;
  options: string[]; // jsonb comes back already parsed via pg
  correct_option_index: number;
  explanation: string;
}

function rowToExercise(row: ExerciseRow): PracticeExercise {
  return {
    id: row.id,
    type: row.type,
    prompt: row.prompt,
    options: row.options,
    correctOptionIndex: row.correct_option_index,
    explanation: row.explanation,
  };
}

export async function getRandomExercise(
  type?: PracticeExercise["type"]
): Promise<PracticeExercise> {
  const result = type
    ? await pgPool.query<ExerciseRow>(
        "SELECT * FROM exercises WHERE type = $1 ORDER BY RANDOM() LIMIT 1",
        [type]
      )
    : await pgPool.query<ExerciseRow>("SELECT * FROM exercises ORDER BY RANDOM() LIMIT 1");

  const row = result.rows[0];

  if (!row) {
    throw new Error(
      type
        ? `No exercises available for type "${type}". Run "npm run seed" or add rows in Supabase.`
        : `No exercises available. Run "npm run seed" or add rows in Supabase.`
    );
  }

  return rowToExercise(row);
}

export async function getAllExercises(): Promise<PracticeExercise[]> {
  const result = await pgPool.query<ExerciseRow>("SELECT * FROM exercises");
  return result.rows.map(rowToExercise);
}