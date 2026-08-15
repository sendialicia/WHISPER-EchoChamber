/**
 * Web/iOS stub. Reading another app's screen has no equivalent outside
 * Android, so every check answers "not available" rather than throwing —
 * callers can then hide the feature instead of guarding each call.
 */
export default {
  isAccessibilityEnabled: () => false,
  isAccessibilityConnected: () => false,
  canDrawOverlay: () => false,
  openAccessibilitySettings: async () => {},
  openAppInfo: async () => {},
  requestOverlayPermission: async () => {},
  showButton: async () => false,
  hideButton: async () => {},
  isButtonShowing: () => false,
  buttonUsesAccessibilityOverlay: () => false,
  takePendingScan: async () => null,
  readScreenText: async () => null,
  captureScreen: async () => null,
  addListener: () => ({ remove: () => {} }),
};
