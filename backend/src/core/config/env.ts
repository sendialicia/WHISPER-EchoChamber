import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().default("3000").transform(Number),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  GEMINI_API_KEY: z.string().optional(),
  GEMINI_FAST_MODEL: z.string().default("gemini-3.5-flash-lite"),
  GEMINI_DEEP_MODEL: z.string().default("gemini-3.6-flash"),
  // Comma-separated, tried in order once the primary has exhausted its
  // retries. Demand spikes hit one model at a time, and the newest models are
  // the most contended — so the chain runs newest to oldest, trading a little
  // capability for a much better chance of getting an answer at all.
  GEMINI_FAST_FALLBACK_MODELS: z
    .string()
    .default("gemini-3.1-flash-lite,gemini-flash-lite-latest"),
  GEMINI_DEEP_FALLBACK_MODELS: z.string().default("gemini-3.5-flash,gemini-3.7-flash"),
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
