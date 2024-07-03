import { readChar,readLine } from "../../core/input.utils";
import { IInteractor } from "../../core/interactor";
import { IBookBase } from "./models/books.model";
import { BookRepository } from "./books.repository";
    const menu = `
    1. Add Book
    2. dit Book
    3.Search book
    4.<Pervious Menu>`;
export class BookInteractor implements IInteractor {
    private repo = new BookRepository();
    async showMenu(): Promise<void>{
        const op = await readChar(menu);
        switch (op.toLowerCase()) {
          case "1":
            // TODO add book flow
            await addBook(this.repo);
            break;
          case "2":
            // TODO add book flow
            break;
          case "3":
            // TODO add book flow
            break;
          case "4":
            // TODO add book flow
            break;
        }
    }
}


async function getBookInput():Promise<IBookBase> {
  const title = await readLine("Please enter title:");
  const author = await readLine("Please enter author:");
  const publisher = await readLine("Please enter publisher:");
  const genre = await readLine("Please enter genre:");
  const isbnNo = await readLine("Please enter isbnNo:");
  const numofPages = +await readLine("Please enter number of pages:");
  const totalNumberOfCopies = +await readLine("Please enter total num of Copies:");
  return {
title:title,
author:author,
publisher:publisher,
genre:[genre],
isbnNo:isbnNo,
numofPages:numofPages,
totalNumberOfCopies:totalNumberOfCopies,
}
} 

async function addBook(repo:BookRepository) {
  const book: IBookBase = await getBookInput();
  const createBook = repo.create(book);
  console.log("book added succesfully\n Book Id:")
  console.table(book);
}