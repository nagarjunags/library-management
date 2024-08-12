import { Database } from "../../db/db";
import { UDatabase } from "../../db/userDb";
import { errorTheme } from "../../core/themes";
import { IBook, IBookBase } from "../book-management/models/books.model";
import { IUser } from "../user-management/models/user.model";
import { ITransaction, ITransactionBase } from "./model/transaction.model";
import { BookRepository } from "../book-management/books.repository";
import { UserRepository } from "../user-management/user.repository";

import mysql from "mysql2/promise";
import { join } from "path";
import { AppEnv } from "../../read-env";
import { readLine } from "../../core/input.utils";

import { MySqlTransactionPoolConnection } from "../../db/db-connection";
import { WhereExpression } from "../libs/types";
import { MySqlQueryGenerator, SqlClause } from "../libs/mysql-query-generator";

import { getDb } from "../drizzle/migrate";

export class TransactionRepository {
  private mySqlTransactionPoolConnection: MySqlTransactionPoolConnection;
  pool: mysql.Pool | null;
  private userRepo: UserRepository;
  private bookRepo: BookRepository;

  constructor() {
    this.pool = mysql.createPool(AppEnv.DATABASE_URL); // FOR ALL in library
    this.mySqlTransactionPoolConnection = new MySqlTransactionPoolConnection(
      this.pool
    );
    this.userRepo = new UserRepository();
    this.bookRepo = new BookRepository();
  }
  // bookrepo = new BookRepository(
  //   // new Database(join(__dirname, "../data/data.json"))
  // );
  // userrepo = new UserRepository(
  //   new UDatabase(join(__dirname, "../data/data.json"))
  // );

  async create(data: ITransactionBase): Promise<ITransaction | null> {
    if ((await this.userRepo.getById(data.userId)) === null) {
      console.log(errorTheme("No Users with the ID:", data.userId));
      return null;
    }
    // console.log(await this.userRepo.getById(data.userId));

    const book = await this.bookRepo.getById(data.bookId);
    // return null;

    if (book === undefined || book === null) {
      console.log(errorTheme("No book with the ID:", data.bookId));
      return null;
    } else if (book.availableNumberOfCopies <= 0) {
      console.log(errorTheme("Currently the book is not available"));
      return null;
    }
    const decrementBookClauseGen = async (id: number): Promise<SqlClause> => {
      const whereExpression: WhereExpression<IBook> = {
        id: { op: "EQUALS", value: id },
      };

      const bookId = data.bookId;
      const updateData: Partial<IBook> = {
        availableNumberOfCopies: book?.availableNumberOfCopies - 1,
      };
      const updateClause = await MySqlQueryGenerator.generateUpdateSql(
        "books",
        updateData,
        whereExpression
      );
      return updateClause;
    };
    const decrementClause = await decrementBookClauseGen(data.bookId);
    console.log(decrementClause); // TODO Run this query in transactions.
    const insertClause =
      await MySqlQueryGenerator.generateInsertSql<ITransactionBase>(
        "transactions",
        [data]
      );
    console.log(insertClause);
    try {
      await this.mySqlTransactionPoolConnection.query(
        decrementClause.query,
        decrementClause.values
      );
      await this.mySqlTransactionPoolConnection.query(
        insertClause.query,
        insertClause.values[0]
      );
      await this.mySqlTransactionPoolConnection.commit();
      console.log("SUCCESSFULL ");
    } catch (err) {
      console.log(err);
      console.log("fAIL ");

      await this.mySqlTransactionPoolConnection.rollback();
    } finally {
      await this.mySqlTransactionPoolConnection.release();
    }

    return null;
  }
  // getPendingUserById(id: number): ITransaction[] {
  //   return this.transactions.filter(
  //     (transaction) => transaction.userId === id && !transaction.isReturned
  //   );
  // }

  async updateReturnStatus(userId: number): Promise<void> {
    const pendingTransactions = MySqlQueryGenerator.generateSelectSql(
      "transactions",
      [],
      {
        userId: { op: "EQUALS", value: userId },
        isReturned: { op: "EQUALS", value: 0 },
      },
      0,
      10
    );
    const result = await this.mySqlTransactionPoolConnection.query(
      pendingTransactions.query,
      pendingTransactions.values
    );
    console.table(result);
    const bookIds: number[] = (
      await readLine("Enter the book Ids From above to return:")
    )
      .split(" ")
      .map(Number);
    bookIds.forEach(async (bookId) => {
      const sql = MySqlQueryGenerator.generateUpdateSql(
        "transactions",
        { isReturned: 1, userId: userId, bookId: bookId },
        {
          userId: { op: "EQUALS", value: userId },
          bookId: { op: "EQUALS", value: bookId },
          isReturned: { op: "EQUALS", value: 0 },
        }
      );
      try {
        await this.mySqlTransactionPoolConnection.query(sql.query, sql.values);
        await this.mySqlTransactionPoolConnection.commit();
        console.log("success");
      } catch (err) {
        await this.mySqlTransactionPoolConnection.rollback();
        console.log("fail");
      } finally {
        this.mySqlTransactionPoolConnection.release();
      }
    });

    //   pendingTransactions.map((trans) => {
    //     const returnDate = new Date(trans.returnDate);
    //     const today = new Date();

    //     // Reset the time to 00:00:00 for accurate date comparison
    //     today.setHours(0, 0, 0, 0);

    //     // Calculate the difference in time
    //     const timeDifference = today.getTime() - returnDate.getTime();
    //     // console.log(timeDifference);
    //     // Convert time difference from milliseconds to days
    //     const daysExceeded = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
    //     if (daysExceeded >= 0) {
    //       trans.fine = daysExceeded * 5; // five rupees per day
    //     }
    //   });
    //   if (pendingTransactions.length === 0) {
    //     console.log("No pending transactions found for this user.");
    //     return;
    //   }
    //   let currentIndex = 0;

    //   const rl = readline.createInterface({
    //     input: process.stdin,
    //     output: process.stdout,
    //     terminal: true,
    //   });
    //   readline.emitKeypressEvents(process.stdin);
    //   if (process.stdin.isTTY) {
    //     process.stdin.setRawMode(true);
    //   }

    //   const handleKeyPress = async (
    //     chunk: Buffer,
    //     key: { name: string; sequence: string }
    //   ) => {
    //     if (key.name === "q") {
    //       rl.close();
    //       return;
    //     } else if (
    //       key.name === "right" &&
    //       currentIndex < pendingTransactions.length - 1
    //     ) {
    //       currentIndex++;
    //     } else if (key.name === "left" && currentIndex > 0) {
    //       currentIndex--;
    //     } else if (key.name === "return") {
    //       await this.updateStatus(
    //         pendingTransactions[currentIndex].transactionId
    //       );

    //       pendingTransactions.splice(currentIndex, 1); // Remove the updated transaction from the list
    //       if (pendingTransactions.length === 0) {
    //         console.log("All transactions have been updated.");
    //         rl.close();
    //         return;
    //       }
    //       if (currentIndex >= pendingTransactions.length) {
    //         currentIndex = pendingTransactions.length - 1;
    //       }
    //     }
    //     showTransaction();
  }

  //   const showTransaction = () => {
  //     const transaction = pendingTransactions[currentIndex];
  //     console.clear();
  //     console.table([transaction]);
  //     console.log(
  //       "Press '→' for next transaction, '←' for previous transaction, 'Enter' to update status, or 'q' to quit."
  //     );
  //   };

  //   process.stdin.on("keypress", handleKeyPress);
  //   showTransaction();

  //   await new Promise<void>((resolve) => {
  //     rl.on("close", resolve);
  //   });

  //   process.stdin.removeListener("keypress", handleKeyPress);
  //   if (process.stdin.isTTY) {
  //     process.stdin.setRawMode(false);
  //   }
  //   process.stdin.resume();
  // }

  // getById(id: number): ITransaction | null {
  //   const transaction = this.transactions.find((b) => b.transactionId === id);
  //   return transaction || null;
  // }

  // async updateStatus(transactionId: number): Promise<void> {
  //   const transaction = this.getById(transactionId);
  //   if (!transaction) {
  //     throw new Error("Transaction not found");
  //   }
  //   if (transaction.isReturned) {
  //     console.log("This transaction is already returned.");
  //     return;
  //   }
  //   transaction.isReturned = true;
  //   const returnedBookID = transaction.bookId;
  //   const returnedBook = this.bookrepo.getById(returnedBookID);
  //   returnedBook!.availableNumberOfCopies += 1;
  //   const currentDate = new Date();
  //   if (currentDate > new Date(transaction.returnDate)) {
  //     const lateDays = Math.ceil(
  //       (currentDate.getTime() - new Date(transaction.returnDate).getTime()) /
  //         (1000 * 60 * 60 * 24)
  //     );
  //     transaction.fine = lateDays * 10; // Assuming a fine of 10 units per day late
  //   }
  //   await this.db.save();
  //   console.log("Return status updated successfully\n");
  //   console.table(transaction);
  // }

  // async getPendingUserByBookId(bookId: number): Promise<IUser[] | null> {
  //   const books = this.transactions.filter((b) => b.bookId === bookId);
  //   if (books === undefined) {
  //     console.log(errorTheme("This book is not issued to anyone"));
  //     return null;
  //   } else {
  //     const pendingMembers = books.map((book) => {
  //       return this.userrepo.getById(book.userId);
  //     });
  //     console.table(pendingMembers);
  //     return pendingMembers as IUser[];
  //   }
  // }

  // async todaysDue() {
  //   const today = new Date();
  //   today.setHours(0, 0, 0, 0);
  //   const due = this.transactions
  //     .filter((transaction) => {
  //       const returnDate = new Date(transaction.returnDate);
  //       return transaction.isReturned === false && returnDate < today;
  //     })
  //     .map((due) => {
  //       const exceed = today.getTime() - new Date(due.returnDate).getTime();
  //       const daysExceeded = Math.ceil(exceed / (1000 * 60 * 60 * 24));
  //       due.fine = daysExceeded * 5;
  //       return due;
  //     });
  //   console.table(due);
  // }
}
