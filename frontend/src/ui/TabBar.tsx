import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { colors, elevation, radius, spacing, typography } from "../theme";

/**
 * The floating tab bar from the mockups: a rounded translucent group that
 * hovers over the content rather than a full-width bar pinned to the edge.
 * The active destination expands into a deep indigo pill carrying its label;
 * the rest stay as frosted icon circles.
 *
 * Screens therefore have to leave room at the bottom of their scroll content —
 * see TAB_BAR_CLEARANCE.
 */

const ICON_SIZE = 22;

function TabIcon({ name, color }: { name: string; color: string }) {
  const common = { stroke: color, strokeWidth: 1.9, fill: "none" };

  switch (name) {
    case "Home":
      return (
        <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24">
          <Path d="M3 10.5 12 3l9 7.5" {...common} strokeLinecap="round" />
          <Path d="M5.5 9.5V20h13V9.5" {...common} strokeLinejoin="round" />
        </Svg>
      );
    case "Analysis":
      return (
        <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24">
          <Rect x="4" y="11" width="3.6" height="9" rx="1.8" {...common} />
          <Rect x="10.2" y="5" width="3.6" height="15" rx="1.8" {...common} />
          <Rect x="16.4" y="8" width="3.6" height="12" rx="1.8" {...common} />
        </Svg>
      );
    case "Journal":
      return (
        <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24">
          <Rect x="4.5" y="3.5" width="15" height="17" rx="2.5" {...common} />
          <Path d="M9 8.5h6M9 12h6M9 15.5h3.5" {...common} strokeLinecap="round" />
        </Svg>
      );
    case "Practice":
      return (
        <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24">
          <Path d="M4 8h11l-2.5-2.5M20 16H9l2.5 2.5" {...common} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    default:
      return (
        <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24">
          <Circle cx="12" cy="12" r="3.2" {...common} />
          <Path
            d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M18 6l-1.6 1.6M7.6 16.4 6 18M18 18l-1.6-1.6M7.6 7.6 6 6"
            {...common}
            strokeLinecap="round"
          />
        </Svg>
      );
  }
}

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.wrap, { paddingBottom: insets.bottom + spacing.sm }]}
      pointerEvents="box-none"
    >
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const label =
            typeof options.tabBarLabel === "string" ? options.tabBarLabel : route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              onPress={onPress}
              style={[styles.item, focused && styles.itemActive]}
            >
              <TabIcon
                name={route.name}
                color={focused ? colors.onDark : colors.deep}
              />
              {focused ? <Text style={styles.label}>{label}</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Bottom padding screens need so the floating bar never covers content. */
export const TAB_BAR_CLEARANCE = 108;

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(249, 251, 255, 0.92)",
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.frostBorder,
    padding: spacing.sm,
    ...elevation,
  },
  item: {
    width: 46,
    height: 46,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.frost,
    flexDirection: "row",
    gap: spacing.xs,
  },
  itemActive: {
    width: "auto",
    paddingHorizontal: spacing.md,
    backgroundColor: colors.deep,
  },
  label: { ...typography.label, color: colors.onDark },
});
