import { app, nativeTheme } from "electron";
import { createMainWindow } from "@/windows/mainWindow.ts";
import { ext, initializeHelpers } from "@/helpers";

void main();
async function main() {
  process.traceDeprecation = true;

  app.on("window-all-closed", () => {
    if (process.platform === "darwin") return;
    app.quit();
  });
  nativeTheme.themeSource = "dark";

  await app.whenReady();
  await initializeHelpers();

  // react devtools
  await ext.install({ storeId: "fmkadmapgofadopljbjfkapdkoienihi", allowFileAccess: true });

  // const external = await import("#electron/index.ts");
  // await external.onAppReady?.();

  app.on("activate", async () => {
    await createMainWindow();
  });

  await createMainWindow();
}
