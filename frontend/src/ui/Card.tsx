import type { ReactNode } from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { colors, radius, spacing, typography } from "../theme";

/** The white panel that carries analysis output on top of the gradient. */
export function Card({
  title,
  children,
  style,
}: {
  title?: string;
  children: ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.card, style]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
    </View>
  );
}

/** A labelled block inside a card — "Side A", "Common ground", and so on. */
export function CardSection({
  label,
  body,
  icon,
}: {
  label: string;
  body: string;
  icon?: string;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>
        {icon ? `${icon}  ` : ""}
        {label}
      </Text>
      <Text style={styles.sectionBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    ...typography.heading,
    color: colors.cardInk,
  },
  section: { gap: spacing.xs },
  sectionLabel: {
    ...typography.label,
    color: colors.cardInk,
  },
  sectionBody: {
    ...typography.body,
    color: colors.cardInkSoft,
    lineHeight: 21,
  },
});
