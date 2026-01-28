import { app, nativeTheme } from "electron";
import { createMainWindow } from "@/windows/mainWindow.ts";
import { initializeHelpers } from "@/helpers";

void main();
async function main() {
  app.on("window-all-closed", () => {
    if (process.platform === "darwin") return;
    app.quit();
  });
  nativeTheme.themeSource = "dark";
  await app.whenReady();

  await initializeHelpers();

  app.on("activate", async () => {
    await createMainWindow();
  });

  await createMainWindow();
}
