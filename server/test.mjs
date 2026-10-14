// test.mjs — teste automático da API (corre com: npm test). Usa base de dados em memória, sem IA.
import assert from "node:assert/strict";
import { createApp } from "./index.mjs";
import { openDb } from "./db.mjs";

const app = createApp({ db: openDb(":memory:"), ai: null });
const server = app.listen(0);
const base = `http://127.0.0.1:${server.address().port}`;
const call = async (path, { method = "GET", body, token } = {}) => {
  const r = await fetch(base + path, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, json: await r.json() };
};

const user = { name: "Ana", email: "Ana@Exemplo.com", password: "segredo123", birthDate: "1982-05-10", lang: "pt" };
let r = await call("/api/auth/register", { method: "POST", body: { ...user, password: "123" } });
assert.equal(r.status, 400); assert.equal(r.json.error, "weak_password");
r = await call("/api/auth/register", { method: "POST", body: { ...user, birthDate: "2020-01-01" } });
assert.equal(r.json.error, "invalid_birth_date");
r = await call("/api/auth/register", { method: "POST", body: user });
assert.equal(r.status, 201); const token = r.json.token;
assert.equal(r.json.user.email, "ana@exemplo.com");
r = await call("/api/auth/register", { method: "POST", body: user });
assert.equal(r.status, 409);
r = await call("/api/auth/login", { method: "POST", body: { email: "ana@exemplo.com", password: "errada123" } });
assert.equal(r.status, 401);
r = await call("/api/auth/login", { method: "POST", body: { email: "ana@exemplo.com", password: "segredo123" } });
assert.equal(r.status, 200);
assert.equal((await call("/api/me")).status, 401);

r = await call("/api/workout", { method: "POST", token, body: { interview: {} } });
assert.equal(r.json.error, "profile_required");
r = await call("/api/me", { method: "PUT", token, body: { lang: "en", profile: { goal: "10k", level: "never", days: ["mon", "xxx", "wed"], durationMin: 30 } } });
assert.deepEqual(r.json.profile.days, ["mon", "wed"]); assert.equal(r.json.user.lang, "en");

// 1.º treino com dor no pescoço
r = await call("/api/workout", { method: "POST", token, body: { lang: "pt", interview: { feeling: "tired", pains: [{ area: "neck", level: 4 }, { area: "naoexiste", level: 3 }], notes: "x" } } });
assert.equal(r.status, 201);
const w1 = r.json.workout;
assert.ok(w1.mobility.some((s) => s.id === "neck_stretch"), "mobilidade devia incluir pescoço");
assert.ok(w1.meta.distanceKm <= 10);
assert.equal(w1.meta.stage, 0);

// concluir (correu bem) -> próxima etapa sobe
r = await call(`/api/workouts/${w1.id}/complete`, { method: "POST", token, body: { effort: "ok", pain: false } });
assert.ok(r.json.workout.completedAt);
r = await call("/api/workout", { method: "POST", token, body: { lang: "en", interview: { feeling: "normal", pains: [] } } });
assert.equal(r.json.workout.meta.stage, 1); assert.match(r.json.workout.title, /Run\/walk/);
// outro utilizador não vê nem conclui treinos alheios
const r2 = await call("/api/auth/register", { method: "POST", body: { ...user, email: "b@b.com" } });
assert.equal((await call(`/api/workouts/${w1.id}/complete`, { method: "POST", token: r2.json.token, body: {} })).status, 404);
assert.equal((await call("/api/workouts", { token: r2.json.token })).json.workouts.length, 0);

r = await call("/api/progress", { token });
assert.equal(r.json.completed, 1); assert.ok(r.json.distanceKm > 0);
r = await call("/api/workouts/latest", { token }); assert.equal(r.json.workout.meta.stage, 1);
console.log("✅ todos os testes da API passaram");
server.close();
