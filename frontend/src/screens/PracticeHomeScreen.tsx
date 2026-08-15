import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Screen } from "../ui/Screen";
import { Card, FeatureCard } from "../ui/Card";
import { GhostButton, OnDarkButton } from "../ui/Button";
import { getPracticeTopic } from "../api/practice";
import { ApiError } from "../api/client";
import { isAuthConfigured } from "../auth/identity";
import { getStreak, type Streak } from "../storage/local";
import type { PracticeTopic } from "../api/types";
import type { PracticeScreenProps } from "../navigation/types";
import { colors, spacing, typography } from "../theme";

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
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        <View style={styles.streak}>
          <Text style={styles.flame}>🔥</Text>
          <Text style={styles.streakCount}>{streak.count}</Text>
          <Text style={styles.streakLabel}>
            {streak.count === 1 ? "Day Streak!" : "Days Streak!"}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Choose A Practice</Text>

        {topic ? (
          <FeatureCard>
            <Text style={styles.cardDate}>{new Date().toLocaleDateString()}</Text>
            <Text style={styles.cardKind}>Perspective</Text>
            <Text style={styles.cardTopic}>{topic.topic}</Text>
            <OnDarkButton
              label="Play"
              onPress={() =>
                navigation.navigate("PerspectiveChallenge", {
                  topic: topic.topic,
                  position: topic.position,
                })
              }
            />
          </FeatureCard>
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
  scroll: { paddingBottom: spacing.xxl, gap: spacing.md },
  streak: { alignItems: "center", gap: spacing.xs, paddingVertical: spacing.lg },
  flame: { fontSize: 40 },
  streakCount: { fontSize: 48, fontWeight: "700", color: colors.ink },
  streakLabel: { ...typography.label, color: colors.inkSoft },
  sectionTitle: { ...typography.heading, color: colors.ink, marginTop: spacing.sm },
  cardDate: { ...typography.caption, color: colors.onDarkSoft, alignSelf: "flex-end" },
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
