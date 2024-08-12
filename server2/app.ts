import express from "express";
import userRoutes from "./user.route"; // Adjust the path as needed

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); // To parse JSON request bodies

// Use user routes
app.use("/users", userRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
