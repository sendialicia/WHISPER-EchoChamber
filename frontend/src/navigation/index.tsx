import { StyleSheet, Text, View } from "react-native";
import { NavigationContainer, type Theme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HomeScreen } from "../screens/HomeScreen";
import { ScanScreen } from "../screens/ScanScreen";
import { AnalysisScreen } from "../screens/AnalysisScreen";
import { JournalScreen } from "../screens/JournalScreen";
import { BookmarkedScreen } from "../screens/BookmarkedScreen";
import { PracticeHomeScreen } from "../screens/PracticeHomeScreen";
import { PerspectiveChallengeScreen } from "../screens/PerspectiveChallengeScreen";
import { CompareReflectScreen } from "../screens/CompareReflectScreen";
import { ExerciseScreen } from "../screens/ExerciseScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { ToneScreen } from "../screens/ToneScreen";
import type {
  HomeStackParamList,
  JournalStackParamList,
  PracticeStackParamList,
  SettingsStackParamList,
} from "./types";
import { colors, radius, spacing, typography } from "../theme";

/**
 * Five tabs, each owning its own stack where it has sub-screens. Screens
 * draw their own background, so navigation's theme only needs to keep the
 * chrome from flashing white between transitions.
 */

const navigationTheme: Theme = {
  dark: false,
  colors: {
    primary: colors.primary,
    background: colors.ground,
    card: colors.ground,
    text: colors.ink,
    border: colors.cardBorder,
    notification: colors.accent,
  },
  fonts: {
    regular: { fontFamily: "System", fontWeight: "400" },
    medium: { fontFamily: "System", fontWeight: "500" },
    bold: { fontFamily: "System", fontWeight: "600" },
    heavy: { fontFamily: "System", fontWeight: "700" },
  },
};

const stackOptions = { headerShown: false } as const;

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={stackOptions}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="Scan" component={ScanScreen} />
    </HomeStack.Navigator>
  );
}

const JournalStack = createNativeStackNavigator<JournalStackParamList>();
function JournalNavigator() {
  return (
    <JournalStack.Navigator screenOptions={stackOptions}>
      <JournalStack.Screen name="JournalMain" component={JournalScreen} />
      <JournalStack.Screen name="Bookmarked" component={BookmarkedScreen} />
    </JournalStack.Navigator>
  );
}

const PracticeStack = createNativeStackNavigator<PracticeStackParamList>();
function PracticeNavigator() {
  return (
    <PracticeStack.Navigator screenOptions={stackOptions}>
      <PracticeStack.Screen name="PracticeHome" component={PracticeHomeScreen} />
      <PracticeStack.Screen
        name="PerspectiveChallenge"
        component={PerspectiveChallengeScreen}
      />
      <PracticeStack.Screen name="CompareReflect" component={CompareReflectScreen} />
      <PracticeStack.Screen name="Exercise" component={ExerciseScreen} />
    </PracticeStack.Navigator>
  );
}

const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();
function SettingsNavigator() {
  return (
    <SettingsStack.Navigator screenOptions={stackOptions}>
      <SettingsStack.Screen name="Settings" component={SettingsScreen} />
      <SettingsStack.Screen name="ToneTester" component={ToneScreen} />
    </SettingsStack.Navigator>
  );
}

const Tab = createBottomTabNavigator();

/** Bar height before the system navigation inset is added on top. */
const TAB_BAR_HEIGHT = 68;

const TAB_ICONS: Record<string, string> = {
  Home: "⌂",
  Analysis: "◫",
  Journal: "❏",
  Practice: "⇄",
  Settings: "⚙",
};

/** Active tab reads as a filled pill with its label; the rest are icon-only. */
function TabItem({ route, focused }: { route: string; focused: boolean }) {
  return (
    <View style={[styles.tabItem, focused && styles.tabItemActive]}>
      <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>
        {TAB_ICONS[route] ?? "•"}
      </Text>
      {focused ? <Text style={styles.tabLabel}>{route}</Text> : null}
    </View>
  );
}

export function RootNavigator() {
  // SDK 57 draws Android edge-to-edge, so the system navigation bar sits on
  // top of the tab bar unless we reserve room for it ourselves. A fixed
  // height alone would leave the bottom row of tabs underneath it.
  const insets = useSafeAreaInsets();

  return (
    <NavigationContainer theme={navigationTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: [
            styles.tabBar,
            { height: TAB_BAR_HEIGHT + insets.bottom, paddingBottom: insets.bottom },
          ],
          tabBarItemStyle: styles.tabBarItem,
          tabBarIcon: ({ focused }) => (
            <TabItem route={route.name} focused={focused} />
          ),
        })}
      >
        <Tab.Screen name="Home" component={HomeNavigator} />
        <Tab.Screen name="Analysis" component={AnalysisScreen} />
        <Tab.Screen name="Journal" component={JournalNavigator} />
        <Tab.Screen name="Practice" component={PracticeNavigator} />
        <Tab.Screen name="Settings" component={SettingsNavigator} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.card,
    borderTopColor: colors.cardBorder,
    paddingTop: spacing.sm,
  },
  tabBarItem: { paddingVertical: 0 },
  tabItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  tabItemActive: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
  },
  tabIcon: { fontSize: 18, color: colors.inkFaint },
  tabIconActive: { color: colors.onDark },
  tabLabel: { ...typography.caption, color: colors.onDark },
});
