import { IPageRequest, IPagedResponse } from "../../core/pagination.model";
import { IRepository } from "../../core/repository";
import { IUser, IUserBase } from "./models/user.model";
import { Librarydb } from "../../db/librarydb";
import { WhereExpression } from "../libs/types";
import { MySqlPoolConnection } from "../../db/db-connection";
import mysql from "mysql2/promise";
import { AppEnv } from "../../read-env";
import { MySqlQueryGenerator } from "../libs/mysql-query-generator";
import { user } from "../drizzle/library.schema";
import { getDb } from "../drizzle/migrate";
import { eq, sql, like } from "drizzle-orm";

/**
 * Class representing a user repository.
 * @implements {IRepository<IUserBase, IUser>}
 */
export class UserRepository implements IRepository<IUserBase, IUser> {
  mySqlPoolConnection: MySqlPoolConnection;
  pool: mysql.Pool;
  /**
   * Creates an instance of UserRepository.
   * @param {Database} db - The database instance.
   */
  librarydb: Librarydb;
  constructor() {
    this.pool = mysql.createPool(AppEnv.DATABASE_URL);
    this.mySqlPoolConnection = new MySqlPoolConnection(this.pool);
    this.mySqlPoolConnection.initialize();
    this.librarydb = new Librarydb();
  }
  list(params: IPageRequest): IPagedResponse<IUser> {
    throw new Error("Method not implemented.");
  }
  // async list(params: {
  //   limit: number; // Optional
  //   offset: number; // Optional
  //   search?: string; // Optional
  // }): Promise<IPagedResponse<IUser>> {
  //   const { limit = 10, offset = 0, search } = params;
  //   const db = await getDb();
  //   try {
  //     // Build the query using Drizzle ORM
  //     let query = db.select().from(user);

  //     if (search) {
  //       query = query.where(
  //         and(
  //           like(user.name, `%${search}%`),
  //           like(user.phoneNum, `%${search}%`)
  //         )
  //       );
  //     }

  //     // Fetch the total count of matching records
  //     const totalCountResult = await db
  //       .select({ count: sql`COUNT(*)` })
  //       .from(user)
  //       .execute();
  //     const total = totalCountResult[0]?.count || 0;

  //     // Fetch the paginated data
  //     const users = await query.limit(limit).offset(offset).execute();

  //     return {
  //       items: users as IUser[],
  //       pagination: {
  //         offset,
  //         limit,
  //         total,
  //         hasNext: offset + limit < total,
  //         hasPrevious: offset > 0,
  //       },
  //     };
  //   } catch (err) {
  //     console.error("Error listing users:", err);
  //     throw err;
  //   }
  // }
  async update(id: number, updatedData: IUserBase): Promise<IUser | null> {
    // Update the user data where UId equals the provided id
    const db = await getDb();
    await db.update(user).set(updatedData).where(eq(user.UId, id));

    // Fetch the updated user
    const result = await db
      .select()
      .from(user)
      .where(eq(user.UId, id))
      .limit(1);
    return null;
    // Return the updated user if found, otherwise return null
    // return result.length > 0 ? result[0] : null;
  }
  async delete(id: number): Promise<IUser | null> {
    // Fetch the record before deletion to return it later
    const db = await getDb();
    const recordToDelete = await db
      .select()
      .from(user)
      .where(eq(user.UId, id))
      .limit(1)
      .execute();

    if (recordToDelete.length === 0) {
      return null;
    }

    await db.delete(user).where(eq(user.UId, id)).execute();

    // Return the previously fetched record
    return recordToDelete[0] as IUser;
  }

  /**
   * Creates a new user.
   * @param {IUserBase} data - The user data.
   * @returns {Promise<IUser>} The created user.
   */
  async create(data: IUserBase): Promise<IUser> | null {
    // Insert the user data into the users table

    const db = await getDb();
    console.table(data);
    const insertId = (await db.insert(user).values(data).$returningId())[0].UId;
    // console.log(insertId);
    //TODO: add getbyId and return the created user
    const insertedUser = this.getById(insertId);
    return insertedUser ?? null;
  }

  // /**
  //  * Updates an existing user.
  //  * @param {number} UIdToUpdate - The ID of the user to update.
  //  * @param {IUserBase} updatedData - The updated user data.
  //  * @returns {IUser | null} The updated user or null if not found.
  //  */
  // async update(
  //   UIdToUpdate: number,
  //   updatedData: IUserBase
  // ): Promise<IUser | null> {
  //   // const user = await this.getById(UIdToUpdate); //BUG
  //   // console.log(user);
  //   // if (updatedData.name != "") {
  //   //   user!.name = updatedDa ta.name;
  //   //   this.db.save();
  //   // }
  //   // if (updatedData.DOB != "") {
  //   //   user!.DOB = updatedData.DOB;
  //   //   this.db.save();
  //   // }
  //   // if (updatedData.phoneNum != NaN! || updatedData.phoneNum !== 0) {
  //   //   console.log(
  //   //     typeof updatedData.phoneNum,
  //   //     updatedData.phoneNum,
  //   //     user!.phoneNum
  //   //   );
  //   //   user!.phoneNum = updatedData.phoneNum;
  //   //   this.db.save();
  //   // }
  //   // return user;
  //   return null;
  // }

  // /**
  //  * Deletes a user by ID.
  //  * @param {number} id - The ID of the user to delete.
  //  * @returns {IUser | null} The deleted user or null if not found.
  //  */
  // async delete(id: number): Promise<IUser | null> {
  //   // const userToDelete = this.getById(id);
  //   // const index = this.users.findIndex((user) => user.UId === id);
  //   // this.users.splice(index, 1);
  //   // this.db.save();
  //   // return userToDelete;
  //   return null;
  // }

  /**
   * Retrieves a user by ID.
   * @param {number} id - The ID of the user.
   * @returns {IUser | null} The user or null if not found.
   */
  async getById(id: number): Promise<IUser | null> {
    // Fetch the user by UId using Drizzle ORM
    const db = await getDb();
    const result = await db
      .select()
      .from(user)
      .where(eq(user.UId, id))
      .limit(1);
    // return null;
    // Return the user if found, otherwise return null
    return result[0] ?? null;
  }

  async getByUsername(username: string) {
    const db = await getDb();
    const result = await db
      .select()
      .from(user)
      .where(eq(user.name, username))
      .limit(1);
    return result[0] ?? null;
  }

  /**
   * Lists all users.
   */

  // /**
  //  * Lists users with pagination.
  //  * @param {IPageRequest} params - The pagination parameters.
  //  * @returns {IPagedResponse<IUser>} The paginated response.
  //  */
  // list(params: IPageRequest): IPagedResponse<IUser> {
  //   console.table(this.users);
  //   throw new Error("Method not implemented.");
  // }
}
