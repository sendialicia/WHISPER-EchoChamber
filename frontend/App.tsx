import { useCallback, useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RootNavigator } from "./src/navigation";
import { Landing } from "./src/ui/Landing";
import { NamePrompt } from "./src/ui/NamePrompt";
import { RippleProvider } from "./src/ui/Ripple";
import { getName } from "./src/storage/local";

/**
 * Three layers, back to front: the app, the name prompt, the landing.
 *
 * The order matters. The landing covers everything while it plays, so when it
 * fades it reveals whichever layer belongs underneath — the prompt for a first
 * launch, the app otherwise. Deciding that beforehand would mean racing the
 * storage read against the animation, and losing that race shows the prompt as
 * a flash after the app has already appeared.
 */
export default function App() {
  const [landed, setLanded] = useState(false);
  /** undefined while storage is being read; null means never asked. */
  const [name, setName] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    void getName().then(setName);
  }, []);

  const finishLanding = useCallback(() => setLanded(true), []);

  const promptingForName = name === null;
  const overlaid = !landed || promptingForName;

  return (
    <SafeAreaProvider>
      {/* Both overlays sit on a deep blue ground, so the status bar inverts
          while either is up. */}
      <StatusBar style={overlaid ? "light" : "dark"} />

      <RippleProvider>
        <RootNavigator />
      </RippleProvider>

      {promptingForName ? <NamePrompt onDone={setName} /> : null}
      {landed ? null : <Landing onFinish={finishLanding} />}
    </SafeAreaProvider>
  );
}
