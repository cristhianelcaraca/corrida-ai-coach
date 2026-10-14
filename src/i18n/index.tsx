// i18n/index.tsx — troca de idioma (pt/en) em toda a app.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { pt, type TKey } from "./pt";
import { en } from "./en";
import { getItem, setItem } from "@/lib/storage";
import type { Lang } from "@/lib/api";

const DICTS: Record<Lang, Record<TKey, string>> = { pt, en };

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TKey, vars?: Record<string, string | number>) => string;
  /** traduz um código de erro do servidor (ex.: "email_taken") */
  err: (code: string) => string;
};
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("pt");

  useEffect(() => {
    getItem("lang").then((v) => {
      if (v === "pt" || v === "en") setLangState(v);
    });
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    setItem("lang", l);
  }, []);

  const value = useMemo<Ctx>(() => {
    const t: Ctx["t"] = (key, vars) => {
      let s = DICTS[lang][key] ?? key;
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
      return s;
    };
    const err = (code: string) => {
      const k = `err.${code}` as TKey;
      return DICTS[lang][k] ?? DICTS[lang]["err.generic"];
    };
    return { lang, setLang, t, err };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n tem de ser usado dentro do I18nProvider");
  return ctx;
}
export type { TKey };
