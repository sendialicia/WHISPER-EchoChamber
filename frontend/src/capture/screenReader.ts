import { Platform } from "react-native";
import EchoOverlay from "../../modules/echo-overlay/src/EchoOverlayModule";
import type {
  EchoOverlayPermissions,
  ScreenReadResult,
} from "../../modules/echo-overlay/src/EchoOverlay.types";
import type { ScanContent } from "../api/types";

/**
 * Reading the screen, and the permissions that allow it.
 *
 * Android-only by nature: no other platform lets an app read or capture
 * another app's screen. Everything here answers "unavailable" elsewhere so the
 * UI can hide the feature in one place rather than guarding every call.
 *
 * Calls also go through `native`/`nativeAsync`, which check the function
 * exists first. In a dev build the JS reloads instantly while the native side
 * stays frozen in the installed APK, so any function added since the last
 * build is simply missing — and calling it blows up the whole screen with
 * "undefined is not a function" rather than pointing at the real problem.
 * Degrading instead keeps the app usable and makes the cause obvious.
 */

export const SCREEN_CAPTURE_SUPPORTED = Platform.OS === "android";

type NativeApi = typeof EchoOverlay;

function native<K extends keyof NativeApi, T>(
  name: K,
  call: (api: NativeApi) => T,
  fallback: T
): T {
  if (!SCREEN_CAPTURE_SUPPORTED) return fallback;

  if (typeof (EchoOverlay as unknown as Record<string, unknown>)[name as string] !== "function") {
    console.warn(
      `[screenReader] EchoOverlay.${String(name)} is missing from the installed build — rebuild the app to pick it up.`
    );
    return fallback;
  }

  return call(EchoOverlay);
}

const UNAVAILABLE: EchoOverlayPermissions = {
  accessibilityEnabled: false,
  accessibilityConnected: false,
  canDrawOverlay: false,
};

export function getPermissions(): EchoOverlayPermissions {
  if (!SCREEN_CAPTURE_SUPPORTED) return UNAVAILABLE;

  return {
    accessibilityEnabled: native("isAccessibilityEnabled", (a) => a.isAccessibilityEnabled(), false),
    accessibilityConnected: native("isAccessibilityConnected", (a) => a.isAccessibilityConnected(), false),
    canDrawOverlay: native("canDrawOverlay", (a) => a.canDrawOverlay(), false),
  };
}

// ----------------------------------------------------------------- settings

export const openAccessibilitySettings = () =>
  native("openAccessibilitySettings", (a) => a.openAccessibilitySettings(), Promise.resolve());

/** App info page — where Android 13+ hides "Allow restricted settings". */
export const openAppInfo = () =>
  native("openAppInfo", (a) => a.openAppInfo(), Promise.resolve());

export const requestOverlayPermission = () =>
  native("requestOverlayPermission", (a) => a.requestOverlayPermission(), Promise.resolve());

// ------------------------------------------------------------------- button

export const showFloatingButton = () =>
  native("showButton", (a) => a.showButton(), Promise.resolve(false));

export const hideFloatingButton = () =>
  native("hideButton", (a) => a.hideButton(), Promise.resolve());

export const isFloatingButtonShowing = () =>
  native("isButtonShowing", (a) => a.isButtonShowing(), false);

/** True when the button needed no draw-over-other-apps grant. */
export const buttonUsesAccessibilityOverlay = () =>
  native("buttonUsesAccessibilityOverlay", (a) => a.buttonUsesAccessibilityOverlay(), false);

/**
 * Fires when the floating button is tapped. The read has already happened by
 * then — collect it with [takePendingScan].
 */
export function onScanRequested(handler: () => void): () => void {
  if (!SCREEN_CAPTURE_SUPPORTED) return () => {};

  try {
    const sub = EchoOverlay.addListener("onScanRequested", handler);
    return () => sub.remove();
  } catch {
    // The event doesn't exist in an older build; nothing to unsubscribe.
    return () => {};
  }
}

// ------------------------------------------------------------------ reading

/** What the last button tap read, or null. Taking it clears it. */
export async function takePendingScan(): Promise<ScanContent | null> {
  const pending = await native("takePendingScan", (a) => a.takePendingScan(), Promise.resolve(null));
  return pending ? toScanContent(pending) : null;
}

/**
 * Reads the foreground app, text first.
 *
 * Text is tried before a screenshot every time: it is instant, costs a
 * fraction as much to analyse, and sends only the words rather than a picture
 * of everything else on screen. The capture exists for apps that expose no
 * text at all.
 */
export async function readScreen(): Promise<ScreenReadResult> {
  const text = await native("readScreenText", (a) => a.readScreenText(), Promise.resolve(null));
  if (text) return { text, imageBase64: null };

  const imageBase64 = await native("captureScreen", (a) => a.captureScreen(), Promise.resolve(null));
  return { text: null, imageBase64 };
}

/** Shapes a read into what the scan endpoints accept, or null if it failed. */
export function toScanContent(result: ScreenReadResult): ScanContent | null {
  if (result.text) return { text: result.text };
  if (result.imageBase64) {
    return { imageBase64: result.imageBase64, imageMimeType: "image/jpeg" };
  }
  return null;
}
