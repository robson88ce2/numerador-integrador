import { query } from './db';

let initialized = false;

export async function ensureSchema(): Promise<void> {
  if (initialized) {
    return;
  }

  await query(`
    CREATE TABLE IF NOT EXISTS delegacias (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      codigo TEXT NOT NULL UNIQUE,
      username TEXT NOT NULL UNIQUE,
      senha_hash TEXT NOT NULL,
      ativa BOOLEAN NOT NULL DEFAULT TRUE,
      criada_em TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS indices (
      delegacia_id INTEGER NOT NULL REFERENCES delegacias(id) ON DELETE CASCADE,
      tipo TEXT NOT NULL,
      ultimo_numero BIGINT NOT NULL DEFAULT 0,
      numero_inicial BIGINT NOT NULL DEFAULT 1,
      PRIMARY KEY (delegacia_id, tipo)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS documentos (
      id SERIAL PRIMARY KEY,
      delegacia_id INTEGER REFERENCES delegacias(id) ON DELETE CASCADE,
      tipo TEXT NOT NULL,
      numero TEXT NOT NULL UNIQUE,
      destino TEXT,
      data_emissao TEXT NOT NULL,
      ano INTEGER
    )
  `);

  initialized = true;
}
