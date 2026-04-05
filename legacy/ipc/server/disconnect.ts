import type { NodeServer } from "./NodeServer";
import { useBeforeMiddleware, withMiddleware } from "../utils/middleware";

export default withMiddleware(
  withEmitDisconnect(disconnect),

  // sockets
  async function (this, [id], next) {
    const socket = this.sockets.get(id);
    if (!socket) return this;
    if (socket.closed) {
      this.sockets.delete(id);
      return this;
    }
    return await next();
  },
);

async function disconnect(this: NodeServer, id: string): Promise<NodeServer> {
  const socket = this.sockets.get(id);
  if (!socket) throw new Error(`failed to disconnect - socket not found: ${id}`);
  this.sockets.delete(id);

  socket.removeAllListeners();
  await new Promise<void>((resolve, reject) => {
    try {
      socket.end(resolve);
    } catch (e) {
      reject(e);
    }
  });
  socket.destroy();

  return this;
}

export function withEmitDisconnect<T>(fn: T): T {
  return withMiddleware<[string], any, NodeServer>(
    fn as any,
    // queue effect
    useBeforeMiddleware(function (this, [id]) {
      this.queueHub.clear(`write:${id}`);
    }),

    // basic effect
    async function (this, [id], next) {
      /**
       * - `this` if fn is `disconnect`,
       * - `false` if fn is `handleClosed`,
       */
      const result = await next();
      const passive = !result;
      this.emit("disconnect", { id, passive });
      return this;
    },
  ) as T;
}
