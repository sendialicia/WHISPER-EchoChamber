import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Screen } from "../ui/Screen";
import { Card, FeatureCard } from "../ui/Card";
import { LinkButton, OnDarkButton, PrimaryButton } from "../ui/Button";
import { SectionHeading } from "../ui/Progress";
import { Meter } from "../ui/Meter";
import { TAB_BAR_CLEARANCE } from "../ui/TabBar";
import { getEchoChamberMeter } from "../api/dashboard";
import { ApiError } from "../api/client";
import { isAuthConfigured } from "../auth/identity";
import { getName, getScanHistory, type ScanRecord } from "../storage/local";
import type { EchoChamberMeterResult } from "../api/types";
import type { HomeScreenProps } from "../navigation/types";
import { colors, spacing, typography } from "../theme";

/** Landing tab — where the user's own numbers live. */
export function HomeScreen({ navigation }: HomeScreenProps<"HomeMain">) {
  const [meter, setMeter] = useState<EchoChamberMeterResult | null>(null);
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [name, setName] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setHistory(await getScanHistory());
    setName((await getName()) ?? "");

    if (!isAuthConfigured()) {
      setNotice("Connect Supabase to start tracking your echo chamber meter.");
      setLoading(false);
      return;
    }

    try {
      setMeter(await getEchoChamberMeter());
      setNotice(null);
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : "Couldn't load your meter.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-read on every focus so a scan taken elsewhere shows up on return.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const shown = showAll ? history : history.slice(0, 3);

  return (
    <Screen backdrop="home">
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        {/* Someone who skipped the prompt is stored as an empty name,
            so the greeting quietly drops the comma rather than trailing off. */}
        <Text style={styles.greeting}>{name ? `Hi, ${name}` : "Hi there"}</Text>

        <FeatureCard>
          <Text style={styles.cardTitle}>Echo Chamber Meter</Text>
          {meter ? (
            <>
              <Meter
                score={meter.skewScore}
                caption={
                  meter.dominantSide
                    ? `You have been seeing one perspective across ${meter.topicsCovered} topic${meter.topicsCovered === 1 ? "" : "s"}.`
                    : `Across ${meter.topicsCovered} topic${meter.topicsCovered === 1 ? "" : "s"} you've scanned.`
                }
              />
              <OnDarkButton
                label="See Full Breakdown"
                onPress={() => navigation.getParent()?.navigate("Analysis")}
              />
            </>
          ) : (
            <Text style={styles.cardEmpty}>
              {notice ?? "Scan a few things and your balance will show up here."}
            </Text>
          )}
        </FeatureCard>

        <PrimaryButton label="Scan something" onPress={() => navigation.navigate("Scan")} />

        <View style={styles.section}>
          <SectionHeading
            title="Quick Scan History"
            trailing={
              history.length > 3 ? (
                <LinkButton
                  label={showAll ? "Show less" : "View All"}
                  onPress={() => setShowAll((v) => !v)}
                />
              ) : undefined
            }
          />

          {history.length === 0 ? (
            <Card>
              <Text style={styles.empty}>
                Nothing scanned yet. Anything you check will be listed here, on
                this device only.
              </Text>
            </Card>
          ) : (
            shown.map((scan) => (
              <Card key={scan.id}>
                <Text style={styles.scanExcerpt} numberOfLines={2}>
                  {scan.excerpt}
                </Text>
                <Text style={styles.scanMeta}>
                  {scan.mode === "fact_context" ? "Fact context" : "Two sides"}
                  {scan.tactic ? ` · ${scan.tactic.replace(/_/g, " ")}` : ""}
                  {" · "}
                  {new Date(scan.scannedAt).toLocaleDateString()}
                </Text>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: TAB_BAR_CLEARANCE, gap: spacing.md },
  greeting: { ...typography.display, color: colors.ink, marginBottom: spacing.xs },
  cardTitle: { ...typography.heading, color: colors.onDark, textAlign: "center" },
  cardEmpty: {
    ...typography.body,
    color: colors.onDarkSoft,
    textAlign: "center",
    lineHeight: 21,
    paddingVertical: spacing.lg,
  },
  section: { gap: spacing.sm, marginTop: spacing.sm },
  empty: { ...typography.body, color: colors.inkSoft, lineHeight: 21 },
  scanExcerpt: { ...typography.body, color: colors.ink },
  scanMeta: { ...typography.caption, color: colors.inkFaint },
});
