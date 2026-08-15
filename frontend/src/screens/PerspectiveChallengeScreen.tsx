import { useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { Screen, ScreenHeader } from "../ui/Screen";
import { TAB_BAR_CLEARANCE } from "../ui/TabBar";
import { InfoCard } from "../ui/Card";
import { GhostButton, PrimaryButton } from "../ui/Button";
import { StepDots } from "../ui/Progress";
import { TextField } from "../ui/TextField";
import type { PracticeScreenProps } from "../navigation/types";
import { colors, spacing, typography } from "../theme";

const MAX_LENGTH = 500;

/** Step 1 of 3 — write the strongest case for the side you don't hold. */
export function PerspectiveChallengeScreen({
  navigation,
  route,
}: PracticeScreenProps<"PerspectiveChallenge">) {
  const { topic, position } = route.params;
  const [attempt, setAttempt] = useState("");

  return (
    <Screen backdrop="practice">
      <ScreenHeader title="Perspective Challenge" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <StepDots count={3} current={0} />

        <Text style={styles.question}>{topic}</Text>
        <Text style={styles.position}>Argue for: {position}</Text>

        <TextField
          value={attempt}
          onChangeText={setAttempt}
          placeholder="Type your argument here…"
          minHeight={180}
          maxLength={MAX_LENGTH}
        />

        <InfoCard title="Tip!" body="Focus on facts, values, and logic — don't attack." />

        <PrimaryButton
          label="Next"
          onPress={() =>
            navigation.navigate("CompareReflect", {
              topic,
              position,
              userSteelman: attempt.trim() || undefined,
            })
          }
          disabled={!attempt.trim()}
        />
        <GhostButton
          label="Skip — just show me theirs"
          onPress={() => navigation.navigate("CompareReflect", { topic, position })}
        />
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
  position: { ...typography.caption, color: colors.inkSoft, textAlign: "center" },
});
