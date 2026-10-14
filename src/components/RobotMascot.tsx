// RobotMascot.tsx — robô animado que "pisca" (feito só com Views e Animated, sem imagens).
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

import { C } from "@/constants/palette";

export default function RobotMascot({ size = 150 }: { size?: number }) {
  const blink = useRef(new Animated.Value(1)).current; // 1 = olhos abertos, 0.08 = fechados
  const float = useRef(new Animated.Value(0)).current; // sobe e desce devagar
  const glow = useRef(new Animated.Value(0.4)).current; // luz da antena

  useEffect(() => {
    const blinkOnce = [
      Animated.timing(blink, { toValue: 0.08, duration: 90, useNativeDriver: true }),
      Animated.timing(blink, { toValue: 1, duration: 130, useNativeDriver: true }),
    ];
    const blinkLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(2600),
        ...blinkOnce,
        Animated.delay(2200),
        ...blinkOnce,
        Animated.delay(150), // piscadela dupla
        ...blinkOnce,
      ]),
    );
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.3, duration: 900, useNativeDriver: true }),
      ]),
    );
    blinkLoop.start();
    floatLoop.start();
    glowLoop.start();
    return () => {
      blinkLoop.stop();
      floatLoop.stop();
      glowLoop.stop();
    };
  }, [blink, float, glow]);

  const s = size / 150; // tudo é desenhado para 150 e escala com "size"
  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -6 * s] });

  return (
    <Animated.View
      accessible
      accessibilityLabel="Robot"
      style={{ width: size, height: size, alignItems: "center", transform: [{ translateY }] }}
    >
      {/* antena */}
      <View style={{ width: 4 * s, height: 16 * s, backgroundColor: C.muted, marginTop: 4 * s }} />
      <Animated.View
        style={{ position: "absolute", top: -2 * s, width: 14 * s, height: 14 * s, borderRadius: 7 * s, backgroundColor: C.accent, opacity: glow }}
      />
      {/* cabeça */}
      <View style={[styles.head, { width: 112 * s, height: 84 * s, borderRadius: 26 * s, borderWidth: 3 * s }]}>
        <View style={[styles.ear, { left: -10 * s, width: 8 * s, height: 26 * s, borderRadius: 4 * s }]} />
        <View style={[styles.ear, { right: -10 * s, width: 8 * s, height: 26 * s, borderRadius: 4 * s }]} />
        <View style={{ flexDirection: "row", gap: 22 * s, marginTop: 6 * s }}>
          <Animated.View style={[styles.eye, { width: 22 * s, height: 26 * s, borderRadius: 11 * s, transform: [{ scaleY: blink }] }]} />
          <Animated.View style={[styles.eye, { width: 22 * s, height: 26 * s, borderRadius: 11 * s, transform: [{ scaleY: blink }] }]} />
        </View>
        <View style={{ width: 30 * s, height: 5 * s, borderRadius: 3 * s, backgroundColor: C.accent, opacity: 0.8, marginTop: 10 * s }} />
      </View>
      {/* corpo */}
      <View style={[styles.body, { width: 70 * s, height: 26 * s, borderRadius: 12 * s, marginTop: 4 * s }]}>
        <View style={{ width: 10 * s, height: 10 * s, borderRadius: 5 * s, backgroundColor: C.accent }} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  head: { backgroundColor: C.card2, borderColor: C.accent, alignItems: "center", justifyContent: "center" },
  ear: { position: "absolute", top: "35%", backgroundColor: C.muted },
  eye: { backgroundColor: C.accent },
  body: { backgroundColor: C.card2, borderWidth: 2, borderColor: C.border, alignItems: "center", justifyContent: "center" },
});
