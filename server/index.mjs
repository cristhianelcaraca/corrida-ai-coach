// index.mjs — servidor (API) da Corrida AI.
import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { fileURLToPath } from "node:url";
import { openDb } from "./db.mjs";
import { buildWorkout, MAX_KM } from "./planner.mjs";
import { createAi } from "./ai.mjs";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-troca-isto";
if (!process.env.JWT_SECRET) console.warn("⚠️  JWT_SECRET não definido no .env — usa um segredo a sério em produção.");

const GOALS = ["start", "5k", "10k"];
const LEVELS = ["never", "starting", "regular"];
const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const AREAS = ["neck", "shoulders", "upper_back", "lower_back", "hips", "glutes", "quads", "hamstrings", "calves", "shins", "knees", "ankles", "feet"];
const FEELINGS = ["energy", "normal", "tired"];
const MIN_AGE = 16;

const str = (v, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const langOf = (v) => (v === "en" ? "en" : "pt");

function ageFrom(birth) {
  const b = new Date(`${birth}T00:00:00Z`);
  const n = new Date();
  let age = n.getUTCFullYear() - b.getUTCFullYear();
  const m = n.getUTCMonth() - b.getUTCMonth();
  if (m < 0 || (m === 0 && n.getUTCDate() < b.getUTCDate())) age--;
  return age;
}
function validBirth(v) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v) return false;
  const age = ageFrom(v);
  return age >= MIN_AGE && age <= 100;
}

function cleanProfile(p = {}) {
  return {
    goal: GOALS.includes(p.goal) ? p.goal : "start",
    level: LEVELS.includes(p.level) ? p.level : "never",
    days: Array.isArray(p.days) ? p.days.filter((d) => DAYS.includes(d)) : [],
    durationMin: [20, 30, 45, 60].includes(Number(p.durationMin)) ? Number(p.durationMin) : 30,
    limitations: str(p.limitations, 500),
  };
}
function cleanInterview(i = {}) {
  const pains = Array.isArray(i.pains)
    ? i.pains
        .filter((p) => AREAS.includes(p?.area))
        .slice(0, 13)
        .map((p) => ({ area: p.area, level: Math.max(1, Math.min(10, Math.round(Number(p.level) || 1))) }))
    : [];
  return {
    maxMinutes: Math.max(0, Math.min(180, Number(i.maxMinutes) || 0)),
    feeling: FEELINGS.includes(i.feeling) ? i.feeling : "normal",
    pains,
    notes: str(i.notes, 800),
  };
}

export function createApp({ db = openDb(), ai = createAi() } = {}) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "64kb" }));

  const userOut = (u) => ({ id: u.id, email: u.email, name: u.name, birthDate: u.birth_date, lang: u.lang });
  const sign = (u) => jwt.sign({ sub: u.id }, JWT_SECRET, { expiresIn: "30d" });

  function auth(req, res, next) {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : "";
    try {
      const { sub } = jwt.verify(token, JWT_SECRET);
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(sub);
      if (!user) throw new Error("no user");
      req.user = user;
      next();
    } catch {
      res.status(401).json({ error: "unauthorized" });
    }
  }

  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: true, legacyHeaders: false });

  app.get("/health", (_req, res) => res.json({ ok: true, ai: Boolean(ai), maxKm: MAX_KM }));

  // ---------- AUTENTICAÇÃO ----------
  app.post("/api/auth/register", authLimiter, (req, res) => {
    const name = str(req.body?.name, 80);
    const email = str(req.body?.email, 200).toLowerCase();
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const birthDate = str(req.body?.birthDate, 10);
    const lang = langOf(req.body?.lang);
    if (name.length < 2) return res.status(400).json({ error: "invalid_name" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "invalid_email" });
    if (password.length < 8 || password.length > 100) return res.status(400).json({ error: "weak_password" });
    if (!validBirth(birthDate)) return res.status(400).json({ error: "invalid_birth_date" });
    if (db.prepare("SELECT 1 FROM users WHERE email = ?").get(email)) return res.status(409).json({ error: "email_taken" });
    const hash = bcrypt.hashSync(password, 10);
    const info = db.prepare("INSERT INTO users (email, password_hash, name, birth_date, lang) VALUES (?,?,?,?,?)").run(email, hash, name, birthDate, lang);
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
    res.status(201).json({ token: sign(user), user: userOut(user) });
  });

  app.post("/api/auth/login", authLimiter, (req, res) => {
    const email = str(req.body?.email, 200).toLowerCase();
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ error: "invalid_credentials" });
    res.json({ token: sign(user), user: userOut(user) });
  });

  // ---------- PERFIL ----------
  app.get("/api/me", auth, (req, res) => {
    const row = db.prepare("SELECT data FROM profiles WHERE user_id = ?").get(req.user.id);
    res.json({ user: userOut(req.user), profile: row ? JSON.parse(row.data) : null });
  });

  app.put("/api/me", auth, (req, res) => {
    if (req.body?.lang !== undefined) db.prepare("UPDATE users SET lang = ? WHERE id = ?").run(langOf(req.body.lang), req.user.id);
    if (req.body?.name !== undefined) {
      const name = str(req.body.name, 80);
      if (name.length < 2) return res.status(400).json({ error: "invalid_name" });
      db.prepare("UPDATE users SET name = ? WHERE id = ?").run(name, req.user.id);
    }
    if (req.body?.profile) {
      const data = JSON.stringify(cleanProfile(req.body.profile));
      db.prepare(`INSERT INTO profiles (user_id, data) VALUES (?, ?)
                  ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = datetime('now')`).run(req.user.id, data);
    }
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
    const row = db.prepare("SELECT data FROM profiles WHERE user_id = ?").get(req.user.id);
    res.json({ user: userOut(user), profile: row ? JSON.parse(row.data) : null });
  });

  // ---------- TREINOS ----------
  const workoutOut = (r) => ({
    id: r.id, createdAt: r.created_at, completedAt: r.completed_at,
    feedback: r.feedback ? JSON.parse(r.feedback) : null, ...JSON.parse(r.data),
  });
  const historyOf = (userId) =>
    db.prepare("SELECT stage, completed_at, feedback FROM workouts WHERE user_id = ? ORDER BY id DESC LIMIT 10").all(userId)
      .map((r) => ({ stage: r.stage, completed_at: r.completed_at, feedback: r.feedback ? JSON.parse(r.feedback) : null }));

  app.post("/api/workout", auth, async (req, res) => {
    const prow = db.prepare("SELECT data FROM profiles WHERE user_id = ?").get(req.user.id);
    if (!prow) return res.status(400).json({ error: "profile_required" });
    const profile = JSON.parse(prow.data);
    const interview = cleanInterview(req.body?.interview);
    const lang = langOf(req.body?.lang ?? req.user.lang);
    const history = historyOf(req.user.id);

    let workout = buildWorkout({ lang, profile, interview, history });
    let aiError = null;
    if (ai) {
      try {
        workout = await ai({ base: workout, lang, profile: { ...profile, age: ageFrom(req.user.birth_date) }, interview });
      } catch (e) {
        console.error("IA falhou, a usar plano por regras:", e?.message || e);
        aiError = "ai_unavailable";
      }
    }
    const info = db.prepare("INSERT INTO workouts (user_id, lang, stage, data, interview) VALUES (?,?,?,?,?)")
      .run(req.user.id, lang, workout.meta.stage, JSON.stringify(workout), JSON.stringify(interview));
    const row = db.prepare("SELECT * FROM workouts WHERE id = ?").get(info.lastInsertRowid);
    res.status(201).json({ workout: workoutOut(row), aiError });
  });

  app.get("/api/workouts", auth, (req, res) => {
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
    const rows = db.prepare("SELECT * FROM workouts WHERE user_id = ? ORDER BY id DESC LIMIT ?").all(req.user.id, limit);
    res.json({ workouts: rows.map(workoutOut) });
  });

  app.get("/api/workouts/latest", auth, (req, res) => {
    const row = db.prepare("SELECT * FROM workouts WHERE user_id = ? ORDER BY id DESC LIMIT 1").get(req.user.id);
    res.json({ workout: row ? workoutOut(row) : null });
  });

  app.post("/api/workouts/:id/complete", auth, (req, res) => {
    const row = db.prepare("SELECT * FROM workouts WHERE id = ? AND user_id = ?").get(Number(req.params.id), req.user.id);
    if (!row) return res.status(404).json({ error: "not_found" });
    const effort = ["easy", "ok", "hard"].includes(req.body?.effort) ? req.body.effort : "ok";
    const feedback = { effort, pain: Boolean(req.body?.pain), notes: str(req.body?.notes, 500) };
    db.prepare("UPDATE workouts SET completed_at = datetime('now'), feedback = ? WHERE id = ?").run(JSON.stringify(feedback), row.id);
    res.json({ workout: workoutOut(db.prepare("SELECT * FROM workouts WHERE id = ?").get(row.id)) });
  });

  app.get("/api/progress", auth, (req, res) => {
    const rows = db.prepare("SELECT * FROM workouts WHERE user_id = ? AND completed_at IS NOT NULL ORDER BY id DESC").all(req.user.id);
    let minutes = 0, km = 0;
    for (const r of rows) {
      const m = JSON.parse(r.data).meta || {};
      minutes += m.runMinutes || 0;
      km += m.distanceKm || 0;
    }
    const now = Date.now();
    const last30 = rows.filter((r) => now - new Date(r.completed_at.replace(" ", "T") + "Z") < 30 * 86400000).length;
    res.json({
      completed: rows.length,
      runMinutes: Math.round(minutes),
      distanceKm: Math.round(km * 10) / 10,
      last30Days: last30,
      stage: rows[0]?.stage ?? 0,
      recent: rows.slice(0, 10).map((r) => ({ id: r.id, completedAt: r.completed_at, stage: r.stage, feedback: r.feedback ? JSON.parse(r.feedback) : null, title: JSON.parse(r.data).title })),
    });
  });

  // erros inesperados
  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: "server_error" });
  });
  return app;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3000);
  createApp().listen(port, "0.0.0.0", () => console.log(`Corrida AI backend: http://0.0.0.0:${port}`));
}
