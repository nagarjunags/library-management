import {
  AndWhereExpression,
  ColumnData,
  OrWhereExpression,
  SimpleWhereExpression,
  StringOperator,
  WhereExpression,
  WhereParamValue,
} from "./types";
import { IUserBase } from "../user-management/models/user.model";

export interface SqlClause {
  query: string;
  values: any[];
}

const generateWhereClauseSql = <Model>(
  whereParams: WhereExpression<Model>
): SqlClause => {
  if (Object.keys(whereParams).length === 0) {
    // Return an empty SQL clause if the whereParams is an empty object
    return { query: "", values: [] };
  }

  const processSimpleExp = (exp: SimpleWhereExpression<Model>): SqlClause => {
    const clauses: string[] = [];
    const values: any[] = [];

    Object.entries(exp).forEach(([key, opts]) => {
      const columnName = `\`${key}\``.trim();
      const paramValue: WhereParamValue = opts as WhereParamValue;
      let operator = "";
      let valuePlaceholder = "?";

      if (paramValue.value === null) {
        if (paramValue.op === "EQUALS") {
          operator = " IS ";
        } else {
          operator = " IS NOT ";
        }
      } else {
        switch (paramValue.op) {
          case "EQUALS":
            operator = " = ";
            break;
          case "NOT_EQUALS":
            operator = " != ";
            break;
          case "STARTS_WITH":
            operator = " LIKE ";
            paramValue.value += "%";
            break;
          case "NOT_STARTS_WITH":
            operator = " NOT LIKE ";
            paramValue.value += "%";
            break;
          case "ENDS_WITH":
            operator = " LIKE ";
            paramValue.value = "%" + paramValue.value;
            break;
          case "NOT_ENDS_WITH":
            operator = " NOT LIKE ";
            paramValue.value = "%" + paramValue.value;
            break;
          case "CONTAINS":
            operator = " LIKE ";
            paramValue.value = "%" + paramValue.value + "%";
            break;
          case "NOT_CONTAINS":
            operator = " NOT LIKE ";
            paramValue.value = "%" + paramValue.value + "%";
            break;
          case "GREATER_THAN":
            operator = " > ";
            break;
          case "GREATER_THAN_EQUALS":
            operator = " >= ";
            break;
          case "LESSER_THAN":
            operator = " < ";
            break;
          case "LESSER_THAN_EQUALS":
            operator = " <= ";
            break;
        }
      }

      clauses.push(
        `(${columnName} ${operator.trim()} ${valuePlaceholder.trim()})`
      );
      values.push(paramValue.value);
    });

    return { query: clauses.join(" AND ").trim(), values };
  };

  const whKeys = Object.keys(whereParams);

  if (whKeys.includes("AND")) {
    // It's an AndWhereExpression
    const andClauses: SqlClause[] = (
      whereParams as AndWhereExpression<Model>
    ).AND.map((exp) => generateWhereClauseSql(exp));

    const andQuery = andClauses
      .map((clause) => clause.query.trim())
      .join(" AND ");
    const andValues = andClauses.flatMap((clause) => clause.values);

    // Change: Adding condition to wrap in parentheses only if there are multiple clauses
    return {
      query: andClauses.length > 1 ? `(${andQuery.trim()})` : andQuery.trim(),
      values: andValues,
    };
  } else if (whKeys.includes("OR")) {
    // It's an OrWhereExpression
    const orClauses: SqlClause[] = (
      whereParams as OrWhereExpression<Model>
    ).OR.map((exp) => generateWhereClauseSql(exp));

    const orQuery = orClauses.map((clause) => clause.query.trim()).join(" OR ");
    const orValues = orClauses.flatMap((clause) => clause.values);

    // Change: Adding condition to wrap in parentheses only if there are multiple clauses
    return {
      query: orClauses.length > 1 ? `( ${orQuery.trim()})` : orQuery.trim(),
      values: orValues,
    };
  } else {
    // It's a SimpleWhereExpression
    return processSimpleExp(whereParams as SimpleWhereExpression<Model>);
  }
};

export const generateInsertSql = <Model>(
  tableName: string,
  rows: Model[]
): SqlClause => {
  tableName = `\`${tableName}\``.trim();
  const columns: string[] = [];
  const values: any[][] = [];

  if (rows.length === 0) {
    throw new Error("Rows array must contain at least one row.");
  }

  // Extract column names from the first row
  Object.keys(rows[0] as object).forEach((key) => {
    columns.push(`\`${key}\``.trim());
  });

  // Collect values for each row
  rows.forEach((row) => {
    const rowValues: any[] = [];
    Object.values(row as object).forEach((value) => {
      rowValues.push(value);
    });
    values.push(rowValues);
  });

  // Create a single placeholder for all rows
  const rowPlaceholders = `(${columns
    .map(() => "?")
    .join(", ")
    .trim()})`;

  const sql = `INSERT INTO ${tableName} (${columns
    .join(", ")
    .trim()}) VALUES ${rowPlaceholders}`;

  return { query: sql.trim(), values };
};

// Example usage
const rows = [
  { name: "Alice", age: 30, city: "New York" },
  { name: "Bob", age: 25, city: "San Francisco" },
  { name: "Charlie", age: 35, city: "Chicago" },
];

const exampleInsertClause = generateInsertSql("Users", rows);

console.log("Generated INSERT clause:", exampleInsertClause.query);
console.log("Values:", exampleInsertClause.values);

const generateUpdateSql = <Model>(
  tableName: string,
  row: Partial<Model>,
  where: WhereExpression<Model>
): SqlClause => {
  const setClauses: string[] = [];
  const values: any[] = [];

  Object.entries(row as object).forEach(
    ([key, value]: [string, ColumnData]) => {
      const columnName = `\`${key}\``.trim();
      setClauses.push(`${columnName} = ?`.trim());
      values.push(value);
    }
  );

  const whereClause = generateWhereClauseSql<Model>(where);

  const sql = `UPDATE \`${tableName}\` SET ${setClauses
    .join(", ")
    .trim()} WHERE ${whereClause.query}`;
  values.push(...whereClause.values);

  return { query: sql.trim(), values };
};

const generateDeleteSql = <Model>(
  tableName: string,
  where: WhereExpression<Model>
): SqlClause => {
  const whereClause = generateWhereClauseSql<Model>(where);

  const sql = `DELETE FROM \`${tableName}\` WHERE ${whereClause.query}`.trim(); // TODO proper sanitisation
  const values = whereClause.values;

  return { query: sql.trim(), values };
};

const sanitisedField = (field: string): string => {
  return `\`${field}\``.trim();
};
const generateSelectSql = <Model>(
  tableName: string,
  fieldsToSelect: string[], // Array<keyof Partial<Model>>,
  where: WhereExpression<Model>,
  offset: number,
  limit: number
): SqlClause => {
  const sanitisedFields = fieldsToSelect.map((field) => sanitisedField(field));
  const selectClause = sanitisedFields.length
    ? sanitisedFields.join(", ").trim()
    : "*";
  const whereClause = generateWhereClauseSql<Model>(where);

  const baseSql = `SELECT ${selectClause} FROM \`${tableName}\``;
  const whereSql = whereClause.query
    ? ` WHERE ${whereClause.query.trim()}`
    : "";

  // Directly interpolate limit and offset values
  const limitOffsetSql = ` LIMIT ${limit} OFFSET ${offset}`;

  const sql = `${baseSql}${whereSql}${limitOffsetSql}`.trim();
  const values = [...whereClause.values];

  return { query: sql.trim(), values };
};

const generateCountSql = <Model>(
  tableName: string,
  where?: WhereExpression<Model>
): SqlClause => {
  const whereClause = where
    ? generateWhereClauseSql<Model>(where)
    : { query: "", values: [] };

  const sql = `SELECT COUNT(*) AS \`count\` FROM \`${tableName}\` ${
    whereClause.query ? `WHERE ${whereClause.query}` : ""
  }`.trim();
  const values = whereClause.values;

  return { query: sql.trim(), values };
};

export const MySqlQueryGenerator = {
  generateWhereClauseSql,
  generateInsertSql,
  generateUpdateSql,
  generateDeleteSql,
  generateSelectSql,
  generateCountSql,
};

// Example usage
const exampleWhereClause = generateWhereClauseSql<Partial<IUserBase>>({
  OR: [
    {
      AND: [
        {
          OR: [
            {
              name: {
                op: "STARTS_WITH" as StringOperator,
                value: "arjun",
              },
            },
            {
              DOB: {
                op: "EQUALS" as StringOperator,
                value: "GS",
              },
            },
          ],
        },
        {
          phoneNum: {
            op: "NOT_CONTAINS",
            value: "00",
          },
        },
      ],
    },
  ],
});

console.log("Generated WHERE clause:", exampleWhereClause.query);
console.log("Values:", exampleWhereClause.values);
