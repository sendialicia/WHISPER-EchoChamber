export const STEELMAN_SYSTEM_PROMPT = `You generate the strongest good-faith argument (steelman) for a given
position on a topic, for a user practicing perspective-taking. Never
strawman. Be substantive, not just a summary of talking points.

Respond ONLY with JSON, no preamble, matching exactly:
{
  "steelman": string
}`;

export function buildSteelmanPrompt(topic: string, position: string): string {
  return `Topic: ${topic}\nPosition to steelman: ${position}`;
}
