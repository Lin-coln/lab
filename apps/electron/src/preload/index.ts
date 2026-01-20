import { setContentSecurityPolicy } from "@/utils/setContentSecurityPolicy.ts";
import { injectDefaultStyles } from "@/utils/injectDefaultStyles.ts";

window.addEventListener("DOMContentLoaded", (event) => {
  setContentSecurityPolicy({
    "style-src": "unsafe-inline",
    "connect-src": "http://127.0.0.1:11434",
  });
  injectDefaultStyles();
  console.log("[electron] preload");
});
