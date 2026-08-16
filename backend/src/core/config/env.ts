import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().default("3000").transform(Number),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  GEMINI_API_KEY: z.string().optional(),
  GEMINI_FAST_MODEL: z.string().default("gemini-2.5-flash-lite"),
  GEMINI_DEEP_MODEL: z.string().default("gemini-2.5-flash"),
  // Used only when the primary answers 503 for long enough to exhaust its
  // retries. Deliberately a different model, since demand spikes hit one at
  // a time — pointing this at the primary just repeats the same failure.
  GEMINI_FAST_FALLBACK_MODEL: z.string().default("gemini-2.5-flash-lite"),
  GEMINI_DEEP_FALLBACK_MODEL: z.string().default("gemini-2.5-flash"),
  LLM_PROVIDER: z.string().default("gemini"),

  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().default("change_me"),
  SUPABASE_URL: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
