export class Logger {
  log(...args: any[]) {
    this.#updateStatus("idle");
    console.log(...args);
  }

  write(status: string, str: string) {
    this.#updateStatus(status);
    this.#write(str);
  }

  #lastChar: string | null = null;
  #write(str: string) {
    if (!Boolean(typeof process !== "undefined" && process.stdout && process.stdout.write)) return;

    if (!str.length) return;
    this.#lastChar = str[str.length - 1]!;
    process.stdout.write(str);
  }

  #status: string = "idle";
  #updateStatus(status: string) {
    if (this.#status === status) return;
    this.#status = status;

    if (status === "idle") {
      console.log("");
      return;
    }

    let prefix: string = "";
    if (
      this.#lastChar !== null
      // && this.#lastChar !== "\n"
    ) {
      prefix += "\n";
    }

    console.log(`${prefix}[assistant] ${status}:`);
  }
}
