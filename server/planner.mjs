// =====================================================================
// planner.mjs — gera o treino de forma DETERMINÍSTICA e SEGURA.
// A IA só personaliza textos e escolhe alongamentos/mobilidade dentro
// de listas que este ficheiro valida. Se a IA falhar, este plano é usado.
// =====================================================================
import { readFileSync } from "node:fs";

export const CATALOG = JSON.parse(
  readFileSync(new URL("../shared/exercises.json", import.meta.url), "utf8"),
);
export const CATALOG_BY_ID = Object.fromEntries(CATALOG.map((e) => [e.id, e]));

export const MAX_KM = 10; // limite absoluto da app

// Cada "etapa" é um treino da progressão: [minutos a correr, minutos a caminhar, repetições]
// reps = 1 e walk = 0 significa corrida contínua.
const STAGES = [
  [1, 2, 8], [2, 2, 6], [3, 2, 5], [5, 2, 4], [8, 2, 3], [10, 1, 3],
  [15, 0, 1], [20, 0, 1], [25, 0, 1], [30, 0, 1], [35, 0, 1], [40, 0, 1],
  [45, 0, 1], [50, 0, 1], [55, 0, 1], [60, 0, 1], [70, 0, 1], [80, 0, 1], [90, 0, 1],
];

const PACE = { never: 8.5, starting: 7.5, regular: 6.5 }; // min/km estimados
const GOAL_CAP_KM = { start: 5, "5k": 5, "10k": 10 };

const T = {
  pt: {
    min: (n) => `${n} min`,
    side: (s) => `${s} s cada lado`,
    sec: (s) => `${s} s`,
    titleInterval: "Intervalos de corrida e caminhada",
    titleContinuous: "Corrida contínua leve",
    titleRecovery: "Dia de recuperação ativa",
    objInterval: "Habituar o corpo a correr de forma gradual, alternando corrida e caminhada.",
    objContinuous: "Aumentar com segurança o tempo de corrida contínua.",
    objMaintain: "Manter a forma e a consistência no teu objetivo.",
    objRecovery: "Recuperar com movimento suave, sem carga de corrida hoje.",
    runStep: "Corrida leve", walkStep: "Caminhada de recuperação",
    runHow: "Ritmo em que consegues falar frases curtas. Se não conseguires, abranda.",
    walkHow: "Caminha com calma para recuperar a respiração.",
    note: "Mantém o ritmo confortável: é melhor terminar com vontade de mais do que com exaustão.",
    noteTired: "Reduzimos a carga de hoje por te sentires cansado(a). Ouve o teu corpo.",
    notePain: "Evitámos exercícios que pudessem sobrecarregar as zonas com dor e adaptámos a mobilidade.",
    safety: "Interrompe o treino se sentires dor, tonturas, dor no peito ou falta de ar fora do normal, e procura avaliação profissional. Alongamentos nunca até à dor.",
    safetyPain: "Reportaste dor intensa. Hoje não há corrida: faz só movimento suave e, se a dor persistir, procura avaliação profissional.",
    intEasy: "Leve", intEasyMod: "Leve a moderada", intRest: "Muito leve",
  },
  en: {
    min: (n) => `${n} min`,
    side: (s) => `${s} s each side`,
    sec: (s) => `${s} s`,
    titleInterval: "Run/walk intervals",
    titleContinuous: "Easy continuous run",
    titleRecovery: "Active recovery day",
    objInterval: "Gradually get your body used to running by alternating running and walking.",
    objContinuous: "Safely build up your continuous running time.",
    objMaintain: "Maintain your fitness and consistency toward your goal.",
    objRecovery: "Recover with gentle movement, no running load today.",
    runStep: "Easy run", walkStep: "Recovery walk",
    runHow: "A pace where you can speak short sentences. If you can't, slow down.",
    walkHow: "Walk calmly to catch your breath.",
    note: "Keep a comfortable pace: it's better to finish wanting more than exhausted.",
    noteTired: "We reduced today's load because you feel tired. Listen to your body.",
    notePain: "We avoided exercises that could overload sore areas and adapted the mobility work.",
    safety: "Stop if you feel pain, dizziness, chest pain or unusual shortness of breath, and seek professional assessment. Never stretch into pain.",
    safetyPain: "You reported intense pain. No running today: do gentle movement only and, if pain persists, seek professional assessment.",
    intEasy: "Easy", intEasyMod: "Easy to moderate", intRest: "Very easy",
  },
};

const round1 = (n) => Math.round(n * 10) / 10;

// ---------- escolher a etapa (progressão) ----------
function startStage(level, maxMinutes) {
  if (level === "never" || !maxMinutes) return 0;
  let best = 0;
  STAGES.forEach(([run, , reps], i) => {
    if (run * (reps === 1 ? 1 : 1) <= maxMinutes * 0.7) best = i;
  });
  if (level === "starting") best = Math.min(best, 5);
  return best;
}

export function nextStage({ level, maxMinutes, history, now = new Date() }) {
  const last = history?.[0]; // histórico vem ordenado do mais recente para o mais antigo
  if (!last) return startStage(level, maxMinutes);
  let stage = Number.isInteger(last.stage) ? last.stage : startStage(level, maxMinutes);
  if (last.completed_at) {
    const fb = last.feedback || {};
    if (fb.effort !== "hard" && !fb.pain) stage += 1; // só avança se correu bem
    const days = (now - new Date(last.completed_at)) / 86400000;
    if (days > 14) stage = Math.max(0, stage - 2); // pausa longa: recuar
  }
  return Math.max(0, Math.min(STAGES.length - 1, stage));
}

// ---------- escolher mobilidade e alongamentos ----------
const MOBILITY_EXTRA = new Set(["neck_stretch", "chest_stretch"]);

function suitable(ex, painAreas) {
  return !ex.avoid.some((a) => painAreas.includes(a));
}
function score(ex, painAreas) {
  return ex.areas.filter((a) => painAreas.includes(a)).length;
}

export function pickMobility(painAreas, count = 3) {
  const pool = CATALOG.filter(
    (e) => (e.kind === "mobility" || MOBILITY_EXTRA.has(e.id)) && suitable(e, painAreas),
  );
  const defaults = ["leg_swings", "ankle_circles", "hip_mobility", "squat_to_stand", "shoulder_circles"];
  const ranked = [...pool].sort((a, b) => {
    const d = score(b, painAreas) - score(a, painAreas);
    if (d) return d;
    return defaults.indexOf(a.id) - defaults.indexOf(b.id) || 0;
  });
  const withScore = ranked.filter((e) => score(e, painAreas) > 0).slice(0, count);
  const rest = defaults.map((id) => pool.find((e) => e.id === id)).filter(Boolean);
  const out = [...withScore];
  for (const e of rest) if (out.length < count && !out.includes(e)) out.push(e);
  return out.slice(0, count);
}

export function pickStretches(painAreas, count = 4) {
  const pool = CATALOG.filter((e) => e.kind === "stretch" && suitable(e, painAreas));
  const defaults = ["calf_stretch", "hamstring_stretch", "quad_stretch", "hip_stretch"];
  const withScore = pool
    .filter((e) => score(e, painAreas) > 0)
    .sort((a, b) => score(b, painAreas) - score(a, painAreas))
    .slice(0, count);
  const out = [...withScore];
  for (const id of defaults) {
    const e = pool.find((x) => x.id === id);
    if (e && out.length < count && !out.includes(e)) out.push(e);
  }
  return out.slice(0, count);
}

// ---------- montar o treino ----------
function exStep(lang, ex, duration, instructions) {
  return {
    id: ex.id,
    name: ex.name[lang],
    duration,
    instructions: instructions || ex.howto[lang],
    avatarExercise: ex.id,
  };
}

export function buildWorkout({ lang = "pt", profile = {}, interview = {}, history = [], now = new Date() }) {
  const t = T[lang] || T.pt;
  const level = profile.level in PACE ? profile.level : "never";
  const goal = profile.goal in GOAL_CAP_KM ? profile.goal : "start";
  const pains = Array.isArray(interview.pains) ? interview.pains : [];
  const painAreas = pains.map((p) => p.area);
  const maxPain = Math.max(0, ...pains.map((p) => Number(p.level) || 0));
  const feeling = interview.feeling || "normal";
  const maxMinutes = Number(interview.maxMinutes) || 0;

  let stage = nextStage({ level, maxMinutes, history, now });
  let reduced = false;
  if (feeling === "tired" || (maxPain >= 4 && maxPain < 7)) {
    stage = Math.max(0, stage - 1);
    reduced = true;
  }
  const recovery = maxPain >= 7;

  // duração máxima da sessão escolhida pelo utilizador
  // (tempo do treino principal; aquecimento, mobilidade e alongamentos são extra)
  const sessionMax = Number(profile.durationMin) || 30;
  const mainBudget = Math.max(10, sessionMax);

  const mobility = pickMobility(painAreas, 3).map((e) =>
    exStep(lang, e, t.side(30)),
  );
  const stretches = pickStretches(painAreas, recovery ? 4 : 4).map((e) =>
    exStep(lang, e, t.side(30)),
  );

  const warmup = [exStep(lang, CATALOG_BY_ID.easy_walk, t.min(5))];
  const cooldownWalk = exStep(lang, CATALOG_BY_ID.easy_walk, t.min(5), t.walkHow);
  const breath = exStep(lang, CATALOG_BY_ID.breathing, t.min(1));

  let main = [];
  let runMinutes = 0;
  let title, objective, intensity;
  let capped = false;

  if (recovery) {
    title = t.titleRecovery;
    objective = t.objRecovery;
    intensity = t.intRest;
    main = [exStep(lang, CATALOG_BY_ID.easy_walk, t.min(10), t.walkHow)];
  } else {
    let [run, walk, reps] = STAGES[stage];
    // limites: tempo da sessão e distância máxima (nunca mais de 10 km)
    const capKm = Math.min(MAX_KM, GOAL_CAP_KM[goal]);
    const capRunMin = Math.floor(capKm * PACE[level]);
    const intervalTotal = (r) => (run + walk) * r;
    while (reps > 1 && intervalTotal(reps) > mainBudget) reps -= 1;
    if (reps === 1 && walk === 0 && run > mainBudget) { run = mainBudget; capped = true; }
    if (reps === 1 && walk === 0 && run > capRunMin) { run = capRunMin; capped = true; }

    if (reps > 1) {
      title = t.titleInterval;
      objective = t.objInterval;
      intensity = t.intEasy;
      for (let i = 0; i < reps; i++) {
        main.push(exStep(lang, CATALOG_BY_ID.easy_run, t.min(run), t.runHow));
        if (i < reps - 1 || walk > 0)
          main.push({ ...exStep(lang, CATALOG_BY_ID.easy_walk, t.min(walk), t.walkHow), name: t.walkStep });
      }
      runMinutes = run * reps;
    } else {
      title = t.titleContinuous;
      objective = capped ? t.objMaintain : t.objContinuous;
      intensity = run >= 25 ? t.intEasyMod : t.intEasy;
      main = [exStep(lang, CATALOG_BY_ID.easy_run, t.min(run), t.runHow)];
      runMinutes = run;
    }
  }

  const distanceKm = Math.min(MAX_KM, round1(runMinutes / PACE[level]));
  const mainMinutes = main.reduce((s, x) => s + (parseInt(x.duration, 10) || 0), 0);
  const total = 5 + 3 * 1 + mainMinutes + 5 + 4 * 1;

  let note = t.note;
  if (feeling === "tired") note = t.noteTired;
  else if (painAreas.length) note = t.notePain;

  return {
    title,
    objective,
    duration: t.min(total),
    intensity,
    warmup,
    mobility,
    workout: main,
    cooldown: [cooldownWalk, ...stretches, breath],
    note,
    safetyNote: recovery ? t.safetyPain : t.safety,
    meta: { stage, runMinutes, distanceKm, painAreas, reduced, recovery, capped, source: "rules" },
  };
}
