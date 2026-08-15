import type { ScanContent } from "../api/types";

/**
 * Hands a scan from the floating button to the scan screen.
 *
 * Kept out of navigation params on purpose: a screenshot is a few hundred
 * kilobytes of base64, and route params end up in navigation state that gets
 * serialised. A module-level handoff keeps the payload out of that entirely.
 *
 * Taking the value clears it, so a scan is run once rather than re-running
 * every time the screen regains focus.
 */

let pending: ScanContent | null = null;
const listeners = new Set<() => void>();

export function setPendingScan(content: ScanContent): void {
  pending = content;
  listeners.forEach((listener) => listener());
}

export function takePendingScan(): ScanContent | null {
  const value = pending;
  pending = null;
  return value;
}

export function subscribeToPendingScan(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
