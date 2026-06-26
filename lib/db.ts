import { Pool, QueryResult, QueryResultRow } from 'pg';

let pool: Pool | null = null;

function getPool(): Pool {
  if (pool) {
    return pool;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL não está definido. Copie .env.example para .env.local e preencha os valores.'
    );
  }

  pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });
  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params: any[] = []): Promise<QueryResult<T>> {
  try {
    return await getPool().query<T>(text, params);
  } catch (error: any) {
    if (error instanceof Error) {
      throw new Error(`Erro de conexão com o banco de dados: ${error.message}`);
    }
    throw error;
  }
}

export async function getClient() {
  return getPool().connect();
}
