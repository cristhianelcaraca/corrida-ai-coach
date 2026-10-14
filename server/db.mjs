// db.mjs — base de dados SQLite (um único ficheiro, sem instalar nada extra).
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export function openDb(path = process.env.DB_PATH || "./data/corrida.db") {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name          TEXT NOT NULL,
      birth_date    TEXT NOT NULL,
      lang          TEXT NOT NULL DEFAULT 'pt',
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS profiles (
      user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      data       TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS workouts (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at   TEXT NOT NULL DEFAULT (datetime('now')),
      lang         TEXT NOT NULL,
      stage        INTEGER NOT NULL DEFAULT 0,
      data         TEXT NOT NULL,
      interview    TEXT NOT NULL,
      completed_at TEXT,
      feedback     TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_workouts_user ON workouts(user_id, id DESC);
  `);
  return db;
}
