import { setContentSecurityPolicy } from "./utiils/setContentSecurityPolicy";
import { injectDefaultStyles } from "./utiils/injectDefaultStyles.ts";

window.addEventListener("DOMContentLoaded", (event) => {
  setContentSecurityPolicy({
    "style-src": "unsafe-inline",
    "connect-src": "http://127.0.0.1:11434",
  });
  injectDefaultStyles();
});
