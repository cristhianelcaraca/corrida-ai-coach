// Plano — mostra o último treino criado, deixa ver cada movimento no boneco 3D e concluir o treino.
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ExerciseAvatar from "@/components/ExerciseAvatar";
import { Body, Button, Card, Chip, ErrorText, H1, H2, Screen } from "@/components/ui";
import { C } from "@/constants/palette";
import { EXERCISE_BY_ID } from "@/data/exercises";
import { useI18n, type TKey } from "@/i18n";
import { api, ApiError, type Step, type Workout } from "@/lib/api";
import { formatDate } from "@/lib/date";

export default function Plan() {
  const { t, err, lang } = useI18n();
  const router = useRouter();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [history, setHistory] = useState<Workout[]>([]);
  const [viewing, setViewing] = useState<Step | null>(null);
  const [rating, setRating] = useState(false);
  const [effort, setEffort] = useState<"easy" | "ok" | "hard">("ok");
  const [pain, setPain] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api<{ workouts: Workout[] }>("/api/workouts?limit=8")
      .then((r) => {
        setWorkout(r.workouts[0] ?? null);
        setHistory(r.workouts.slice(1));
      })
      .catch(() => {});
  }, []);
  useFocusEffect(load);

  async function complete() {
    if (!workout) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/api/workouts/${workout.id}/complete`, { method: "POST", body: { effort, pain } });
      setRating(false);
      load();
    } catch (e) {
      setError(err(e instanceof ApiError ? e.code : "generic"));
    } finally {
      setBusy(false);
    }
  }

  if (!workout) {
    return (
      <Screen>
        <H1>{t("plan.title")}</H1>
        <Card>
          <Body muted>{t("plan.empty")}</Body>
          <Button title={t("plan.talk")} onPress={() => router.push("/assistente")} />
        </Card>
      </Screen>
    );
  }

  const section = (title: string, steps: Step[]) => (
    <Card key={title}>
      <H2>{title}</H2>
      {steps.map((s, i) => (
        <Pressable key={`${s.id}-${i}`} onPress={() => setViewing(s)} style={styles.step}>
          <View style={{ flex: 1 }}>
            <Text style={styles.stepName}>{s.name}</Text>
            <Text style={styles.stepInfo}>{s.duration}</Text>
            <Text style={styles.stepHow}>{s.instructions}</Text>
          </View>
          <Text style={styles.view}>▶ {t("plan.view")}</Text>
        </Pressable>
      ))}
    </Card>
  );

  return (
    <Screen>
      <H1>{workout.title}</H1>
      <Card>
        <Body>{workout.objective}</Body>
        <Body muted>{`${t("plan.duration")}: ${workout.duration} · ${t("plan.intensity")}: ${workout.intensity}`}</Body>
        <Body muted>{`${t("plan.distance")}: ~${workout.meta.distanceKm} ${t("common.km")} · ${t("plan.stage", { n: workout.meta.stage + 1 })}`}</Body>
        <Text style={styles.badge}>{workout.meta.source === "ai" ? t("plan.source.ai") : t("plan.source.rules")}</Text>
      </Card>

      {section(t("plan.warmup"), workout.warmup)}
      {section(t("plan.mobility"), workout.mobility)}
      {section(t("plan.workout"), workout.workout)}
      {section(t("plan.cooldown"), workout.cooldown)}

      <Card>
        <H2>{t("plan.safety")}</H2>
        <Body muted>{workout.note}</Body>
        <Body muted>{workout.safetyNote}</Body>
      </Card>

      {workout.completedAt ? (
        <Card><Text style={{ color: C.ok, fontWeight: "700" }}>✓ {t("plan.done")}</Text></Card>
      ) : rating ? (
        <Card>
          <H2>{t("plan.how")}</H2>
          <View style={styles.row}>
            {(["easy", "ok", "hard"] as const).map((e) => (
              <Chip key={e} label={t(`effort.${e}` as TKey)} selected={effort === e} onPress={() => setEffort(e)} />
            ))}
          </View>
          <Chip label={t("plan.pain")} selected={pain} onPress={() => setPain((p) => !p)} />
          <Body muted>{t("plan.feedbackNote")}</Body>
          <ErrorText>{error}</ErrorText>
          <Button title={t("plan.send")} onPress={complete} loading={busy} />
        </Card>
      ) : (
        <Button title={t("plan.complete")} onPress={() => setRating(true)} />
      )}
      <Button title={t("plan.new")} variant="ghost" onPress={() => router.push("/assistente")} />

      {history.length > 0 && (
        <Card>
          <H2>{t("plan.history")}</H2>
          {history.map((h) => (
            <Text key={h.id} style={styles.hist}>
              {`${h.completedAt ? "✓" : "•"} ${formatDate(h.createdAt, lang)} — ${h.title}`}
            </Text>
          ))}
        </Card>
      )}

      {/* janela com o boneco a fazer o movimento */}
      <Modal visible={!!viewing} animationType="slide" onRequestClose={() => setViewing(null)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
          <View style={{ padding: 20, gap: 14 }}>
            {viewing && (
              <>
                <H1>{viewing.name}</H1>
                <ExerciseAvatar exerciseId={viewing.avatarExercise} height={340} />
                <Body>{viewing.instructions}</Body>
                {EXERCISE_BY_ID[viewing.avatarExercise] && <Body muted>{EXERCISE_BY_ID[viewing.avatarExercise].desc[lang]}</Body>}
              </>
            )}
            <Button title={t("common.close")} onPress={() => setViewing(null)} />
          </View>
        </SafeAreaView>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  step: { flexDirection: "row", gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.border },
  stepName: { color: C.text, fontSize: 16, fontWeight: "700" },
  stepInfo: { color: C.accent, fontSize: 13, marginTop: 2 },
  stepHow: { color: C.muted, fontSize: 13, marginTop: 4, lineHeight: 18 },
  view: { color: C.accent, fontSize: 12, fontWeight: "700", alignSelf: "center", maxWidth: 90, textAlign: "right" },
  badge: { color: C.accent, fontSize: 12, fontWeight: "700" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  hist: { color: C.muted, fontSize: 14, paddingVertical: 3 },
});
