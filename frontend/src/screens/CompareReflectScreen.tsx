import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text } from "react-native";
import { Screen, ScreenHeader } from "../ui/Screen";
import { TAB_BAR_CLEARANCE } from "../ui/TabBar";
import { Card, InfoCard, OppositeCard } from "../ui/Card";
import { PrimaryButton } from "../ui/Button";
import { StepDots } from "../ui/Progress";
import { compareSteelman } from "../api/practice";
import { ApiError } from "../api/client";
import { recordPractice } from "../storage/local";
import type { CompareResult } from "../api/types";
import type { PracticeScreenProps } from "../navigation/types";
import { colors, spacing, typography } from "../theme";

/**
 * Step 2 of 3 — the user's attempt beside the model's.
 *
 * Deliberately unscored, per the spec: the point is to notice the gap
 * yourself, not to be marked right or wrong.
 */
export function CompareReflectScreen({
  navigation,
  route,
}: PracticeScreenProps<"CompareReflect">) {
  const { topic, position, userSteelman } = route.params;
  const [result, setResult] = useState<CompareResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const comparison = await compareSteelman({ topic, position, userSteelman });
        if (cancelled) return;
        setResult(comparison);
        // The attempt counts as practice whether or not they wrote one.
        await recordPractice();
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Couldn't compare that.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [position, topic, userSteelman]);

  const next = useCallback(() => navigation.navigate("Exercise"), [navigation]);

  return (
    <Screen backdrop="practice">
      <ScreenHeader title="Compare & Reflect" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <StepDots count={3} current={1} />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!result && !error ? <ActivityIndicator color={colors.primary} /> : null}

        {result ? (
          <>
            {result.userSteelman ? (
              <>
                <Text style={styles.label}>Your response</Text>
                <Card>
                  <Text style={styles.body}>{result.userSteelman}</Text>
                </Card>
              </>
            ) : null}

            <Text style={styles.label}>The Opposite Side</Text>
            <OppositeCard>
              <Text style={styles.oppositeBody}>{result.aiSteelman}</Text>
            </OppositeCard>

            <InfoCard
              title="Results!"
              body={
                result.userSteelman
                  ? "Compare where the two differ — which reasons did the model reach for that you didn't?"
                  : "This is the strongest version of the case. Notice which parts you hadn't considered."
              }
            />

            <PrimaryButton label="Next" onPress={next} />
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: TAB_BAR_CLEARANCE, gap: spacing.sm },
  label: { ...typography.label, color: colors.ink, marginTop: spacing.sm },
  body: { ...typography.body, color: colors.inkSoft, lineHeight: 21 },
  oppositeBody: { ...typography.body, color: colors.ink, lineHeight: 21 },
  error: { ...typography.body, color: colors.danger },
});
