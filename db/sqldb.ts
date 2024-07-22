import mysql from "mysql2/promise";
import { SqlClause } from "../src/libs/mysql-query-generator";
export interface DBConfig {
  dbURL: string;
}

interface Adapter {
  shutDown: () => Promise<void>;
  runQuery: <T>(sql: string, values: any[]) => Promise<T | undefined>;
}

export class MySQLAdapter implements Adapter {
  private pool: mysql.Pool;

  constructor(private readonly config: DBConfig) {
    this.pool = mysql.createPool(this.config.dbURL);
  }

  async shutDown() {
    return this.pool.end();
  }

  async runQuery<T>(sql: string | SqlClause): Promise<T | undefined> {
    let connection: mysql.PoolConnection | null = null;
    let result;
    try {
      connection = await this.pool.getConnection();
      if (typeof sql === "string") {
        console.log("baaaa");

        [result] = await connection.query(sql);
      } else {
        [result] = await connection.query(sql.query, sql.values);
      }

      return result as T;
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }
}
