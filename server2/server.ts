import http, { IncomingMessage, ServerResponse } from "node:http";
import { URL } from "node:url";

export interface reqInput extends http.IncomingMessage {
  body?: any;
}

export type RequestProcessor = (
  request: reqInput,
  response: http.ServerResponse,
  next: (error?: Error) => void
) => void;

type URLPath = string;
type AllowedHTTPMethods = "GET" | "POST" | "PATCH" | "DELETE";
type RequestProcessorPathMap = Record<URLPath, RequestProcessor[]>;

export class HTTPServer {
  private port: number;
  private server: ReturnType<typeof http.createServer>;

  private processorsMap: Record<
    AllowedHTTPMethods | "GLOBALS",
    RequestProcessorPathMap | RequestProcessor[]
  > = {
    GET: {},
    POST: {},
    PATCH: {},
    DELETE: {},
    GLOBALS: [],
  };

  constructor(port: number) {
    this.port = port;

    this.server = http.createServer(
      (request: http.IncomingMessage, response: http.ServerResponse) => {
        if (this.isValidMethod(request.method)) {
          this.handleRequest(request as reqInput, response);
        } else {
          response
            .writeHead(405, { "Content-Type": "text/plain" })
            .end(`Method ${request.method} not allowed`);
        }
      }
    );

    this.server.listen(port, () => {
      console.log("listening at port:", port);
    });
  }

  private isValidMethod(method?: string): method is AllowedHTTPMethods {
    return ["GET", "POST", "PATCH", "DELETE"].includes(method ?? "");
  }

  private async handleRequest(
    request: reqInput,
    response: http.ServerResponse
  ) {
    if (request.method) {
      const method = request.method as AllowedHTTPMethods;

      const baseUrl = `http://${request.headers.host}`;
      const url = new URL(request.url ?? "", baseUrl);
      const path = url.pathname;

      const globalMiddlewares = this.processorsMap[
        "GLOBALS"
      ] as RequestProcessor[];
      const pathMiddlewares =
        (this.processorsMap[method] as RequestProcessorPathMap)[path] || [];

      // Execute global processors and path-specific processors
      this.executeMiddleware(request, response, [
        ...globalMiddlewares,
        ...pathMiddlewares,
      ]);
    }
  }

  private nextFunctionCreator(
    request: reqInput,
    response: http.ServerResponse,
    middlewares: RequestProcessor[],
    nextIndex: number
  ): (error?: Error) => void {
    return (error?: Error) => {
      if (error) {
        response.writeHead(500, { "Content-Type": "application/json" });
        response.end(
          JSON.stringify({ error: `Internal server error: ${error.message}` })
        );
      } else {
        if (nextIndex < middlewares.length) {
          this.executeMiddleware(request, response, middlewares, nextIndex);
        } else {
          if (!response.headersSent) {
            response.writeHead(404, { "Content-Type": "text/plain" });
            response.end("Not Found");
          }
        }
      }
    };
  }

  private executeMiddleware(
    request: reqInput,
    response: http.ServerResponse,
    middlewares: RequestProcessor[],
    nextIndex: number = 0
  ) {
    const currentMiddleware = middlewares[nextIndex];
    if (currentMiddleware) {
      try {
        currentMiddleware(
          request,
          response,
          this.nextFunctionCreator(
            request,
            response,
            middlewares,
            nextIndex + 1
          )
        );
      } catch (error) {
        response.writeHead(500, { "Content-Type": "application/json" });
        response.end(/*
          JSON.stringify({
            error: `Internal server error: ${(error as Error).message}`,
          })
        */);
      }
    }
  }

  // Methods to help register processors for respective methods and paths
  public get(path: string, ...processors: RequestProcessor[]) {
    this.registerProcessors("GET", path, processors);
  }

  public post(path: string, ...processors: RequestProcessor[]) {
    this.registerProcessors("POST", path, processors);
  }

  public patch(path: string, ...processors: RequestProcessor[]) {
    this.registerProcessors("PATCH", path, processors);
  }

  public delete(path: string, ...processors: RequestProcessor[]) {
    this.registerProcessors("DELETE", path, processors);
  }

  private registerProcessors(
    method: AllowedHTTPMethods,
    path: string,
    processors: RequestProcessor[]
  ) {
    const methodProcessors = this.processorsMap[
      method
    ] as RequestProcessorPathMap;
    if (!methodProcessors[path]) {
      methodProcessors[path] = [];
    }
    methodProcessors[path].push(...processors);
  }

  public use(processor: RequestProcessor, path?: string) {
    const globalProcessors = this.processorsMap[
      "GLOBALS"
    ] as RequestProcessor[];

    if (path) {
      const wrappedProcessor = (
        request: reqInput,
        response: ServerResponse<IncomingMessage>,
        next: (error?: Error) => void
      ) => {
        if (request.url!.includes(path)) {
          processor(request, response, next);
        }
        next();
      };
      globalProcessors.push(wrappedProcessor);
      return;
    }
    globalProcessors.push(processor);
  }

  // public pathProcessRegister(path: string, processor: RequestProcessor) {
  //   const globalProcessors = this.processorsMap[
  //     "GLOBALS"
  //   ] as RequestProcessor[];
  //   const wrappedProcessor = (
  //     request: reqInput,
  //     response: ServerResponse<IncomingMessage>,
  //     next: (error?: Error) => void
  //   ) => {
  //     if (request.url.includes(path)) {
  //       processor(request, response, next);
  //     }
  //     next();
  //   };
  //   globalProcessors.push(wrappedProcessor);
  // }
}
