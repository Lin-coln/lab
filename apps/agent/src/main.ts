import { app, nativeTheme } from "electron";
import { installExtension } from "elpers/extension";
import { initializeHelpers } from "@/windows/initialize.ts";
import { createServiceWindow } from "@/windows/serviceWindow.ts";
import { createMainWindow } from "@/windows/mainWindow.ts";

void main();
async function main() {
  app.on("window-all-closed", () => {
    if (process.platform === "darwin") return;
    app.quit();
  });
  nativeTheme.themeSource = "dark";
  await app.whenReady();

  await installExtension("REACT_DEVELOPER_TOOLS", { force: false });

  await initializeHelpers();
  app.on("activate", async () => {
    await createServiceWindow();
    await createMainWindow();
  });
  await createServiceWindow();
  await createMainWindow();
}
