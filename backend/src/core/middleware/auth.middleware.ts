import type { NextFunction, Request, Response } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "@core/config/env";
import { logger } from "@core/utils/logger";

/**
 * Verifies the JWT that Supabase Auth issues after login, using
 * Supabase's NEW asymmetric JWT Signing Keys system (JWKS) — NOT the
 * legacy shared JWT secret, which Supabase is phasing out and no longer
 * recommends for new projects.
 *
 * How it works: Supabase publishes its current public signing key(s) at
 * https://<project-ref>.supabase.co/auth/v1/jwks. This verifies tokens
 * against that public key locally — no secret ever needs to live in this
 * backend's env vars, and key rotation on Supabase's side "just works"
 * without redeploying anything here.
 *
 * The mobile app (React Native) authenticates via the Supabase client SDK,
 * gets back a session JWT, stores it securely on-device (expo-secure-store
 * / Keychain / Keystore — NOT AsyncStorage, which isn't encrypted), and
 * sends it as: Authorization: Bearer <token>
 *
 * This is token-based auth, not cookies — cookies are a browser concept
 * and don't fit a mobile app's request model. Encryption at rest
 * (automatic on Supabase) only protects data sitting in the database; it
 * doesn't authenticate requests — you need both layers, they solve
 * different problems.
 */

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// Lazily created once and reused — createRemoteJWKSet caches the fetched
// keys internally and handles rotation automatically.
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  if (!jwks) {
    if (!env.SUPABASE_URL) {
      throw new Error("SUPABASE_URL is not set.");
    }
    jwks = createRemoteJWKSet(new URL(`${env.SUPABASE_URL}/auth/v1/jwks`));
  }
  return jwks;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

  if (!token) {
    return res.status(401).json({ error: "unauthorized", message: "Missing bearer token." });
  }

  if (!env.SUPABASE_URL) {
    return res.status(500).json({
      error: "server_misconfigured",
      message: "SUPABASE_URL is not set on the server.",
    });
  }

  try {
    const { payload } = await jwtVerify(token, getJwks());
    if (!payload.sub) {
      return res.status(401).json({ error: "unauthorized", message: "Token missing subject." });
    }
    req.userId = payload.sub; // Supabase puts the user's UUID in `sub`
    next();
  } catch (err) {
    logger.warn("JWT verification failed", err);
    return res.status(401).json({ error: "unauthorized", message: "Invalid or expired token." });
  }
}