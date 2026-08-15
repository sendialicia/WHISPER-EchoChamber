import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radius, spacing, typography } from "../theme";

/**
 * The staged progress list from the analysis mockup.
 *
 * Analysis is a single backend call, so these stages are presentational:
 * they name what the model is doing rather than tracking real sub-requests.
 * That's deliberate — a deep call takes several seconds and a bare spinner
 * makes it feel broken. The last stage holds until the response lands, so
 * the list never claims to be finished before it is.
 */

const STAGES = [
  "Detecting tactic…",
  "Understanding both sides…",
  "Finding common ground…",
  "Checking full context…",
] as const;

const STAGE_DURATION_MS = 2200;

export function AnalyzingStages() {
  const [reached, setReached] = useState(0);

  useEffect(() => {
    if (reached >= STAGES.length - 1) return;
    const timer = setTimeout(() => setReached((s) => s + 1), STAGE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [reached]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>Analyzing…</Text>
      <View style={styles.stages}>
        {STAGES.map((stage, i) => (
          <StageRow key={stage} label={stage} active={i <= reached} />
        ))}
      </View>
    </View>
  );
}

function StageRow({ label, active }: { label: string; active: boolean }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return;
    Animated.timing(progress, {
      toValue: 1,
      duration: STAGE_DURATION_MS,
      easing: Easing.out(Easing.quad),
      // Width can't be driven on the native thread.
      useNativeDriver: false,
    }).start();
  }, [active, progress]);

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["4%", "100%"],
  });

  return (
    <View style={[styles.row, !active && styles.rowIdle]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.track}>
        <Animated.View style={[styles.fillWrap, { width }]}>
          <LinearGradient
            colors={[colors.accentSoft, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.fill}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xl, alignItems: "stretch" },
  heading: {
    ...typography.display,
    color: colors.ink,
    textAlign: "center",
  },
  stages: { gap: spacing.md },
  row: { gap: spacing.sm },
  rowIdle: { opacity: 0.35 },
  rowLabel: {
    ...typography.body,
    color: colors.ink,
    textAlign: "center",
  },
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.glassRaised,
    overflow: "hidden",
  },
  fillWrap: { height: "100%" },
  fill: { flex: 1, borderRadius: radius.pill },
});
