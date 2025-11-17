#!/usr/bin/env node
import mysql from 'mysql2/promise';

const host = process.env.DB_HOST ?? '127.0.0.1';
const port = Number(process.env.DB_PORT ?? 3307);
const user = process.env.DB_USER ?? 'betuser';
const password = process.env.DB_PASSWORD ?? 'betpw';
const database = process.env.DB_NAME ?? 'betception';
const retries = Number(process.env.DB_WAIT_RETRIES ?? 30);
const delayMs = Number(process.env.DB_WAIT_DELAY_MS ?? 2000);
const sslCa = process.env.DB_SSL_CA ? process.env.DB_SSL_CA.replace(/\\n/g, '\n') : undefined;

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkConnection() {
  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    ssl: sslCa ? { ca: sslCa } : undefined,
  });
  await connection.query('SELECT 1');
  await connection.end();
}

async function main() {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await checkConnection();
      console.log(`Database is ready (host=${host}, port=${port})`);
      return;
    } catch (err) {
      const remaining = retries - attempt;
      console.log(
        `Waiting for database (attempt ${attempt}/${retries})... ${remaining ? `${remaining} retries left` : ''
        }`,
      );
      if (attempt === retries) {
        console.error('Database is still unreachable. Aborting.');
        console.error(err);
        process.exit(1);
      }
      await wait(delayMs);
    }
  }
}

main();
