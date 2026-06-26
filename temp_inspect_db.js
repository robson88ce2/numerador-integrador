const fs = require('fs');
const { Pool } = require('pg');
const path = require('path');
const envText = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
const env = {};
envText.split(/\r?\n/).forEach((line) => {
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
    const res1 = await pool.query('SELECT * FROM indices ORDER BY delegacia_id, tipo');
    console.log('INDICES');
    console.log(JSON.stringify(res1.rows, null, 2));
    const res2 = await pool.query('SELECT * FROM documentos ORDER BY id DESC LIMIT 40');
    console.log('DOCUMENTOS');
    console.log(JSON.stringify(res2.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
})();
