require('dotenv').config();
const pg = require('pg');
console.log('Host:', process.env.PGHOST);
console.log('User:', process.env.PGUSER);
console.log('Pass defined:', !!process.env.PGPASSWORD);
const pool = new pg.Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: { rejectUnauthorized: false }
});
pool.query('SELECT tablename FROM pg_tables WHERE schemaname = ___BEGIN___COMMAND_DONE_MARKER___$LASTEXITCODEpublic___BEGIN___COMMAND_DONE_MARKER___$LASTEXITCODE')
  .then(r => { console.log('SUCCESS:', JSON.stringify(r.rows)); pool.end(); })
  .catch(e => { console.error('FAIL:', e.message); pool.end(); });
