// exercises.ts — catálogo de exercícios (os dados estão em shared/exercises.json,
// o mesmo ficheiro que o servidor usa, para nunca ficarem diferentes).
import raw from "../../shared/exercises.json";
import type { Lang } from "@/lib/api";

export type Exercise = {
  id: string;
  kind: "warmup" | "drill" | "mobility" | "stretch" | "breath";
  areas: string[];
  avoid: string[];
  name: Record<Lang, string>;
  desc: Record<Lang, string>;
  howto: Record<Lang, string>;
};

export const EXERCISES = raw as Exercise[];
export const EXERCISE_BY_ID: Record<string, Exercise> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

export const PAIN_AREAS = [
  "neck", "shoulders", "upper_back", "lower_back", "hips", "glutes", "quads",
  "hamstrings", "calves", "shins", "knees", "ankles", "feet",
] as const;
