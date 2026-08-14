import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Express does NOT automatically catch rejected promises thrown inside
 * async route handlers — an unhandled rejection there crashes the entire
 * Node process, not just that one request. Every controller in this
 * project is async, so every route registration wraps its handler with
 * this to route errors into errorHandler.middleware.ts instead.
 *
 * Usage: router.get("/path", asyncHandler(myController))
 */
export function asyncHandler(fn: RequestHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}