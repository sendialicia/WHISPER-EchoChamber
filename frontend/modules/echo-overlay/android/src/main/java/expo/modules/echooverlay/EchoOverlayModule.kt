package expo.modules.echooverlay

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import android.text.TextUtils
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * The JS-facing surface for reading the screen and for the permissions that
 * make it possible.
 *
 * Everything here is either a permission check or a one-shot read. Nothing
 * polls, and nothing runs unless JS asks — the accessibility service is
 * capable of watching continuously, and deliberately does not.
 */
class EchoOverlayModule : Module() {

  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("EchoOverlay")

    Events(ON_SCAN_REQUESTED)

    // The listener is only attached while JS is subscribed, so a tap on the
    // button never tries to reach a runtime that isn't there.
    OnStartObserving {
      GemaAccessibilityService.onButtonTap = { sendEvent(ON_SCAN_REQUESTED, emptyMap<String, Any>()) }
    }

    OnStopObserving {
      GemaAccessibilityService.onButtonTap = null
    }

    // ------------------------------------------------------------ the button

    /** False when the window system refused, e.g. no overlay grant at all. */
    AsyncFunction("showButton") {
      GemaAccessibilityService.instance?.showButton() ?: false
    }

    AsyncFunction("hideButton") {
      GemaAccessibilityService.instance?.hideButton()
    }

    Function("isButtonShowing") {
      GemaAccessibilityService.instance?.isButtonShowing == true
    }

    /**
     * True when the button got on screen through the accessibility window
     * type, which needs no draw-over-other-apps grant. The onboarding uses
     * this to stop asking for a permission that turned out to be unnecessary.
     */
    Function("buttonUsesAccessibilityOverlay") {
      GemaAccessibilityService.instance?.buttonUsesAccessibilityOverlay == true
    }

    /**
     * Collects what the last button tap read, or null if there is nothing
     * waiting. Taking it clears it — a scan is shown once, not replayed on
     * every screen focus.
     */
    AsyncFunction("takePendingScan") {
      GemaAccessibilityService.takePendingScan()?.let {
        mapOf("text" to it.text, "imageBase64" to it.imageBase64)
      }
    }

    // ------------------------------------------------------------ permissions

    Function("isAccessibilityEnabled") {
      isAccessibilityServiceEnabled()
    }

    /**
     * True once the service is actually bound, which lags the setting by a
     * moment. The onboarding waits on this rather than the setting so it never
     * moves on before a read would work.
     */
    Function("isAccessibilityConnected") {
      GemaAccessibilityService.isRunning
    }

    Function("canDrawOverlay") {
      Settings.canDrawOverlays(context)
    }

    AsyncFunction("openAccessibilitySettings") {
      launch(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
    }

    /**
     * Android 13+ greys out the accessibility toggle for anything installed
     * outside an app store until "Allow restricted settings" is chosen here.
     * Every sideloaded install hits this, so the onboarding sends people
     * straight to the page rather than describing where to find it.
     */
    AsyncFunction("openAppInfo") {
      launch(
        Intent(
          Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
          Uri.fromParts("package", context.packageName, null)
        )
      )
    }

    AsyncFunction("requestOverlayPermission") {
      launch(
        Intent(
          Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
          Uri.fromParts("package", context.packageName, null)
        )
      )
    }

    // ------------------------------------------------------------ reading

    /**
     * The text of whatever is on screen, or null when the app exposes none.
     * Null is the caller's cue to fall back to [captureScreen].
     */
    AsyncFunction("readScreenText") {
      GemaAccessibilityService.instance?.readVisibleText()
    }

    /**
     * Base64 JPEG of the current screen, or null if the platform refused.
     * Requires Android 11; below that there is no silent capture.
     */
    AsyncFunction("captureScreen") { promise: expo.modules.kotlin.Promise ->
      val service = GemaAccessibilityService.instance
      if (service == null) {
        promise.resolve(null)
        return@AsyncFunction
      }
      service.captureScreenshot { base64 -> promise.resolve(base64) }
    }
  }

  private fun launch(intent: Intent) {
    // Started from outside an Activity context, so it needs its own task.
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    context.startActivity(intent)
  }

  /**
   * Reads the system's own list of enabled services and looks for ours.
   * AccessibilityManager.getEnabledAccessibilityServiceList would also work,
   * but it reports services the user has turned on *and* the system has bound,
   * so it briefly disagrees with what the user just did in Settings.
   */
  private fun isAccessibilityServiceEnabled(): Boolean {
    val expected = "${context.packageName}/${GemaAccessibilityService::class.java.name}"

    val enabled = Settings.Secure.getString(
      context.contentResolver,
      Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
    ) ?: return false

    val splitter = TextUtils.SimpleStringSplitter(':')
    splitter.setString(enabled)
    while (splitter.hasNext()) {
      if (splitter.next().equals(expected, ignoreCase = true)) return true
    }
    return false
  }
}

private const val ON_SCAN_REQUESTED = "onScanRequested"
