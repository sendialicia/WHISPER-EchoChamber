import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Animated, Easing, StyleSheet, useWindowDimensions } from "react-native";
import { radius } from "../theme";

/**
 * The echo wash that plays over a tab change.
 *
 * A translucent disc expands from wherever the user tapped and sweeps off the
 * screen — the same gesture as the logo, and the closest thing to the "water"
 * feel we're after. It deliberately runs *over* an already-completed
 * navigation rather than gating it: the new screen is live underneath the
 * whole time, so a dropped frame or an interrupted animation can never leave
 * someone stuck on a blank page.
 */

const RIPPLE_MS = 620;
const SEED = 80;

type Trigger = (x: number, y: number) => void;

const RippleContext = createContext<Trigger>(() => {});

/** Call inside a press handler with the touch's page coordinates. */
export function useRipple(): Trigger {
  return useContext(RippleContext);
}

export function RippleProvider({ children }: { children: ReactNode }) {
  const { width, height } = useWindowDimensions();
  const progress = useRef(new Animated.Value(0)).current;
  const [origin, setOrigin] = useState({ x: 0, y: 0 });

  /** Cover the furthest corner from wherever the touch landed. */
  const maxScale = useMemo(() => {
    const dx = Math.max(origin.x, width - origin.x);
    const dy = Math.max(origin.y, height - origin.y);
    return (Math.hypot(dx, dy) / (SEED / 2)) * 1.05;
  }, [height, origin, width]);

  const trigger = useCallback<Trigger>(
    (x, y) => {
      setOrigin({ x, y });
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: RIPPLE_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    },
    [progress]
  );

  return (
    <RippleContext.Provider value={trigger}>
      {children}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ripple,
          {
            left: origin.x - SEED / 2,
            top: origin.y - SEED / 2,
            opacity: progress.interpolate({
              inputRange: [0, 0.15, 1],
              outputRange: [0, 0.5, 0],
            }),
            transform: [
              {
                scale: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.2, maxScale],
                }),
              },
            ],
          },
        ]}
      />
    </RippleContext.Provider>
  );
}

const styles = StyleSheet.create({
  ripple: {
    position: "absolute",
    width: SEED,
    height: SEED,
    borderRadius: radius.pill,
    // Deliberately not the accent: a magenta wash over every tab change reads
    // as an alert. The pale blue passes as light moving across the surface.
    backgroundColor: "#9FC4FF",
  },
});
