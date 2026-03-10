import type { NodeClient } from "./NodeClient.ts";
import { useBeforeMiddleware, withMiddleware } from "../utils/middleware.ts";

export default withMiddleware(
  withEmitDisconnect(disconnect),

  // sockets
  async function (this, _, next) {
    const socket = this.socket;
    if (socket.closed) return this;
    return await next();
  },
);

/**
 * 1. removeAllListeners
 * 2. end
 * 3. destroy
 */
async function disconnect(this: NodeClient): Promise<NodeClient> {
  const socket = this.socket;

  socket.removeAllListeners();
  await new Promise<void>((resolve, reject) => {
    try {
      socket.end(() => resolve());
    } catch (e) {
      reject(e);
    }
  });
  socket.destroy();

  return this;
}

export function withEmitDisconnect<T>(fn: T): T {
  return withMiddleware<[], any, NodeClient>(
    fn as any,
    // queue effect
    useBeforeMiddleware(function (this) {
      this.queueHub.clear("write");
    }),

    // basic effect
    async function (this, _, next) {
      const identifier = this.remoteIdentifier!;

      /**
       * - `this` if fn is `disconnect`,
       * - `false` if fn is `handleClosed`,
       */
      const result = await next();

      const passive = !result;
      this.connOpts = null;
      this.emit("disconnect", { identifier, passive });
      return result;
    },
  ) as T;
}
