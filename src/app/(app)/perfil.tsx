// Perfil — dados da conta, objetivo/nível, idioma, progresso e terminar sessão.
import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";

import { Body, Button, Card, Chip, ErrorText, Field, H1, H2, LangSwitch, Screen } from "@/components/ui";
import { C } from "@/constants/palette";
import { useI18n, type TKey } from "@/i18n";
import { api, ApiError, type Profile, type Progress } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ageFrom, formatDate } from "@/lib/date";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DEFAULT: Profile = { goal: "start", level: "never", days: ["tue", "thu", "sat"], durationMin: 30, limitations: "" };

export default function ProfileScreen() {
  const { t, err, lang, setLang } = useI18n();
  const { user, profile, saveProfile, saveLang, signOut } = useAuth();
  const [form, setForm] = useState<Profile>(profile ?? DEFAULT);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) setForm(profile);
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      api<Progress>("/api/progress").then(setProgress).catch(() => {});
    }, []),
  );

  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setForm((f) => ({ ...f, [k]: v }));
  const toggleDay = (d: string) => set("days", form.days.includes(d) ? form.days.filter((x) => x !== d) : [...form.days, d]);

  async function save() {
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      await saveProfile(form);
      setMsg(t("profile.saved"));
    } catch (e) {
      setError(err(e instanceof ApiError ? e.code : "generic"));
    } finally {
      setBusy(false);
    }
  }

  function changeLang(l: "pt" | "en") {
    setLang(l);
    saveLang(l).catch(() => {});
  }

  return (
    <Screen>
      <H1>{user?.name}</H1>
      <Body muted>{`${user?.email} · ${t("profile.age", { n: user ? ageFrom(user.birthDate) : 0 })}`}</Body>
      {!profile && <Card><Body>{t("profile.onboarding")}</Body></Card>}

      <Card>
        <H2>{t("profile.language")}</H2>
        <View style={styles.row}>
          {(["pt", "en"] as const).map((l) => (
            <Chip key={l} label={l === "pt" ? "🇵🇹 Português" : "🇬🇧 English"} selected={lang === l} onPress={() => changeLang(l)} />
          ))}
        </View>
      </Card>

      <Card>
        <H2>{t("profile.goal")}</H2>
        <View style={styles.row}>
          {(["start", "5k", "10k"] as const).map((g) => (
            <Chip key={g} label={t(`goal.${g}` as TKey)} selected={form.goal === g} onPress={() => set("goal", g)} />
          ))}
        </View>
        <Body muted>{t("profile.maxNote")}</Body>
      </Card>

      <Card>
        <H2>{t("profile.level")}</H2>
        <View style={styles.row}>
          {(["never", "starting", "regular"] as const).map((l) => (
            <Chip key={l} label={t(`level.${l}` as TKey)} selected={form.level === l} onPress={() => set("level", l)} />
          ))}
        </View>
      </Card>

      <Card>
        <H2>{t("profile.days")}</H2>
        <View style={styles.row}>
          {DAYS.map((d) => (
            <Chip key={d} label={t(`day.${d}` as TKey)} selected={form.days.includes(d)} onPress={() => toggleDay(d)} />
          ))}
        </View>
        <H2>{t("profile.duration")}</H2>
        <View style={styles.row}>
          {[20, 30, 45, 60].map((m) => (
            <Chip key={m} label={`${m} ${t("common.min")}`} selected={form.durationMin === m} onPress={() => set("durationMin", m)} />
          ))}
        </View>
      </Card>

      <Card>
        <Field label={t("profile.limitations")} value={form.limitations} onChangeText={(v) => set("limitations", v)} multiline autoCapitalize="sentences" />
      </Card>

      <ErrorText>{error}</ErrorText>
      {msg && <Text style={{ color: C.ok }}>{msg}</Text>}
      <Button title={t("common.save")} onPress={save} loading={busy} />

      {progress && (
        <Card>
          <H2>{t("profile.progress")}</H2>
          <Body>{`${progress.completed} ${t("home.stat.workouts").toLowerCase()} · ${progress.distanceKm} ${t("common.km")} · ${progress.runMinutes} ${t("common.min")}`}</Body>
          <Body muted>{`${t("profile.last30")}: ${progress.last30Days}`}</Body>
          {progress.recent.map((r) => (
            <Text key={r.id} style={{ color: C.muted, fontSize: 14 }}>{`✓ ${formatDate(r.completedAt, lang)} — ${r.title}`}</Text>
          ))}
        </Card>
      )}

      <Button title={t("common.logout")} variant="ghost" onPress={signOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: "row", flexWrap: "wrap", gap: 8 } });
