import type { NextFunction, Request, Response } from "express";
import { logger } from "@core/utils/logger";
import { LlmUnavailableError } from "@core/llm/llmErrors";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error(`Unhandled error on ${req.method} ${req.path}`, err);

  // The model being busy is not a bug in this server, and it is not permanent
  // — say so, with a status the client can recognise, instead of a 500
  // carrying the provider's own wording.
  if (err instanceof LlmUnavailableError) {
    return res.status(503).json({ error: err.code, message: err.message });
  }

  const message = err instanceof Error ? err.message : "Unknown error";
  res.status(500).json({ error: "internal_server_error", message });
}
