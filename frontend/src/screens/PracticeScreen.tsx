import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { Screen } from "../ui/Screen";
import { Card, CardSection } from "../ui/Card";
import { GhostButton, PrimaryButton } from "../ui/Button";
import { TextField } from "../ui/TextField";
import { compareSteelman, getPracticeTopic } from "../api/practice";
import { ApiError } from "../api/client";
import { isAuthConfigured } from "../auth/identity";
import type { CompareResult, PracticeTopic } from "../api/types";
import { colors, spacing, typography } from "../theme";

/**
 * Feature 4 — argue the other side, then see how the model did it.
 *
 * Per spec the comparison is never scored: the point is to notice the gap
 * yourself, not to be marked right or wrong.
 */
export function PracticeScreen() {
  const [topic, setTopic] = useState<PracticeTopic | null>(null);
  const [attempt, setAttempt] = useState("");
  const [comparison, setComparison] = useState<CompareResult | null>(null);
  const [loadingTopic, setLoadingTopic] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTopic = useCallback(async () => {
    if (!isAuthConfigured()) {
      setError(
        "Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to get a topic from your scan history."
      );
      setLoadingTopic(false);
      return;
    }

    setLoadingTopic(true);
    setError(null);
    setComparison(null);
    setAttempt("");
    try {
      setTopic(await getPracticeTopic());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't load a topic.");
    } finally {
      setLoadingTopic(false);
    }
  }, []);

  useEffect(() => {
    void loadTopic();
  }, [loadTopic]);

  const submit = useCallback(
    async (skip: boolean) => {
      if (!topic) return;
      setComparing(true);
      setError(null);
      try {
        setComparison(
          await compareSteelman({
            topic: topic.topic,
            position: topic.position,
            userSteelman: skip ? undefined : attempt.trim() || undefined,
          })
        );
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Couldn't compare that.");
      } finally {
        setComparing(false);
      }
    },
    [attempt, topic]
  );

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Practice</Text>
          <Text style={styles.subtitle}>
            Make the strongest case for a position you don't hold.
          </Text>
        </View>

        {loadingTopic ? <ActivityIndicator color={colors.ink} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {topic && !comparison ? (
          <View style={styles.form}>
            <Card title={topic.topic}>
              <CardSection label="Argue for" body={topic.position} />
            </Card>
            <TextField
              value={attempt}
              onChangeText={setAttempt}
              placeholder="Put the other side's best case in your own words…"
              minHeight={160}
            />
            <PrimaryButton
              label="Compare with the model"
              onPress={() => submit(false)}
              loading={comparing}
              disabled={!attempt.trim()}
            />
            <GhostButton
              label="Skip — just show me theirs"
              onPress={() => submit(true)}
              disabled={comparing}
            />
          </View>
        ) : null}

        {comparison ? (
          <View style={styles.form}>
            {comparison.userSteelman ? (
              <Card title="Yours">
                <Text style={styles.body}>{comparison.userSteelman}</Text>
              </Card>
            ) : null}
            <Card title="The model's">
              <Text style={styles.body}>{comparison.aiSteelman}</Text>
            </Card>
            <PrimaryButton label="Try another" onPress={loadTopic} />
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl, gap: spacing.xl },
  header: { gap: spacing.xs },
  title: { ...typography.display, color: colors.ink },
  subtitle: { ...typography.body, color: colors.inkSoft },
  form: { gap: spacing.md },
  body: { ...typography.body, color: colors.cardInkSoft, lineHeight: 21 },
  error: { ...typography.body, color: colors.danger },
});
