// Note: We can give a robust implementation using a validation lib such as zod and then export the parsed object
import "dotenv/config";
export interface AppEnv {
  DATABASE_URL: string;
}
export const AppEnv = process.env as unknown as AppEnv;
 console.log()