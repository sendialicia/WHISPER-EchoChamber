import * as SecureStore from "expo-secure-store";

/**
 * A Supabase auth storage adapter backed by the device keystore.
 *
 * The backend's auth middleware is explicit that the session token belongs in
 * SecureStore rather than AsyncStorage, which isn't encrypted. The catch is
 * that SecureStore rejects large values — historically anything past roughly
 * 2KB on iOS — and a Supabase session (access token + refresh token + user
 * object) sits right around that line. So values are split across several
 * keys and stitched back together on read.
 *
 * Layout: `<key>` holds the chunk count, `<key>__0`, `<key>__1`, ... hold the
 * pieces. SecureStore keys allow alphanumerics, `.`, `-` and `_`, so the
 * double underscore is safe.
 */

// Characters, not bytes. Anonymous sessions are effectively all ASCII (no
// email or display name), so this stays well under the platform limit even
// if a stray multi-byte character shows up.
const CHUNK_SIZE = 1024;

const chunkKey = (key: string, index: number) => `${key}__${index}`;

async function readChunkCount(key: string): Promise<number> {
  const raw = await SecureStore.getItemAsync(key);
  if (raw === null) return 0;
  const count = Number.parseInt(raw, 10);
  return Number.isFinite(count) && count > 0 ? count : 0;
}

async function deleteChunks(key: string, from: number, to: number): Promise<void> {
  const deletions: Promise<void>[] = [];
  for (let i = from; i < to; i += 1) {
    deletions.push(SecureStore.deleteItemAsync(chunkKey(key, i)));
  }
  await Promise.all(deletions);
}

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    const count = await readChunkCount(key);
    if (count === 0) return null;

    const chunks = await Promise.all(
      Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(chunkKey(key, i)))
    );

    // A missing piece means the write was interrupted. Report it as absent
    // rather than handing Supabase a truncated session to choke on.
    if (chunks.some((chunk) => chunk === null)) return null;

    return chunks.join("");
  },

  async setItem(key: string, value: string): Promise<void> {
    const previousCount = await readChunkCount(key);

    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }

    await Promise.all(
      chunks.map((chunk, i) => SecureStore.setItemAsync(chunkKey(key, i), chunk))
    );
    await SecureStore.setItemAsync(key, String(chunks.length));

    // Drop leftovers from a longer previous session.
    if (previousCount > chunks.length) {
      await deleteChunks(key, chunks.length, previousCount);
    }
  },

  async removeItem(key: string): Promise<void> {
    const count = await readChunkCount(key);
    await deleteChunks(key, 0, count);
    await SecureStore.deleteItemAsync(key);
  },
};
