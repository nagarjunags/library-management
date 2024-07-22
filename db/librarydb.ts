import {
  MySqlQueryGenerator,
  SqlClause,
} from "../src/libs/mysql-query-generator";
import { MySQLAdapter } from "./sqldb";
import { AppEnv } from "../read-env";
import { WhereExpression } from "../src/libs/types";
import { IUser } from "../src/user-management/models/user.model";
import { object } from "zod";
import { da } from "@faker-js/faker";

export class Librarydb {
  mySQLAdapter: MySQLAdapter;

  constructor() {
    this.mySQLAdapter = new MySQLAdapter({
      dbURL: AppEnv.DATABASE_URL,
    });
  }

  async executeQuery(query: string | SqlClause) {
    return this.mySQLAdapter.runQuery(query);
  }
  async insert<model>(tableName: string, insertObject: model) {
    MySqlQueryGenerator;
    const insertClause = await MySqlQueryGenerator.generateInsertSql<model>(
      tableName,
      [insertObject]
    );
    insertClause.values = insertClause.values[0];
    console.log(insertClause); // TODO Remove if necessary
    const result = await this.executeQuery(insertClause);

    console.log(typeof result);

    return result;
  }

  async select<model>(
    tableName: string,
    UId: number,
    field: string
  ) /*: Promise<model[]>*/ {
    const whereExpression: WhereExpression<IUser> = {
      UId: { op: "EQUALS", value: UId },
    };

    const selectByIdClause: SqlClause =
      MySqlQueryGenerator.generateSelectSql<IUser>(
        tableName,
        [], //TODO CHECK IT
        whereExpression,
        0,
        1
      );
    console.log(selectByIdClause);
    const result = await this.executeQuery(selectByIdClause);
    return (await result) as model[];
  }

  async update<model>(
    table: string,
    updateData: Partial<model>,
    whereClause: WhereExpression<model>
  ) {
    const data: Partial<model> = {};
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== "" && (value as unknown as number) !== 0) {
        data[key as keyof model] = value as model[keyof model];
      }
    });

    // Object.entries(updateData).forEach(([key, value]) => {
    //   if (value !== "") {
    //     data[key] = value;
    //   }
    // });
    // console.log(data);
    const updateclause = await MySqlQueryGenerator.generateUpdateSql(
      table,
      data,
      whereClause
    );
    console.log(updateclause);
    const result = await this.executeQuery(updateclause);
    // console.log(result, "qqqq");
  }
}

// const librarydb = new Librarydb();
// console.log(AppEnv.DATABASE_URL);
