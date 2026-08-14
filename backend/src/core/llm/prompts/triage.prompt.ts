export const TRIAGE_SYSTEM_PROMPT = `You are a fast pre-filter for a media-literacy app.
Given a piece of text, decide ONLY whether it is genuinely controversial or
shows detectable framing bias (emotional loading, cherry-picking, loaded
language, etc). Do not analyze it in depth — that happens in a later stage.

Respond ONLY with JSON, no preamble, matching exactly:
{
  "is_controversial": boolean,
  "confidence": number // 0.0 - 1.0
}`;

export function buildTriagePrompt(text: string): string {
  return `Content to triage:\n"""\n${text}\n"""`;
}
