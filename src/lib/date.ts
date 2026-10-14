// date.ts — converte a data de nascimento escrita pelo utilizador para AAAA-MM-DD.
import type { Lang } from "./api";

/** pt: DD/MM/AAAA   en: MM/DD/YYYY   (também aceita AAAA-MM-DD). Devolve null se inválida. */
export function parseBirthDate(input: string, lang: Lang): string | null {
  const s = input.trim();
  let y: number, m: number, d: number;
  let match = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) {
    [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  } else {
    match = s.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/);
    if (!match) return null;
    const a = Number(match[1]), b = Number(match[2]);
    y = Number(match[3]);
    [d, m] = lang === "en" ? [b, a] : [a, b];
  }
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function formatDate(iso: string, lang: Lang): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return lang === "en" ? `${m}/${d}/${y}` : `${d}/${m}/${y}`;
}

export function ageFrom(iso: string): number {
  const b = new Date(`${iso}T00:00:00Z`), n = new Date();
  let age = n.getUTCFullYear() - b.getUTCFullYear();
  const diff = n.getUTCMonth() - b.getUTCMonth();
  if (diff < 0 || (diff === 0 && n.getUTCDate() < b.getUTCDate())) age--;
  return age;
}
