import type { IEvents } from "./event.ts";

export interface ServerEvents extends IEvents {
  error(err: Error): void;
  close(): void;
  listening(): void;
  connect(id: string): void;
  disconnect(ctx: { id: string; passive: boolean }): void;
  data(id: string, data: Buffer): void;
}

export interface Server {
  listen(opts: unknown): Promise<this>;
  close(): Promise<this>;
  disconnect(id: string): Promise<this>;
  write(id: string, data: Buffer): Promise<this>;
  on<T extends keyof ServerEvents>(type: T, listener: ServerEvents[T]): this;
  off<T extends keyof ServerEvents>(type?: T, listener?: ServerEvents[T]): this;
}

export interface ClientEvents extends IEvents {
  error(err: Error): void;
  disconnect(ctx: { identifier: string; passive: boolean }): void;
  connect(): void;
  data(data: Buffer): void;
}

export interface Client {
  readonly remoteIdentifier: string | null;
  connect(opts: unknown): Promise<this>;
  disconnect(): Promise<this>;
  write(data: Buffer): Promise<this>;
  on<T extends keyof ClientEvents>(type: T, listener: ClientEvents[T]): this;
  off<T extends keyof ClientEvents>(type?: T, listener?: ClientEvents[T]): this;
}
