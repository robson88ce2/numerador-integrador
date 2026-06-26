import crypto from 'crypto';
import { query, getClient } from './db';
import { DelegaciaRecord, IndexInfo, DocumentoRecord } from './types';

export function hashPw(password: string): string {
  return crypto.createHash('sha256').update(password, 'utf8').digest('hex');
}

export function verifyPw(plain: string, hashed: string): boolean {
  return hashPw(plain) === hashed;
}

export async function findDelegaciaByUsername(username: string): Promise<DelegaciaRecord | null> {
  const result = await query<DelegaciaRecord>(
    'SELECT id, nome, codigo, username, ativa, criada_em, senha_hash FROM delegacias WHERE username = $1',
    [username]
  );
  return result.rows[0] ?? null;
}

export async function listDelegacias(): Promise<DelegaciaRecord[]> {
  const result = await query<DelegaciaRecord>(
    'SELECT id, nome, codigo, username, ativa, criada_em FROM delegacias ORDER BY nome'
  );
  return result.rows;
}

export async function createDelegacia(
  nome: string,
  codigo: string,
  username: string,
  password: string
): Promise<void> {
  if (!nome.trim() || !codigo.trim() || !username.trim() || !password.trim()) {
    throw new Error('Todos os campos são obrigatórios.');
  }
  await query(
    'INSERT INTO delegacias (nome, codigo, username, senha_hash) VALUES ($1, $2, $3, $4)',
    [nome.trim(), codigo.trim(), username.trim(), hashPw(password)]
  );
}

export async function updateDelegacia(
  id: number,
  nome: string,
  codigo: string,
  username: string
): Promise<void> {
  if (!nome.trim() || !codigo.trim() || !username.trim()) {
    throw new Error('Nome, código e usuário são obrigatórios.');
  }
  await query(
    'UPDATE delegacias SET nome = $1, codigo = $2, username = $3 WHERE id = $4',
    [nome.trim(), codigo.trim(), username.trim(), id]
  );
}

export async function toggleDelegacia(id: number, ativa: boolean): Promise<void> {
  await query('UPDATE delegacias SET ativa = $1 WHERE id = $2', [ativa, id]);
}

export async function deleteDelegacia(id: number): Promise<void> {
  await query('DELETE FROM delegacias WHERE id = $1', [id]);
}

export async function changeDelegaciaPassword(id: number, password: string): Promise<void> {
  if (!password.trim()) {
    throw new Error('Senha não pode ser vazia.');
  }
  await query('UPDATE delegacias SET senha_hash = $1 WHERE id = $2', [hashPw(password), id]);
}

export async function getIndicesDeDelegacia(did: number): Promise<IndexInfo[]> {
  const year = new Date().getFullYear();
  const result = await query<IndexInfo>(
    `SELECT idx.tipo,
            idx.numero_inicial,
            COALESCE(d.max_numero, 0) AS ultimo_numero
     FROM indices idx
     LEFT JOIN (
       SELECT tipo,
              MAX(CAST(REGEXP_REPLACE(numero, '^.*-(\\d+)/\\d{4}$', '\\1') AS INTEGER)) AS max_numero
       FROM documentos
       WHERE delegacia_id = $1 AND ano = $2
       GROUP BY tipo
     ) d ON d.tipo = idx.tipo
     WHERE idx.delegacia_id = $1
     ORDER BY idx.tipo`,
    [did, year]
  );
  return result.rows;
}

export async function setNumeroInicial(did: number, tipo: string, numeroInicial: number): Promise<void> {
  if (numeroInicial < 1) {
    throw new Error('O número inicial deve ser ≥ 1.');
  }

  const year = new Date().getFullYear();
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const currentMaxResult = await client.query<{ max_numero: number }>(
      `SELECT MAX(CAST(REGEXP_REPLACE(numero, '^.*-(\\d+)/\\d{4}$', '\\1') AS INTEGER)) AS max_numero
       FROM documentos
       WHERE delegacia_id = $1 AND tipo = $2 AND ano = $3`,
      [did, tipo, year]
    );

    const currentMax = currentMaxResult.rows[0]?.max_numero ?? 0;
    if (currentMax > 0 && numeroInicial <= currentMax) {
      throw new Error(
        `Já existem ${currentMax} documento(s) deste tipo neste ano. O número inicial deve ser maior que ${currentMax}.`
      );
    }

    const result = await client.query<{ numero_inicial: number; ultimo_numero: number }>(
      'SELECT numero_inicial, ultimo_numero FROM indices WHERE delegacia_id = $1 AND tipo = $2 FOR UPDATE',
      [did, tipo]
    );

    if (result.rowCount === 0) {
      await client.query(
        'INSERT INTO indices (delegacia_id, tipo, ultimo_numero, numero_inicial) VALUES ($1, $2, $3, $4)',
        [did, tipo, numeroInicial - 1, numeroInicial]
      );
    } else {
      await client.query(
        'UPDATE indices SET numero_inicial = $1, ultimo_numero = $2 WHERE delegacia_id = $3 AND tipo = $4',
        [numeroInicial, numeroInicial - 1, did, tipo]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function nextNum(did: number, código: string, tipo: string): Promise<string> {
  const year = new Date().getFullYear();
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const indexResult = await client.query<{ numero_inicial: number }>(
      'SELECT numero_inicial FROM indices WHERE delegacia_id = $1 AND tipo = $2 FOR UPDATE',
      [did, tipo]
    );

    const currentMaxResult = await client.query<{ max_numero: number }>(
      `SELECT MAX(CAST(REGEXP_REPLACE(numero, '^.*-(\\d+)/\\d{4}$', '\\1') AS INTEGER)) AS max_numero
       FROM documentos
       WHERE delegacia_id = $1 AND tipo = $2 AND ano = $3`,
      [did, tipo, year]
    );

    const ultimoNumeroAnoAtual = currentMaxResult.rows[0]?.max_numero ?? 0;
    const indexRowCount = indexResult?.rowCount ?? 0;
    const numeroInicial = indexRowCount > 0 ? indexResult.rows[0]?.numero_inicial || 1 : 1;
    const nextNumber = Math.max(numeroInicial, ultimoNumeroAnoAtual + 1);

    if (indexRowCount === 0) {
      await client.query(
        'INSERT INTO indices (delegacia_id, tipo, ultimo_numero, numero_inicial) VALUES ($1, $2, $3, $4)',
        [did, tipo, nextNumber, numeroInicial]
      );
    } else {
      await client.query(
        'UPDATE indices SET ultimo_numero = $1 WHERE delegacia_id = $2 AND tipo = $3',
        [nextNumber, did, tipo]
      );
    }

    await client.query('COMMIT');
    return `${código}-${String(nextNumber).padStart(3, '0')}/${year}`;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function saveDocumento(
  did: number,
  codigo: string,
  tipo: string,
  destino: string,
  data_emissao: string
): Promise<string> {
  const destination = destino?.trim() || null;

  while (true) {
    const numero = await nextNum(did, codigo, tipo);
    try {
      await query(
        'INSERT INTO documentos (delegacia_id, tipo, numero, destino, data_emissao, ano) VALUES ($1, $2, $3, $4, $5, $6)',
        [did, tipo, numero, destination, data_emissao, new Date().getFullYear()]
      );
      return numero;
    } catch (error: any) {
      if (error?.code === '23505') {
        continue;
      }
      throw error;
    }
  }
}

export async function fetchDocs(did?: number): Promise<DocumentoRecord[]> {
  let sql = `
    SELECT d.nome AS delegacia, doc.tipo, doc.numero, COALESCE(doc.destino, '—') AS destino,
           doc.data_emissao, doc.ano
    FROM documentos doc
    JOIN delegacias d ON d.id = doc.delegacia_id
  `;
  const params: any[] = [];

  if (typeof did === 'number') {
    sql += ' WHERE doc.delegacia_id = $1';
    params.push(did);
  }

  sql += ' ORDER BY doc.id DESC';
  const result = await query<DocumentoRecord>(sql, params);
  return result.rows;
}
