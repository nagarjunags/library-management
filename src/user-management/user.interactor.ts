import { readChar, readLine } from "../../core/input.utils";
import { IInteractor } from "../../core/interactor";
import { IUserBase, IUser } from "./models/user.model";
import { UserRepository } from "./user.repository";
import { UDatabase } from "../../db/userDb";
import { Menu } from "../../core/menu";
import { z } from "zod";
import chalk from "chalk";
import { join } from "path";
import { getEditableInput } from "../../core/print.utils";

const menu = new Menu("Book Management", [
  { key: "1", label: "Add User" },
  { key: "2", label: "Updated User" },
  { key: "3", label: "Search User" },
  { key: "4", label: "List User" },
  { key: "5", label: "Delete User" },
  { key: "6", label: "<Previous Menu>" },
]);

// Schema validation for user input
const userSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .regex(/^[A-Za-z]+$/, "Name must contain only alphabets"),
  DOB: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "DOB must be in YYYY-MM-DD format"),
  phoneNum: z
    .string()
    .regex(
      /^\d{10,}$/,
      "Phone number must be at least 10 digits and contain only numbers"
    ),
});

/**
 * Class representing the user interactor.
 * @implements {IInteractor}
 */
export class UserInteractor implements IInteractor {
  repo: UserRepository; // TODO remove the db implementation
  constructor() {
    this.repo = new UserRepository();
  }

  async showMenu(): Promise<void> {
    let loop = true;
    while (loop) {
      const op = await menu.show();
      if (op) {
        switch (op?.key.toLowerCase()) {
          case "1":
            await addUser(this.repo);
            break;
          case "2":
            await updateUser(this.repo);
            break;
          case "3":
            const id = await readLine("Enter the userId to search:");
            await this.repo.getById(+id);
            break;
          case "4":
            const user = await this.repo.getById(23);
            console.table(user);
            // await searchBook(this.repo);
            // console.table(this.repo.list({ limit: 1000, offset: 0 }).items);
            break;
          case "5":
            const deleteId = await readLine("id to delete:");
            let deleteUser = await this.repo.getById(+deleteId);
            console.log("Confirm the book to delete:");
            console.table(deleteUser);
            const choice = await readChar(
              "y to delete or any button to cancel"
            );
            if (choice === "y") {
              deleteUser = await this.repo.delete(+deleteId);
              console.log("Deleted Book:");
              console.table(deleteUser);
            }
            break;

          case "6":
            // await closeConnection(this.repo);
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

// /**
//  * Prompts the user for input and validates it.
//  * @param {IUser} [previous={ name: "", DOB: "", phoneNum: "", UId: -1 }] - The previous user data.
//  * @returns {Promise<IUserBase>} The validated user input.
//  */
async function getUserInput(): Promise<IUserBase> {
  const name = await readLine(`Please enter the Name:`);
  const DOB = await readLine(`Please enter the Date Of Birth (YYYY-MM-DD):`);
  const phoneNum = await readLine(`Please enter the Phone Number:`);

  const parsed = userSchema.safeParse({
    name: name,
    DOB: DOB,
    phoneNum: phoneNum,
  });

  if (!parsed.success) {
    console.log(chalk.red("Invalid input:"));
    parsed.error.issues.forEach((error) =>
      console.log(chalk.red(error.message))
    );
    return getUserInput(); // Prompt again if validation fails
  }

  // Ensure that the return value has all required properties
  return {
    name: parsed.data.name!,
    DOB: parsed.data.DOB!,
    phoneNum: parsed.data.phoneNum!,
  };
}

/**
 * Adds a new user to the repository.
 * @param {UserRepository} repo - The user repository.
 */
async function addUser(repo: UserRepository) {
  const user: IUserBase = await getUserInput();
  const createdUser = await repo.create(user);
  if (createdUser !== null) {
    console.log("User Created:");
    console.table(createdUser);
  }
}

/**
 * Updates an existing user in the repository.
 * @param {UserRepository} repo - The user repository.
 * @param {number} UIdToUpdate - The ID of the user to update.
 */
async function updateUser(repo: UserRepository) {
  const id = +(await readLine("Please enter the ID of the User to update:"));

  const user = (await repo.getById(id)!) as IUser;
  if (user === null) {
    console.log(`User with ${id} does not exist.`);
    return;
  }
  user.name = await getEditableInput("Please updated Name: ", user.name);
  user.DOB = await getEditableInput("Please updated DOB: ", user.DOB);
  user.phoneNum = await getEditableInput(
    "Please updated PhoneNum: ",
    user.phoneNum
  );

  const updatedUser = await repo.update(id, user);
  console.table(updateUser);
}

const a: UserInteractor = new UserInteractor();
a.showMenu();
