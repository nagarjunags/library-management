import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";
// import { AppEnv } from "../../read-env";
// import { UserTable } from "/home/nagarjun/learn/data-management/fake/Library-Management/src/drizzle/schema";

// Create a function to initialize the database connection and perform migrations
async function initializeDb() {
  // Database URL
  const databaseUrl = "mysql://root:root_password@localhost:3306/library_db";

  //   Connection for migrations
  const migrationClient = await mysql.createConnection({
    uri: databaseUrl,
    multipleStatements: true, // Required for running migrations
  });

  //   Perform migrations
  await migrate(drizzle(migrationClient), {
    migrationsFolder:
      "/home/nagarjun/learn/data-management/fake/Library-Management/src/drizzle/migrations", // Adjust this path to your migrations folder
  });

  await migrationClient.end();

  //   Connection pool for queries
  const pool = mysql.createPool({
    uri: databaseUrl,
  });

  // Create and return the `db` instance
  return drizzle(pool);
}

// Export the `db` instance and `UserTable` after initialization
let db: ReturnType<typeof drizzle> | undefined;

export async function getDb() {
  if (!db) {
    db = await initializeDb();
  }
  return db;
}

// export { UserTable };

// initializeDb();
