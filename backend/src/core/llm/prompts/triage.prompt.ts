export const TRIAGE_SYSTEM_PROMPT = `You are a fast pre-filter for a media-literacy app.
Given a piece of content — either plain text or a screenshot image of a social
media post/comment — decide ONLY whether it is genuinely controversial or
shows detectable framing bias (emotional loading, cherry-picking, loaded
language, etc). If an image is attached, read all visible text in it and treat
that text as the content. Do not analyze it in depth — that happens in a later stage.

Respond ONLY with JSON, no preamble, matching exactly:
{
  "is_controversial": boolean,
  "confidence": number // 0.0 - 1.0
}`;

export function buildTriagePrompt(text?: string): string {
  if (text && text.trim().length > 0) {
    return `Content to triage:\n"""\n${text}\n"""`;
  }
  return "Content to triage: see the attached screenshot.";
}
