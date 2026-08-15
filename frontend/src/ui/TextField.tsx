import { StyleSheet, TextInput, View } from "react-native";
import { colors, radius, spacing, typography } from "../theme";

export function TextField({
  value,
  onChangeText,
  placeholder,
  minHeight = 120,
  editable = true,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  minHeight?: number;
  editable?: boolean;
}) {
  return (
    <View style={styles.wrap}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inkFaint}
        multiline
        textAlignVertical="top"
        editable={editable}
        style={[styles.input, { minHeight }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  input: {
    ...typography.body,
    color: colors.ink,
    padding: spacing.md,
    lineHeight: 21,
  },
});
