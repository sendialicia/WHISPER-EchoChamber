import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { backgroundGradient, spacing } from "../theme";

/**
 * The gradient ground every screen sits on. Dark-only by design — the
 * mockups have no light variant, so there's nothing to switch on here.
 */
export function Screen({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={backgroundGradient}
      locations={[0, 0.55, 1]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.fill}
    >
      <View style={[styles.content, { paddingTop: insets.top + spacing.md }]}>
        {children}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { flex: 1, paddingHorizontal: spacing.lg },
});
