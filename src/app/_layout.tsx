// _layout.tsx (raiz) — junta idioma + sessão e decide que ecrãs o utilizador pode ver:
// sem sessão -> ecrãs de login; com sessão -> a app.
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { C } from "@/constants/palette";
import { I18nProvider, useI18n } from "@/i18n";
import { AuthProvider, useAuth } from "@/lib/auth";

function Gate() {
  const { user, loading } = useAuth();
  const { lang, setLang } = useI18n();
  const segments = useSegments();
  const router = useRouter();

  // quando o utilizador entra, usamos o idioma que ficou guardado na conta dele
  useEffect(() => {
    if (user && user.lang !== lang) setLang(user.lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === "(auth)";
    if (!user && !inAuth) router.replace("/login");
    else if (user && inAuth) router.replace("/");
  }, [user, loading, segments, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={C.accent} size="large" />
      </View>
    );
  }
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <Gate />
        </AuthProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
