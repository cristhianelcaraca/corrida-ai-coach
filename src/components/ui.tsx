// ui.tsx — pequenos blocos visuais reutilizados em todos os ecrãs.
import React from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { C } from "@/constants/palette";
import { useI18n } from "@/i18n";
import type { Lang } from "@/lib/api";

export function Screen({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) {
  const inner = scroll ? (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  ) : (
    <View style={styles.content}>{children}</View>
  );
  return <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>{inner}</SafeAreaView>;
}

export const H1 = ({ children }: { children: React.ReactNode }) => <Text style={styles.h1}>{children}</Text>;
export const H2 = ({ children }: { children: React.ReactNode }) => <Text style={styles.h2}>{children}</Text>;
export const Body = ({ children, muted, style }: { children: React.ReactNode; muted?: boolean; style?: object }) => (
  <Text style={[styles.body, muted && { color: C.muted }, style]}>{children}</Text>
);

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({ title, onPress, loading, variant = "primary", disabled }: {
  title: string; onPress: () => void; loading?: boolean; variant?: "primary" | "ghost"; disabled?: boolean;
}) {
  const primary = variant === "primary";
  return (
    <Pressable
      onPress={onPress}
      disabled={loading || disabled}
      style={({ pressed }) => [styles.btn, primary ? styles.btnPrimary : styles.btnGhost, (pressed || disabled) && { opacity: 0.7 }]}
    >
      {loading ? <ActivityIndicator color={primary ? C.bg : C.accent} /> : <Text style={[styles.btnText, !primary && { color: C.accent }]}>{title}</Text>}
    </Pressable>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipOn]}>
      <Text style={[styles.chipText, selected && { color: C.bg }]}>{label}</Text>
    </Pressable>
  );
}

export function Field({ label, ...props }: { label: string } & TextInputProps) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor="#6B756E" style={styles.input} autoCapitalize="none" {...props} />
    </View>
  );
}

export const ErrorText = ({ children }: { children?: string | null }) => (children ? <Text style={styles.error}>{children}</Text> : null);

export function LangSwitch() {
  const { lang, setLang } = useI18n();
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {(["pt", "en"] as Lang[]).map((l) => (
        <Chip key={l} label={l === "pt" ? "🇵🇹 Português" : "🇬🇧 English"} selected={lang === l} onPress={() => setLang(l)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, gap: 16, paddingBottom: 60, maxWidth: 640, width: "100%", alignSelf: "center" },
  h1: { color: C.text, fontSize: 28, fontWeight: "800" },
  h2: { color: C.text, fontSize: 18, fontWeight: "700" },
  body: { color: C.text, fontSize: 15, lineHeight: 22 },
  card: { backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 16, gap: 10 },
  btn: { minHeight: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  btnPrimary: { backgroundColor: C.accent },
  btnGhost: { borderWidth: 1, borderColor: C.accent, backgroundColor: "transparent" },
  btnText: { color: C.bg, fontSize: 16, fontWeight: "800" },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  chipOn: { backgroundColor: C.accent, borderColor: C.accent },
  chipText: { color: C.text, fontSize: 14, fontWeight: "600" },
  label: { color: C.muted, fontSize: 13, fontWeight: "600" },
  input: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, color: C.text, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16 },
  error: { color: C.danger, fontSize: 14 },
});
