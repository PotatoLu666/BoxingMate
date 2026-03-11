import 'dotenv/config';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

function buildDatabaseUrl(): string {
  const host = process.env.PGHOST;
  const port = process.env.PGPORT || '5432';
  const database = process.env.PGDATABASE || 'postgres';
  const user = encodeURIComponent(process.env.PGUSER || '');
  const password = process.env.PGPASSWORD || '';
  return `postgresql://${user}:${password}@${host}:${port}/${database}?sslmode=require`;
}

console.log(buildDatabaseUrl());

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  datasource: {
    url: buildDatabaseUrl(),
  },
});
