import { setContentSecurityPolicy } from "@/utils/setContentSecurityPolicy.ts";
import { injectDefaultStyles } from "@/utils/injectDefaultStyles.ts";

window.addEventListener("DOMContentLoaded", (event) => {
  setContentSecurityPolicy({
    "style-src": "unsafe-inline",
    ...((process.env.CSP as any) ?? {}),
  });
  injectDefaultStyles();
  console.log("[electron] preload");
});
