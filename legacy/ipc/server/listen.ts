import fs from "node:fs";
import { type ListenOptions, type Server, type Socket } from "node:net";
import uuid from "../utils/uuid";
import useCleanup from "../utils/useCleanup";
import type { NodeServer } from "./NodeServer";
import { withEmitClose } from "./close";
import { withEmitDisconnect } from "./disconnect";
import fixPipeName from "../utils/fixPipeName";

export default function (this: NodeServer, opts: ListenOptions) {
  let sockPath = opts.path;
  if (!sockPath) return listen.call(this, opts);

  sockPath = fixPipeName(sockPath);

  // wrap clear sock file
  const clearSock = () => process.platform !== "win32" && fs.existsSync(sockPath) && fs.unlinkSync(sockPath);

  return listen
    .call(this, { ...opts, path: sockPath })
    .then((res) => {
      useCleanup(clearSock);
      return res;
    })
    .catch((e) => {
      clearSock();
      throw e;
    });
}

async function listen(this: NodeServer, opts: ListenOptions): Promise<NodeServer> {
  const server = this.server;
  if (server.listening) return this;

  console.log(`[server.server] listen...`);
  await listen(server, opts);

  server
    .on("error", (err) => void this.emit("error", err))
    .on("close", withEmitClose(() => this.server.removeAllListeners()).bind(this))
    .on("connection", handleSocketConnection.bind(this));
  this.emit("listening");

  return this;

  async function listen(server: Server, listenOpts: ListenOptions) {
    if (server.listening) return;

    let resolve1: () => void;
    let reject1: (err: Error) => void;
    await new Promise<void>((resolve, reject) => {
      resolve1 = resolve;
      reject1 = reject;
      server.on("error", reject1).on("listening", resolve1).listen(listenOpts);
    }).finally(() => {
      server.off("error", reject1).off("listening", resolve1);
    });
  }
}

function handleSocketConnection(this: NodeServer, socket: Socket) {
  const id = uuid();
  console.log(`[server.socket] connection`, id);

  const handleClose = withEmitDisconnect((id: string) => {
    this.sockets.delete(id);
    socket.removeAllListeners();
    socket.destroy();
    return false;
  }).bind(this);

  socket
    .on("error", (err) => {
      this.emit("error", err);
      if (socket.closed) handleClose(id);
    })
    .on("close", (hadError: boolean) => {
      if (hadError) return;
      handleClose(id);
    })
    .on("data", (data: Buffer) => void this.emit("data", id, data));
  this.sockets.set(id, socket);
  this.emit("connect", id);
}
