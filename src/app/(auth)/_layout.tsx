import { Stack } from "expo-router";
import { C } from "@/constants/palette";

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }} />;
}
