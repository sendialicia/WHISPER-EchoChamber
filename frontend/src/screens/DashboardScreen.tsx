import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Screen } from "../ui/Screen";
import { Card, CardSection } from "../ui/Card";
import {
  getEchoChamberMeter,
  getReflectionJournal,
  getSourceDiversity,
} from "../api/dashboard";
import { ApiError } from "../api/client";
import { isAuthConfigured } from "../auth/identity";
import type {
  EchoChamberMeterResult,
  ReflectionJournalEntry,
  SourceDiversityNudge,
} from "../api/types";
import { colors, radius, spacing, typography } from "../theme";

/** Feature 3 — read-only aggregation of the user's own scan history. */
export function DashboardScreen() {
  const [meter, setMeter] = useState<EchoChamberMeterResult | null>(null);
  const [nudges, setNudges] = useState<SourceDiversityNudge[]>([]);
  const [journal, setJournal] = useState<ReflectionJournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAuthConfigured()) {
      setError(
        "Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to enable your dashboard."
      );
      setLoading(false);
      return;
    }

    setError(null);
    try {
      const [m, n, j] = await Promise.all([
        getEchoChamberMeter(),
        getSourceDiversity(),
        getReflectionJournal(),
      ]);
      setMeter(m);
      setNudges(n);
      setJournal(j);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Couldn't load your dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            tintColor={colors.ink}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>
            Where your attention has been going.
          </Text>
        </View>

        {loading && !meter ? <ActivityIndicator color={colors.ink} /> : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {meter ? (
          <Card title="Echo chamber meter">
            <SkewBar score={meter.skewScore} />
            <Text style={styles.meterCaption}>
              {meter.topicsCovered} topic{meter.topicsCovered === 1 ? "" : "s"} seen
              {meter.dominantSide ? ` · leaning ${meter.dominantSide}` : ""}
            </Text>
          </Card>
        ) : null}

        {nudges.length > 0 ? (
          <Card title="Worth reading next">
            {nudges.map((nudge) => (
              <CardSection
                key={`${nudge.topic}-${nudge.suggestedReadingUrl}`}
                label={nudge.suggestedReadingTitle}
                body={nudge.reason}
              />
            ))}
          </Card>
        ) : null}

        {journal.length > 0 ? (
          <Card title="What keeps pulling you in">
            {journal.map((entry) => (
              <CardSection
                key={entry.topic}
                label={entry.topic}
                body={`${entry.occurrences} time${entry.occurrences === 1 ? "" : "s"} · last ${new Date(entry.lastTriggeredAt).toLocaleDateString()}`}
              />
            ))}
          </Card>
        ) : null}

        {!loading && !error && !meter ? (
          <Text style={styles.subtitle}>
            Nothing here yet — scan something and it'll show up.
          </Text>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

/** 0 is balanced exposure, 1 is entirely one-sided. */
function SkewBar({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(1, score));
  const percent = Math.round(clamped * 100);

  return (
    <View style={styles.skew}>
      <View
        style={styles.skewTrack}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: percent }}
      >
        <View style={[styles.skewFill, { width: `${percent}%` }]} />
      </View>
      <Text style={styles.skewLabel}>
        {percent}% one-sided
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl, gap: spacing.lg },
  header: { gap: spacing.xs },
  title: { ...typography.display, color: colors.ink },
  subtitle: { ...typography.body, color: colors.inkSoft },
  error: { ...typography.body, color: colors.danger },
  skew: { gap: spacing.sm },
  skewTrack: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: "#E9ECF2",
    overflow: "hidden",
  },
  skewFill: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  skewLabel: { ...typography.label, color: colors.cardInk },
  meterCaption: { ...typography.caption, color: colors.cardInkSoft },
});
