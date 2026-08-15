import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Screen } from "../ui/Screen";
import { Card, CardSection } from "../ui/Card";
import { PrimaryButton, GhostButton } from "../ui/Button";
import { Pill } from "../ui/Pill";
import { TextField } from "../ui/TextField";
import { checkTone } from "../api/tone";
import { ApiError } from "../api/client";
import type { ToneCheckResult } from "../api/types";
import { colors, spacing, typography } from "../theme";

/** Feature 2 — run a draft reply past the model before it gets sent. */
export function ToneScreen() {
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

  const useRewrite = useCallback(() => {
    if (result?.suggested_rewrite) {
      setDraft(result.suggested_rewrite);
      setResult(null);
    }
  }, [result]);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Tone</Text>
          <Text style={styles.subtitle}>
            Check a reply before you send it. Nothing leaves your draft box.
          </Text>
        </View>

        <View style={styles.form}>
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
        </View>

        {result && !result.flagged ? (
          <Pill label="Reads clean" icon="✓" tone="positive" />
        ) : null}

        {result?.flagged ? (
          <View style={styles.result}>
            <Card>
              {result.tactic ? (
                <CardSection
                  label={result.tactic}
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
              <GhostButton label="Use this rewrite" onPress={useRewrite} />
            ) : null}
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
  result: { gap: spacing.md },
  error: { ...typography.body, color: colors.danger },
});
