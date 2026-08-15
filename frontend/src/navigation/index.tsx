import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import {
  NavigationContainer,
  createNavigationContainerRef,
  type Theme,
} from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { TabBar } from "../ui/TabBar";
import {
  onScanRequested,
  takePendingScan as takeNativeScan,
} from "../capture/screenReader";
import { setPendingScan } from "../capture/pendingScan";
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
import { PermissionsScreen } from "../screens/PermissionsScreen";
import { ToneScreen } from "../screens/ToneScreen";
import type {
  HomeStackParamList,
  JournalStackParamList,
  PracticeStackParamList,
  SettingsStackParamList,
} from "./types";
import { colors } from "../theme";

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
      <SettingsStack.Screen name="Permissions" component={PermissionsScreen} />
      <SettingsStack.Screen name="ToneTester" component={ToneScreen} />
    </SettingsStack.Navigator>
  );
}

const Tab = createBottomTabNavigator();

const navigationRef = createNavigationContainerRef();

/**
 * Picks up a scan started from the floating button.
 *
 * The tap reads the screen and launches the app, so by the time this runs the
 * result is already waiting natively. Both triggers matter: the event covers
 * an app that was already running, and the foreground check covers a cold
 * start, where JS did not exist yet when the tap happened.
 */
function useFloatingButtonScans() {
  const collecting = useRef(false);

  useEffect(() => {
    const collect = async () => {
      if (collecting.current) return;
      collecting.current = true;
      try {
        const content = await takeNativeScan();
        if (!content) return;
        setPendingScan(content);
        if (navigationRef.isReady()) {
          // The container isn't generically typed, so the nested target is
          // asserted rather than inferred.
          (navigationRef.navigate as (name: string, params?: object) => void)(
            "Home",
            { screen: "Scan" }
          );
        }
      } finally {
        collecting.current = false;
      }
    };

    const unsubscribe = onScanRequested(() => void collect());
    const appState = AppState.addEventListener("change", (state) => {
      if (state === "active") void collect();
    });

    void collect();

    return () => {
      unsubscribe();
      appState.remove();
    };
  }, []);
}

export function RootNavigator() {
  useFloatingButtonScans();

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme}>
      <Tab.Navigator
        tabBar={(props) => <TabBar {...props} />}
        // The ripple washes over the swap; a crossfade underneath keeps the
        // swap itself from being a hard cut.
        screenOptions={{ headerShown: false, animation: "fade" }}
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
