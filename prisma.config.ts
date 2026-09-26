import { defineConfig } from '@prisma/config';

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL || 'mysql://root:@127.0.0.1:3306/hero_logistics',
  },
});
