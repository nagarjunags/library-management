import { readChar, readLine } from "../../core/input.utils";
import { IInteractor } from "../../core/interactor";
import { IUserBase, IUser } from "./models/user.model";
import { UserRepository } from "./user.repository";
import { UDatabase } from "../../db/userDb";
import { z } from "zod";
import chalk from "chalk";
import { join } from "path";

const menu = `
    1. Add User
    2. Update User
    3. Search User
    4. List Users
    5. Delete User
    6. Exit
`;

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
  /**
   * Displays the menu and handles user input.
   * @returns {Promise<void>}
   */
  async showMenu(): Promise<void> {
    const op = await readChar(menu);
    switch (op.toLowerCase()) {
      case "1":
        await addUser(this.repo);
        break;
      case "2":
        const UIdToUpdate = +(await readLine(
          "Enter the User Id to update user details."
        ));
        await updateUser(this.repo, UIdToUpdate);
        break;
      case "3":
        const UIdToSearch = +(await readLine("Enter User Id to search"));
        const user = await this.repo.getById(UIdToSearch);
        console.table(user);
        break;
      case "4":
        this.repo.lists();
        break;
      case "5":
        // const UId = await readLine("Enter User Id to delete");
        // this.repo.delete(+UId);
        break;
      case "6":
        return;
    }
    await this.showMenu();
  }
}

/**
 * Prompts the user for input and validates it.
 * @param {IUser} [previous={ name: "", DOB: "", phoneNum: "", UId: -1 }] - The previous user data.
 * @returns {Promise<IUserBase>} The validated user input.
 */
async function getUserInput(
  previous: IUser = { name: "", DOB: "", phoneNum: "", UId: -1 }
): Promise<IUserBase> {
  // console.log(previous);
  const name = await readLine(`Please enter the Name (${previous.name}):`);
  const DOB = await readLine(
    `Please enter the Date Of Birth (${previous?.DOB}):`
  );
  const phoneNum = await readLine(
    `Please enter the Phone Number (${previous?.phoneNum}):`
  );

  const parsed = userSchema.safeParse({
    name: name,
    DOB: DOB,
    phoneNum: phoneNum,
  });

  if (previous.UId !== -1) {
    return { name: name, DOB: DOB, phoneNum: phoneNum };
  }

  if (!parsed.success) {
    console.log(chalk.red("Invalid input:"));
    parsed.error.issues.forEach((error) =>
      console.log(chalk.red(error.message))
    );
    return getUserInput(previous); // Prompt again if validation fails
  }

  return parsed.data;
}

/**
 * Adds a new user to the repository.
 * @param {UserRepository} repo - The user repository.
 */
async function addUser(repo: UserRepository) {
  const user: IUserBase = await getUserInput();
  const createdUser = await repo.create(user);
  console.log("User Created:", createdUser);
}

/**
 * Updates an existing user in the repository.
 * @param {UserRepository} repo - The user repository.
 * @param {number} UIdToUpdate - The ID of the user to update.
 */
async function updateUser(repo: UserRepository, UIdToUpdate: number) {
  const user = ((await repo.getById(UIdToUpdate)!) as unknown as IUser[])[0];
  if (user === undefined) {
    console.log(`User with ${UIdToUpdate} does not exist.`);
    return;
  }

  const updatedData = await getUserInput(user);
  // console.table(updatedData);

  repo.update(UIdToUpdate, updatedData);
}

// const a: UserInteractor = new UserInteractor();
// a.showMenu();
