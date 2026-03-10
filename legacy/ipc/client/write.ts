import type { NodeClient } from "./NodeClient.ts";
import type { Socket } from "node:net";

export default write;

async function write(this: NodeClient, data: Buffer): Promise<NodeClient> {
  const socket = this.socket;
  console.log(`[client.socket] write`, data.length);
  await writeData(socket, data);
  return this;
}

async function writeData(socket: Socket, data: Buffer): Promise<void> {
  const remain = socket.writableHighWaterMark - socket.writableLength;
  // write directly
  if (remain >= data.length) {
    await writeChunk(socket, data);
    return;
  }

  const chunkSize = 1024;
  let index = 0;
  let chunk: Buffer;
  while (true) {
    if (index >= data.length) break;
    const from = index;
    const len = Math.min(index + chunkSize, data.length);
    const to = from + len;
    chunk = data.subarray(from, to);
    await writeChunk(socket, chunk);
    index += len;
  }
}

async function writeChunk(socket: Socket, data: Buffer): Promise<void> {
  // not connected
  if (socket.pending) throw new Error(`[client] failed to write - not connected`);

  const done = socket.write(data);
  if (done) return;

  let closeHandler: () => void;
  let drainHandler: () => void;
  await new Promise<void>((resolve, reject) => {
    closeHandler = () => {
      reject(new Error(`[client] failed to write - disconnect`));
    };
    drainHandler = () => resolve();
    socket.off("close", closeHandler);
    socket.once("drain", drainHandler);
  }).finally(() => {
    closeHandler && socket.off("close", closeHandler);
    drainHandler && socket.off("drain", drainHandler);
  });
}
