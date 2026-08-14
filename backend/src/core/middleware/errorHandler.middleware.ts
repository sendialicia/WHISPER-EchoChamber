import type { NextFunction, Request, Response } from "express";
import { logger } from "@core/utils/logger";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error(`Unhandled error on ${req.method} ${req.path}`, err);

  const message = err instanceof Error ? err.message : "Unknown error";
  res.status(500).json({ error: "internal_server_error", message });
}
