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
 */

export const SCREEN_CAPTURE_SUPPORTED = Platform.OS === "android";

const UNAVAILABLE: EchoOverlayPermissions = {
  accessibilityEnabled: false,
  accessibilityConnected: false,
  canDrawOverlay: false,
};

export function getPermissions(): EchoOverlayPermissions {
  if (!SCREEN_CAPTURE_SUPPORTED) return UNAVAILABLE;

  return {
    accessibilityEnabled: EchoOverlay.isAccessibilityEnabled(),
    accessibilityConnected: EchoOverlay.isAccessibilityConnected(),
    canDrawOverlay: EchoOverlay.canDrawOverlay(),
  };
}

export const openAccessibilitySettings = () => EchoOverlay.openAccessibilitySettings();
export const openAppInfo = () => EchoOverlay.openAppInfo();
export const requestOverlayPermission = () => EchoOverlay.requestOverlayPermission();

/**
 * Reads the foreground app, text first.
 *
 * Text is tried before a screenshot every time: it is instant, costs a
 * fraction as much to analyse, and sends only the words rather than a picture
 * of everything else on screen. The capture exists for apps that expose no
 * text at all.
 */
export async function readScreen(): Promise<ScreenReadResult> {
  if (!SCREEN_CAPTURE_SUPPORTED) return { text: null, imageBase64: null };

  const text = await EchoOverlay.readScreenText();
  if (text) return { text, imageBase64: null };

  const imageBase64 = await EchoOverlay.captureScreen();
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
