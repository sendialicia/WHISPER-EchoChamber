import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Screen, ScreenHeader } from "../ui/Screen";
import { Card, CardSection, OppositeCard } from "../ui/Card";
import { GhostButton, PrimaryButton } from "../ui/Button";
import { Pill } from "../ui/Pill";
import { TextField } from "../ui/TextField";
import { AnalyzingStages } from "../ui/AnalyzingStages";
import { analyze, triage } from "../api/scan";
import { ApiError } from "../api/client";
import { prepareImageForScan } from "../scan/prepareImage";
import { recordScan } from "../storage/local";
import type { AnalyzeResult, ScanContent } from "../api/types";
import type { HomeScreenProps } from "../navigation/types";
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

export function ScanScreen({ navigation }: HomeScreenProps<"Scan">) {
  const [draft, setDraft] = useState("");
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });

  const run = useCallback(async (content: ScanContent, excerpt: string) => {
    try {
      setPhase({ kind: "triaging" });
      const verdict = await triage(content);

      if (!verdict.is_controversial) {
        setPhase({ kind: "settled" });
        return;
      }

      setPhase({ kind: "analyzing" });
      const result = await analyze(content);
      await recordScan({ excerpt, mode: result.mode, tactic: result.tactic });
      setPhase({ kind: "result", result });
    } catch (err) {
      setPhase({
        kind: "error",
        message: err instanceof ApiError ? err.message : "Something went wrong.",
      });
    }
  }, []);

  const scanText = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    void run({ text }, text);
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
      await run(content, "Screenshot");
    } catch (err) {
      setPhase({
        kind: "error",
        message: err instanceof Error ? err.message : "Couldn't read that image.",
      });
    }
  }, [run]);

  const reset = useCallback(() => {
    setDraft("");
    setPhase({ kind: "idle" });
  }, []);

  const busy =
    phase.kind === "preparing" || phase.kind === "triaging" || phase.kind === "analyzing";

  return (
    <Screen>
      <ScreenHeader title="Scan" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {phase.kind === "idle" || phase.kind === "error" ? (
          <View style={styles.form}>
            <Text style={styles.subtitle}>
              Paste something you just read, or pick a screenshot of it.
            </Text>
            <TextField
              value={draft}
              onChangeText={setDraft}
              placeholder="Paste a post or comment…"
            />
            <PrimaryButton label="Scan this" onPress={scanText} disabled={!draft.trim()} />
            <GhostButton label="Pick a screenshot" onPress={scanScreenshot} />
            {phase.kind === "error" ? (
              <Text style={styles.error}>{phase.message}</Text>
            ) : null}
          </View>
        ) : null}

        {phase.kind === "preparing" || phase.kind === "triaging" ? (
          <View style={styles.centered}>
            <Pill label={phase.kind === "preparing" ? "Reading image…" : "Checking…"} />
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

        {busy ? null : <View style={styles.spacer} />}
      </ScrollView>
    </Screen>
  );
}

function ResultCard({ result, onDone }: { result: AnalyzeResult; onDone: () => void }) {
  const isFact = result.mode === "fact_context";

  return (
    <View style={styles.result}>
      <Text style={styles.resultHeading}>{isFact ? "Fact Check" : "Tactic Detected"}</Text>

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
          <CardSection label={result.side_a.label} body={result.side_a.steelman} icon="🅰️" />
        ) : null}

        {result.common_ground ? (
          <CardSection label="Common ground" body={result.common_ground} icon="🤝" />
        ) : null}

        {result.context_note ? (
          <CardSection label="Full context" body={result.context_note} icon="🔗" />
        ) : null}
      </Card>

      {result.side_b ? (
        <OppositeCard>
          <Text style={styles.oppositeLabel}>The Opposite Side</Text>
          <Text style={styles.oppositeTitle}>{result.side_b.label}</Text>
          <Text style={styles.oppositeBody}>{result.side_b.steelman}</Text>
        </OppositeCard>
      ) : null}

      <PrimaryButton label="Done" onPress={onDone} />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl, gap: spacing.lg },
  subtitle: { ...typography.body, color: colors.inkSoft },
  form: { gap: spacing.md },
  centered: { gap: spacing.xl, paddingVertical: spacing.xl },
  result: { gap: spacing.md },
  resultHeading: { ...typography.title, color: colors.ink, textAlign: "center" },
  oppositeLabel: { ...typography.caption, color: colors.inkSoft },
  oppositeTitle: { ...typography.label, color: colors.ink },
  oppositeBody: { ...typography.body, color: colors.ink, lineHeight: 21 },
  error: { ...typography.body, color: colors.danger },
  spacer: { height: spacing.xl },
});
