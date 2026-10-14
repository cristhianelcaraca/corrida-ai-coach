// Mobilidade — biblioteca de exercícios; o boneco 3D mostra o movimento escolhido.
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import ExerciseAvatar from "@/components/ExerciseAvatar";
import { Body, Card, Chip, H1, H2, Screen } from "@/components/ui";
import { C } from "@/constants/palette";
import { EXERCISES, EXERCISE_BY_ID } from "@/data/exercises";
import { useI18n, type TKey } from "@/i18n";
import { api, type Workout } from "@/lib/api";

export default function Mobility() {
  const { t, lang } = useI18n();
  const [selected, setSelected] = useState("neck_stretch");
  const [suggested, setSuggested] = useState<string[]>([]);
  const [focused, setFocused] = useState(true);

  // só desenhamos o boneco 3D quando este separador está visível (poupa bateria)
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      let alive = true;
      api<{ workout: Workout | null }>("/api/workouts/latest")
        .then((r) => {
          if (!alive || !r.workout) return;
          const ids = [...r.workout.mobility, ...r.workout.cooldown].map((s) => s.id);
          const uniq = [...new Set(ids)].filter((id) => id !== "easy_walk" && id !== "breathing");
          setSuggested(uniq);
          if (uniq[0]) setSelected((cur) => (cur === "neck_stretch" ? uniq[0] : cur));
        })
        .catch(() => {});
      return () => {
        alive = false;
        setFocused(false);
      };
    }, []),
  );

  const others = useMemo(() => EXERCISES.filter((e) => !suggested.includes(e.id) && e.id !== "easy_run"), [suggested]);
  const ex = EXERCISE_BY_ID[selected];

  const row = (id: string) => {
    const e = EXERCISE_BY_ID[id];
    if (!e) return null;
    return (
      <Pressable key={id} onPress={() => setSelected(id)} style={[styles.item, selected === id && styles.itemOn]}>
        <Text style={styles.itemName}>{e.name[lang]}</Text>
        <Text style={styles.itemKind}>{t(`kind.${e.kind}` as TKey)}</Text>
      </Pressable>
    );
  };

  return (
    <Screen>
      <H1>{t("mob.title")}</H1>
      {focused && <ExerciseAvatar exerciseId={selected} height={320} />}
      {ex && (
        <Card>
          <H2>{ex.name[lang]}</H2>
          <Body>{ex.howto[lang]}</Body>
          {ex.areas.length > 0 && (
            <View style={{ gap: 6 }}>
              <Text style={{ color: C.muted, fontSize: 13 }}>{t("mob.areas")}</Text>
              <View style={styles.row}>
                {ex.areas.map((a) => <Chip key={a} label={t(`area.${a}` as TKey)} />)}
              </View>
            </View>
          )}
        </Card>
      )}
      {suggested.length > 0 && (
        <>
          <H2>{t("mob.forYou")}</H2>
          <View style={{ gap: 8 }}>{suggested.map(row)}</View>
        </>
      )}
      <H2>{t("mob.all")}</H2>
      <View style={{ gap: 8 }}>{others.map((e) => row(e.id))}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14 },
  itemOn: { borderColor: C.accent, backgroundColor: C.accentDark },
  itemName: { color: C.text, fontSize: 15, fontWeight: "600", flex: 1 },
  itemKind: { color: C.muted, fontSize: 12 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
