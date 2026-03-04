import path from "node:path";
import fs from "node:fs";
import { net, app, session, type Session, type LoadExtensionOptions, type Extension } from "electron";
import type { Readable } from "stream";
import type { Entry, ZipFile } from "yauzl";
import { pipeline } from "node:stream/promises";

export class ExtensionHelper {
  readonly #session?: Session;
  readonly dirname: string;

  constructor(opts: { session?: Session } = {}) {
    this.#session = opts.session;
    this.dirname = path.resolve(`${app.getPath("userData")}/extensions`);
  }

  get session(): Session {
    return this.#session ?? session.defaultSession;
  }

  async install(opts: { storeId: string; force?: boolean; allowFileAccess?: boolean }): Promise<void> {
    const { storeId, force = false, ...loadOpts } = opts;
    const { session } = this;
    const filename = path.resolve(this.dirname, `${storeId}.crx`);
    const dirname = path.resolve(this.dirname, storeId);

    const installed = isInstalled(session, storeId);
    if (installed && !force) return;

    if (force) {
      await fs.promises.rm(filename, { recursive: true, force: true });
      await fs.promises.rm(dirname, { recursive: true, force: true });
      installed && (await uninstall(session, storeId));
    }

    if (!fs.existsSync(dirname)) {
      if (!fs.existsSync(filename)) {
        await fs.promises.mkdir(path.dirname(filename), { recursive: true });
        await download({
          session,
          filename,
          url: resolveUrl(storeId),
        });
      }
      await fs.promises.mkdir(dirname, { recursive: true });
      await unzipCrx(filename, dirname);
    }

    await install(session, {
      allowFileAccess: false,
      ...loadOpts,
      storeId,
      dirname,
    });
  }

  async uninstall(opts: { storeId: string }) {
    const { storeId } = opts;
    const { session } = this;
    const filename = path.resolve(this.dirname, `${storeId}.crx`);
    const dirname = path.resolve(this.dirname, storeId);

    await fs.promises.rm(filename, { recursive: true, force: true });
    await fs.promises.rm(dirname, { recursive: true, force: true });

    const installed = isInstalled(session, storeId);
    installed && (await uninstall(session, storeId));
  }
}

async function install(
  session: Session,
  opts: {
    storeId: string;
    dirname: string;
    allowFileAccess: boolean;
  },
): Promise<void> {
  const { storeId, dirname, ...loadOpts } = opts;
  if (!fs.existsSync(dirname)) {
    throw new Error(`extension not found ${dirname}`);
  }
  const api = session.extensions;
  await api.loadExtension(dirname, loadOpts);
}

async function uninstall(session: Session, storeId: string): Promise<void> {
  return new Promise<void>((resolve) => {
    const api = session.extensions;
    const handler = (_, ext: Extension) => {
      if (ext.id !== storeId) return;
      api.removeListener("extension-unloaded", handler);
      resolve();
    };
    api.on("extension-unloaded", handler);
    api.removeExtension(storeId);
  });
}

function isInstalled(session: Session, storeId: string) {
  const ext = session.extensions.getAllExtensions().find((ext) => ext.id === storeId);
  return Boolean(ext);
}

function resolveUrl(storeId: string) {
  // const url = `https://clients2.google.com/service/update2/crx?response=redirect&acceptformat=crx2,crx3&x=id%3D${storeId}%26uc&prodversion=${process.versions.chrome}`;
  const url = new URL("https://clients2.google.com/service/update2/crx");
  url.searchParams.set("response", "redirect");
  url.searchParams.set("acceptformat", "crx2,crx3");
  url.searchParams.set("x", `id=${storeId}&uc`);
  url.searchParams.set("prodversion", process.versions.chrome);
  return url.toString();
}

async function download(opts: { session: Session; url: string; filename: string }) {
  const { session, url, filename } = opts;
  return new Promise<void>((resolve, reject) => {
    const req = net
      .request({
        url,
        method: "GET",
        session,
      })
      .on("error", reject)
      .on("response", (resp) => {
        const stream = fs
          .createWriteStream(filename)
          .on("error", reject)
          .on("finish", () => resolve());
        resp
          .on("data", (chunk) => stream.write(chunk))
          .on("end", () => stream.end())
          .on("error", (err) => {
            reject(err);
            stream.end();
          })
          .on("aborted", () => {
            reject(new Error(`aborted when downloading ${filename}`));
            stream.end();
          });
      });
    req.end();
  });
}

async function unzipCrx(filename: string, outDir: string) {
  const buf = await fs.promises.readFile(filename);
  const header = resolveHeader(buf);
  await fs.promises.mkdir(outDir, { recursive: true });
  const zip: ZipFile = await createZip(Buffer.from(buf.subarray(header.offset)));
  await unzip(zip, outDir);

  function resolveHeader(u8arr: Uint8Array): {
    version: 2 | 3;
    offset: number;
  } {
    const magic = String.fromCharCode(u8arr[0]!, u8arr[1]!, u8arr[2]!, u8arr[3]!);
    if (magic !== "Cr24") {
      throw new Error("invalid crx file");
    }

    const view = new DataView(u8arr.buffer, u8arr.byteOffset, u8arr.byteLength);
    const version = view.getUint32(4, true);

    if (version === 2) {
      const pubKeyLen = view.getUint32(8, true);
      const sigLen = view.getUint32(12, true);
      const offset = 16 + pubKeyLen + sigLen;
      return { version, offset };
    }

    if (version === 3) {
      const headerSize = view.getUint32(8, true);
      const offset = 12 + headerSize;
      return { version, offset };
    }

    throw new Error(`unsupported crx version: ${version}`);
  }

  async function createZip(buf: Buffer): Promise<ZipFile> {
    const { fromBuffer } = await import("yauzl");
    return await new Promise((resolve, reject) => {
      fromBuffer(buf, { lazyEntries: true }, (err, data) => void (err ? reject(err) : resolve(data)));
    });
  }

  async function unzip(zip: ZipFile, dest: string) {
    const root = path.resolve(dest);
    return await new Promise<void>(async (resolve, reject) => {
      zip.on("error", reject);
      zip.on("end", resolve);
      zip.on("entry", (entry) => handleEntry(entry).then(() => zip.readEntry(), reject));
      zip.readEntry();
    }).finally(() => {
      zip.removeAllListeners();
    });

    async function handleEntry(entry: Entry) {
      const resolved = path.resolve(root, entry.fileName);
      if (!resolved.startsWith(root)) {
        throw new Error(`invalid entry: ${entry.fileName}`);
      }

      // dir
      if (entry.fileName.endsWith("/")) {
        await fs.promises.mkdir(resolved, { recursive: true });
        return;
      }

      // file
      await fs.promises.mkdir(path.dirname(resolved), { recursive: true });
      const stream = await new Promise<Readable>((res, rej) =>
        zip.openReadStream(entry, (err, s) => (err || !s ? rej(err) : res(s))),
      );
      await pipeline(stream, fs.createWriteStream(resolved));
    }
  }
}
