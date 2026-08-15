import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AnalyzeResult } from "../api/types";

/**
 * On-device state for the parts of the design the backend doesn't cover:
 * the practice streak, bookmarked readings, and recent scans.
 *
 * AsyncStorage rather than SecureStore on purpose — none of this is a
 * credential, and SecureStore's ~2KB ceiling would fight the history list.
 * It also matches what the app promises the user: practice and scan history
 * stay on the device.
 */

// Prefix predates the rename to GEMA. Left alone deliberately: changing it
// would orphan the streak and bookmarks already on people's devices.
const KEYS = {
  streak: "echobreaker.streak",
  bookmarks: "echobreaker.bookmarks",
  scans: "echobreaker.scans",
} as const;

const MAX_SCANS = 50;

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    // Corrupt or unreadable — start over rather than crashing a screen.
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

// ------------------------------------------------------------------ streak

export interface Streak {
  count: number;
  /** ISO date (YYYY-MM-DD) of the last day a practice was completed. */
  lastPracticedOn: string | null;
}

const EMPTY_STREAK: Streak = { count: 0, lastPracticedOn: null };

/** Local calendar day. Streaks are a human idea, so local time is correct. */
function today(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00`).getTime();
  const b = new Date(`${to}T00:00:00`).getTime();
  return Math.round((b - a) / 86_400_000);
}

export async function getStreak(): Promise<Streak> {
  const stored = await readJson<Streak>(KEYS.streak, EMPTY_STREAK);
  if (!stored.lastPracticedOn) return stored;

  // A streak the user has already broken should read as broken before they
  // practise again, not stay frozen at its old number.
  const gap = daysBetween(stored.lastPracticedOn, today());
  return gap > 1 ? EMPTY_STREAK : stored;
}

/** Call once a practice is finished. Practising twice in a day doesn't double-count. */
export async function recordPractice(): Promise<Streak> {
  const current = await getStreak();
  const now = today();

  if (current.lastPracticedOn === now) return current;

  const continued = current.lastPracticedOn
    ? daysBetween(current.lastPracticedOn, now) === 1
    : false;

  const next: Streak = {
    count: continued ? current.count + 1 : 1,
    lastPracticedOn: now,
  };
  await writeJson(KEYS.streak, next);
  return next;
}

// --------------------------------------------------------------- bookmarks

export interface Bookmark {
  id: string;
  title: string;
  note: string;
  url?: string;
  savedAt: string;
}

export async function getBookmarks(): Promise<Bookmark[]> {
  return readJson<Bookmark[]>(KEYS.bookmarks, []);
}

/** Adds or removes by id. Returns the list as it now stands. */
export async function toggleBookmark(entry: Omit<Bookmark, "savedAt">): Promise<Bookmark[]> {
  const current = await getBookmarks();
  const existing = current.findIndex((b) => b.id === entry.id);

  const next =
    existing >= 0
      ? current.filter((_, i) => i !== existing)
      : [{ ...entry, savedAt: new Date().toISOString() }, ...current];

  await writeJson(KEYS.bookmarks, next);
  return next;
}

// ------------------------------------------------------------ scan history

export interface ScanRecord {
  id: string;
  /** What was scanned, trimmed for the list. */
  excerpt: string;
  mode: AnalyzeResult["mode"];
  tactic: string | null;
  scannedAt: string;
}

export async function getScanHistory(): Promise<ScanRecord[]> {
  return readJson<ScanRecord[]>(KEYS.scans, []);
}

export async function recordScan(
  entry: Omit<ScanRecord, "id" | "scannedAt">
): Promise<ScanRecord[]> {
  const current = await getScanHistory();
  const next = [
    {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      scannedAt: new Date().toISOString(),
    },
    ...current,
  ].slice(0, MAX_SCANS);

  await writeJson(KEYS.scans, next);
  return next;
}

export async function clearLocalData(): Promise<void> {
  await AsyncStorage.multiRemove([KEYS.streak, KEYS.bookmarks, KEYS.scans]);
}
