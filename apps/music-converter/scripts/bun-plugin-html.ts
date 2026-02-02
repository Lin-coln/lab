import { html } from "utils/plugins/html";

export default html({
  csp: {
    "default-src": [
      "self",
      "unsafe-inline", // todo: use sha256 or nonce for preload script
    ],
    // "script-src": ["self"],
    // "style-src": ["self"],
    "connect-src": ["self", "https://api.github.com/users/lin-coln"],
    "img-src": [
      "self",
      // netease
      "http://p3.music.126.net",
      "http://p4.music.126.net",
      // github
      "https://avatars.githubusercontent.com",
    ],
  },
});
