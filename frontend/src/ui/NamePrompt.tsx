import { useCallback, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MAX_NAME_LENGTH, setName } from "../storage/local";
import { colors, radius, spacing, typography } from "../theme";

/**
 * Asked once, on first launch, right after the landing animation.
 *
 * Purely for the greeting — the Supabase account stays anonymous and this
 * never leaves the device, which is why it is stored beside the streak rather
 * than attached to the user record. Skipping is a first-class option: the
 * greeting falls back to a plain hello and nothing else changes.
 */
export function NamePrompt({ onDone }: { onDone: (name: string) => void }) {
  const insets = useSafeAreaInsets();
  const [value, setValue] = useState("");

  const submit = useCallback(async () => {
    const name = value.trim();
    await setName(name);
    onDone(name);
  }, [onDone, value]);

  const skip = useCallback(async () => {
    // Stored empty rather than left unset, so they aren't asked again.
    await setName("");
    onDone("");
  }, [onDone]);

  return (
    <LinearGradient
      colors={["#3A75ED", "#2A56D8", "#1937B2"]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.fill}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.fill}
      >
        <View
          style={[
            styles.content,
            { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.lg },
          ]}
        >
          <View style={styles.disc}>
            <Image
              source={require("../../assets/splash-icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.copy}>
            <Text style={styles.title}>What should we call you?</Text>
            <Text style={styles.blurb}>
              Just for the greeting. It stays on this device and is never sent
              anywhere.
            </Text>
          </View>

          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder="Your name"
            placeholderTextColor="rgba(255, 255, 255, 0.55)"
            style={styles.input}
            maxLength={MAX_NAME_LENGTH}
            autoFocus
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={submit}
          />

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={submit}
              disabled={!value.trim()}
              style={({ pressed }) => [
                styles.primary,
                (!value.trim() || pressed) && styles.dimmed,
              ]}
            >
              <Text style={styles.primaryLabel}>Continue</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={skip}
              style={({ pressed }) => (pressed ? styles.dimmed : undefined)}
              hitSlop={12}
            >
              <Text style={styles.skip}>Skip for now</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  disc: {
    width: 130,
    height: 130,
    borderRadius: radius.pill,
    backgroundColor: colors.ground,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { width: 86, height: 86 },
  copy: { gap: spacing.sm, alignItems: "center" },
  title: { ...typography.display, color: colors.onDark, textAlign: "center" },
  blurb: {
    ...typography.body,
    color: colors.onDarkSoft,
    textAlign: "center",
    lineHeight: 21,
    maxWidth: 300,
  },
  input: {
    ...typography.heading,
    color: colors.onDark,
    alignSelf: "stretch",
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.32)",
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    textAlign: "center",
  },
  actions: { alignSelf: "stretch", gap: spacing.md, alignItems: "center" },
  primary: {
    alignSelf: "stretch",
    backgroundColor: colors.ground,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    minHeight: 52,
    justifyContent: "center",
  },
  primaryLabel: { ...typography.heading, color: colors.deep },
  skip: { ...typography.label, color: colors.onDarkSoft },
  dimmed: { opacity: 0.55 },
});
