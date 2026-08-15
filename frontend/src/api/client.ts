import { Platform } from "react-native";
import Constants from "expo-constants";
import { getAuthHeaders } from "../auth/identity";

/** The port the backend listens on. Matches PORT in backend/.env. */
const BACKEND_PORT = 3000;

/**
 * In development, follow whichever machine is serving the bundle.
 *
 * `hostUri` looks like "192.168.1.199:8081" — the dev machine's current
 * address, which is also the one running the backend. Deriving the API host
 * from it means a laptop that moves between networks (or on and off a phone
 * hotspot) keeps working without anyone editing .env, which is otherwise a
 * silent failure: the app just stops reaching the backend.
 */
function hostFromDevServer(): string | undefined {
  const host = Constants.expoConfig?.hostUri?.split(":")[0];
  return host ? `http://${host}:${BACKEND_PORT}` : undefined;
}

/**
 * Last resort when there's no dev server to learn from. Android emulators
 * reach the host machine through 10.0.2.2 — plain localhost points at the
 * emulator itself. iOS simulators share the host's network stack.
 */
const FALLBACK_BASE_URL = Platform.select({
  android: `http://10.0.2.2:${BACKEND_PORT}`,
  default: `http://localhost:${BACKEND_PORT}`,
});

/** EXPO_PUBLIC_API_URL wins when set — needed once the backend isn't local. */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? hostFromDevServer() ?? FALLBACK_BASE_URL;

/** How long to wait before giving up. Analysis runs a "deep" model call. */
const TIMEOUT_MS = 45_000;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    /** The backend's machine-readable code, e.g. "invalid_request". */
    readonly code: string,
    message: string,
    readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** True when the request failed before reaching the server at all. */
  get isNetworkError(): boolean {
    return this.status === 0;
  }
}

interface RequestOptions {
  method?: "GET" | "POST";
  body?: unknown;
  /** Attach the Supabase bearer token. Required by dashboard/practice/log. */
  auth?: boolean;
  signal?: AbortSignal;
}

async function parseError(res: Response): Promise<ApiError> {
  let code = "unknown_error";
  let message = `Request failed with status ${res.status}.`;
  let details: unknown;

  try {
    const body = (await res.json()) as {
      error?: string;
      message?: string;
      details?: unknown;
    };
    if (body.error) code = body.error;
    if (body.message) message = body.message;
    details = body.details;
  } catch {
    // Non-JSON error body (a proxy page, an HTML stack trace) — keep the
    // status-based message rather than masking it.
  }

  return new ApiError(res.status, code, message, details);
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = false, signal } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) Object.assign(headers, await getAuthHeaders());

  // Combine the caller's cancellation with our own timeout.
  const timeoutController = new AbortController();
  const timeout = setTimeout(() => timeoutController.abort(), TIMEOUT_MS);
  signal?.addEventListener("abort", () => timeoutController.abort());

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: timeoutController.signal,
    });
  } catch (err) {
    const aborted = signal?.aborted === true;
    throw new ApiError(
      0,
      aborted ? "cancelled" : "network_error",
      aborted
        ? "Request cancelled."
        : `Can't reach the backend at ${API_BASE_URL}. Is it running?`,
      err
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) throw await parseError(res);

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
