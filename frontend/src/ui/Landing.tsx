import { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, useWindowDimensions, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radius } from "../theme";

/**
 * The launch screen: the mark inside a white disc, with rings pulsing outward
 * from it. The rings are the whole point — the logo is a wave radiating from a
 * source, and "gema" is echo, so the launch animation is the brand's own
 * gesture rather than a decorative spinner.
 *
 * Three rings run on a stagger so a new one leaves the disc before the last
 * has faded, which reads as a continuous echo instead of a repeating blink.
 */

const RING_COUNT = 3;
const CYCLE_MS = 2600;
const DISC = 210;

export function Landing({ onFinish }: { onFinish: () => void }) {
  const { width, height } = useWindowDimensions();
  /** Far enough for the largest ring to clear the corners. */
  const maxScale = (Math.hypot(width, height) / DISC) * 1.1;

  const rings = useRef(
    Array.from({ length: RING_COUNT }, () => new Animated.Value(0))
  ).current;
  const content = useRef(new Animated.Value(0)).current;
  const exit = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const entrance = Animated.timing(content, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.back(1.4)),
      useNativeDriver: true,
    });

    const pulses = rings.map((ring, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay((CYCLE_MS / RING_COUNT) * i),
          Animated.timing(ring, {
            toValue: 1,
            duration: CYCLE_MS,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(ring, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      )
    );

    entrance.start();
    pulses.forEach((p) => p.start());

    // Hold long enough for two full echoes, then hand over to the app.
    const handoff = setTimeout(() => {
      Animated.timing(exit, {
        toValue: 1,
        duration: 460,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onFinish();
      });
    }, 2400);

    return () => {
      clearTimeout(handoff);
      pulses.forEach((p) => p.stop());
    };
  }, [content, exit, onFinish, rings]);

  return (
    <Animated.View
      style={[
        styles.fill,
        { opacity: exit.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) },
      ]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={["#3A75ED", "#2A56D8", "#1937B2"]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.fill}
      >
        <View style={styles.centre}>
          {rings.map((ring, i) => (
            <Animated.View
              key={i}
              style={[
                styles.ring,
                {
                  opacity: ring.interpolate({
                    inputRange: [0, 0.1, 1],
                    outputRange: [0, 0.42, 0],
                  }),
                  transform: [
                    {
                      scale: ring.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, maxScale],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}

          <Animated.View
            style={[
              styles.disc,
              {
                opacity: content,
                transform: [
                  {
                    scale: content.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.72, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Image
              source={require("../../assets/splash-icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  centre: { flex: 1, alignItems: "center", justifyContent: "center" },
  ring: {
    position: "absolute",
    width: DISC,
    height: DISC,
    borderRadius: radius.pill,
    backgroundColor: "#C7329C",
  },
  disc: {
    width: DISC,
    height: DISC,
    borderRadius: radius.pill,
    backgroundColor: colors.ground,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0B1E6B",
    shadowOpacity: 0.35,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  logo: { width: DISC * 0.66, height: DISC * 0.66 },
});
