import "react-native-url-polyfill/auto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { secureStorage } from "./secureStorage";

/**
 * Who the user is, as far as the backend is concerned.
 *
 * The authed routes (dashboard, practice/topic, log/scan) verify a Supabase
 * JWT against the project's JWKS and take the user from the token's `sub` —
 * so a locally invented user id would not get past them. Anonymous sign-in
 * gives us a real, verifiable token without putting a login screen in front
 * of anyone: the account is created on first launch and persists in the
 * device keystore from then on.
 *
 * Scan and tone don't require auth, so the app stays useful even when
 * Supabase isn't configured yet — see `isAuthConfigured`.
 */

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * False until the Supabase project is wired up. Screens that need auth check
 * this so they can explain themselves instead of failing with a raw 401.
 */
export function isAuthConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

const supabase: SupabaseClient | null = isAuthConfigured()
  ? createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      auth: {
        storage: secureStorage,
        autoRefreshToken: true,
        persistSession: true,
        // Sessions arrive from the SDK, never from a redirect URL, so there
        // is nothing in the app's deep links for Supabase to parse.
        detectSessionInUrl: false,
      },
    })
  : null;

// One in-flight sign-in at most: several screens mount at once on launch and
// would otherwise each create their own anonymous user.
let pendingSignIn: Promise<string | null> | null = null;

async function signInAnonymously(): Promise<string | null> {
  if (!supabase) return null;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.warn("[identity] anonymous sign-in failed:", error.message);
    return null;
  }
  return data.session?.access_token ?? null;
}

/**
 * Returns a valid access token, signing in anonymously the first time.
 * Null means auth isn't configured or sign-in failed — callers should treat
 * that as "no authed features", not as a crash.
 */
export async function getAccessToken(): Promise<string | null> {
  if (!supabase) return null;

  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) return data.session.access_token;

  if (!pendingSignIn) {
    pendingSignIn = signInAnonymously().finally(() => {
      pendingSignIn = null;
    });
  }
  return pendingSignIn;
}

/** The authenticated user's UUID, or null when there's no session. */
export async function getUserId(): Promise<string | null> {
  if (!supabase) return null;

  const { data } = await supabase.auth.getSession();
  if (data.session?.user.id) return data.session.user.id;

  await getAccessToken();
  const { data: refreshed } = await supabase.auth.getSession();
  return refreshed.session?.user.id ?? null;
}

/** Headers for an authed request. Empty when there's no session to send. */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
