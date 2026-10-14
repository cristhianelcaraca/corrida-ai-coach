// ExerciseAvatar.tsx — caixa com o boneco 3D, botões Frente/Lado e mensagem de erro.
import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import AvatarViewer from "./AvatarViewer";
import { C } from "@/constants/palette";
import { useI18n } from "@/i18n";

export default function ExerciseAvatar({ exerciseId, height = 300 }: { exerciseId: string; height?: number }) {
  const { t } = useI18n();
  const [angle, setAngle] = useState<"front" | "side">("front");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  return (
    <View style={[styles.wrap, { height }]}>
      {status !== "error" && <AvatarViewer exerciseId={exerciseId} angle={angle} onStatus={setStatus} style={StyleSheet.absoluteFill} />}
      {status === "loading" && (
        <View style={styles.center} pointerEvents="none">
          <ActivityIndicator color={C.accent} />
          <Text style={styles.muted}>{t("avatar.loading")}</Text>
        </View>
      )}
      {status === "error" && (
        <View style={styles.center}>
          <Text style={{ fontSize: 40 }}>🏃</Text>
          <Text style={styles.muted}>{t("avatar.error")}</Text>
        </View>
      )}
      {status === "ready" && (
        <View style={styles.toggle}>
          {(["front", "side"] as const).map((a) => (
            <Pressable key={a} onPress={() => setAngle(a)} style={[styles.tbtn, angle === a && styles.tbtnOn]}>
              <Text style={[styles.ttext, angle === a && { color: C.bg }]}>{t(a === "front" ? "avatar.front" : "avatar.side")}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 20, overflow: "hidden", backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  center: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center", gap: 8, padding: 20 },
  muted: { color: C.muted, textAlign: "center" },
  toggle: { position: "absolute", right: 10, top: 10, flexDirection: "row", gap: 6 },
  tbtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: "rgba(0,0,0,0.55)", borderWidth: 1, borderColor: C.border },
  tbtnOn: { backgroundColor: C.accent, borderColor: C.accent },
  ttext: { color: C.text, fontSize: 12, fontWeight: "700" },
});
