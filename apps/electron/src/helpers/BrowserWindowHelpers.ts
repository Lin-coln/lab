import { app, BrowserWindow, type BrowserWindowConstructorOptions } from "electron";

type BWOptions = BrowserWindowConstructorOptions;

const defaultOptions: BWOptions = {
  width: 1200,
  height: 900,
  minWidth: 320,
  minHeight: 480,
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: false,
    webSecurity: true,
    devTools: false,
    spellcheck: false,
  },
};

export class BrowserWindowHelpers {
  #defOptions: BWOptions = defaultOptions;

  constructor() {
    app.on("before-quit", () => {
      BrowserWindow.getAllWindows().forEach((win) => this.ensureDisposed(win));
    });
  }

  public setDefaultOptions(opts: BWOptions) {
    this.#defOptions = this.#mergeOptions(this.#defOptions, opts);
    return this;
  }

  public create(opts?: BWOptions): BrowserWindow {
    const finalOpts = opts
      ? this.#mergeOptions(structuredClone(this.#defOptions), opts)
      : structuredClone(this.#defOptions);
    const win = new BrowserWindow(finalOpts);
    win.once("closed", () => this.ensureDisposed(win));
    return win;
  }

  public ensureDisposed(idOrWin: number | BrowserWindow) {
    const win = typeof idOrWin === "number" ? BrowserWindow.fromId(idOrWin) : idOrWin;
    if (!win) return;
    if (win.isDestroyed()) return;
    try {
      win.destroy();
    } catch {}
  }

  #mergeOptions(opt1: BWOptions, opt2: BWOptions): BWOptions {
    const next: BWOptions = Object.assign({}, opt1, opt2);
    const mergeOpts = (key: keyof BWOptions) => {
      if (!(key in opt2 && opt2[key])) return;
      next[key] = Object.assign({}, opt1[key] ?? {}, opt2[key]) as any;
    };
    mergeOpts("webPreferences");
    mergeOpts("titleBarOverlay");
    mergeOpts("trafficLightPosition");
    return next;
  }
}
