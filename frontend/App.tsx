import { StatusBar } from "expo-status-bar";
import { NavigationContainer, type Theme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Text } from "react-native";
import { ScanScreen } from "./src/screens/ScanScreen";
import { ToneScreen } from "./src/screens/ToneScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { PracticeScreen } from "./src/screens/PracticeScreen";
import { colors } from "./src/theme";

const Tab = createBottomTabNavigator();

/**
 * Navigation's own theme only paints the chrome it owns (the bar, the
 * transition backgrounds). Screens draw their own gradient, so `background`
 * here just needs to match the darkest stop and avoid a light flash.
 */
const navigationTheme: Theme = {
  dark: true,
  colors: {
    primary: colors.accent,
    background: colors.ground,
    card: colors.ground,
    text: colors.ink,
    border: colors.glassBorder,
    notification: colors.accent,
  },
  fonts: {
    regular: { fontFamily: "System", fontWeight: "400" },
    medium: { fontFamily: "System", fontWeight: "500" },
    bold: { fontFamily: "System", fontWeight: "600" },
    heavy: { fontFamily: "System", fontWeight: "700" },
  },
};

const TAB_ICONS: Record<string, string> = {
  Scan: "◎",
  Tone: "✎",
  Dashboard: "◈",
  Practice: "⇄",
};

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer theme={navigationTheme}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: colors.accent,
            tabBarInactiveTintColor: colors.inkFaint,
            tabBarStyle: {
              backgroundColor: colors.ground,
              borderTopColor: colors.glassBorder,
            },
            tabBarIcon: ({ color }) => (
              <Text style={{ color, fontSize: 18 }}>
                {TAB_ICONS[route.name] ?? "•"}
              </Text>
            ),
          })}
        >
          <Tab.Screen name="Scan" component={ScanScreen} />
          <Tab.Screen name="Tone" component={ToneScreen} />
          <Tab.Screen name="Dashboard" component={DashboardScreen} />
          <Tab.Screen name="Practice" component={PracticeScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
