import { readLine } from "../core/input.utils";
import { BookRepository } from "../src/book-management/books.repository";
import { HTTPServer, RequestProcessor } from "./server";

const bookRepository = new BookRepository();

const addBookHandler: RequestProcessor = async (request, response) => {
  if (request.method === "POST" && request.url === "/books") {
    const book = await request.body;
    try {
      await bookRepository.create(book);
      response.writeHead(201, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ message: "Book added successfully" }));
    } catch (error) {
      response.writeHead(500, { "Content-Type": "text/plain" });
      if (error.message.includes("Duplicate")) {
        response.end(
          `Error: "The book with this ISBN:${book.isbnNo} already Exists"`
        );
      } else {
        response.end("The Database Error,Please try Later");
      }
    }
  } else {
    response
      .writeHead(405, { "Content-Type": "text/plain" })
      .end("Method Not Allowed");
  }
};

const searchBookHandler: RequestProcessor = async (request, response) => {
  if (request.method === "GET" && request.url?.startsWith("/books")) {
    const url = new URL(request.url, `http://localhost:3000`);
    const bookId = url.searchParams.get("id") ?? "";
    const searchKey = url.searchParams.get("key") ?? "";

    if (bookId === "") {
      try {
        const books = await bookRepository.search(searchKey);
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(JSON.stringify(books));
      } catch (error) {
        response.writeHead(500, { "Content-Type": "text/plain" });
        response.end(`Error: ${error.message}`);
      }
    } else {
      try {
        const book = await bookRepository.getById(parseInt(bookId));
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(JSON.stringify(book));
      } catch (error) {
        response.writeHead(500, { "Content-Type": "text/plain" });
        response.end(`Error: ${error.message}`);
      }
    }
  } else {
    response.writeHead(405, { "Content-Type": "text/plain" });
    response.end("Method Not Allowed");
  }
};

const deleteBookHandler: RequestProcessor = async (request, response) => {
  if (request.method === "DELETE" && request.url?.startsWith("/books")) {
    const url = new URL(request.url, `http://localhost:3000`);
    const bookId = url.searchParams.get("id") ?? "";
    try {
      const result = await bookRepository.delete(+bookId);
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ message: "Book deleted successfully" }));
    } catch (error) {
      response.writeHead(500, { "Content-Type": "text/plain" });
      response.end(`Error: ${error.message}`);
    }
  } else {
    response.writeHead(405, { "Content-Type": "text/plain" });
    response.end("Method Not Allowed");
  }
};

const startServer = async () => {
  const result = await readLine("Enter the port:");
  const port = parseInt(result);
  const server = new HTTPServer(port);

  /**
   * The function to allow THE CORS and to set the content type to JSON.
   */
  server.use((request, response) => {
    response.setHeader("Content-Type", "application/json");
    response.setHeader("Access-Control-Allow-Origin", "*");
  });
  server.use((request, response) => {
    if (request.method === "POST") {
      request.body = new Promise((resolve, reject) => {
        let body = "";
        request.on("data", (chunk) => {
          body += chunk.toString();
        });
        request.on("end", () => {
          try {
            const parsedBody = JSON.parse(body);
            resolve(parsedBody);
          } catch (error) {
            response.writeHead(400, { "Content-Type": "text/plain" });
            response.end("Invalid JSON");
            reject(error);
          }
        });
        request.on("error", (err) => {
          response.writeHead(500, { "Content-Type": "text/plain" });
          response.end("Server Error");
          reject(err);
        });
      });
    }
  });
  server.post("/books", addBookHandler);
  server.get("/books", searchBookHandler);
  server.delete("/books", deleteBookHandler); // Corrected the path here
};

startServer();
