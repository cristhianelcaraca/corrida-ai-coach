import { NativeTabs } from "expo-router/unstable-native-tabs";

import { C } from "@/constants/palette";
import { useI18n } from "@/i18n";

// Barra de separadores nativa (telemóvel). Os "name" têm de ser iguais aos ficheiros em src/app/(app)/.
export default function AppTabs() {
  const { t } = useI18n();
  return (
    <NativeTabs
      backgroundColor={C.bg}
      tintColor={C.accent}
      indicatorColor={C.accentDark}
      iconColor={{ default: C.muted, selected: C.accent }}
      labelStyle={{ default: { color: C.muted }, selected: { color: C.accent } }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{t("tab.home")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="plano">
        <NativeTabs.Trigger.Label>{t("tab.plan")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="calendar" md="calendar_month" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="mobilidade">
        <NativeTabs.Trigger.Label>{t("tab.mobility")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="figure.flexibility" md="self_improvement" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="assistente">
        <NativeTabs.Trigger.Label>{t("tab.assistant")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="sparkles" md="auto_awesome" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="perfil">
        <NativeTabs.Trigger.Label>{t("tab.profile")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.fill" md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
