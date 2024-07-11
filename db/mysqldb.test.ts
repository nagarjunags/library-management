import { test, expect, describe, beforeAll } from "vitest";
import "dotenv/config";
import { AppEnv } from "../read-env";
import { MYSQLAdapter } from "./sqldb";
import { SimpleWhereExpression } from "../src/libs/types";
import { IBook } from "../src/book-management/models/books.model";
import { MySqlQueryGenerator } from "../src/libs/mysql-query-generator";

describe("sql db adapter tests", () => {
  let mySQLAdapter: MYSQLAdapter;

  beforeAll(async () => {
    mySQLAdapter = new MYSQLAdapter({
      dbURL: AppEnv.DATABASE_URL,
    });
    await mySQLAdapter.load();
  });
  test("run a select on books table", async () => {
    const authorClause: SimpleWhereExpression<IBook> = {};
    const selectByAuthorClause = MySqlQueryGenerator.generateSelectSql<IBook>(
      "books",
      [],
      authorClause,
      0,
      10
    );
    console.log(selectByAuthorClause);
    let result: Promise<IBook> = (await mySQLAdapter.runQuery(
      selectByAuthorClause
    )) as unknown as Promise<IBook>;
    console.log(result);
  });
});
