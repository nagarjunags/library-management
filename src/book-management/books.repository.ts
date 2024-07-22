import { IPageRequest, IPagedResponse } from "../../core/pagination.model";
import { IRepository } from "../../core/repository";
import { IBookBase, IBook } from "../book-management/models/books.model";
import { Database } from "../../db/db";
import { MySqlQueryGenerator } from "../libs/mysql-query-generator";
import { MySqlPoolConnection } from "../../db/db-connection";
import { AppEnv } from "../../read-env";
import { config } from "yargs";
import { PoolConnection } from "mysql2/typings/mysql/lib/PoolConnection";
import mysql from "mysql2/promise";
import { WhereExpression } from "../libs/types";
import { threadId } from "worker_threads";
import chalk from "chalk";
import { RowDataPacket } from "mysql2";
import Table from "cli-table3"; // npm install cli-table3 chalk

//  create a pool in the constructor
//  inititalise the connection in constructor
//  on exitperform the pool.connection.release() and pool.end()
export class BookRepository implements IRepository<IBookBase, IBook> {
  private mySqlPoolConnection: MySqlPoolConnection;
  pool: mysql.Pool | null;

  constructor() {
    this.pool = mysql.createPool(AppEnv.DATABASE_URL); // FOR ALL in library
    this.mySqlPoolConnection = new MySqlPoolConnection(this.pool); //

    // this.mySqlPoolConnection.initialize();
  }

  async update(id: number, data: IBookBase): Promise<IBook | null> {
    // console.log(data);
    const whereClause: WhereExpression<IBook> = {
      id: { op: "EQUALS", value: id },
    };
    const updateclause = await MySqlQueryGenerator.generateUpdateSql(
      "books",
      data,
      whereClause
    );
    console.log(updateclause);
    const result = await this.mySqlPoolConnection.query(
      updateclause.query,
      updateclause.values
    );

    // console.log
    return null;
  }
  async delete(id: number): Promise<IBook | null> {
    const whereClause: WhereExpression<IBook> = {
      id: { op: "EQUALS", value: id },
    };
    const deleteClause = await MySqlQueryGenerator.generateDeleteSql(
      "books",
      whereClause
    );
    console.log(deleteClause);

    const result = this.mySqlPoolConnection.query(
      deleteClause.query,
      deleteClause.values
    );
    // throw new Error("Method not implemented.");
    return null;
  }
  list(params: IPageRequest): IPagedResponse<IBook> {
    throw new Error("Method not implemented.");
  }

  async search(key: string) {
    const whereExpression: WhereExpression<IBook> = {
      OR: [
        { title: { op: "CONTAINS", value: `${key}` } },
        { author: { op: "CONTAINS", value: `${key}` } },
        { publisher: { op: "CONTAINS", value: `${key}` } },
        { genre: { op: "CONTAINS", value: `${key}` } },
        { isbnNo: { op: "CONTAINS", value: `${key}` } },
        { id: { op: "CONTAINS", value: `${key}` } },
      ],
    };
    const searchClause = MySqlQueryGenerator.generateSelectSql(
      "books",
      [],
      whereExpression,
      0,
      10
    );
    console.log(searchClause);

    let result: RowDataPacket[] = await this.mySqlPoolConnection.query(
      searchClause.query,
      searchClause.values
    );
    function highlightKeyword(text: string, keyword: string): string {
      const regex = new RegExp(`(${keyword})`, "gi");
      return text.replace(regex, chalk.red.bold("$1"));
    }
    function highlightBooks(books: any[], keyword: string) {
      return books.map((book) => {
        return {
          ...book,
          title: highlightKeyword(book.title, keyword),
          author: highlightKeyword(book.author, keyword),
          publisher: highlightKeyword(book.publisher, keyword),
          genre: highlightKeyword(book.genre, keyword),
          isbnNo: highlightKeyword(book.isbnNo, keyword),
          // Assuming other fields don't need highlighting
        };
      });
    }

    result = highlightBooks(result as unknown as any, key);
    const table = new Table({
      head: [
        "ID",
        "Title",
        "Author",
        "Publisher",
        "Genre",
        "ISBN No",
        "Num of Pages",
        "Total Copies",
        "Available Copies",
      ],
      colWidths: [5, 25, 20, 15, 20, 15, 10, 15, 15],
    });

    result.forEach((book) => {
      table.push([
        book.id,
        book.title,
        book.author,
        book.publisher,
        book.genre,
        book.isbnNo,
        book.numofPages,
        book.totalNumberOfCopies,
        book.availableNumberOfCopies,
      ]);
    });

    console.log(table.toString());
  }

  /**
   * Creates a new book and adds it to the repository.
   * @param {IBookBase} data - The base data for the book to be created.
   * @returns {Promise<IBook>} The created book with assigned ID and available number of copies.
   */
  async create(data: IBookBase): Promise<IBook> {
    const book: IBook = {
      // TODO: Implement validation
      ...data,
      id: 5,
      availableNumberOfCopies: data.totalNumberOfCopies,
    };
    const insertClause = await MySqlQueryGenerator.generateInsertSql<IBookBase>(
      "books",
      [data]
    );
    console.log(insertClause); // TODO remove the console.
    const result = await this.mySqlPoolConnection.query(
      insertClause.query,
      insertClause.values[0]
    );
    console.log(result); // TODO remove console

    return book;
  }
  async close() {
    await this.mySqlPoolConnection.release();
    this.pool = null;
  }
  /* ------------------
  /**
   * Updates an existing book in the repository.
   * @param {number} id - The ID of the book to update.
   * @param {IBook} data - The new data for the book.
   * @returns {Promise<IBook | null>} The updated book or null if the book was not found.
   
  async update(id: number, data: IBook): Promise<IBook | null> {
    const index = this.books.findIndex((b) => b.id === id);
    if (index === -1) {
      return null;
    }
    const updatedBook: IBook = {
      ...this.books[index],
      ...data,
    };
    this.books[index] = updatedBook;
    await this.db.save();
    return updatedBook;
  }
// */

  //   /**
  //    * Deletes a book from the repository.
  //    * @param {number} id - The ID of the book to delete.
  //    * @returns {Promise<IBook | null>} The deleted book or null if the book was not found.
  //    */
  //   async delete(id: number): Promise<IBook | null> {
  //     const index = this.books.findIndex((b) => b.id === id);
  //     if (index === -1) {
  //       return null;
  //     }
  //     const deletedBook = this.books.splice(index, 1)[0];
  //     await this.db.save();
  //     return deletedBook;
  //   }

  //   /**
  //    * Retrieves a book by its ID.
  //    * @param {number} id - The ID of the book to retrieve.
  //    * @returns {IBook | null} The book with the specified ID or null if not found.
  //    */
  async getById(id: number): Promise<IBook | null> {
    //     const book = this.books.find((b) => b.id === id);
    const whereExpression: WhereExpression<IBook> = {
      id: { op: "EQUALS", value: id },
    };
    const getByIdClause = MySqlQueryGenerator.generateSelectSql<IBook>(
      "books",
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
      )) as Array<IBook>
    )[0];
    return result as unknown as IBook;
  }

  //   /**
  //    * Lists books with pagination and optional search filtering.
  //    * @param {IPageRequest} params - The pagination and search parameters.
  //    * @returns {IPagedResponse<IBook>} The paginated response containing books and pagination info.
  //    */
  //   list(params: IPageRequest): IPagedResponse<IBook> {
  //     const search = params.search?.toLocaleLowerCase();
  //     const filteredBooks = search
  //       ? this.books.filter(
  //           (b) =>
  //             b.title.toLocaleLowerCase().includes(search) ||
  //             b.isbnNo.toLocaleLowerCase().includes(search)
  //         )
  //       : this.books;

  //     const items = filteredBooks.slice(
  //       params.offset,
  //       params.limit + params.offset
  //     );
  //     const hasNext = params.offset + params.limit < filteredBooks.length;
  //     const hasPrevious = params.offset > 0;

  //     return {
  //       items,
  //       pagination: {
  //         offset: params.offset,
  //         limit: params.limit,
  //         total: filteredBooks.length,
  //         hasNext,
  //         hasPrevious,
  //       },
  //     };
  //   }
}
