import { useCallback, useState } from "react";
import { AppState, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Screen, ScreenHeader } from "../ui/Screen";
import { Card, InfoCard } from "../ui/Card";
import { GhostButton, PrimaryButton } from "../ui/Button";
import { TAB_BAR_CLEARANCE } from "../ui/TabBar";
import {
  SCREEN_CAPTURE_SUPPORTED,
  getPermissions,
  hideFloatingButton,
  isFloatingButtonShowing,
  openAccessibilitySettings,
  openAppInfo,
  requestOverlayPermission,
  showFloatingButton,
} from "../capture/screenReader";
import type { EchoOverlayPermissions } from "../../modules/echo-overlay/src/EchoOverlay.types";
import type { SettingsScreenProps } from "../navigation/types";
import { colors, radius, spacing, typography } from "../theme";

/**
 * Turns on the two permissions the floating button needs.
 *
 * The order is not cosmetic. Android 13+ greys out the accessibility toggle
 * for anything installed outside an app store, and the option to unblock it is
 * hidden on the app info page until you have already tried and failed to flip
 * the toggle. Telling someone to "go to Accessibility and enable GEMA" without
 * that step sends them to a switch that will not move.
 */
export function PermissionsScreen({ navigation }: SettingsScreenProps<"Permissions">) {
  const [permissions, setPermissions] = useState<EchoOverlayPermissions>({
    accessibilityEnabled: false,
    accessibilityConnected: false,
    canDrawOverlay: false,
  });

  const [buttonShowing, setButtonShowing] = useState(false);
  const [buttonError, setButtonError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setPermissions(getPermissions());
    setButtonShowing(isFloatingButtonShowing());
  }, []);

  const toggleButton = useCallback(async () => {
    setButtonError(null);

    if (isFloatingButtonShowing()) {
      await hideFloatingButton();
      setButtonShowing(false);
      return;
    }

    const shown = await showFloatingButton();
    setButtonShowing(shown);
    if (!shown) {
      setButtonError(
        "Android wouldn't put the button on screen. Check that screen reading is on above, and that display over other apps is allowed."
      );
    }
  }, []);

  // Granting happens in the system's Settings app, so the only reliable moment
  // to re-check is when we come back to the foreground.
  useFocusEffect(
    useCallback(() => {
      refresh();
      const sub = AppState.addEventListener("change", (state) => {
        if (state === "active") refresh();
      });
      return () => sub.remove();
    }, [refresh])
  );

  if (!SCREEN_CAPTURE_SUPPORTED) {
    return (
      <Screen backdrop="home">
        <ScreenHeader title="Screen access" onBack={() => navigation.goBack()} />
        <Card>
          <Text style={styles.body}>
            Reading the screen of another app is only possible on Android. iOS
            gives no app that ability, so the floating button is Android-only.
          </Text>
        </Card>
      </Screen>
    );
  }

  const { accessibilityEnabled, accessibilityConnected, canDrawOverlay } = permissions;
  const ready = accessibilityConnected && canDrawOverlay;

  return (
    <Screen backdrop="home">
      <ScreenHeader title="Screen access" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          Two permissions let GEMA work from inside other apps. You can turn
          either off at any time.
        </Text>

        <Step
          index={1}
          title="Allow restricted settings"
          done={accessibilityEnabled}
          body={
            "Because GEMA was installed from a link rather than an app store, " +
            "Android locks the next step until you allow it here. Open app " +
            "info, tap the ⋮ menu in the corner, then “Allow restricted " +
            "settings”.\n\nIf you don't see that menu item yet, try step 2 " +
            "first — Android only reveals it once you've been blocked once."
          }
          action="Open app info"
          onPress={openAppInfo}
        />

        <Step
          index={2}
          title="Turn on screen reading"
          done={accessibilityConnected}
          body={
            "Settings → Accessibility → GEMA → switch it on.\n\n" +
            "This is what reads the post you're looking at when you tap the " +
            "button. It only reads on that tap — never in the background."
          }
          action="Open accessibility settings"
          onPress={openAccessibilitySettings}
        />

        <Step
          index={3}
          title="Show the floating button"
          done={canDrawOverlay}
          body={
            "Lets the button float above other apps so it's there when you " +
            "need it."
          }
          action="Allow display over other apps"
          onPress={requestOverlayPermission}
        />

        {accessibilityConnected ? (
          <Card title="Floating button">
            <Text style={styles.body}>
              {buttonShowing
                ? "The button is on screen. Drag it anywhere; tap it over a post and GEMA reads that screen and opens with the other side."
                : "Turn this on and a small GEMA button floats above other apps, ready whenever something gets a reaction out of you."}
            </Text>
            <PrimaryButton
              label={buttonShowing ? "Hide the button" : "Show the button"}
              onPress={toggleButton}
            />
            {buttonError ? <Text style={styles.error}>{buttonError}</Text> : null}
          </Card>
        ) : null}

        {ready && buttonShowing ? (
          <InfoCard
            title="All set"
            body="Open anything, tap the button over a post, and GEMA will read it and show you the other side."
          />
        ) : null}

        <Card title="What this lets GEMA do">
          <Text style={styles.body}>
            Screen reading is a powerful permission, and worth being clear
            about: while it is on, GEMA is able to read the text on any screen
            you open, and to take a screenshot without any indicator appearing.
          </Text>
          <Text style={styles.body}>
            It only does either when you tap the button, and what it reads is
            sent to GEMA's server to be analysed. Nothing is watched or stored
            in the background. Turning the switch off stops it completely.
          </Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}

function Step({
  index,
  title,
  body,
  action,
  onPress,
  done,
}: {
  index: number;
  title: string;
  body: string;
  action: string;
  onPress: () => void;
  done: boolean;
}) {
  return (
    <Card>
      <View style={styles.stepHead}>
        <View style={[styles.badge, done && styles.badgeDone]}>
          <Text style={[styles.badgeText, done && styles.badgeTextDone]}>
            {done ? "✓" : index}
          </Text>
        </View>
        <Text style={styles.stepTitle}>{title}</Text>
      </View>

      <Text style={styles.body}>{body}</Text>

      {done ? (
        <Text style={styles.doneNote}>Done</Text>
      ) : (
        <GhostButton label={action} onPress={onPress} />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: TAB_BAR_CLEARANCE, gap: spacing.md },
  intro: { ...typography.body, color: colors.inkSoft, lineHeight: 21 },
  stepHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  badge: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: colors.track,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeDone: { backgroundColor: colors.positive },
  badgeText: { ...typography.label, color: colors.deep },
  badgeTextDone: { color: colors.onDark },
  stepTitle: { ...typography.heading, color: colors.ink, flex: 1 },
  body: { ...typography.body, color: colors.inkSoft, lineHeight: 21 },
  doneNote: { ...typography.label, color: colors.positive },
  error: { ...typography.caption, color: colors.danger, lineHeight: 18 },
});
