import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { Screen, ScreenHeader } from "../ui/Screen";
import { TAB_BAR_CLEARANCE } from "../ui/TabBar";
import { Card } from "../ui/Card";
import { GhostButton } from "../ui/Button";
import { API_BASE_URL } from "../api/client";
import { getUserId, isAuthConfigured } from "../auth/identity";
import { clearLocalData } from "../storage/local";
import type { SettingsScreenProps } from "../navigation/types";
import { colors, spacing, typography } from "../theme";

/** Privacy, connection state, and the surfaces that only exist for testing. */
export function SettingsScreen({ navigation }: SettingsScreenProps<"Settings">) {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    void getUserId().then(setUserId);
  }, []);

  const confirmClear = useCallback(() => {
    Alert.alert(
      "Clear local data?",
      "Removes your streak, bookmarks, and scan history from this device. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            void clearLocalData();
          },
        },
      ]
    );
  }, []);

  return (
    <Screen backdrop="home">
      <ScreenHeader title="Settings" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Card title="Your data">
          <Text style={styles.body}>
            Your streak, bookmarks, and scan history stay on this device.
            Nothing is uploaded unless you choose to sync a scan.
          </Text>
          <GhostButton label="Clear local data" onPress={confirmClear} />
        </Card>

        <Card title="Connection">
          <Row label="Backend" value={API_BASE_URL} />
          <Row
            label="Account"
            value={
              !isAuthConfigured()
                ? "Not configured"
                : userId
                  ? `Anonymous · ${userId.slice(0, 8)}…`
                  : "Signing in…"
            }
          />
          {!isAuthConfigured() ? (
            <Text style={styles.hint}>
              Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in
              .env to enable your dashboard, journal, and practice topics.
            </Text>
          ) : null}
        </Card>

        <Card title="Tone check">
          <Text style={styles.body}>
            In the finished app this runs as an overlay on top of whatever
            you're replying in. Until the accessibility service exists, you can
            paste a draft here to exercise the same endpoint.
          </Text>
          <GhostButton
            label="Open tone tester"
            onPress={() => navigation.navigate("ToneTester")}
          />
        </Card>
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: TAB_BAR_CLEARANCE, gap: spacing.md },
  body: { ...typography.body, color: colors.inkSoft, lineHeight: 21 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  rowLabel: { ...typography.label, color: colors.ink },
  rowValue: { ...typography.caption, color: colors.inkSoft, flex: 1, textAlign: "right" },
  hint: { ...typography.caption, color: colors.inkFaint, lineHeight: 18 },
});
