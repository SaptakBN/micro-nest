import { defineConfig } from 'prisma/config';
import * as dotenv from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

const envFile = process.env.ENV_FILE
  ? resolve(process.cwd(), process.env.ENV_FILE)
  : null;

if (envFile && existsSync(envFile)) {
  console.log(`Loading env from ${envFile}`);
  dotenv.config({ path: envFile });
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
