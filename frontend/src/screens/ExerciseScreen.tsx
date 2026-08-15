import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Screen, ScreenHeader } from "../ui/Screen";
import { TAB_BAR_CLEARANCE } from "../ui/TabBar";
import { Card, InfoCard, OppositeCard } from "../ui/Card";
import { PrimaryButton } from "../ui/Button";
import { StepDots } from "../ui/Progress";
import { getExercise } from "../api/practice";
import { ApiError } from "../api/client";
import { recordPractice } from "../storage/local";
import type { PracticeExercise } from "../api/types";
import type { PracticeScreenProps } from "../navigation/types";
import { colors, radius, spacing, typography } from "../theme";

/**
 * Step 3 of 3 — a short multiple-choice drill.
 *
 * The backend does return a correct index, but per the spec the user isn't
 * scored: after answering they see the explanation, not a mark. The index is
 * only used to decide which explanation framing to show.
 */
export function ExerciseScreen({ navigation }: PracticeScreenProps<"Exercise">) {
  const [exercise, setExercise] = useState<PracticeExercise | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const next = await getExercise("identify_framing");
        if (!cancelled) setExercise(next);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Couldn't load an exercise.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const submit = useCallback(async () => {
    setSubmitted(true);
    await recordPractice();
  }, []);

  return (
    <Screen backdrop="practice">
      <ScreenHeader title="Exercise" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <StepDots count={3} current={2} />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!exercise && !error ? <ActivityIndicator color={colors.primary} /> : null}

        {exercise ? (
          <>
            <Text style={styles.question}>{exercise.prompt}</Text>

            <OppositeCard>
              <Text style={styles.quote}>“{exercise.prompt}”</Text>
            </OppositeCard>

            <View style={styles.options}>
              {exercise.options.map((option, index) => {
                const selected = chosen === index;
                return (
                  <Pressable
                    key={option}
                    accessibilityRole="radio"
                    accessibilityState={{ selected, disabled: submitted }}
                    onPress={() => setChosen(index)}
                    disabled={submitted}
                    style={[styles.option, selected && styles.optionSelected]}
                  >
                    <Text style={styles.optionLabel}>{option}</Text>
                  </Pressable>
                );
              })}
            </View>

            {submitted ? (
              <>
                <InfoCard
                  title={
                    chosen === exercise.correctOptionIndex
                      ? "That's the one"
                      : "Worth a second look"
                  }
                  body={exercise.explanation}
                />
                <PrimaryButton
                  label="Finish"
                  onPress={() => navigation.popToTop()}
                />
              </>
            ) : (
              <PrimaryButton label="Submit" onPress={submit} disabled={chosen === null} />
            )}
          </>
        ) : null}

        {error ? (
          <Card>
            <Text style={styles.empty}>
              The exercise bank isn't populated yet — see EXERCISE_BANK in the
              backend's practice module.
            </Text>
          </Card>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: TAB_BAR_CLEARANCE, gap: spacing.md },
  question: {
    ...typography.title,
    color: colors.ink,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  quote: {
    ...typography.body,
    color: colors.primary,
    textAlign: "center",
    lineHeight: 22,
  },
  options: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  option: {
    flexGrow: 1,
    flexBasis: "45%",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    minHeight: 88,
    justifyContent: "flex-end",
  },
  optionSelected: { borderColor: colors.accent, borderWidth: 2 },
  optionLabel: { ...typography.label, color: colors.ink },
  error: { ...typography.body, color: colors.danger },
  empty: { ...typography.body, color: colors.inkSoft, lineHeight: 21 },
});
