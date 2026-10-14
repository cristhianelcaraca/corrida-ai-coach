// api.ts — fala com o servidor (backend).
import Constants from "expo-constants";
import { Platform } from "react-native";

/** Descobre o endereço do servidor.
 * 1) EXPO_PUBLIC_API_URL no ficheiro .env (recomendado em produção);
 * 2) senão, usa o IP do computador onde corre o Expo (porta 3000). */
export function getApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const hostUri = Constants.expoConfig?.hostUri; // ex.: "192.168.1.141:8081"
  if (hostUri) return `http://${hostUri.split(":")[0]}:3000`;
  return Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";
}

export class ApiError extends Error {
  constructor(public code: string, public status: number) {
    super(code);
  }
}

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;
export const setAuthToken = (t: string | null) => (authToken = t);
export const setUnauthorizedHandler = (fn: (() => void) | null) => (onUnauthorized = fn);

export async function api<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(getApiUrl() + path, {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError("network", 0); // sem ligação ao servidor
  }
  let json: any = null;
  try {
    json = await res.json();
  } catch {
    /* resposta sem JSON */
  }
  if (!res.ok) {
    if (res.status === 401 && authToken && !path.startsWith("/api/auth/")) onUnauthorized?.();
    throw new ApiError(json?.error ?? "server_error", res.status);
  }
  return json as T;
}

// ---------- tipos que o servidor devolve ----------
export type Lang = "pt" | "en";
export type User = { id: number; email: string; name: string; birthDate: string; lang: Lang };
export type Profile = {
  goal: "start" | "5k" | "10k";
  level: "never" | "starting" | "regular";
  days: string[];
  durationMin: number;
  limitations: string;
};
export type Step = { id: string; name: string; duration: string; instructions: string; avatarExercise: string };
export type Workout = {
  id: number;
  createdAt: string;
  completedAt: string | null;
  feedback: { effort: "easy" | "ok" | "hard"; pain: boolean; notes: string } | null;
  title: string;
  objective: string;
  duration: string;
  intensity: string;
  warmup: Step[];
  mobility: Step[];
  workout: Step[];
  cooldown: Step[];
  note: string;
  safetyNote: string;
  meta: { stage: number; runMinutes: number; distanceKm: number; painAreas: string[]; source: "ai" | "rules" };
};
export type Progress = {
  completed: number;
  runMinutes: number;
  distanceKm: number;
  last30Days: number;
  stage: number;
  recent: { id: number; completedAt: string; stage: number; title: string }[];
};
export type Interview = {
  maxMinutes: number;
  feeling: "energy" | "normal" | "tired";
  pains: { area: string; level: number }[];
  notes: string;
};
