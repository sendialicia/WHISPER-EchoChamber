package expo.modules.echooverlay

import android.accessibilityservice.AccessibilityService
import android.graphics.Bitmap
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import java.io.ByteArrayOutputStream
import java.util.concurrent.Executors

/**
 * Reads whatever is on screen, so a scan can start from any app.
 *
 * Two ways out, in order of preference:
 *
 *  - [readVisibleText] walks the accessibility tree. It is instant, costs
 *    nothing, and sends only the words that matter rather than a picture of
 *    everything on screen.
 *  - [captureScreenshot] is the fallback for apps that expose no text — ones
 *    that set FLAG_SECURE, draw into a canvas, or mark their views unimportant
 *    for accessibility.
 *
 * The capture is deliberately not MediaProjection: from Android 11 the
 * accessibility API can capture the screen straight from the hardware buffer,
 * with no per-capture consent dialog. That is the whole reason the floating
 * button can work in one tap. It also means this service can photograph
 * anything the user is looking at, silently — see the onboarding copy, which
 * says so plainly.
 */
class GemaAccessibilityService : AccessibilityService() {

  companion object {
    private const val TAG = "GemaA11y"

    /** Set while the service is connected; null whenever it isn't. */
    @Volatile
    var instance: GemaAccessibilityService? = null
      private set

    val isRunning: Boolean
      get() = instance != null

    /**
     * Set by the module while JS is listening. Held here rather than on the
     * instance because the service is created and destroyed by the system,
     * and the listener has to survive that.
     */
    @Volatile
    var onButtonTap: (() -> Unit)? = null

    /**
     * What the last button tap read, waiting to be collected.
     *
     * Parked here rather than pushed straight to JS because the app is usually
     * not running at the moment of the tap — it is being launched by that very
     * tap. Whoever collects it takes it: a scan is shown once, not replayed
     * every time the screen regains focus.
     */
    @Volatile
    private var pendingScan: PendingScan? = null

    fun takePendingScan(): PendingScan? {
      val scan = pendingScan
      pendingScan = null
      return scan
    }
  }

  /** One reading of the screen: text when it was exposed, an image if not. */
  data class PendingScan(val text: String?, val imageBase64: String?)

  // Read from the JS thread, written on the main thread.
  @Volatile
  private var overlay: OverlayButton? = null

  /**
   * Every window operation goes through here.
   *
   * WindowManager.addView must run on the main thread, and the module's
   * AsyncFunction bodies do not — Expo runs those on a background thread, so
   * calling straight through throws and the button silently never appears.
   */
  private val mainHandler = Handler(Looper.getMainLooper())

  private val screenshotExecutor = Executors.newSingleThreadExecutor()

  override fun onServiceConnected() {
    super.onServiceConnected()
    instance = this
  }

  override fun onUnbind(intent: android.content.Intent?): Boolean {
    hideButton()
    instance = null
    return super.onUnbind(intent)
  }

  override fun onDestroy() {
    hideButton()
    instance = null
    screenshotExecutor.shutdown()
    super.onDestroy()
  }

  // ------------------------------------------------------------ the button

  /** Calls back with false if the window system refused to show it. */
  fun showButton(onResult: (Boolean) -> Unit) {
    mainHandler.post {
      val existing = overlay
      if (existing != null && existing.isShowing) {
        onResult(true)
        return@post
      }

      val button = OverlayButton(this) { handleButtonTap() }
      overlay = button
      onResult(button.show())
    }
  }

  /**
   * Reads the screen, *then* opens the app.
   *
   * The order is the whole trick. Bringing GEMA forward first would make it
   * the foreground window, so the read would return GEMA's own interface
   * instead of the post the user was looking at. The result is parked for JS
   * to collect once it is running.
   */
  private fun handleButtonTap() {
    val text = readVisibleText()
    if (text != null) {
      deliver(PendingScan(text = text, imageBase64 = null))
      return
    }

    captureScreenshot { base64 ->
      deliver(PendingScan(text = null, imageBase64 = base64))
    }
  }

  private fun deliver(scan: PendingScan) {
    pendingScan = scan
    launchApp()
    onButtonTap?.invoke()
  }

  private fun launchApp() {
    val intent = packageManager.getLaunchIntentForPackage(packageName) ?: return
    intent.addFlags(
      android.content.Intent.FLAG_ACTIVITY_NEW_TASK or
        android.content.Intent.FLAG_ACTIVITY_SINGLE_TOP
    )
    runCatching { startActivity(intent) }
      .onFailure { e -> Log.w(TAG, "Couldn't bring GEMA forward", e) }
  }

  fun hideButton(onDone: () -> Unit = {}) {
    mainHandler.post {
      overlay?.hide()
      overlay = null
      onDone()
    }
  }

  val isButtonShowing: Boolean
    get() = overlay?.isShowing == true

  /** Whether the button got in without the draw-over-other-apps grant. */
  val buttonUsesAccessibilityOverlay: Boolean
    get() = overlay?.usedAccessibilityOverlay == true

  // Required by the base class. Nothing is done per-event on purpose: reacting
  // to every window change would mean continuously inspecting other apps, and
  // this service only ever reads when the user taps the button.
  override fun onAccessibilityEvent(event: AccessibilityEvent?) = Unit

  override fun onInterrupt() = Unit

  /**
   * Collects the visible text of the foreground window, in reading order.
   * Returns null when the window exposes nothing usable, which is the signal
   * to fall back to a screenshot.
   */
  fun readVisibleText(): String? {
    val root = rootInActiveWindow ?: return null
    val collected = mutableListOf<String>()

    try {
      collectText(root, collected, depth = 0)
    } finally {
      root.recycle()
    }

    // A couple of stray labels ("Home", "Post") is not content. Requiring a
    // little substance stops the fallback being skipped for a screen that
    // technically exposed a word or two.
    val text = collected.joinToString("\n").trim()
    return if (text.length >= MIN_USEFUL_TEXT) text else null
  }

  private fun collectText(node: AccessibilityNodeInfo?, into: MutableList<String>, depth: Int) {
    if (node == null || depth > MAX_DEPTH || into.size >= MAX_NODES) return

    // contentDescription carries the text for image-based posts, so it is
    // worth having when the node has no text of its own.
    val own = node.text?.toString()?.trim().takeUnless { it.isNullOrEmpty() }
      ?: node.contentDescription?.toString()?.trim().takeUnless { it.isNullOrEmpty() }

    if (own != null && isContent(node, own) && into.none { it == own }) {
      into.add(own)
    }

    for (i in 0 until node.childCount) {
      val child = node.getChild(i)
      collectText(child, into, depth + 1)
      child?.recycle()
    }
  }

  /**
   * Keeps writing, drops interface furniture.
   *
   * A tap reads the whole window, so on a feed the model would otherwise get
   * tab labels, button captions and like counts mixed in with the posts, and
   * has to guess which of it is the thing the user was annoyed by. Cutting the
   * obvious chrome here is cheaper and more reliable than asking it to.
   *
   * The bias is deliberately toward keeping: losing part of a post is far
   * worse than passing along a stray word.
   */
  private fun isContent(node: AccessibilityNodeInfo, text: String): Boolean {
    // Controls carry their own label — "Post", "Follow", "Reply" — never prose.
    val className = node.className?.toString().orEmpty()
    if (CONTROL_CLASSES.any { className.endsWith(it) }) return false

    // A short label on something tappable is a button or a tab. Real posts run
    // longer than this, and the ones that don't are carried by their neighbours.
    if (node.isClickable && text.length < SHORT_LABEL) return false

    // Counts and timestamps: "1.2K", "3 jt", "12h", "5 min", "08/10/2026".
    if (COUNT_OR_TIME.matches(text)) return false

    return true
  }

  /**
   * Captures the screen and returns it as base64 JPEG, or null if the platform
   * refuses. Callbacks arrive off the main thread, so [onResult] must not
   * assume otherwise.
   */
  fun captureScreenshot(onResult: (String?) -> Unit) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
      // Below Android 11 there is no silent capture, and MediaProjection's
      // per-capture dialog is a trade we decided against.
      onResult(null)
      return
    }

    takeScreenshot(
      android.view.Display.DEFAULT_DISPLAY,
      screenshotExecutor,
      object : TakeScreenshotCallback {
        override fun onSuccess(screenshot: ScreenshotResult) {
          val bitmap = try {
            Bitmap.wrapHardwareBuffer(screenshot.hardwareBuffer, screenshot.colorSpace)
          } catch (e: Throwable) {
            Log.w(TAG, "Couldn't read the captured frame", e)
            null
          } finally {
            screenshot.hardwareBuffer.close()
          }

          onResult(bitmap?.let(::encodeScaledJpeg))
        }

        override fun onFailure(errorCode: Int) {
          // ERROR_TAKE_SCREENSHOT_INTERVAL_TIME_SHORT lands here when taps come
          // faster than the platform's own throttle allows.
          Log.w(TAG, "Screen capture refused, code $errorCode")
          onResult(null)
        }
      }
    )
  }

  /**
   * A raw frame is several megabytes. Downscaling to the same width the app
   * uses elsewhere and encoding as JPEG lands around a tenth of that, with no
   * loss that matters for reading text off it.
   */
  private fun encodeScaledJpeg(source: Bitmap): String? = try {
    // wrapHardwareBuffer hands back a HARDWARE-config bitmap, whose pixels live
    // on the GPU and cannot be read directly — scaling one throws. Copying to
    // ARGB_8888 first brings it into memory where it can be resized.
    val software = source.copy(Bitmap.Config.ARGB_8888, false)

    if (software == null) {
      Log.w(TAG, "Couldn't move the capture off the GPU")
      null
    } else {
      val scale = TARGET_WIDTH.toFloat() / software.width
      val scaled = if (scale < 1f) {
        Bitmap.createScaledBitmap(
          software,
          TARGET_WIDTH,
          (software.height * scale).toInt(),
          true
        )
      } else {
        software
      }

      val encoded = ByteArrayOutputStream().use { out ->
        scaled.compress(Bitmap.CompressFormat.JPEG, JPEG_QUALITY, out)
        android.util.Base64.encodeToString(out.toByteArray(), android.util.Base64.NO_WRAP)
      }

      // These are full-screen bitmaps; leaving them to the collector means
      // several megabytes held per scan.
      if (scaled !== software) scaled.recycle()
      software.recycle()

      encoded
    }
  } catch (e: Throwable) {
    Log.w(TAG, "Couldn't encode the capture", e)
    null
  }
}

private const val MIN_USEFUL_TEXT = 40

/** Widget classes that only ever hold their own label, never prose. */
private val CONTROL_CLASSES = listOf(
  "Button",
  "ImageButton",
  "CheckBox",
  "RadioButton",
  "Switch",
  "ToggleButton",
  "Chip",
  "TabView",
)

/** Below this, a tappable label is chrome rather than something to analyse. */
private const val SHORT_LABEL = 25

/**
 * Engagement counts and timestamps in the formats social apps use, including
 * the Indonesian abbreviations (rb = ribu, jt = juta) the target audience sees.
 */
private val COUNT_OR_TIME = Regex(
  """^[\d.,]+\s*(rb|jt|k|m|b|%)?$|^\d+\s*(s|m|h|d|w|y|min|jam|hari|mgg|thn)$|^\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}$""",
  RegexOption.IGNORE_CASE
)
private const val MAX_DEPTH = 40
private const val MAX_NODES = 400
private const val TARGET_WIDTH = 1080
private const val JPEG_QUALITY = 80
