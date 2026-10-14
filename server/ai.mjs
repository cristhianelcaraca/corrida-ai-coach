// ai.mjs — a IA personaliza textos e escolhe mobilidade/alongamentos.
// Tudo o que ela devolve é VALIDADO; se algo falhar usamos o plano das regras.
import OpenAI from "openai";
import { CATALOG, CATALOG_BY_ID, pickMobility, pickStretches } from "./planner.mjs";

const MOBILITY_EXTRA = new Set(["neck_stretch", "chest_stretch"]);

// Tira o JSON de uma resposta de texto (alguns modelos gratuitos põem ```json … ``` à volta).
function extractJson(text) {
  const clean = String(text || "").replace(/```json|```/g, "");
  const a = clean.indexOf("{"), b = clean.lastIndexOf("}");
  if (a < 0 || b <= a) throw new Error("A IA não devolveu JSON");
  return JSON.parse(clean.slice(a, b + 1));
}

const isKey = (v) => Boolean(v) && !v.startsWith("coloque");

export function createAi() {
  const orKey = process.env.OPENROUTER_API_KEY;
  const oaKey = process.env.OPENAI_API_KEY;
  if (!isKey(orKey) && !isKey(oaKey)) return null;
  const useOpenRouter = isKey(orKey); // se houver chave OpenRouter, usa-a
  const client = useOpenRouter
    ? new OpenAI({
        apiKey: orKey,
        baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
        defaultHeaders: { "X-Title": "Corrida AI" },
      })
    : new OpenAI({ apiKey: oaKey });
  const model = useOpenRouter
    ? process.env.OPENROUTER_MODEL || "openrouter/free"
    : process.env.OPENAI_MODEL || "gpt-5.6-luna";

  return async function personalize({ base, lang, profile, interview }) {
    const painAreas = base.meta.painAreas;
    const ok = (e) => !e.avoid.some((a) => painAreas.includes(a));
    const mobilityIds = CATALOG.filter((e) => (e.kind === "mobility" || MOBILITY_EXTRA.has(e.id)) && ok(e)).map((e) => e.id);
    const stretchIds = CATALOG.filter((e) => e.kind === "stretch" && ok(e)).map((e) => e.id);

    const stepSchema = (ids) => ({
      type: "object", additionalProperties: false,
      properties: { id: { type: "string", enum: ids }, instructions: { type: "string" } },
      required: ["id", "instructions"],
    });
    const schema = {
      type: "object", additionalProperties: false,
      properties: {
        title: { type: "string" }, objective: { type: "string" },
        note: { type: "string" }, safetyNote: { type: "string" },
        mainInstructions: { type: "array", items: { type: "string" } },
        mobility: { type: "array", items: stepSchema(mobilityIds) },
        cooldown: { type: "array", items: stepSchema(stretchIds) },
      },
      required: ["title", "objective", "note", "safetyNote", "mainInstructions", "mobility", "cooldown"],
    };

    const instructions = [
      `Responde em ${lang === "en" ? "English" : "português de Portugal"}.`,
      "És um assistente de treino de corrida. Não diagnostiques nem trates lesões.",
      "NÃO alteres a estrutura nem as durações do treino principal: só escreve instruções motivadoras e claras para cada passo (mainInstructions, mesma ordem e mesmo número de itens).",
      "Escolhe 3 exercícios de mobilidade e 3 a 4 alongamentos APENAS dos ids permitidos, priorizando as zonas com dor ou cansaço relatadas.",
      "Alongamentos suaves, nunca até à dor. Se houver dor forte, tontura ou falta de ar, recomenda parar e procurar avaliação profissional.",
      "Mantém textos curtos (máx. 2 frases por instrução).",
    ].join("\n");
    const input = JSON.stringify({
      profile, interview,
      mainWorkoutSteps: base.workout.map((s) => ({ name: s.name, duration: s.duration })),
      painAreas, tired: interview.feeling === "tired",
      allowedMobilityIds: mobilityIds, allowedStretchIds: stretchIds,
    });

    let out;
    if (useOpenRouter) {
      // OpenRouter: formato "chat" compatível com a OpenAI. Os modelos gratuitos nem sempre aceitam
      // schema estrito, por isso pedimos JSON no texto e validamos tudo depois.
      const shape = '{"title":"","objective":"","note":"","safetyNote":"","mainInstructions":["..."],"mobility":[{"id":"","instructions":""}],"cooldown":[{"id":"","instructions":""}]}';
      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: `${instructions}\nResponde APENAS com um objeto JSON neste formato, sem texto extra: ${shape}` },
          { role: "user", content: input },
        ],
      });
      out = extractJson(response.choices?.[0]?.message?.content);
    } else {
      const response = await client.responses.create({
        model,
        store: false,
        instructions,
        input,
        text: { format: { type: "json_schema", name: "running_workout", strict: true, schema } },
      });
      out = JSON.parse(response.output_text);
    }
    const merged = { ...base, meta: { ...base.meta, source: "ai" } };
    if (typeof out.title === "string" && out.title.trim()) merged.title = out.title.trim().slice(0, 80);
    if (typeof out.objective === "string" && out.objective.trim()) merged.objective = out.objective.trim().slice(0, 300);
    if (typeof out.note === "string" && out.note.trim()) merged.note = out.note.trim().slice(0, 300);
    if (typeof out.safetyNote === "string" && out.safetyNote.trim()) merged.safetyNote = out.safetyNote.trim().slice(0, 400);

    if (Array.isArray(out.mainInstructions) && out.mainInstructions.length === base.workout.length) {
      merged.workout = base.workout.map((s, i) => ({ ...s, instructions: String(out.mainInstructions[i]).slice(0, 240) }));
    }
    const mapSteps = (items, fallback, min, max, allowed) => {
      if (!Array.isArray(items)) return fallback;
      const seen = new Set();
      const steps = [];
      for (const it of items) {
        const ex = CATALOG_BY_ID[it?.id];
        if (!ex || seen.has(ex.id) || !allowed.has(ex.id)) continue; // só ids permitidos para as dores do utilizador
        seen.add(ex.id);
        const old = fallback.find((f) => f.id === ex.id);
        steps.push({
          id: ex.id, name: ex.name[lang], avatarExercise: ex.id,
          duration: old?.duration ?? fallback[0]?.duration ?? "30 s",
          instructions: String(it.instructions || ex.howto[lang]).slice(0, 240),
        });
      }
      return steps.length >= min ? steps.slice(0, max) : fallback;
    };
    merged.mobility = mapSteps(out.mobility, base.mobility, 2, 4, new Set(mobilityIds));
    // no cooldown mantemos a caminhada inicial e a respiração final das regras
    const stretches = mapSteps(out.cooldown, base.cooldown.filter((s) => CATALOG_BY_ID[s.id].kind === "stretch"), 2, 4, new Set(stretchIds));
    merged.cooldown = [base.cooldown[0], ...stretches, base.cooldown[base.cooldown.length - 1]];
    return merged;
  };
}
