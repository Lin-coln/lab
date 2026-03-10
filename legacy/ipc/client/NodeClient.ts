import { EventBus } from "../utils/event.ts";
import type { Client as IClient, ClientEvents } from "../utils/types.ts";
import QueueHub from "../utils/QueueHub.ts";
import PromiseHub from "../utils/PromiseHub.ts";
import { type IpcSocketConnectOpts, type SocketConstructorOpts, Socket } from "node:net";
import { useBeforeMiddleware, withMiddleware } from "../utils/middleware.ts";
import connect from "./connect.ts";
import disconnect from "./disconnect.ts";
import write from "./write.ts";

export class NodeClient extends EventBus<ClientEvents> implements IClient {
  queueHub: QueueHub;
  promiseHub: PromiseHub;
  socket: Socket;
  connOpts: IpcSocketConnectOpts | null;
  connect: (opts: IpcSocketConnectOpts) => Promise<this>;
  disconnect: () => Promise<this>;
  write: (data: Buffer) => Promise<this>;

  constructor(opts: SocketConstructorOpts) {
    super();
    this.socket = new Socket(opts);
    this.connOpts = null;

    this.connect = connect.bind(this) as any;
    this.disconnect = disconnect.bind(this) as any;
    this.write = write.bind(this) as any;

    //  emit
    this.emit = withMiddleware(
      this.emit,
      useBeforeMiddleware(([event]) => {
        console.log(`[client] emit`, event);
      }),
    );

    // promise & queue
    this.queueHub = new QueueHub();
    this.promiseHub = new PromiseHub();
    this.connect = this.promiseHub.wrapLock(this.connect, "connect");
    this.write = this.queueHub.wrapQueue(this.write, () => "write");
    this.disconnect = this.promiseHub.wrapLock(this.disconnect, "disconnect");
  }

  get remoteIdentifier(): string | null {
    if (!this.connOpts) return null;
    return `pipe://${this.connOpts.path}`;
  }
}
