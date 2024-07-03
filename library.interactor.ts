import { readChar } from "./core/input.utils";
import { IInteractor } from "./core/interactor";
import { BookInteractor } from "./src/book-management/books.interactor";

const menu = `
1. Book Management
2. Member Management
3. Transaction
4. Today's due list
5.Exit
`;

export class LibraryInteractor implements IInteractor{
    private readonly bookInteractor = new BookInteractor();
    async showMenu(): Promise<void> {
        const op = await readChar(menu);
        switch (op.toLocaleLowerCase()) {
            case "1":
                await this.bookInteractor.showMenu();
                break;
            case "2":
                break;
            case "5":
                process.exit(0);
            default:
                console.log("Invalid input\n\n");
        }
        this.showMenu();
    }
}