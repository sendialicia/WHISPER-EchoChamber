import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Screen, ScreenHeader } from "../ui/Screen";
import { TAB_BAR_CLEARANCE } from "../ui/TabBar";
import { Card, StackedFeatureCard } from "../ui/Card";
import { GhostButton, OnDarkButton } from "../ui/Button";
import { Flame } from "../ui/Icons";
import { getPracticeTopic } from "../api/practice";
import { ApiError } from "../api/client";
import { isAuthConfigured } from "../auth/identity";
import { getStreak, type Streak } from "../storage/local";
import type { PracticeTopic } from "../api/types";
import type { PracticeScreenProps } from "../navigation/types";
import { colors, radius, spacing, typography } from "../theme";

/** Feature 4 — the practice hub. */
export function PracticeHomeScreen({ navigation }: PracticeScreenProps<"PracticeHome">) {
  const [streak, setStreak] = useState<Streak>({ count: 0, lastPracticedOn: null });
  const [topic, setTopic] = useState<PracticeTopic | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setStreak(await getStreak());

    if (!isAuthConfigured()) {
      setNotice("Connect Supabase to get a topic from your own scan history.");
      setLoading(false);
      return;
    }

    try {
      setTopic(await getPracticeTopic());
      setNotice(null);
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : "Couldn't load a topic.");
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
    <Screen backdrop="practice">
      <ScreenHeader title="Practice" centered />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        <View style={styles.streak}>
          <Flame size={72} />
          <Text style={styles.streakCount}>{streak.count}</Text>
          <Text style={styles.streakLabel}>
            {streak.count === 1 ? "Day Streak!" : "Days Streak!"}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Choose A Practice</Text>

        {topic ? (
          <StackedFeatureCard>
            <View style={styles.cardTop}>
              <View style={styles.thumb} />
              <View style={styles.datePill}>
                <Text style={styles.dateText}>{new Date().toLocaleDateString()}</Text>
              </View>
            </View>
            <Text style={styles.cardKind}>Perspective</Text>
            <Text style={styles.cardTopic}>{formatTopic(topic.topic)}</Text>
            <OnDarkButton
              label="Play"
              onPress={() =>
                navigation.navigate("PerspectiveChallenge", {
                  topic: topic.topic,
                  position: topic.position,
                })
              }
            />
          </StackedFeatureCard>
        ) : (
          <Card>
            <Text style={styles.empty}>
              {notice ?? "No topic available yet — scan a few things first."}
            </Text>
          </Card>
        )}

        <Text style={styles.sectionTitle}>Critical Thinking</Text>
        <Card>
          <Text style={styles.exerciseBlurb}>
            Short activities that build media literacy — spotting framing,
            separating fact from opinion, weighing evidence.
          </Text>
          <GhostButton
            label="Start an exercise"
            onPress={() => navigation.navigate("Exercise")}
          />
        </Card>

        <Text style={styles.privacy}>
          All practice stays private on your device. You control your data, always.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: TAB_BAR_CLEARANCE, gap: spacing.md },
  streak: { alignItems: "center", gap: spacing.xs, paddingVertical: spacing.md },
  streakCount: { ...typography.hero, fontSize: 52, color: colors.ink },
  streakLabel: { ...typography.label, color: colors.inkSoft },
  sectionTitle: { ...typography.title, color: colors.ink, marginTop: spacing.sm },
  cardTop: { flexDirection: "row", alignItems: "flex-start" },
  thumb: {
    width: 118,
    height: 118,
    borderRadius: radius.md,
    backgroundColor: colors.lavender,
  },
  datePill: {
    marginLeft: "auto",
    backgroundColor: colors.deepPressed,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  dateText: { ...typography.caption, color: colors.onDark },
  cardKind: { ...typography.caption, color: colors.onDarkSoft },
  cardTopic: { ...typography.title, color: colors.onDark },
  exerciseBlurb: { ...typography.body, color: colors.inkSoft, lineHeight: 21 },
  empty: { ...typography.body, color: colors.inkSoft, lineHeight: 21 },
  privacy: {
    ...typography.caption,
    color: colors.inkFaint,
    textAlign: "center",
    marginTop: spacing.md,
    lineHeight: 18,
  },
});

/** "remote_work" reads as a slug; the card wants it as a title. */
function formatTopic(topic: string): string {
  return topic
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
