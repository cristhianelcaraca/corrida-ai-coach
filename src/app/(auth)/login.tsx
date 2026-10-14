import { Link } from "expo-router";
import React, { useState } from "react";
import { View } from "react-native";

import RobotMascot from "@/components/RobotMascot";
import { Body, Button, ErrorText, Field, H1, LangSwitch, Screen } from "@/components/ui";
import { useI18n } from "@/i18n";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { C } from "@/constants/palette";

export default function Login() {
  const { t, err } = useI18n();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email.trim() || !password) return setError(t("err.fill_all"));
    setBusy(true);
    setError(null);
    try {
      await signIn(email.trim(), password); // o guarda no _layout leva-nos para a app
    } catch (e) {
      setError(err(e instanceof ApiError ? e.code : "generic"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <LangSwitch />
      <View style={{ alignItems: "center", marginTop: 8 }}>
        <RobotMascot size={120} />
      </View>
      <H1>{t("login.title")}</H1>
      <Body muted>{t("login.subtitle")}</Body>
      <Field label={t("auth.email")} value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
      <Field label={t("auth.password")} value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" />
      <ErrorText>{error}</ErrorText>
      <Button title={t("login.submit")} onPress={submit} loading={busy} />
      <Link href="/registo" style={{ color: C.accent, textAlign: "center", fontSize: 15, padding: 8 }}>
        {t("login.toRegister")}
      </Link>
    </Screen>
  );
}
