import { readLine } from "../core/input.utils";
import { BookRepository } from "../src/book-management/books.repository";
import { HTTPServer, RequestProcessor } from "./server";
import { IBookBase } from "../src/book-management/models/books.model";
import { Console } from "node:console";

const bookRepository = new BookRepository();

const addBookHandler: RequestProcessor = async (request, response, next) => {
  if (request.method === "POST" && request.url === "/books") {
    const book = await request.body;
    try {
      await bookRepository.create(book);

      if (!response.writableEnded) {
        response.writeHead(201, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ message: "Book added successfully" }));
      }
    } catch (error) {
      if (!response.writableEnded) {
        response.writeHead(500, { "Content-Type": "text/plain" });
        if ((error as Error).message.includes("Duplicate")) {
          response.end(
            `Error: "The book with this ISBN:${book.isbnNo} already exists"`
          );
        } else {
          response.end("The Database Error, Please try later");
        }
      }
    }
  } else {
    if (!response.writableEnded) {
      response
        .writeHead(405, { "Content-Type": "text/plain" })
        .end("Method Not Allowed");
    }
  }
  next();
};

const searchBookHandler: RequestProcessor = async (request, response, next) => {
  if (request.method === "GET" && request.url?.startsWith("/books")) {
    const url = new URL(request.url, `http://localhost:3000`);
    const bookId = url.searchParams.get("id") ?? "";
    const searchKey = url.searchParams.get("key") ?? "";

    if (bookId === "") {
      try {
        const books = await bookRepository.search(searchKey);
        if (!response.writableEnded) {
          response.writeHead(200, { "Content-Type": "application/json" });
          response.end(JSON.stringify(books));
        }
      } catch (error) {
        if (!response.writableEnded) {
          response.writeHead(500, { "Content-Type": "text/plain" });
          response.end(`Error: ${(error as Error).message}`);
        }
      }
    } else {
      try {
        const book = await bookRepository.getById(parseInt(bookId));
        if (!response.writableEnded) {
          response.writeHead(200, { "Content-Type": "application/json" });
          response.end(JSON.stringify(book));
        }
      } catch (error) {
        if (!response.writableEnded) {
          response.writeHead(500, { "Content-Type": "text/plain" });
          response.end(`Error: ${(error as Error).message}`);
        }
      }
    }
  } else {
    if (!response.writableEnded) {
      response.writeHead(405, { "Content-Type": "text/plain" });
      response.end("Method Not Allowed");
    }
  }
  next();
};

const deleteBookHandler: RequestProcessor = async (request, response, next) => {
  if (request.method === "DELETE" && request.url?.startsWith("/books")) {
    const url = new URL(request.url, `http://localhost:3000`);
    const bookId = url.searchParams.get("id") ?? "";
    try {
      await bookRepository.delete(parseInt(bookId));
      if (!response.writableEnded) {
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ message: "Book deleted successfully" }));
      }
    } catch (error) {
      if (!response.writableEnded) {
        response.writeHead(500, { "Content-Type": "text/plain" });
        response.end(`Error: ${(error as Error).message}`);
      }
    }
  } else {
    if (!response.writableEnded) {
      response.writeHead(405, { "Content-Type": "text/plain" });
      response.end("Method Not Allowed");
    }
  }
  next();
};

const validateBookDataMiddleware: RequestProcessor = (
  request,
  response,
  next
) => {
  if (request.method === "POST" || request.method === "PATCH") {
    const body = request.body;

    const isValidBook = (data: any): data is IBookBase => {
      return (
        typeof data.title === "string" &&
        typeof data.author === "string" &&
        typeof data.publisher === "string" &&
        typeof data.genre === "string" &&
        typeof data.isbnNo === "string" &&
        typeof data.numofPages === "number" &&
        typeof data.totalNumberOfCopies === "number"
      );
    };

    if (!isValidBook(body)) {
      if (!response.writableEnded) {
        response.writeHead(400, { "Content-Type": "application/json" });

        response.end(JSON.stringify({ error: "Invalid book data format" }));
      }
      return;
    }
  }
  next();
};

const updateBookHandler: RequestProcessor = async (request, response, next) => {
  if (request.method === "PATCH" && request.url?.startsWith("/books")) {
    const url = new URL(request.url, `http://localhost:3000`);
    const bookId = url.searchParams.get("id") ?? "";

    if (!bookId) {
      if (!response.writableEnded) {
        response.writeHead(400, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ error: "Book ID is required" }));
      }
      return;
    }

    try {
      const updatedBook = await bookRepository.update(
        parseInt(bookId),
        request.body
      );
      if (updatedBook) {
        if (!response.writableEnded) {
          response.writeHead(200, { "Content-Type": "application/json" });
          response.end(JSON.stringify(updatedBook));
        }
      } else {
        if (!response.writableEnded) {
          response.writeHead(404, { "Content-Type": "application/json" });
          response.end(JSON.stringify({ error: "Book not found" }));
        }
      }
    } catch (error) {
      if (!response.writableEnded) {
        response.writeHead(500, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ error: (error as Error).message }));
      }
    }
  } else {
    if (!response.writableEnded) {
      response.writeHead(405, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ error: "Method Not Allowed" }));
    }
  }
  next();
};

const startServer = async () => {
  const result = await readLine("Enter the port:");
  const port = parseInt(result);
  const server = new HTTPServer(port);

  server.use((request, response, next) => {
    response.setHeader("Content-Type", "application/json");
    response.setHeader("Access-Control-Allow-Origin", "*");
    next();
  });

  server.use((request, response, next) => {
    if (request.method === "POST" || request.method === "PATCH") {
      let body = "";
      request.on("data", (chunk) => {
        body += chunk.toString();
      });
      request.on("end", () => {
        try {
          request.body = JSON.parse(body);
          next();
        } catch (error) {
          if (!response.writableEnded) {
            response.writeHead(400, { "Content-Type": "text/plain" });
            response.end("Invalid JSON");
          }
        }
      });
      request.on("error", (err) => {
        if (!response.writableEnded) {
          response.writeHead(500, { "Content-Type": "text/plain" });
          response.end("Server Error");
        }
      });
    } else {
      next();
    }
  }, "books");

  server.post("/books", validateBookDataMiddleware, addBookHandler);
  server.get("/books", searchBookHandler);
  server.delete("/books", deleteBookHandler);
  server.patch("/books", validateBookDataMiddleware, updateBookHandler);

  console.log(`Server is running on port ${port}`);
};

startServer();
