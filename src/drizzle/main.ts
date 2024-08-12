// performQueries.ts
import {
  getDb,
  UserTable,
} from "/home/nagarjun/learn/data-management/fake/Library-Management/src/drizzle/migrate";

async function performQueries() {
  const db = await getDb();

  try {
    await db.insert(UserTable).values({ name: "John Doe" }).execute();
    console.log("Queries executed successfully.");
  } catch (error) {
    console.error("Failed to execute queries:", error);
  }
}

performQueries();
