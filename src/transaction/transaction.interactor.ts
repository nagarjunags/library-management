import { readLine } from "../../core/input.utils";
import { IInteractor } from "../../core/interactor";
import { Menu } from "../../core/menu";
import { Database } from "../../db/db";
import { join } from "path";
import { ITransactionBase } from "./model/transaction.model";
import { TransactionRepository } from "./transaction.repository";

const menu = new Menu("Transaction Menu", [
  { key: "1", label: "Issue Book" },
  { key: "2", label: "Return Book" },
  { key: "3", label: "Find Issued Members by Book Id" },
  { key: "4", label: "Today's due" },
  { key: "5", label: "<Previous Menu>" },
]);

export class TransactionInteractor implements IInteractor {
  private repo = new TransactionRepository();

  async showMenu(): Promise<void> {
    let loop = true;
    while (loop) {
      const op = await menu.show();
      if (op) {
        switch (op.key.toLowerCase()) {
          case "1":
            await addTransaction(this.repo);
            break;
          case "2":
            await returnBook(this.repo);
            break;
          case "3":
            // TODO: Find Issued Members by Book Id
            // await getPendingMembersByBookId(this.repo);
            break;
          case "4":
            // await this.repo.todaysDue();
            break;
          case "5":
            loop = false;
            break;
          default:
            console.log("\nInvalid input\n\n");
            break;
        }
      } else {
        console.log("\nInvalid input\n\n");
      }
    }
  }
}

async function getTransactionInput(): Promise<ITransactionBase> {
  const userId = await readLine(`Please enter User Id:`);
  const bookId = await readLine(`Please enter Book Id:`);
  const returnPeriod = +(await readLine(`Please enter Return Period in days:`));
  const returnDate: Date = addDaysToDate(returnPeriod);

  function addDaysToDate(daysToAdd: number, baseDate: Date = new Date()): Date {
    const resultDate = new Date(baseDate);
    resultDate.setDate(resultDate.getDate() + daysToAdd);
    return resultDate;
  }

  return {
    userId: +userId,
    bookId: +bookId,
    returnDate: returnDate.toString(),
  };
}

async function addTransaction(repo: TransactionRepository) {
  const transaction: ITransactionBase = await getTransactionInput();
  // console.log(transaction);
  const createdTransaction = await repo.create(transaction);
  //   if (createdTransaction !== null) {
  //     console.log("Transaction logged successfully\n");
  //     console.table(createdTransaction);
  //   }
}

async function returnBook(repo: TransactionRepository) {
  const userId = +(await readLine(`Please enter User Id:`));
  await repo.updateReturnStatus(userId);
}

// async function getPendingMembersByBookId(repo: TransactionRepository) {
//   const uid = +(await readLine("Enter the book ID:"));
//   const pendingMembers = repo.getPendingUserByBookId(uid);
// }

const a = new TransactionInteractor();
a.showMenu();
