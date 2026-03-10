import { EventBus } from "./utils/event.ts";
import { NodeServer } from "./server";
import { NodeClient } from "./client";
import type { Client, Server } from "./utils/types.ts";
import type { IpcSocketConnectOpts, ListenOptions } from "node:net";

class Node extends EventBus {
  buf: Buffer;
  #server: Server;
  #clients: Map<string, Client>;

  constructor() {
    super();
    this.buf = Buffer.alloc(0);
    this.#server = new NodeServer({});
    this.#clients = new Map();
  }

  async listen(opts: ListenOptions) {
    await this.#server
      .on("error", (err) => {
        this.emit("error", err);
      })
      .on("listening", () => {
        console.log("server listening");
      })
      .on("connect", (id) => {
        console.log(id, "connected");
      })
      .on("disconnect", ({ id }) => {
        console.log(id, "disconnected");
      })
      .listen(opts);
    return this;
  }

  async connect(id: string, opts: IpcSocketConnectOpts) {
    let client: Client | void = this.#clients.get(id);

    if (!client) {
      client = new NodeClient({});
      this.#clients.set(id, client);

      client
        .on("error", (err) => {
          this.emit("error", err);
        })
        .on("connect", () => {
          console.log("client connected");
        })
        .on("data", (data) => {
          this.onReceiveData(data);
        })
        .on("disconnect", (ctx) => {
          if (!ctx.passive) return;
          this.#clients.delete(id);
          this.emit("disconnect", ctx);
        });
    }

    await client.connect(opts);

    return this;
  }

  async disconnect(id: string) {
    // if (this.#client === null) return this;
    // const client = this.#client!;
    // const identifier = this.remoteIdentifier!;
    //
    // this.#client = null;
    // await client.disconnect();
    // this.emit("disconnect", { identifier, passive: false });
    // return this;
  }

  async postMessage(id: string, data: object | string) {
    // let raw = this.onSerialize(data);
    // raw = Buffer.concat([raw, Buffer.from("\f", "utf8")]);
    //
    // await this.#client!.write(raw);
    // return this;
  }

  onSerialize(data: object | string): Buffer {
    let raw: string;
    if (typeof data !== "string") {
      raw = JSON.stringify(data);
    } else {
      raw = data;
    }
    return Buffer.from(raw, "utf8");
  }

  onDeserialize(data: Buffer): object | string {
    const raw: any = data.toString("utf8");
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }

  onReceiveData(data: Buffer) {
    const symbol = Buffer.from("\f", "utf8");

    const idx = data.indexOf(symbol);
    if (idx === -1) {
      this.buf = Buffer.concat([this.buf, data]);
      return;
    }

    const totalData = Buffer.concat([this.buf, data.subarray(0, idx)]);
    this.buf = Buffer.alloc(0);
    this.emit("message", this.onDeserialize(totalData));

    const remain = data.subarray(idx + 1);
    if (remain.length) {
      this.onReceiveData(remain);
    }
  }
}
