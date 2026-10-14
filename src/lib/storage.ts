// storage.ts — guarda pequenos valores (token de login, idioma).
// No telemóvel usa o SecureStore (cofre do sistema); na web usa o localStorage.
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

export async function getItem(key: string): Promise<string | null> {
  try {
    if (Platform.OS === "web") return globalThis.localStorage?.getItem(key) ?? null;
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === "web") globalThis.localStorage?.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
  } catch {
    /* se falhar, a app continua a funcionar (só não lembra da próxima vez) */
  }
}

export async function removeItem(key: string): Promise<void> {
  try {
    if (Platform.OS === "web") globalThis.localStorage?.removeItem(key);
    else await SecureStore.deleteItemAsync(key);
  } catch {
    /* ignorar */
  }
}
