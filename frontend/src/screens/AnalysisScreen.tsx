import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Screen, ScreenHeader } from "../ui/Screen";
import { Card, InfoCard } from "../ui/Card";
import { SegmentedControl } from "../ui/Button";
import { ShareBar } from "../ui/Progress";
import { getEchoChamberMeter } from "../api/dashboard";
import { ApiError } from "../api/client";
import { isAuthConfigured } from "../auth/identity";
import { getScanHistory, type ScanRecord } from "../storage/local";
import type { EchoChamberMeterResult } from "../api/types";
import { colors, radius, spacing, typography } from "../theme";

const TABS = ["Breakdown", "History"] as const;
type Tab = (typeof TABS)[number];

/** Feature 3 — the meter in detail, and the trail of scans behind it. */
export function AnalysisScreen() {
  const [tab, setTab] = useState<Tab>("Breakdown");
  const [meter, setMeter] = useState<EchoChamberMeterResult | null>(null);
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setHistory(await getScanHistory());

    if (!isAuthConfigured()) {
      setNotice("Connect Supabase to see your breakdown.");
      setLoading(false);
      return;
    }

    try {
      setMeter(await getEchoChamberMeter());
      setNotice(null);
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : "Couldn't load your breakdown.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return (
    <Screen>
      <ScreenHeader title="Echo Chamber Analysis" />

      <View style={styles.segments}>
        <SegmentedControl options={TABS} value={tab} onChange={setTab} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        {tab === "Breakdown" ? (
          <BreakdownTab meter={meter} notice={notice} />
        ) : (
          <HistoryTab history={history} />
        )}
      </ScrollView>
    </Screen>
  );
}

function BreakdownTab({
  meter,
  notice,
}: {
  meter: EchoChamberMeterResult | null;
  notice: string | null;
}) {
  if (!meter) {
    return (
      <Card>
        <Text style={styles.empty}>
          {notice ?? "Scan a few things and your breakdown will appear here."}
        </Text>
      </Card>
    );
  }

  const skew = Math.max(0, Math.min(1, meter.skewScore));

  return (
    <View style={styles.stack}>
      <View style={styles.readout}>
        <Text style={styles.percent}>{Math.round(skew * 100)}%</Text>
        <Text style={styles.percentLabel}>One sided</Text>
        <Text style={styles.percentCaption}>
          Across {meter.topicsCovered} topic{meter.topicsCovered === 1 ? "" : "s"} you've
          scanned so far.
        </Text>
      </View>

      <InfoCard
        title="What's this mean?"
        body={
          skew >= 0.6
            ? "Most of what you've checked argues the same way. That's not wrong on its own — it just means you're hearing one case well and the other barely at all."
            : "You've been seeing a reasonable mix of perspectives. Keep an eye on the topics below where one side dominates."
        }
      />

      <Card title="Breakdown by Perspective">
        <ShareBar label="Side A" value={skew} />
        <ShareBar label="Side B" value={1 - skew} />
      </Card>
    </View>
  );
}

function HistoryTab({ history }: { history: ScanRecord[] }) {
  if (history.length === 0) {
    return (
      <Card>
        <Text style={styles.empty}>
          Nothing scanned yet. Your history stays on this device.
        </Text>
      </Card>
    );
  }

  const groups = groupByDay(history);

  return (
    <View style={styles.stack}>
      {groups.map(([day, records]) => (
        <View key={day} style={styles.dayGroup}>
          <View style={styles.dayHeading}>
            <View style={styles.dayDot} />
            <Text style={styles.dayLabel}>{day}</Text>
          </View>
          {records.map((record) => (
            <Card key={record.id}>
              <Text style={styles.excerpt} numberOfLines={3}>
                {record.excerpt}
              </Text>
              <Text style={styles.meta}>
                {record.mode === "fact_context" ? "Fact context" : "Two sides"}
                {record.tactic ? ` · ${record.tactic.replace(/_/g, " ")}` : ""}
              </Text>
            </Card>
          ))}
        </View>
      ))}
    </View>
  );
}

/** "Today" / "Yesterday" / a date, in the order the mockup's timeline shows. */
function groupByDay(records: ScanRecord[]): [string, ScanRecord[]][] {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const buckets = new Map<string, ScanRecord[]>();

  for (const record of records) {
    const when = new Date(record.scannedAt);
    const daysAgo = Math.floor((startOfToday.getTime() - when.getTime()) / 86_400_000) + 1;

    const label =
      daysAgo <= 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo} days ago`;

    const existing = buckets.get(label);
    if (existing) existing.push(record);
    else buckets.set(label, [record]);
  }

  return [...buckets.entries()];
}

const styles = StyleSheet.create({
  segments: {
    flexDirection: "row",
    gap: spacing.xs,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.xs,
    marginBottom: spacing.md,
  },
  scroll: { paddingBottom: spacing.xxl },
  stack: { gap: spacing.md },
  readout: { alignItems: "center", gap: spacing.xs, paddingVertical: spacing.md },
  percent: { fontSize: 44, fontWeight: "700", color: colors.primary },
  percentLabel: { ...typography.heading, color: colors.ink },
  percentCaption: {
    ...typography.caption,
    color: colors.inkSoft,
    textAlign: "center",
    lineHeight: 18,
  },
  dayGroup: { gap: spacing.sm },
  dayHeading: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  dayDot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  dayLabel: { ...typography.label, color: colors.ink },
  excerpt: { ...typography.body, color: colors.ink },
  meta: { ...typography.caption, color: colors.inkFaint },
  empty: { ...typography.body, color: colors.inkSoft, lineHeight: 21 },
});
