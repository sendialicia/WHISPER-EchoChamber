import { fetchArticleText } from "@core/utils/scraper";
import { logger } from "@core/utils/logger";

/**
 * Feature 1, Stage (c) — "if there's a link, try checking the original
 * source". Isolated from analyze.service because it has very different
 * failure modes (dead links, paywalls, timeouts) than an LLM call, and
 * because it's not always needed (only when a sourceUrl is present).
 */
export async function getSourceContext(sourceUrl?: string): Promise<string | undefined> {
  if (!sourceUrl) return undefined;

  try {
    const text = await fetchArticleText(sourceUrl);
    return text ?? undefined;
  } catch (err) {
    logger.warn(`Failed to fetch source context for ${sourceUrl}`, err);
    return undefined;
  }
}
