import * as path from "node:path";
import * as fs from "node:fs";

export class Storage {
  data: Record<string, any>;
  filename: string;
  constructor(name: string) {
    this.filename = path.join(process.cwd(), ".cache", `${name}.json`);
    this.data = {};
  }

  async #check() {
    if (fs.existsSync(this.filename)) return;

    const dirname = path.dirname(this.filename);
    if (!fs.existsSync(dirname)) await fs.promises.mkdir(dirname);

    await fs.promises.writeFile(this.filename, JSON.stringify({}), "utf8");
  }

  async read() {
    await this.#check();
    const raw = await fs.promises.readFile(this.filename, "utf8");
    this.data = JSON.parse(raw);
  }

  async write() {
    await this.#check();
    await fs.promises.writeFile(this.filename, JSON.stringify(this.data), "utf8");
  }

  #timeout: any;
  promiseWrite() {
    let resolve1: any;
    const promise = new Promise((resolve) => (resolve1 = resolve));
    clearTimeout(this.#timeout);
    this.#timeout = setTimeout(async () => {
      clearTimeout(this.#timeout);
      await this.write();
      resolve1();
    });

    return promise;
  }

  getItem(key: string) {
    return this.data[key];
  }

  setItem(key: string, value: any) {
    this.data[key] = value;
    void this.promiseWrite();
  }

  removeItem(key: string) {
    delete this.data[key];
    void this.promiseWrite();
  }
}
