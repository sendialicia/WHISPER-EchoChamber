import * as cheerio from "cheerio";

/**
 * Fetches a URL and pulls out readable article text — used by
 * scan/sourceContext.service.ts when content looks like it was cut short
 * from a longer source.
 *
 * This is intentionally dumb (grab <p> tags). Swap in a proper
 * readability library (e.g. @mozilla/readability + jsdom) if quality
 * matters more than speed of setup.
 */
export async function fetchArticleText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; EchoBreakerBot/0.1)" },
    });
    if (!res.ok) return null;

    const html = await res.text();
    const $ = cheerio.load(html);

    const paragraphs = $("p")
      .map((_, el) => $(el).text().trim())
      .get()
      .filter((t) => t.length > 40);

    const text = paragraphs.join("\n\n");
    return text.length > 0 ? text : null;
  } catch {
    return null;
  }
}
