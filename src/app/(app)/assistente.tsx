// Assistente — entrevista curta (como te sentes, dores, cansaço) e cria o treino.
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Body, Button, Card, Chip, ErrorText, Field, H1, H2, Screen } from "@/components/ui";
import { C } from "@/constants/palette";
import { PAIN_AREAS } from "@/data/exercises";
import { useI18n, type TKey } from "@/i18n";
import { api, ApiError, type Interview, type Workout } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const FEELINGS = ["energy", "normal", "tired"] as const;
const MINUTES = [0, 5, 10, 20, 30];
const LEVELS = [{ key: "pain.mild", v: 3 }, { key: "pain.moderate", v: 5 }, { key: "pain.strong", v: 8 }] as const;

export default function Assistant() {
  const { t, err, lang } = useI18n();
  const { profile } = useAuth();
  const router = useRouter();
  const [feeling, setFeeling] = useState<Interview["feeling"]>("normal");
  const [maxMinutes, setMaxMinutes] = useState(0);
  const [pains, setPains] = useState<Record<string, number>>({}); // zona -> intensidade
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ workout: Workout; aiError: string | null } | null>(null);

  if (!profile) {
    return (
      <Screen>
        <H1>{t("assistant.title")}</H1>
        <Card>
          <Body>{t("assistant.needProfile")}</Body>
          <Button title={t("assistant.goProfile")} onPress={() => router.push("/perfil")} />
        </Card>
      </Screen>
    );
  }

  function togglePain(area: string) {
    setPains((p) => {
      const next = { ...p };
      if (area in next) delete next[area];
      else next[area] = 3;
      return next;
    });
  }

  async function create() {
    setBusy(true);
    setError(null);
    const interview: Interview = {
      feeling,
      maxMinutes,
      notes: notes.trim(),
      pains: Object.entries(pains).map(([area, level]) => ({ area, level })),
    };
    try {
      const res = await api<{ workout: Workout; aiError: string | null }>("/api/workout", { method: "POST", body: { interview, lang } });
      setCreated(res);
    } catch (e) {
      setError(err(e instanceof ApiError ? e.code : "generic"));
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    const w = created.workout;
    return (
      <Screen>
        <H1>{w.title}</H1>
        <Card>
          <Body>{w.objective}</Body>
          <Body muted>{`${w.duration} · ${w.intensity} · ~${w.meta.distanceKm} ${t("common.km")}`}</Body>
          <Body muted>{w.note}</Body>
          {created.aiError && <Text style={{ color: C.muted, fontSize: 13 }}>{t("assistant.aiFallback")}</Text>}
        </Card>
        <Button title={t("home.openPlan")} onPress={() => { setCreated(null); router.push("/plano"); }} />
      </Screen>
    );
  }

  return (
    <Screen>
      <H1>{t("assistant.title")}</H1>
      <Body muted>{t("assistant.intro")}</Body>

      <Card>
        <H2>{t("assistant.q.feeling")}</H2>
        <View style={styles.row}>
          {FEELINGS.map((f) => (
            <Chip key={f} label={t(`feeling.${f}` as TKey)} selected={feeling === f} onPress={() => setFeeling(f)} />
          ))}
        </View>
      </Card>

      <Card>
        <H2>{t("assistant.q.maxMin")}</H2>
        <View style={styles.row}>
          {MINUTES.map((m) => (
            <Chip
              key={m}
              label={m === 0 ? t("assistant.noRun") : m === 30 ? t("assistant.min30") : t("assistant.min", { n: m })}
              selected={maxMinutes === m}
              onPress={() => setMaxMinutes(m)}
            />
          ))}
        </View>
      </Card>

      <Card>
        <H2>{t("assistant.q.pains")}</H2>
        <View style={styles.row}>
          {PAIN_AREAS.map((a) => (
            <Chip key={a} label={t(`area.${a}` as TKey)} selected={a in pains} onPress={() => togglePain(a)} />
          ))}
        </View>
        {Object.keys(pains).map((a) => (
          <View key={a} style={{ gap: 6, marginTop: 6 }}>
            <Text style={{ color: C.muted }}>{`${t(`area.${a}` as TKey)} — ${t("assistant.intensity")}`}</Text>
            <View style={styles.row}>
              {LEVELS.map((l) => (
                <Chip key={l.v} label={t(l.key)} selected={pains[a] === l.v} onPress={() => setPains((p) => ({ ...p, [a]: l.v }))} />
              ))}
            </View>
          </View>
        ))}
      </Card>

      <Card>
        <H2>{t("assistant.q.notes")}</H2>
        <Field label="" value={notes} onChangeText={setNotes} placeholder={t("assistant.notesHint")} multiline autoCapitalize="sentences" />
      </Card>

      <ErrorText>{error}</ErrorText>
      <Button title={busy ? t("assistant.creating") : t("assistant.create")} onPress={create} loading={busy} />
    </Screen>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: "row", flexWrap: "wrap", gap: 8 } });
