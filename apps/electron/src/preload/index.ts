import { injectDefaultStyles } from "@/injectDefaultStyles";

window.addEventListener("DOMContentLoaded", (event) => {
  injectDefaultStyles();
  console.log("[electron] preload");
});
