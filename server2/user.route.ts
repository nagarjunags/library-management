import { Router } from "express";
import { UserRepository } from "../src/user-management/user.repository";
import { IUserBase } from "../src/user-management/models/user.model";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = Router();
const userRepo = new UserRepository();

// Secret key for JWT
const JWT_SECRET = "your_secret_key"; // Replace with a strong secret key

/**
 * @route POST /users/register
 * @desc Register a new user
 * @access Public
 */
router.post("/register", async (req, res) => {
  try {
    const userData: IUserBase = req.body;

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    userData.password = hashedPassword;

    const newUser = await userRepo.create(userData);
    if (!newUser) {
      return res.status(400).json({ message: "Failed to create user" });
    }
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

/**
 * @route POST /users/login
 * @desc Login a user and return a JWT token
 * @access Public
 */
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await userRepo.getByUsername(username);

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Compare the password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user.UId }, JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

/**
 * Middleware to verify JWT token
 */
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ message: "Invalid token" });
      }
      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ message: "Authorization token required" });
  }
};

/**
 * @route PUT /users/:id
 * @desc Update an existing user
 * @access Private (Only the user himself can update)
 */
router.put("/:id", authenticateJWT, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (userId !== req.user.userId) {
      return res
        .status(403)
        .json({ message: "You can only update your own details" });
    }
    const updatedData: IUserBase = req.body;

    if (updatedData.password) {
      // Hash the password before updating
      updatedData.password = await bcrypt.hash(updatedData.password, 10);
    }

    const updatedUser = await userRepo.update(userId, updatedData);
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

/**
 * @route DELETE /users/:id
 * @desc Delete a user
 * @access Private (Only the user himself can delete)
 */
router.delete("/:id", authenticateJWT, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (userId !== req.user.userId) {
      return res
        .status(403)
        .json({ message: "You can only delete your own account" });
    }

    const deletedUser = await userRepo.delete(userId);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(deletedUser);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

/**
 * @route GET /users/:id
 * @desc Get a user by ID
 * @access Private (Only the user himself can view his details)
 */
router.get("/:id", authenticateJWT, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (userId !== req.user.userId) {
      return res
        .status(403)
        .json({ message: "You can only view your own details" });
    }

    const user = await userRepo.getById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

/**
 * @route GET /users
 * @desc List users with optional search and pagination
 * @access Public
 */
router.get("/", async (req, res) => {
  try {
    const { limit, offset, search } = req.query;
    const pageRequest = {
      limit: parseInt(limit as string, 10) || 10,
      offset: parseInt(offset as string, 10) || 0,
      search: (search as string) || "",
    };
    const usersList = await userRepo.list(pageRequest);
    res.json(usersList);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

export default router;
