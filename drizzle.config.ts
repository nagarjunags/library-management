import { defineConfig } from "drizzle-kit";
import { AppEnv } from "./read-env";

export default defineConfig({
  schema: "./src/drizzle/schema.ts",
  out: "./src/drizzle/migrations",
  dialect: "mysql",
  dbCredentials: {
    url: AppEnv.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
/**
 * In your configuration, if you want to use MySQL with the mysql2 driver,
 * you should set the dialect to "mysql" and configure the dbCredentials appropriately.
 * You don't need to specify the driver unless it's required for a specific driver strategy
 * like aws-data-api, d1-http, expo, or turso.
 */
