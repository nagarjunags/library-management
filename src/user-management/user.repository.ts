import { IPageRequest, IPagedResponse } from "../../core/pagination.model";
import { IRepository } from "../../core/repository";
import { IUser, IUserBase } from "./models/user.model";
import { Librarydb } from "../../db/librarydb";
import { WhereExpression } from "../libs/types";
import { MySqlPoolConnection } from "../../db/db-connection";
import mysql from "mysql2/promise";
import { AppEnv } from "../../read-env";
import { MySqlQueryGenerator } from "../libs/mysql-query-generator";
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
  async update(id: number, updatedData: IUserBase): Promise<IUser | null> {
    const whereClause: WhereExpression<IUser> = {
      UId: { op: "EQUALS", value: id },
    };
    this.librarydb.update<IUserBase>("users", updatedData, whereClause);
    // throw new Error("Method not implemented.");
    return null;
  }
  delete(id: number): Promise<IUser | null> {
    throw new Error("Method not implemented.");
  }
  list(params: IPageRequest): IPagedResponse<IUser> {
    throw new Error("Method not implemented.");
  }

  // /**
  //  * Retrieves the list of users from the database.
  //  * @private
  //  * @returns {IUser[]} The list of users.
  //  */
  // private get users(): IUser[] {
  //   return this.db.table<IUser>("users");
  // }

  /**
   * Creates a new user.
   * @param {IUserBase} data - The user data.
   * @returns {Promise<IUser>} The created user.
   */
  async create(data: IUserBase): Promise<IUser> {
    // const user: IUserBase = {
    //   ...data,
    //   // UId: 1, //this.users.length + 1,
    // };
    const a = this.librarydb.select<IUser>(
      "users",
      parseInt(data.phoneNum),
      "phoneNum"
    ) as unknown as IUser;
    const user = this.librarydb.insert<IUserBase>("users", data);
    // let a = generateInsertSql<IUser>("users", user); //TODO parse it to
    console.log(a);
    return a;
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
    //     const book = this.books.find((b) => b.id === id);
    const whereExpression: WhereExpression<IUser> = {
      UId: { op: "EQUALS", value: id },
    };
    const getByIdClause = MySqlQueryGenerator.generateSelectSql<IUser>(
      "users",
      [], //TODO CHECK IT
      whereExpression,
      0,
      1
    );
    console.log(getByIdClause);
    const result = (
      (await this.mySqlPoolConnection.query(
        getByIdClause.query,
        getByIdClause.values[0]
      )) as Array<IUser>
    )[0];

    return result as unknown as IUser;
  }

  /**
   * Lists all users.
   */
  lists() {
    console.table();
  }

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
