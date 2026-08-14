import { pgPool, ensurePostgresSchema } from "@db/postgresClient";
import { logger } from "@core/utils/logger";

interface SeedExercise {
  type: "identify_framing" | "fact_vs_opinion" | "spot_fallacy" | "evaluate_evidence";
  prompt: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

const exercises: SeedExercise[] = [
  {
    type: "identify_framing",
    prompt:
      'A headline reads: "Radical politicians push dangerous new law that could destroy small businesses." What framing tactic is being used?',
    options: ["Cherry-picking", "Emotional loading", "False dichotomy", "Appeal to authority"],
    correctOptionIndex: 1,
    explanation:
      'Words like "radical," "dangerous," and "destroy" are emotionally loaded — they push a reaction before any facts about the law are given.',
  },
  {
    type: "identify_framing",
    prompt:
      'An article only quotes three angry customer reviews out of thousands of mostly positive ones to argue a product is "widely hated." What tactic is this?',
    options: ["Cherry-picking", "Strawmanning", "Whataboutism", "Loaded language"],
    correctOptionIndex: 0,
    explanation:
      "Selecting a small, unrepresentative sample that supports a predetermined conclusion while ignoring the broader pattern is cherry-picking.",
  },
  {
    type: "fact_vs_opinion",
    prompt: '"The Earth\'s average surface temperature has risen over the past century." Is this a fact or an opinion?',
    options: ["Fact", "Opinion", "Both, depending on who says it", "Neither — it's unverifiable"],
    correctOptionIndex: 0,
    explanation:
      "This is a measurable, well-documented claim with scientific consensus behind it — a settled fact, not a matter of perspective.",
  },
  {
    type: "fact_vs_opinion",
    prompt: '"Remote work is better for employee productivity than office work." Is this a fact or an opinion?',
    options: ["Fact", "Opinion", "Fact, settled by research", "Neither"],
    correctOptionIndex: 1,
    explanation:
      "Despite studies existing on both sides, this is a genuinely contested claim shaped by job type, personality, and management style — a real opinion, not a settled fact.",
  },
  {
    type: "spot_fallacy",
    prompt:
      '"If we let people work from home, next they\'ll want to never come into the office at all, and the company will collapse." What fallacy is this?',
    options: ["Ad hominem", "Slippery slope", "False cause", "Appeal to popularity"],
    correctOptionIndex: 1,
    explanation:
      "This assumes one small step will inevitably lead to an extreme outcome without justifying the chain of causation — a classic slippery slope.",
  },
  {
    type: "spot_fallacy",
    prompt:
      '"You can\'t trust her opinion on the economy, she didn\'t even finish college." What fallacy is this?',
    options: ["Straw man", "Ad hominem", "False dichotomy", "Circular reasoning"],
    correctOptionIndex: 1,
    explanation:
      "Attacking the person's credentials instead of engaging with their actual argument is an ad hominem — it sidesteps the substance entirely.",
  },
  {
    type: "evaluate_evidence",
    prompt:
      'A post claims "9 out of 10 dentists agree" but doesn\'t say who was surveyed, how many, or by whom. What\'s the main issue?',
    options: [
      "The claim is too positive to be true",
      "Lack of source transparency makes the statistic unverifiable",
      "Dentists aren't qualified to comment",
      "The number is too round to be real",
    ],
    correctOptionIndex: 1,
    explanation:
      "Without knowing the sample size, selection method, or original source, a statistic like this can't be evaluated for reliability — it could be real or fabricated.",
  },
  {
    type: "evaluate_evidence",
    prompt:
      "A claim cites a single anecdote from one person's experience to argue a medical treatment 'definitely works.' What's the strongest critique?",
    options: [
      "Anecdotes are always false",
      "One person's experience isn't strong evidence for a general causal claim",
      "The person is probably lying",
      "The treatment must be fake",
    ],
    correctOptionIndex: 1,
    explanation:
      "A single case doesn't control for other variables (placebo effect, coincidence, individual differences) — it's weak evidence for a broad claim, even if the anecdote itself is true.",
  },
];

interface SeedTopic {
  topic: string;
  positionA: string;
  positionB: string;
}

const topics: SeedTopic[] = [
  {
    topic: "remote_work",
    positionA: "Remote work improves productivity and quality of life for most employees.",
    positionB: "In-office work is essential for collaboration, mentorship, and company culture.",
  },
  {
    topic: "social_media_regulation",
    positionA: "Social media platforms should be more heavily regulated to curb misinformation and harm.",
    positionB: "Heavier regulation of social media risks government overreach and stifles free expression.",
  },
  {
    topic: "minimum_wage",
    positionA: "Raising the minimum wage helps lift workers out of poverty without significant job loss.",
    positionB: "Raising the minimum wage too quickly can hurt small businesses and reduce entry-level jobs.",
  },
  {
    topic: "ai_in_education",
    positionA: "AI tools in classrooms personalize learning and free up teachers' time for higher-value work.",
    positionB: "AI tools in classrooms risk eroding critical thinking and over-relying on unverified outputs.",
  },
];

interface SeedDiverseRead {
  topic: string;
  reason: string;
  suggestedReadingTitle: string;
  suggestedReadingUrl: string;
}

const diverseReads: SeedDiverseRead[] = [
  {
    topic: "remote_work",
    reason: "You've mostly seen arguments in favor of remote work lately.",
    suggestedReadingTitle: "The case for bringing teams back to the office",
    suggestedReadingUrl: "https://hbr.org/topic/subject/remote-work",
  },
  {
    topic: "social_media_regulation",
    reason: "You've mostly seen arguments for stricter platform regulation lately.",
    suggestedReadingTitle: "Why over-regulating platforms can backfire",
    suggestedReadingUrl: "https://www.eff.org/issues/free-speech",
  },
  {
    topic: "minimum_wage",
    reason: "You've mostly seen arguments against minimum wage increases lately.",
    suggestedReadingTitle: "What the research says about minimum wage and poverty",
    suggestedReadingUrl: "https://www.epi.org/publication/minimum-wage/",
  },
];

async function seed() {
  await ensurePostgresSchema();

  await pgPool.query("DELETE FROM exercises");
  for (const ex of exercises) {
    await pgPool.query(
      `INSERT INTO exercises (type, prompt, options, correct_option_index, explanation)
       VALUES ($1, $2, $3, $4, $5)`,
      [ex.type, ex.prompt, JSON.stringify(ex.options), ex.correctOptionIndex, ex.explanation]
    );
  }
  logger.info(`Seeded ${exercises.length} exercises into Postgres.`);

  await pgPool.query("DELETE FROM topics");
  for (const t of topics) {
    await pgPool.query(
      `INSERT INTO topics (topic, position_a, position_b) VALUES ($1, $2, $3)`,
      [t.topic, t.positionA, t.positionB]
    );
  }
  logger.info(`Seeded ${topics.length} topics into Postgres.`);

  await pgPool.query("DELETE FROM diverse_reads");
  for (const d of diverseReads) {
    await pgPool.query(
      `INSERT INTO diverse_reads (topic, reason, suggested_reading_title, suggested_reading_url)
       VALUES ($1, $2, $3, $4)`,
      [d.topic, d.reason, d.suggestedReadingTitle, d.suggestedReadingUrl]
    );
  }
  logger.info(`Seeded ${diverseReads.length} diverse reads into Postgres.`);

  await pgPool.end();
}

seed().catch((err) => {
  logger.error("Seeding failed:", err);
  process.exit(1);
});