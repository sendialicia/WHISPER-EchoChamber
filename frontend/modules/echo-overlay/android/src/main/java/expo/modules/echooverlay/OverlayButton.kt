package expo.modules.echooverlay

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.PixelFormat
import android.os.Build
import android.util.Log
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewConfiguration
import android.view.WindowManager
import android.widget.ImageView
import kotlin.math.abs
import kotlin.math.roundToInt

/**
 * The draggable button that floats over other apps.
 *
 * It is owned by the accessibility service rather than by a service of its
 * own. That service is already bound by the system for as long as the user
 * leaves it switched on, so hosting the button there keeps it alive while they
 * browse — without a foreground service, its permanent notification, or the
 * two extra permissions that would come with it.
 */
class OverlayButton(
  private val context: Context,
  private val onTap: () -> Unit,
) {
  private val windowManager =
    context.getSystemService(Context.WINDOW_SERVICE) as WindowManager

  private var view: ImageView? = null
  private var params: WindowManager.LayoutParams? = null

  /**
   * Which window type actually worked. TYPE_ACCESSIBILITY_OVERLAY is tried
   * first because a service that owns it needs no draw-over-other-apps grant;
   * whether every OEM honours that is not something to bet on, so the ordinary
   * overlay type stays as a fallback.
   */
  var usedAccessibilityOverlay = false
    private set

  val isShowing: Boolean
    get() = view != null

  @SuppressLint("ClickableViewAccessibility")
  fun show(): Boolean {
    if (isShowing) return true

    val size = dp(SIZE_DP)
    val button = ImageView(context).apply {
      setImageResource(R.drawable.gema_overlay_mark)
      background = context.getDrawable(R.drawable.gema_overlay_bg)
      scaleType = ImageView.ScaleType.CENTER
      elevation = dp(6).toFloat()
      contentDescription = "GEMA — read this screen"
    }

    val layout = WindowManager.LayoutParams(
      size,
      size,
      overlayType(preferAccessibility = true),
      // Not focusable, so typing in the app underneath still works while the
      // button is up.
      WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
        WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
      PixelFormat.TRANSLUCENT
    ).apply {
      gravity = Gravity.TOP or Gravity.START
      x = dp(START_MARGIN_DP)
      y = dp(START_TOP_DP)
    }

    button.setOnTouchListener(DragTapListener(layout, ::onDragged, onTap))

    if (!addView(button, layout)) return false

    view = button
    params = layout
    return true
  }

  fun hide() {
    view?.let {
      runCatching { windowManager.removeView(it) }
        .onFailure { e -> Log.w(TAG, "Couldn't remove the button", e) }
    }
    view = null
    params = null
  }

  private fun addView(button: View, layout: WindowManager.LayoutParams): Boolean {
    // First attempt: the accessibility window type.
    try {
      windowManager.addView(button, layout)
      usedAccessibilityOverlay = layout.type == accessibilityOverlayType()
      return true
    } catch (e: Throwable) {
      Log.w(TAG, "Accessibility overlay refused, falling back", e)
    }

    // Second attempt: the ordinary overlay, which needs SYSTEM_ALERT_WINDOW.
    layout.type = overlayType(preferAccessibility = false)
    return try {
      windowManager.addView(button, layout)
      usedAccessibilityOverlay = false
      true
    } catch (e: Throwable) {
      Log.e(TAG, "Couldn't show the floating button at all", e)
      false
    }
  }

  private fun onDragged(dx: Int, dy: Int) {
    val layout = params ?: return
    val button = view ?: return
    layout.x += dx
    layout.y += dy
    runCatching { windowManager.updateViewLayout(button, layout) }
  }

  private fun overlayType(preferAccessibility: Boolean): Int = when {
    preferAccessibility -> accessibilityOverlayType()
    Build.VERSION.SDK_INT >= Build.VERSION_CODES.O ->
      WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
    else -> @Suppress("DEPRECATION") WindowManager.LayoutParams.TYPE_PHONE
  }

  private fun accessibilityOverlayType() =
    WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY

  private fun dp(value: Int): Int =
    (value * context.resources.displayMetrics.density).roundToInt()

  private companion object {
    const val TAG = "GemaOverlay"
    const val SIZE_DP = 56
    const val START_MARGIN_DP = 16
    const val START_TOP_DP = 240
  }
}

/**
 * Separates a drag from a tap.
 *
 * Without this the button either cannot be moved out of the way, or fires a
 * scan every time someone nudges it. Anything past the system's own touch slop
 * counts as a drag and suppresses the tap.
 */
private class DragTapListener(
  private val layout: WindowManager.LayoutParams,
  private val onDrag: (dx: Int, dy: Int) -> Unit,
  private val onTap: () -> Unit,
) : View.OnTouchListener {

  private var lastX = 0f
  private var lastY = 0f
  private var totalMovement = 0f
  private var slop = -1

  override fun onTouch(view: View, event: MotionEvent): Boolean {
    if (slop < 0) slop = ViewConfiguration.get(view.context).scaledTouchSlop

    return when (event.action) {
      MotionEvent.ACTION_DOWN -> {
        lastX = event.rawX
        lastY = event.rawY
        totalMovement = 0f
        view.alpha = 0.75f
        true
      }

      MotionEvent.ACTION_MOVE -> {
        val dx = event.rawX - lastX
        val dy = event.rawY - lastY
        totalMovement += abs(dx) + abs(dy)
        lastX = event.rawX
        lastY = event.rawY
        onDrag(dx.roundToInt(), dy.roundToInt())
        true
      }

      MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
        view.alpha = 1f
        if (event.action == MotionEvent.ACTION_UP && totalMovement <= slop) {
          onTap()
        }
        true
      }

      else -> false
    }
  }
}
