import { useCallback, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RootNavigator } from "./src/navigation";
import { Landing } from "./src/ui/Landing";
import { RippleProvider } from "./src/ui/Ripple";

export default function App() {
  const [launched, setLaunched] = useState(false);
  const finish = useCallback(() => setLaunched(true), []);

  return (
    <SafeAreaProvider>
      {/* The landing sits on a deep blue ground, so the status bar has to
          invert while it is up and go back once the app shows through. */}
      <StatusBar style={launched ? "dark" : "light"} />
      <RippleProvider>
        <RootNavigator />
      </RippleProvider>
      {/* Mounted over the app rather than instead of it, so the navigator has
          already rendered by the time the landing fades out. */}
      {launched ? null : <Landing onFinish={finish} />}
    </SafeAreaProvider>
  );
}
