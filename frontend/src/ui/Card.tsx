import type { ReactNode } from "react";
import { Image, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  backdrop,
  cardArt,
  colors,
  elevation,
  gradients,
  radius,
  spacing,
  typography,
} from "../theme";

/**
 * The pale glass panel most content sits in. It is barely lighter than the
 * ground, so the shadow rather than the fill is what separates it.
 */
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

/**
 * The deep indigo card carrying a headline — the Echo Chamber Meter, "Choose
 * A Practice". The design fills these with soft concentric glows, so one is
 * layered in behind the content. Text inside must use `onDark` colours.
 */
export function FeatureCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.feature, style]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Image source={backdrop.crescent} style={styles.featureGlow} resizeMode="cover" />
      </View>
      {children}
    </View>
  );
}

/**
 * The "Choose A Practice" card: a feature card sitting at the front of a
 * shallow deck, with concentric arcs inside it.
 *
 * The deck and the arcs are the designer's own exported pieces rather than
 * shapes rebuilt in code — the stack cards carry a slight perspective tilt
 * and the arcs a pink bloom at their edge, neither of which survives being
 * approximated with a rotated View and a border-radius.
 */
export function StackedFeatureCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={styles.deck}>
      <Image source={cardArt.stackBack} style={styles.stackBack} resizeMode="contain" />
      <Image source={cardArt.stackMid} style={styles.stackMid} resizeMode="contain" />

      <View style={[styles.feature, styles.deckFront, style]}>
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Image source={cardArt.ringLarge} style={styles.ringLarge} resizeMode="contain" />
          <Image source={cardArt.ringMedium} style={styles.ringMedium} resizeMode="contain" />
          <Image source={cardArt.ringSmall} style={styles.ringSmall} resizeMode="contain" />
        </View>
        {children}
      </View>
    </View>
  );
}

/** Blue callout — "What's this mean?", "Tip!", "Results!". */
export function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <LinearGradient
      colors={gradients.info}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.info}
    >
      <Text style={styles.infoTitle}>{title}</Text>
      <Text style={styles.infoBody}>{body}</Text>
    </LinearGradient>
  );
}

/** Pastel card used for the opposing view and for quoted content. */
export function OppositeCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  return (
    <LinearGradient
      colors={gradients.opposite}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.opposite, style]}
    >
      {children}
    </LinearGradient>
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

/** How far each card in the deck peeks out above the one in front of it. */
const PEEK = 12;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    gap: spacing.sm,
    ...elevation,
  },
  // The stack images are near-square with their own rounded corners, so they
  // keep their aspect ratio and are simply overlapped by the front card.
  // Forcing them into a short strip stretched those corners into a hard edge.
  deck: { paddingTop: PEEK * 2 },
  deckFront: { marginTop: 0 },
  stackBack: {
    position: "absolute",
    top: 0,
    left: "10%",
    right: "10%",
    aspectRatio: 311 / 293,
    opacity: 0.55,
  },
  stackMid: {
    position: "absolute",
    top: PEEK,
    left: "5%",
    right: "5%",
    aspectRatio: 346 / 325,
    opacity: 0.8,
  },
  ringLarge: {
    position: "absolute",
    right: -30,
    bottom: -50,
    width: 250,
    height: 340,
    opacity: 0.55,
  },
  ringMedium: {
    position: "absolute",
    right: -14,
    bottom: -20,
    width: 175,
    height: 245,
    opacity: 0.6,
  },
  ringSmall: {
    position: "absolute",
    right: 6,
    bottom: 16,
    width: 92,
    height: 165,
    opacity: 0.7,
  },
  feature: {
    backgroundColor: colors.deep,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    overflow: "hidden",
    ...elevation,
  },
  featureGlow: {
    position: "absolute",
    right: -90,
    bottom: -110,
    width: 340,
    height: 340,
    opacity: 0.5,
  },
  info: {
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  infoTitle: { ...typography.label, color: colors.onDark },
  infoBody: { ...typography.caption, color: colors.onDarkSoft, lineHeight: 18 },
  opposite: {
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: { ...typography.heading, color: colors.ink },
  section: { gap: spacing.xs },
  sectionLabel: { ...typography.label, color: colors.ink },
  sectionBody: { ...typography.body, color: colors.inkSoft, lineHeight: 21 },
});
