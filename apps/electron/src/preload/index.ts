import { injectDefaultStyles } from "@/utils/injectDefaultStyles.ts";

window.addEventListener("DOMContentLoaded", (event) => {
  injectDefaultStyles();
  console.log("[electron] preload");
});
