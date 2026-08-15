import { StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radius, spacing, typography } from "../theme";

export function TextField({
  value,
  onChangeText,
  placeholder,
  minHeight = 120,
  editable = true,
  maxLength,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  minHeight?: number;
  editable?: boolean;
  /** Shows a counter, as on the Perspective Challenge input. */
  maxLength?: number;
}) {
  return (
    <View style={[styles.wrap, { minHeight }]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inkFaint}
        multiline
        textAlignVertical="top"
        editable={editable}
        maxLength={maxLength}
        style={styles.input}
      />
      {maxLength ? (
        <Text style={styles.counter}>
          {value.length}/{maxLength}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.field,
    borderColor: colors.fieldBorder,
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
