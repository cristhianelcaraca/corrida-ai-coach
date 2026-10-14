// Início — robô animado, botão "Fale com o assistente", resumo do progresso e último treino.
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import RobotMascot from "@/components/RobotMascot";
import { Body, Button, Card, H1, H2, Screen } from "@/components/ui";
import { C } from "@/constants/palette";
import { useI18n } from "@/i18n";
import { api, type Progress, type Workout } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function Home() {
  const { t } = useI18n();
  const { user } = useAuth();
  const router = useRouter();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);

  // recarrega os dados sempre que voltamos a este ecrã
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      api<{ workout: Workout | null }>("/api/workouts/latest").then((r) => alive && setWorkout(r.workout)).catch(() => {});
      api<Progress>("/api/progress").then((r) => alive && setProgress(r)).catch(() => {});
      return () => {
        alive = false;
      };
    }, []),
  );

  return (
    <Screen>
      <H1>{t("home.greeting", { name: user?.name.split(" ")[0] ?? "" })}</H1>
      <Body muted>{t("home.tagline")}</Body>

      {/* robô que pisca, com o botão por baixo */}
      <View style={styles.hero}>
        <RobotMascot size={170} />
        <Button title={t("home.talk")} onPress={() => router.push("/assistente")} />
      </View>

      <View style={styles.stats}>
        <Stat value={progress?.completed ?? 0} label={t("home.stat.workouts")} />
        <Stat value={progress?.distanceKm ?? 0} label={t("home.stat.km")} />
        <Stat value={progress?.runMinutes ?? 0} label={t("home.stat.minutes")} />
      </View>

      <Card>
        <H2>{t("home.next")}</H2>
        {workout ? (
          <>
            <Text style={styles.wTitle}>{workout.title}</Text>
            <Body muted>{`${workout.duration} · ${workout.intensity} · ~${workout.meta.distanceKm} ${t("common.km")}`}</Body>
            <Button title={t("home.openPlan")} variant="ghost" onPress={() => router.push("/plano")} />
          </>
        ) : (
          <Body muted>{t("home.empty")}</Body>
        )}
      </Card>
    </Screen>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "stretch", gap: 14, backgroundColor: C.card, borderRadius: 24, borderWidth: 1, borderColor: C.border, padding: 18, paddingTop: 10 },
  stats: { flexDirection: "row", gap: 10 },
  stat: { flex: 1, backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 14, alignItems: "center" },
  statValue: { color: C.accent, fontSize: 24, fontWeight: "800" },
  statLabel: { color: C.muted, fontSize: 12, marginTop: 2 },
  wTitle: { color: C.text, fontSize: 18, fontWeight: "700" },
});
