import { StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radius, spacing, typography } from "../theme";

export function TextField({
  value,
  onChangeText,
  placeholder,
  minHeight = 120,
  editable = true,
  maxLength,
  multiline = true,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  minHeight?: number;
  editable?: boolean;
  /** Shows a counter, as on the Perspective Challenge input. */
  maxLength?: number;
  /** Off for short single-line values, where Enter should submit, not wrap. */
  multiline?: boolean;
}) {
  return (
    <View style={[styles.wrap, { minHeight }]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inkFaint}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        editable={editable}
        maxLength={maxLength}
        style={styles.input}
      />
      {maxLength && multiline ? (
        <Text style={styles.counter}>
          {value.length}/{maxLength}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  input: {
    ...typography.body,
    color: colors.ink,
    flex: 1,
    lineHeight: 21,
    padding: 0,
  },
  counter: {
    ...typography.caption,
    color: colors.inkFaint,
    alignSelf: "flex-end",
    marginTop: spacing.xs,
  },
});
