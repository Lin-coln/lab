import { injectDefaultStyles } from "@/injectDefaultStyles.ts";

window.addEventListener("DOMContentLoaded", (event) => {
  injectDefaultStyles();
  console.log("[electron] preload");
});
