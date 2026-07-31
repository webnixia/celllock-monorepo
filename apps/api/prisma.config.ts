import { defineConfig } from '@prisma/config';

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://postgres:postgres_dev_password@localhost:5432/celllock_db?schema=public",
  },
});