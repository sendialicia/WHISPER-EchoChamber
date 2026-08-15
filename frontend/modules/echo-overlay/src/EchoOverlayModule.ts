import { NativeModule, requireNativeModule } from "expo";

declare class EchoOverlayNativeModule extends NativeModule {
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

  /** Visible text of the foreground app, or null if it exposes none. */
  readScreenText(): Promise<string | null>;
  /** Base64 JPEG of the screen, or null if the platform refused. */
  captureScreen(): Promise<string | null>;
}

export default requireNativeModule<EchoOverlayNativeModule>("EchoOverlay");
