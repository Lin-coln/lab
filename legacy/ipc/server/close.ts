import type { NodeServer } from "./NodeServer.ts";
import { withMiddleware } from "../utils/middleware.ts";

export default withMiddleware(
  withEmitClose(close),
  // ...
);

async function close(this: NodeServer): Promise<NodeServer> {
  if (!this.server.listening) return this;
  this.server.removeAllListeners();

  const closePromise = new Promise<void>((resolve, reject) => {
    console.log(`[server.server] closing`);
    this.server.close((err) => (err ? reject(err) : resolve()));
    console.log("detect listening", this.server.listening);
  });

  const socketIdList = Array.from(this.sockets.keys());
  await Promise.all(socketIdList.map((id) => this.disconnect(id)));

  await closePromise;
  return this;
}

export function withEmitClose(fn) {
  return withMiddleware<any[], any, NodeServer>(
    fn,
    // effect
    async function (this, _, next) {
      const result = await next();
      this.emit("close");
      return result;
    },
  );
}
