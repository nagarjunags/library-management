import { describe, test, expect } from "vitest";
import {
  MySqlQueryGenerator,
  generateSelectSql,
} from "./mysql-query-generator";
import {
  WhereExpression,
  SimpleWhereExpression,
  OrWhereExpression,
  AndWhereExpression,
} from "./types";
import { IBook } from "../book-management/models/books.model";
import { IUser, IUserBase } from "../user-management/models/user.model";

describe("MySqlQueryGenerator", () => {
  test("should generate an INSERT SQL statement", () => {
    const tableName = "users";
    const row: IUserBase = {
      name: "Tejas",
      age: 21,
      phoneNum: 9123456789,
      address: "Mangalore, Karnataka",
    };
    const expectedSql = `INSERT INTO \`users\` (\`name\`, \`age\`, \`phone\`, \`address\`) VALUES (?, ?, ?, ?)`;
    const expectedValues = ["Tejas", 21, "9123456789", "Mangalore, Karnataka"];

    const { query, values } = MySqlQueryGenerator.generateInsertSql<IUser>(
      tableName,
      row
    );
    expect(query.trim()).toBe(expectedSql);
    expect(values).toEqual(expectedValues);
  });

  test("should generate an UPDATE SQL statement", () => {
    const tableName = "users";
    const row: Partial<IUser> = {
      name: "Tejas Prabhu",
      address: "Mangalore, DK, Karnataka",
    };
    const where: WhereExpression<IUser> = {
      phone: { op: "EQUALS", value: "9123456789" },
    };
    const expectedSql = `UPDATE \`users\` SET \`name\` = ?, \`address\` = ? WHERE (\`phone\` = ?)`;
    const expectedValues = [
      "Tejas Prabhu",
      "Mangalore, DK, Karnataka",
      "9123456789",
    ];

    const { query, values } = MySqlQueryGenerator.generateUpdateSql(
      tableName,
      row,
      where
    );
    expect(query.trim()).toBe(expectedSql);
    expect(values).toEqual(expectedValues);
  });

  test("should generate a DELETE SQL statement", () => {
    const tableName = "users";
    const where: WhereExpression<IUser> = {
      name: { op: "EQUALS", value: "Tejas" },
      phone: { op: "EQUALS", value: "9123456789" },
    };
    const expectedSql = `DELETE FROM \`users\` WHERE (\`name\` = ?) AND (\`phone\` = ?)`;
    const expectedValues = ["Tejas", "9123456789"];

    const { query, values } = MySqlQueryGenerator.generateDeleteSql(
      tableName,
      where
    );
    expect(query.trim()).toBe(expectedSql);
    expect(values).toEqual(expectedValues);
  });

  test("should generate a SELECT SQL statement", () => {
    const tableName = "users";
    const fieldsToSelect: Array<keyof Partial<IUser>> = ["name", "age"];
    const where: WhereExpression<IUser> = {};
    const offset = 0;
    const limit = 5;
    const expectedSql = `SELECT \`name\`, \`age\` FROM \`users\` LIMIT ? OFFSET ?`;
    const expectedValues = [limit, offset];

    const { query, values } = MySqlQueryGenerator.generateSelectSql<IUser>(
      tableName,
      fieldsToSelect,
      where,
      offset,
      limit
    );
    expect(query.trim()).toBe(expectedSql);
    expect(values).toEqual(expectedValues);
  });

  test("should generate a COUNT SQL statement", () => {
    const tableName = "users";
    const where: WhereExpression<IUser> = {};
    const expectedSql = `SELECT COUNT(*) AS \`count\` FROM \`users\``;
    const expectedValues: any[] = [];

    const { query, values } = MySqlQueryGenerator.generateCountSql<IUser>(
      tableName,
      where
    );
    expect(query.trim()).toBe(expectedSql);
    expect(values).toEqual(expectedValues);
  });
  test("should return the WHERE clause for conditions supplied as params", () => {
    const conditions: WhereExpression<IUser> = {
      OR: [
        {
          AND: [
            { name: { op: "EQUALS", value: "Tejas" } },
            { phoneNum: { op: "EQUALS", value: "9123456789" } },
          ],
        },
        {
          age: { op: "GREATER_THAN", value: 15 },
        },
      ],
    };
    const expectedSql = `((\`name\` = ?) AND (\`phoneNum\` = ?)) OR (\`age\` > ?)`;
    const expectedValues = ["Tejas", "9123456789", 15];

    const { query, values } =
      MySqlQueryGenerator.generateWhereClauseSql<IUser>(conditions);
    expect(query.trim()).toBe(expectedSql);
    expect(values).toEqual(expectedValues);
  });
});

describe("Test sql generator on books", () => {
  const whereCondition: SimpleWhereExpression<IBook> = {
    author: {
      op: "CONTAINS",
      value: "Sudha Murthy",
    },
  };

  const authAndPublisher: SimpleWhereExpression<IBook> = {
    author: {
      op: "CONTAINS",
      value: "Sudha Murthy",
    },
    publisher: {
      op: "EQUALS",
      value: "Penguin UK",
    },
  };

  const authAndPublisherOrCopies: OrWhereExpression<IBook> = {
    OR: [
      {
        author: {
          op: "CONTAINS",
          value: "Sudha Murthy",
        },
        publisher: {
          op: "EQUALS",
          value: "Penguin UK",
        },
      },
      {
        totalNumberOfCopies: {
          op: "GREATER_THAN_EQUALS",
          value: 10,
        },
      },
    ],
  };

  const authOrTotalCopies: OrWhereExpression<IBook> = {
    OR: [
      {
        author: {
          op: "EQUALS",
          value: "Sudha Murthy",
        },
      },
      {
        totalNumberOfCopies: {
          op: "GREATER_THAN_EQUALS",
          value: 10,
        },
      },
    ],
  };

  test("where clause generation", () => {
    const { query: queryStr, values: whereValues } =
      MySqlQueryGenerator.generateWhereClauseSql<IBook>(whereCondition);
    expect(queryStr.trim()).toEqual("(`author` LIKE ?)");
    expect(whereValues).toEqual(["%Sudha Murthy%"]);

    const { query: authAndPublisherQuery, values: authAndPublisherValues } =
      MySqlQueryGenerator.generateWhereClauseSql<IBook>(authAndPublisher);
    expect(authAndPublisherQuery.trim()).toEqual(
      "(`author` LIKE ? AND `publisher` = ?)"
    );
    expect(authAndPublisherValues).toEqual(["%Sudha Murthy%", "Penguin UK"]);

    const {
      query: authAndPublisherOrCopiesClause,
      values: authAndPublisherOrCopiesValues,
    } = MySqlQueryGenerator.generateWhereClauseSql<IBook>(
      authAndPublisherOrCopies
    );
    expect(authAndPublisherOrCopiesClause.trim()).toEqual(
      "((`author` LIKE ? AND `publisher` = ?) OR (`totalNumberOfCopies` >= ?))"
    );
    expect(authAndPublisherOrCopiesValues).toEqual([
      "%Sudha Murthy%",
      "Penguin UK",
      10,
    ]);

    const { query: authOrTotalCopiesClause, values: authOrTotalCopiesValues } =
      MySqlQueryGenerator.generateWhereClauseSql(authOrTotalCopies);
    expect(authOrTotalCopiesClause.trim()).toEqual(
      "((`author` = ?) OR (`totalNumberOfCopies` >= ?))"
    );
    expect(authOrTotalCopiesValues).toEqual(["Sudha Murthy", 10]);
  });

  test("select tests", () => {
    const { query: selectByAuthorQuery, values: selectByAuthorValues } =
      generateSelectSql<IBook>("books", [], whereCondition, 0, 10);
    expect(selectByAuthorQuery.trim()).toEqual(
      "SELECT * FROM `books` WHERE (`author` LIKE ?) LIMIT ? OFFSET ?"
    );
    expect(selectByAuthorValues).toEqual(["%Sudha Murthy%", 10, 0]);

    const {
      query: selectAuthorAndPublisherOrCopiesQuery,
      values: selectAuthorAndPublisherOrCopiesValues,
    } = generateSelectSql<IBook>("books", [], authAndPublisherOrCopies, 0, 10);
    expect(selectAuthorAndPublisherOrCopiesQuery.trim()).toEqual(
      "SELECT * FROM `books` WHERE ((`author` LIKE ? AND `publisher` = ?) OR (`totalNumberOfCopies` >= ?)) LIMIT ? OFFSET ?"
    );
    expect(selectAuthorAndPublisherOrCopiesValues).toEqual([
      "%Sudha Murthy%",
      "Penguin UK",
      10,
      10,
      0,
    ]);
  });
});
