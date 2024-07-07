import { IUser } from "../../user-management/models/user.model";
export interface ITransactionBase {
  // immutable data which has to kept safe

  bookId: number;
  userId: number;
  returnPeriod: number;
}

export interface ITransaction extends ITransactionBase {
  transactionId: number;
  issueddate: string;
  returnDate: string;
  isReturned: boolean;
  fine: number;
}
