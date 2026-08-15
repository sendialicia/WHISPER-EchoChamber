/** Where the permission flow currently stands. */
export interface EchoOverlayPermissions {
  /** The user has switched the service on in Settings. */
  accessibilityEnabled: boolean;
  /** The service is bound and would answer a read right now. */
  accessibilityConnected: boolean;
  /** "Display over other apps" is granted — needed for the floating button. */
  canDrawOverlay: boolean;
}

/**
 * What a read produced. `text` is preferred; `imageBase64` only appears when
 * the screen exposed no usable text, and both are null when nothing could be
 * read at all.
 */
export interface ScreenReadResult {
  text: string | null;
  imageBase64: string | null;
}
