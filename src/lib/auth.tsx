// auth.tsx — guarda quem está com sessão iniciada e fala com o backend para login/registo.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, setAuthToken, setUnauthorizedHandler, type Lang, type Profile, type User } from "./api";
import { getItem, removeItem, setItem } from "./storage";

type Ctx = {
  loading: boolean;
  user: User | null;
  profile: Profile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: { name: string; email: string; password: string; birthDate: string; lang: Lang }) => Promise<void>;
  signOut: () => Promise<void>;
  saveProfile: (profile: Profile) => Promise<void>;
  saveLang: (lang: Lang) => Promise<void>;
};
const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const signOut = useCallback(async () => {
    setAuthToken(null);
    await removeItem("token");
    setUser(null);
    setProfile(null);
  }, []);

  // ao abrir a app: se houver token guardado, tenta retomar a sessão
  useEffect(() => {
    setUnauthorizedHandler(() => {
      signOut();
    });
    (async () => {
      const token = await getItem("token");
      if (token) {
        setAuthToken(token);
        try {
          const me = await api<{ user: User; profile: Profile | null }>("/api/me");
          setUser(me.user);
          setProfile(me.profile);
        } catch (e: any) {
          if (e?.status === 401) {
            setAuthToken(null);
            await removeItem("token");
          }
        }
      }
      setLoading(false);
    })();
    return () => {
      setUnauthorizedHandler(null);
    };
  }, [signOut]);

  const startSession = useCallback(async (res: { token: string; user: User }) => {
    setAuthToken(res.token);
    await setItem("token", res.token);
    setUser(res.user);
    try {
      const me = await api<{ user: User; profile: Profile | null }>("/api/me");
      setProfile(me.profile);
    } catch {
      setProfile(null);
    }
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      loading,
      user,
      profile,
      signIn: async (email, password) => {
        const res = await api<{ token: string; user: User }>("/api/auth/login", { method: "POST", body: { email, password } });
        await startSession(res);
      },
      signUp: async (data) => {
        const res = await api<{ token: string; user: User }>("/api/auth/register", { method: "POST", body: data });
        await startSession(res);
      },
      signOut,
      saveProfile: async (p) => {
        const me = await api<{ user: User; profile: Profile }>("/api/me", { method: "PUT", body: { profile: p } });
        setUser(me.user);
        setProfile(me.profile);
      },
      saveLang: async (lang) => {
        if (!user) return;
        const me = await api<{ user: User; profile: Profile | null }>("/api/me", { method: "PUT", body: { lang } });
        setUser(me.user);
      },
    }),
    [loading, user, profile, signOut, startSession],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth tem de ser usado dentro do AuthProvider");
  return ctx;
}
