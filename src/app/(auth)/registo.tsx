import { Link, useRouter } from "expo-router";
import React, { useState } from "react";

import { Body, Button, ErrorText, Field, H1, LangSwitch, Screen } from "@/components/ui";
import { C } from "@/constants/palette";
import { useI18n } from "@/i18n";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { parseBirthDate } from "@/lib/date";

export default function Register() {
  const { t, err, lang } = useI18n();
  const { signUp } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birth, setBirth] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!name.trim() || !email.trim() || !password || !birth.trim()) return setError(t("err.fill_all"));
    const birthDate = parseBirthDate(birth, lang); // converte DD/MM/AAAA -> AAAA-MM-DD
    if (!birthDate) return setError(t("err.birth_format"));
    setBusy(true);
    setError(null);
    try {
      await signUp({ name: name.trim(), email: email.trim(), password, birthDate, lang });
      router.replace("/perfil"); // primeiro passo: completar o perfil
    } catch (e) {
      setError(err(e instanceof ApiError ? e.code : "generic"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <LangSwitch />
      <H1>{t("register.title")}</H1>
      <Body muted>{t("register.subtitle")}</Body>
      <Field label={t("auth.name")} value={name} onChangeText={setName} autoCapitalize="words" autoComplete="name" />
      <Field label={t("auth.email")} value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
      <Field label={t("auth.birth")} value={birth} onChangeText={setBirth} placeholder={t("auth.birthHint")} keyboardType="numbers-and-punctuation" />
      <Field label={`${t("auth.password")} (${t("register.passwordHint")})`} value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
      <ErrorText>{error}</ErrorText>
      <Button title={t("register.submit")} onPress={submit} loading={busy} />
      <Link href="/login" style={{ color: C.accent, textAlign: "center", fontSize: 15, padding: 8 }}>
        {t("register.toLogin")}
      </Link>
    </Screen>
  );
}
