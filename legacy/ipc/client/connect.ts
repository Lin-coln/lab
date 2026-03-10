import type { NodeClient } from "./NodeClient.ts";
import type { IpcSocketConnectOpts, Socket } from "node:net";
import { withEmitDisconnect } from "./disconnect.ts";
import { useArgsMiddleware, useRetryMiddleware, withMiddleware } from "../utils/middleware.ts";
import fixPipeName from "../utils/fixPipeName.ts";

export default withMiddleware(
  connect,

  // fix pipe name on win32 platform
  useArgsMiddleware(([opts]) => {
    opts.path = fixPipeName(opts.path);
  }),

  // retry feature
  useRetryMiddleware({
    times: 30,
    delay: 1_000,
    onCheck: (err, { cur, max }) => {
      console.log(`[socket] reconnect (${cur}/${max})`, "code" in err ? err.code : err.message);
      return "code" in err && ["ENOENT", "ECONNREFUSED"].includes(err.code as string);
    },
  }),
);

async function connect(this: NodeClient, connOpts: IpcSocketConnectOpts) {
  const socket = this.socket;
  // connected
  if (!socket.connecting && !socket.pending) return this;

  console.log(`[client.socket] connect...`);
  await connect(socket, connOpts);
  const handleClosed = withEmitDisconnect(() => {
    socket.removeAllListeners();
    socket.destroy();
    return false;
  }).bind(this);
  socket
    .on("error", (err: Error) => {
      this.emit("error", err);
      if (socket.closed) handleClosed();
    })
    .on("close", (hadError: boolean) => {
      if (hadError) return;
      handleClosed();
    })
    .on("data", (data: Buffer) => {
      this.emit("data", data);
    });

  this.connOpts = connOpts;
  this.emit("connect");
  return this;

  async function connect(socket: Socket, connOpts: IpcSocketConnectOpts) {
    // connected
    if (!socket.connecting && !socket.pending) return;

    let resolve1: () => void;
    let reject1: (err: Error) => void;
    await new Promise<void>((resolve, reject) => {
      resolve1 = resolve;
      reject1 = reject;
      socket.on("error", reject1).on("connect", resolve1).connect(connOpts);
    }).finally(() => {
      socket.off("error", reject1).off("connect", resolve1);
    });
  }
}
