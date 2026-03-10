import path from "node:path";
import url from "node:url";
import { NodeClient } from "./client";
import { NodeServer } from "./server";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

export async function createClient(name: string) {
  const pipeFilename = path.join(__dirname, `./scripts/pipe-${name}.sock`);
  const connectOpts = { path: pipeFilename };

  const client = new NodeClient({});

  await client
    .on("connect", () => {
      console.log("connected", client.remoteIdentifier);
    })
    .connect(connectOpts);
}

export async function createServer(name: string) {
  const pipeFilename = path.join(__dirname, `./scripts/pipe-${name}.sock`);
  const connectOpts = { path: pipeFilename };

  const server = new NodeServer({});

  await server
    .on("connect", (id) => {
      console.log(id, "connected");
    })
    .on("disconnect", ({ id }) => {
      console.log(id, "disconnected");
    })
    .on("listening", () => {
      console.log("server listening");
    })
    .listen(connectOpts);
}
