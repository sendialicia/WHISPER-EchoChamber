import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Screen } from "../ui/Screen";
import { Card, CardSection } from "../ui/Card";
import { GhostButton, PrimaryButton } from "../ui/Button";
import { Pill } from "../ui/Pill";
import { TextField } from "../ui/TextField";
import { AnalyzingStages } from "../ui/AnalyzingStages";
import { analyze, triage } from "../api/scan";
import { ApiError } from "../api/client";
import { prepareImageForScan } from "../scan/prepareImage";
import type { AnalyzeResult, ScanContent } from "../api/types";
import { colors, spacing, typography } from "../theme";

/**
 * Feature 1 — the whole pipeline in one screen.
 *
 * Once the overlay and accessibility service exist, this same flow runs with
 * content handed in from outside rather than typed. The picker is here so the
 * screenshot path can be exercised end to end before any Kotlin is written.
 */

type Phase =
  | { kind: "idle" }
  | { kind: "preparing" }
  | { kind: "triaging" }
  | { kind: "settled" }
  | { kind: "analyzing" }
  | { kind: "result"; result: AnalyzeResult }
  | { kind: "error"; message: string };

const TACTIC_LABELS: Record<string, string> = {
  emotional_loading: "Emotional loading",
  cherry_picking: "Cherry-picking",
  false_dichotomy: "False dichotomy",
  strawman: "Strawman",
  loaded_language: "Loaded language",
  whataboutism: "Whataboutism",
  appeal_to_fear: "Appeal to fear",
  false_balance: "False balance",
  ad_hominem: "Ad hominem",
};

export function ScanScreen() {
  const [draft, setDraft] = useState("");
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });

  const run = useCallback(async (content: ScanContent) => {
    try {
      setPhase({ kind: "triaging" });
      const verdict = await triage(content);

      if (!verdict.is_controversial) {
        setPhase({ kind: "settled" });
        return;
      }

      setPhase({ kind: "analyzing" });
      const result = await analyze(content);
      setPhase({ kind: "result", result });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Something went wrong. Try again.";
      setPhase({ kind: "error", message });
    }
  }, []);

  const scanText = useCallback(() => {
    if (!draft.trim()) return;
    void run({ text: draft.trim() });
  }, [draft, run]);

  const scanScreenshot = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setPhase({
        kind: "error",
        message: "EchoBreaker needs photo access to read a screenshot.",
      });
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
    });
    if (picked.canceled) return;

    try {
      setPhase({ kind: "preparing" });
      const content = await prepareImageForScan(picked.assets[0].uri);
      await run(content);
    } catch (err) {
      setPhase({
        kind: "error",
        message: err instanceof Error ? err.message : "Couldn't read that image.",
      });
    }
  }, [run]);

  const reset = useCallback(() => setPhase({ kind: "idle" }), []);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Scan</Text>
          <Text style={styles.subtitle}>
            Paste something you just read, or pick a screenshot of it.
          </Text>
        </View>

        {phase.kind === "idle" || phase.kind === "error" ? (
          <View style={styles.form}>
            <TextField
              value={draft}
              onChangeText={setDraft}
              placeholder="Paste a post or comment…"
            />
            <PrimaryButton
              label="Scan this"
              onPress={scanText}
              disabled={!draft.trim()}
            />
            <GhostButton label="Pick a screenshot" onPress={scanScreenshot} />
            {phase.kind === "error" ? (
              <Text style={styles.error}>{phase.message}</Text>
            ) : null}
          </View>
        ) : null}

        {phase.kind === "preparing" || phase.kind === "triaging" ? (
          <View style={styles.centered}>
            <Pill
              label={phase.kind === "preparing" ? "Reading image…" : "Checking…"}
            />
          </View>
        ) : null}

        {phase.kind === "settled" ? (
          <View style={styles.centered}>
            <Pill label="No Significant Framing Detected" icon="✓" tone="positive" />
            <GhostButton label="Scan something else" onPress={reset} />
          </View>
        ) : null}

        {phase.kind === "analyzing" ? (
          <View style={styles.centered}>
            <AnalyzingStages />
          </View>
        ) : null}

        {phase.kind === "result" ? (
          <ResultCard result={phase.result} onDone={reset} />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function ResultCard({
  result,
  onDone,
}: {
  result: AnalyzeResult;
  onDone: () => void;
}) {
  const isFact = result.mode === "fact_context";

  return (
    <View style={styles.result}>
      <Text style={styles.resultHeading}>
        {isFact ? "Fact Check" : "Tactic Detected"}
      </Text>

      <Card>
        {!isFact && result.tactic ? (
          <CardSection
            label={TACTIC_LABELS[result.tactic] ?? result.tactic}
            body="This is how the content is framed — not proof that it's wrong."
            icon="⚠️"
          />
        ) : null}

        {isFact && result.fact_summary ? (
          <CardSection label="What's established" body={result.fact_summary} icon="✅" />
        ) : null}

        {result.side_a ? (
          <CardSection
            label={result.side_a.label}
            body={result.side_a.steelman}
            icon="🅰️"
          />
        ) : null}

        {result.side_b ? (
          <CardSection
            label={result.side_b.label}
            body={result.side_b.steelman}
            icon="🅱️"
          />
        ) : null}

        {result.common_ground ? (
          <CardSection label="Common ground" body={result.common_ground} icon="🤝" />
        ) : null}

        {result.context_note ? (
          <CardSection label="Full context" body={result.context_note} icon="🔗" />
        ) : null}
      </Card>

      <PrimaryButton label="Done" onPress={onDone} />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl, gap: spacing.xl },
  header: { gap: spacing.xs },
  title: { ...typography.display, color: colors.ink },
  subtitle: { ...typography.body, color: colors.inkSoft },
  form: { gap: spacing.md },
  centered: { gap: spacing.xl, paddingVertical: spacing.xl },
  result: { gap: spacing.lg },
  resultHeading: {
    ...typography.title,
    color: colors.ink,
    textAlign: "center",
  },
  error: { ...typography.body, color: colors.danger },
});
