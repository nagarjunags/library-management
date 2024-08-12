import http, { IncomingMessage } from "node:http";
import { URL } from "node:url";

interface reqInput extends http.IncomingMessage {
  body?: any;
}

export type RequestProcessor = (
  request: reqInput,
  response: http.ServerResponse
) => void;

type URLPath = string;
type RequestProcessorPathMap =
  | Record<URLPath, RequestProcessor>
  | Array<RequestProcessor>;

export class HTTPServer {
  private port: number;
  private server: ReturnType<typeof http.createServer>;
  private processorsMap: Record<
    "GET" | "POST" | "UPDATE" | "DELETE" | "GLOBALS",
    RequestProcessorPathMap
  > = {
    GET: {},
    POST: {},
    UPDATE: {},
    DELETE: {},
    GLOBALS: [],
  };

  constructor(port: number) {
    this.port = port;

    this.server = http.createServer(
      (request: http.IncomingMessage, response: http.ServerResponse) => {
        if (
          request.method !== "GET" &&
          request.method !== "POST" &&
          request.method !== "DELETE"
        ) {
          response
            .writeHead(500)
            .end(`Sorry, currently not handling ${request.method}`);
          return;
        }
        this.handleRequest(request, response);
      }
    );

    this.server.listen(port, () => {
      console.log("listening at port:", port);
    });
  }

  private async handleRequest(
    request: reqInput,
    response: http.ServerResponse
  ) {
    if (request.method) {
      // Run global processors
      const globalProcessors = this.processorsMap[
        "GLOBALS"
      ] as Array<RequestProcessor>;
      for (const processor of globalProcessors) {
        await processor(request, response);
      }

      // Run specific method processors
      const pathMap = this.processorsMap[request.method];
      const url = new URL(request.url ?? "", `http://localhost:${this.port}`);
      const path = url.pathname;
      if (pathMap[path]) {
        await pathMap[path](request, response);
      } else {
        response.writeHead(404).end("Not Found");
      }
    } else {
      response.writeHead(400).end("Bad Request");
    }
  }

  public get(path: string, processor: RequestProcessor) {
    this.processorsMap["GET"][path] = processor;
  }

  public post(path: string, processor: RequestProcessor) {
    this.processorsMap["POST"][path] = processor;
  }

  public delete(path: string, processor: RequestProcessor) {
    this.processorsMap["DELETE"][path] = processor;
  }

  public use(processor: RequestProcessor) {
    const globalProcessor = this.processorsMap[
      "GLOBALS"
    ] as Array<RequestProcessor>;
    globalProcessor.push(processor);
  }
}
