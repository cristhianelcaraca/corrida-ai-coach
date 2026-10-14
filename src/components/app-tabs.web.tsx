// Versão web da barra de separadores (o navegador não tem NativeTabs).
import { TabList, TabSlot, TabTrigger, Tabs, type TabListProps, type TabTriggerSlotProps } from "expo-router/ui";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { C } from "@/constants/palette";
import { useI18n } from "@/i18n";

function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={[styles.btn, isFocused && styles.btnOn]}>
      <Text style={[styles.text, isFocused && { color: C.bg }]}>{children}</Text>
    </Pressable>
  );
}

function Bar(props: TabListProps) {
  return <View {...props} style={styles.bar} />;
}

export default function AppTabs() {
  const { t } = useI18n();
  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild>
        <Bar>
          <TabTrigger name="index" href="/" asChild><TabButton>{t("tab.home")}</TabButton></TabTrigger>
          <TabTrigger name="plano" href="/plano" asChild><TabButton>{t("tab.plan")}</TabButton></TabTrigger>
          <TabTrigger name="mobilidade" href="/mobilidade" asChild><TabButton>{t("tab.mobility")}</TabButton></TabTrigger>
          <TabTrigger name="assistente" href="/assistente" asChild><TabButton>{t("tab.assistant")}</TabButton></TabTrigger>
          <TabTrigger name="perfil" href="/perfil" asChild><TabButton>{t("tab.profile")}</TabButton></TabTrigger>
        </Bar>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", justifyContent: "center", gap: 8, padding: 10, backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.border },
  btn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: C.card },
  btnOn: { backgroundColor: C.accent },
  text: { color: C.text, fontWeight: "700", fontSize: 13 },
});
