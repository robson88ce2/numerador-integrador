const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const text = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
const env = {};
text.split(/\r?\n/).forEach((line) => {
  const m = line.match(/^(\w+)=(.*)$/);
  if (m) {
    let value = m[2];
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    env[m[1]] = value;
  }
});
const pool = new Pool({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
(async () => {
  try {
    const res = await pool.query(`SELECT MAX(CAST(REGEXP_REPLACE(numero, '^.*-(\\d+)/\\d{4}$', '\\1') AS INTEGER)) AS max_numero FROM documentos WHERE delegacia_id = $1 AND tipo = $2 AND ano = $3`, [4, 'Oficio', 2026]);
    console.log('max_numero for Oficio 2026:', res.rows[0]);
    const idx = await pool.query('SELECT * FROM indices WHERE delegacia_id = $1 AND tipo = $2', [4, 'Oficio']);
    console.log('index row', idx.rows[0]);
    const docs = await pool.query('SELECT id, numero, ano FROM documentos WHERE delegacia_id = $1 AND tipo = $2 ORDER BY id DESC LIMIT 10', [4, 'Oficio']);
    console.log('latest docs', docs.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
})();
