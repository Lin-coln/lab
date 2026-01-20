import { BrowserWindow, type LoadFileOptions, type LoadURLOptions, type WebContents } from "electron";

export class WebContentsHelpers {
  public async load(wc: WebContents, url: string, opts?: LoadURLOptions);
  public async load(wc: WebContents, filePath: string, opts?: LoadFileOptions);
  public async load(wc: WebContents, urlOrFilePath: string, opts?: LoadURLOptions | LoadFileOptions) {
    // reset zoom
    wc.once("dom-ready", () => {
      wc.setZoomFactor(1.0);
      void wc.setVisualZoomLevelLimits(1, 1);
    });

    // set <title> if not exist
    wc.once("dom-ready", () => {
      const win = BrowserWindow.fromWebContents(wc)!;
      const title = win.getTitle();
      void wc.executeJavaScript(
        `void (${function setupTitle(document: any, titleContent: string) {
          if (document.querySelector("title")) return;
          const title = document.createElement("title");
          title.textContent = titleContent;
          document.head.appendChild(title);
        }.toString()})(document, ${JSON.stringify(title)});`,
      );
    });

    wc.once("did-fail-load", (_evt, code, desc, url) => {
      Promise.reject(new Error(`Failed to load ${url}: ${desc} (${code})`));
    });

    // todo router
    return isURL(urlOrFilePath)
      ? wc.loadURL(urlOrFilePath, opts as LoadURLOptions)
      : wc.loadFile(urlOrFilePath, opts as LoadFileOptions);
  }
}

function isURL(input: string): boolean {
  try {
    const u = new URL(input);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
