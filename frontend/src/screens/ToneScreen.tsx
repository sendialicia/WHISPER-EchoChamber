import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Screen, ScreenHeader } from "../ui/Screen";
import { Card, CardSection } from "../ui/Card";
import { GhostButton, PrimaryButton } from "../ui/Button";
import { Pill } from "../ui/Pill";
import { TextField } from "../ui/TextField";
import { checkTone } from "../api/tone";
import { ApiError } from "../api/client";
import type { ToneCheckResult } from "../api/types";
import type { SettingsScreenProps } from "../navigation/types";
import { colors, spacing, typography } from "../theme";

/**
 * Feature 2, as a testing surface.
 *
 * The shipped version is an overlay over the host app's compose box — it
 * reads the draft through the accessibility service and writes the rewrite
 * back with ACTION_SET_TEXT, which is what the "Fix It" button in the design
 * does. That needs native code. This screen exercises the same endpoint so
 * the prompt and the response shape can be checked in the meantime.
 */
export function ToneScreen({ navigation }: SettingsScreenProps<"ToneTester">) {
  const [draft, setDraft] = useState("");
  const [result, setResult] = useState<ToneCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async () => {
    if (!draft.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await checkTone({ draft: draft.trim() }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't check that draft.");
    } finally {
      setLoading(false);
    }
  }, [draft]);

  const applyRewrite = useCallback(() => {
    if (result?.suggested_rewrite) {
      setDraft(result.suggested_rewrite);
      setResult(null);
    }
  }, [result]);

  return (
    <Screen>
      <ScreenHeader title="Tone tester" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TextField
          value={draft}
          onChangeText={setDraft}
          placeholder="Write the reply you're about to send…"
          minHeight={160}
        />
        <PrimaryButton
          label="Check tone"
          onPress={check}
          loading={loading}
          disabled={!draft.trim()}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {result && !result.flagged ? (
          <Pill label="Reads clean" icon="✓" tone="positive" />
        ) : null}

        {result?.flagged ? (
          <View style={styles.result}>
            <Card title="Argument Suggestion">
              {result.tactic ? (
                <CardSection
                  label={result.tactic.replace(/_/g, " ")}
                  body="This is the pattern that stood out in your draft."
                  icon="⚠️"
                />
              ) : null}
              {result.suggested_rewrite ? (
                <CardSection
                  label="Suggested rewrite"
                  body={result.suggested_rewrite}
                  icon="✏️"
                />
              ) : null}
            </Card>
            {result.suggested_rewrite ? (
              <PrimaryButton label="Fix It" onPress={applyRewrite} />
            ) : null}
            <GhostButton label="Ignore" onPress={() => setResult(null)} />
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl, gap: spacing.md },
  result: { gap: spacing.sm },
  error: { ...typography.body, color: colors.danger },
});
