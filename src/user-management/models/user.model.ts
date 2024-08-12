export interface IUserBase {
  // immutable data which has to kept safe
  name: string;
  DOB: string;
  // age: number;
  phoneNum: string;
  password: string;
  // address: string;
}

export interface IUser extends IUserBase {
  UId: number;
  //   numOfBooksIssued: number;
  //   booksIssued: String[];
}
// console.log((keyof Iuser))
