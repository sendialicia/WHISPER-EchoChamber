import { NativeModule, requireNativeModule } from "expo";

export type EchoOverlayEvents = {
  /** The floating button was tapped; the read is waiting in takePendingScan. */
  onScanRequested: () => void;
};

declare class EchoOverlayNativeModule extends NativeModule<EchoOverlayEvents> {
  /** The user has switched the service on in Settings. */
  isAccessibilityEnabled(): boolean;
  /** The service is bound and would answer a read right now. */
  isAccessibilityConnected(): boolean;
  /** "Display over other apps" is granted. */
  canDrawOverlay(): boolean;

  openAccessibilitySettings(): Promise<void>;
  /** App info page — where Android 13+ hides "Allow restricted settings". */
  openAppInfo(): Promise<void>;
  requestOverlayPermission(): Promise<void>;

  /** False when the window system refused to show the button. */
  showButton(): Promise<boolean>;
  hideButton(): Promise<void>;
  isButtonShowing(): boolean;
  /** True when the button needed no draw-over-other-apps grant. */
  buttonUsesAccessibilityOverlay(): boolean;

  /** What the last tap read. Taking it clears it. */
  takePendingScan(): Promise<{
    text: string | null;
    imageBase64: string | null;
  } | null>;

  /** Visible text of the foreground app, or null if it exposes none. */
  readScreenText(): Promise<string | null>;
  /** Base64 JPEG of the screen, or null if the platform refused. */
  captureScreen(): Promise<string | null>;
}

export default requireNativeModule<EchoOverlayNativeModule>("EchoOverlay");
