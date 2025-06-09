import type { Config } from 'drizzle-kit';

export default {
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL || './fieldbook.sqlite',
  },
  verbose: true,
  strict: true,
} satisfies Config;
